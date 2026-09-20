import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div><div id="app2"></div></body></html>', {
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
  addPath() {}
};
global.DOMMatrix = global.DOMMatrix || class {
  constructor() {}
  scale() { return this; }
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
const { Editor, version } = await import('../src/index.js');
const { setSvg, fileBase } = await import('../src/core/utils.js');

// ---- Version single source (build injects from package.json) ----
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert.strictEqual(version, pkg.version, 'src version matches package.json');

// ---- Keyboard activity defaults to inactive ----
const edA = new Editor({ target: '#app', width: 800, height: 600, name: 'A' });
assert.strictEqual(edA._isActive, false, 'editor starts keyboard-inactive');

const rectA = edA.addElement({ type: 'rect', x: 10, y: 10, w: 50, h: 50 });
edA.select([rectA.id]);
const stackBefore = edA.history._undoStack.length;
window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
  key: 'z', ctrlKey: true, bubbles: true, cancelable: true
}));
assert.strictEqual(edA.history._undoStack.length, stackBefore, 'inactive editor ignores Ctrl+Z');

// Pointerdown inside the container activates it.
edA.container.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
assert.strictEqual(edA._isActive, true, 'container pointerdown activates');

window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
  key: 'z', ctrlKey: true, bubbles: true, cancelable: true
}));
// undo() discards the current-state top entry and pops the previous one.
assert.strictEqual(edA.history._undoStack.length, stackBefore - 2, 'active editor handles Ctrl+Z');

// Pointerdown outside deactivates.
document.body.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
assert.strictEqual(edA._isActive, false, 'outside pointerdown deactivates');

// ---- Multi-instance: only the active editor reacts ----
const edB = new Editor({ target: '#app2', width: 400, height: 400, name: 'B' });
edB.container.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
assert.strictEqual(edB._isActive, true, 'second editor activates on its own pointerdown');
assert.strictEqual(edA._isActive, false, 'first editor stays inactive');

const rectB = edB.addElement({ type: 'rect', x: 5, y: 5, w: 30, h: 30 });
edB.select([rectB.id]);
const bStack = edB.history._undoStack.length;
const aStack = edA.history._undoStack.length;
const aElems = edA.getElements().length;
window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
  key: 'z', ctrlKey: true, bubbles: true, cancelable: true
}));
assert.strictEqual(edB.history._undoStack.length, bStack - 2, 'active editor B undoes');
assert.strictEqual(edA.history._undoStack.length, aStack, 'inactive editor A untouched');
assert.strictEqual(edA.getElements().length, aElems, 'inactive editor A content untouched');

edB.destroy();

// ---- Empty-selection commits are skipped ----
const stackNoSel = edA.history._undoStack.length;
edA.updateSelected({ x: 5 }, true);
assert.strictEqual(edA.history._undoStack.length, stackNoSel, 'no-op updateSelected pushes nothing');

// ---- historyLimit option ----
const edH = new Editor({ target: '#app2', width: 200, height: 200, name: 'H', historyLimit: 3 });
for (let i = 0; i < 10; i++) {
  edH.addElement({ type: 'rect', x: i, y: i, w: 10, h: 10 });
}
assert.ok(edH.history._undoStack.length <= 3, `history limit respected (got ${edH.history._undoStack.length})`);
edH.destroy();

// ---- Shared chrome teardown + re-injection ----
assert.ok(document.getElementById('ez-styles'), 'styles present while editor alive');
edA.destroy();
assert.strictEqual(document.getElementById('ez-styles'), null, 'styles removed with last editor');
assert.strictEqual(document.getElementById('ez-fonts'), null, 'font link removed with last editor');
const edC = new Editor({ target: '#app', width: 300, height: 300, name: 'C' });
assert.ok(document.getElementById('ez-styles'), 'styles re-injected after teardown');
edC.destroy();
assert.strictEqual(document.getElementById('ez-styles'), null, 'styles removed again');

// ---- setSvg sanitization ----
const host = document.createElement('div');
setSvg(host, '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
assert.ok(host.querySelector('svg path'), 'svg preserved');
setSvg(host, '<svg><script>alert(1)</script><path d="M1"/></svg>');
assert.strictEqual(host.querySelector('script'), null, 'script stripped');
setSvg(host, '<svg><rect onclick="alert(1)" onmouseover="x()" width="4"/></svg>');
assert.strictEqual(host.querySelector('[onclick]'), null, 'onclick stripped');
assert.strictEqual(host.querySelector('[onmouseover]'), null, 'onmouseover stripped');
setSvg(host, '<a href="javascript:alert(1)">x</a>');
assert.strictEqual(host.querySelector('[href]'), null, 'javascript: href stripped');
setSvg(host, '');
assert.strictEqual(host.childNodes.length, 0, 'empty markup clears host');

// ---- Unicode-safe download names ----
assert.strictEqual(fileBase('デザイン 2024'), 'デザイン 2024', 'non-ASCII letters kept');
assert.strictEqual(fileBase('  my design!.v2 '), 'my designv2', 'punctuation removed');
assert.strictEqual(fileBase('///'), 'design', 'fallback base');
assert.strictEqual(fileBase(''), 'design', 'empty falls back');

// ---- Text edit commit is skipped when unchanged ----
const edT = new Editor({ target: '#app2', width: 300, height: 300, name: 'T' });
const txt = edT.addText({ text: 'Hello', fontSize: 24, x: 10, y: 10, w: 200 });
const tStack = edT.history._undoStack.length;
edT.startTextEdit(txt);
edT.commitTextEdit();
assert.strictEqual(edT.history._undoStack.length, tStack, 'unchanged text edit commits nothing');
assert.ok(!document.querySelector('.ez-text-editor'), 'text overlay removed');
edT.destroy();

console.log('All production-readiness audit tests passed.');
