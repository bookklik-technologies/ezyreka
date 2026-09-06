import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Image = dom.window.Image;
global.FileReader = dom.window.FileReader;
global.Blob = dom.window.Blob;
global.requestAnimationFrame = (cb) => cb();
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.Path2D = class Path2D {
  moveTo() {} lineTo() {} arc() {} arcTo() {} ellipse() {}
  rect() {} bezierCurveTo() {} quadraticCurveTo() {} closePath() {}
};

const gradient = { addColorStop() {} };
dom.window.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy(
    { canvas: this },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (prop === 'measureText') return (s) => ({ width: String(s).length * 10 });
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
        return () => {};
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    }
  );
};
dom.window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,x';
dom.window.Element.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 1200, bottom: 800, width: 1200, height: 800, x: 0, y: 0 };
};

const assert = (await import('node:assert')).default;
const { Editor } = await import('../src/index.js');

const editor = new Editor({ target: '#app', width: 800, height: 600, name: 'Test' });
assert.ok(document.getElementById('app').classList.contains('sk-editor'), 'editor mounted');
assert.ok(document.querySelector('.sk-topbar'), 'topbar built');
assert.ok(document.querySelector('.sk-sidepanel'), 'sidepanel built');
assert.ok(document.querySelector('.sk-pagesbar'), 'pages bar built');

const rect = editor.addElement({ type: 'rect', x: 10, y: 10, w: 100, h: 100 });
assert.strictEqual(editor.getElements().length, 1, 'element added');
assert.strictEqual(rect.w, 100, 'element props kept');

const text = editor.addText({ text: 'Hello world', fontSize: 32, x: 50, y: 50, w: 300 });
assert.ok(editor.getElements().length === 2, 'text added');
assert.ok(text.id.startsWith('text_'), 'text id');

editor.select([rect.id]);
assert.strictEqual(editor.getSelected().length, 1, 'selected');
assert.ok(document.querySelector('.sk-sel-box'), 'selection box rendered');
assert.ok(document.querySelectorAll('.sk-handle').length === 8, '8 resize handles');
assert.ok(document.querySelector('.sk-rotate-handle'), 'rotate handle rendered');

// Button icons must be SVG elements, not invisible HTML path elements.
const iconButtons = document.querySelectorAll('.sk-icon-btn');
assert.ok(editor.toolbarEl.querySelectorAll('.sk-icon-btn').length === 5, 'toolbar has five icon actions');
for (const button of iconButtons) {
  const svg = button.querySelector('svg');
  assert.ok(svg, `${button.title}: SVG root exists`);
  assert.strictEqual(svg.getAttribute('viewBox'), '0 0 24 24', `${button.title}: icon viewBox`);
  const path = svg.querySelector('path');
  assert.ok(path?.getAttribute('d'), `${button.title}: icon path exists`);
  assert.strictEqual(path.namespaceURI, 'http://www.w3.org/2000/svg', `${button.title}: drawable SVG path`);
}

const { rotatePoint, deg2rad } = await import('../src/core/utils.js');
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-6, message);
const pointerAt = (p, shiftKey = false) => ({
  clientX: p.x * editor.zoom,
  clientY: p.y * editor.zoom,
  shiftKey,
  preventDefault() {},
  stopPropagation() {}
});
const opposite = { n: 's', s: 'n', e: 'w', w: 'e', nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' };
for (const zoom of [0.5, 2]) {
  editor.zoom = zoom;
  for (const rotation of [0, 45, 90]) {
    for (const dir of Object.keys(opposite)) {
      for (const shiftKey of [false, true]) {
        Object.assign(rect, { x: 200, y: 150, w: 120, h: 80, rotation });
        const horizontal = dir.includes('e') || dir.includes('w');
        const vertical = dir.includes('n') || dir.includes('s');
        const anchor = editor.interactions.handlePoint(rect, opposite[dir]);
        const handle = editor.interactions.handlePoint(rect, dir);
        editor.interactions.startResize(pointerAt(handle), dir);
        const delta = rotatePoint(
          horizontal ? (dir.includes('w') ? -40 : 40) : 25,
          vertical ? (dir.includes('n') ? -30 : 30) : 25,
          0, 0, deg2rad(rotation)
        );
        editor.interactions.onPointerMove(pointerAt({ x: handle.x + delta.x, y: handle.y + delta.y }, shiftKey));
        const label = `${dir}, rotation ${rotation}, zoom ${zoom}, shift ${shiftKey}`;
        near(rect.w, horizontal ? 160 : 120, `resize width: ${label}`);
        near(rect.h, shiftKey && horizontal && vertical ? 160 / 1.5 : vertical ? 110 : 80, `resize height: ${label}`);
        const after = editor.interactions.handlePoint(rect, opposite[dir]);
        near(after.x, anchor.x, `fixed anchor x: ${label}`);
        near(after.y, anchor.y, `fixed anchor y: ${label}`);
        editor.interactions.onPointerUp({});
      }
    }
  }
}

// Dragging past the opposite edge keeps the minimum width and anchor stable.
Object.assign(rect, { x: 200, y: 150, w: 120, h: 80, rotation: 0 });
editor.interactions.startResize(pointerAt({ x: 320, y: 190 }), 'e');
editor.interactions.onPointerMove(pointerAt({ x: 100, y: 230 }));
near(rect.w, 8, 'minimum resize width');
near(rect.h, 80, 'minimum resize preserves height');
near(rect.x, 200, 'minimum resize keeps opposite edge');
near(rect.y, 150, 'minimum resize keeps vertical position');
editor.interactions.onPointerUp({});

// Successive rotation gestures use pointer deltas, including across the angle wrap.
Object.assign(rect, { x: 200, y: 150, w: 120, h: 80, rotation: 75 });
const rotationPointer = (angle) => pointerAt({
  x: 260 + 100 * Math.cos(deg2rad(angle)),
  y: 190 + 100 * Math.sin(deg2rad(angle))
});
for (const startAngle of [-15, 170]) {
  const before = rect.rotation;
  editor.interactions.startRotate(rotationPointer(startAngle));
  editor.interactions.onPointerMove(rotationPointer(startAngle));
  near(rect.rotation, before, 'rotation does not jump on stationary pointer');
  editor.interactions.onPointerMove(rotationPointer(startAngle + 30));
  near(rect.rotation, (before + 30) % 360, 'rotation follows pointer delta');
  near(rect.x, 200, 'rotation keeps x position');
  near(rect.y, 150, 'rotation keeps y position');
  editor.interactions.onPointerUp({});
}

editor.updateSelected({ fill: '#ff0000' });
assert.strictEqual(rect.fill, '#ff0000', 'updateSelected applies');

editor.duplicateSelected();
assert.strictEqual(editor.getElements().length, 3, 'duplicated');

editor.selectAll();
assert.strictEqual(editor.getSelected().length, 3, 'select all');

editor.copy();
editor.deleteSelected();
assert.strictEqual(editor.getElements().length, 0, 'deleted');
editor.paste();
assert.strictEqual(editor.getElements().length, 3, 'pasted');

editor.bringToFront();
editor.sendToBack();
editor.bringForward();
editor.sendBackward();
editor.toggleLock();

editor.undo();
assert.ok(editor.getElements().length >= 0, 'undo did not throw');
editor.redo();

editor.addPage();
editor.duplicatePage();
assert.strictEqual(editor.doc.pages.length, 3, 'pages added');
editor.goToPage(0);
assert.strictEqual(editor.pageIndex, 0, 'goToPage');
editor.deletePage(2);
assert.strictEqual(editor.doc.pages.length, 2, 'page deleted');

editor.setBackground({ type: 'gradient', from: '#000000', to: '#ffffff', angle: 135 });
assert.strictEqual(editor.page.background.type, 'gradient', 'background set');

editor.setZoom(0.5);
assert.strictEqual(editor.zoom, 0.5, 'zoom set');
editor.zoomFit();
assert.ok(editor.zoom > 0, 'zoomFit');

const json = editor.getJSON();
assert.strictEqual(json.pages.length, 2, 'getJSON');
editor.loadJSON({ pages: [{ width: 500, height: 500, elements: [{ type: 'rect', x: 0, y: 0, w: 50, h: 50 }] }] });
assert.strictEqual(editor.getElements().length, 1, 'loadJSON elements');

editor.loadJSON({
  name: 'Renamed doc',
  pages: [{ width: 400, height: 400, elements: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10 }, { type: 'bogus' }] }]
});
assert.strictEqual(editor.getElements().length, 1, 'unknown element types skipped');
assert.strictEqual(editor.fileName, 'Renamed doc', 'name restored from JSON');

editor.loadJSON({ pages: [{ width: 500, height: 500, elements: [{ type: 'rect', x: 0, y: 0, w: 50, h: 50 }] }] });
editor.select(editor.getElements().map((e) => e.id));
editor.copy();
editor.paste();
editor.paste();
const [a, b] = editor.getElements().slice(1);
assert.ok(b.x > a.x && b.y > a.y, 'repeated paste offsets accumulate');

let changed = 0;
editor.on('change', () => changed++);
editor.commit();
assert.strictEqual(changed, 1, 'change event');

editor.destroy();
assert.strictEqual(document.getElementById('app').innerHTML, '', 'destroyed');

console.log('All DOM smoke tests passed.');
