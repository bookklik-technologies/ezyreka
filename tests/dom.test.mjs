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

let changed = 0;
editor.on('change', () => changed++);
editor.commit();
assert.strictEqual(changed, 1, 'change event');

editor.destroy();
assert.strictEqual(document.getElementById('app').innerHTML, '', 'destroyed');

console.log('All DOM smoke tests passed.');
