import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
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
const { Editor } = await import('../src/index.js');
const { drawChart } = await import('../src/core/chart-renderer.js');
const { renderPage, registerElementRenderer } = await import('../src/core/renderer.js');
const { createElement, elementName, hitTest, manifestFor } = await import('../src/core/elements.js');

const container = (id) => {
  const node = document.createElement('div');
  node.id = id;
  document.body.appendChild(node);
  return node;
};

// ---- Per-type capability manifest ----
assert.equal(elementName(createElement('rect', {})), 'Rectangle', 'manifest name string');
assert.ok(elementName(createElement('icon', { icon: 'star' })).includes('star'), 'manifest name fn');
const line = createElement('line', { w: 200, h: 0, strokeWidth: 4 });
assert.ok(hitTest(line, 100, 0), 'segment hit-test from manifest');
assert.ok(!hitTest(line, 100, 60), 'segment hit-test rejects off-axis points');
assert.equal(manifestFor('chart').edit, 'chart', 'manifest edit capability');

// ---- registerElementType: a full custom element type without core edits ----
const badgeDrawn = [];
const editor = new Editor({ target: container('ext-app'), width: 800, height: 600 });
editor.registerElementType('badge', {
  defaults: { fill: '#477cf5', w: 120, h: 40, label: 'Hi' },
  manifest: { name: 'Badge', toolbar: ['fill', 'opacity'] },
  render: (ctx, el) => badgeDrawn.push(el.type)
});
const badge = editor.addElement({ type: 'badge', x: 10, y: 10 });
assert.equal(badge.fill, '#477cf5', 'custom type defaults applied');
assert.equal(elementName(badge), 'Badge', 'custom type manifest applied');
assert.ok(hitTest(badge, 40, 25), 'custom type hit-tested by AABB');
editor.select([badge.id]);
editor.render();
assert.ok(badgeDrawn.includes('badge'), 'custom type rendered through registry');
assert.throws(() => editor.registerElementType('badge', {}), /already exists/, 'duplicate type rejected');
assert.throws(() => editor.registerElementType('1bad', {}), /identifiers/, 'invalid type name rejected');

// ---- registerElementRenderer: override an existing type's renderer ----
const draws = [];
const alt = editor.addElement({ type: 'rect', x: 0, y: 0, w: 50, h: 50 });
editor.registerElementRenderer('rect', (ctx, el) => draws.push(el.id));
editor.render();
assert.ok(draws.includes(alt.id), 'renderer override used');
registerElementRenderer('rect', (ctx, el, registry) => draws.push('module-level'));
const { drawElement } = await import('../src/core/renderer.js');
drawElement(document.createElement('canvas').getContext('2d'), createElement('rect', {}));
assert.ok(draws.includes('module-level'), 'module-level renderer registration works');

// ---- registerChartRenderer ----
const chartPaints = [];
const chartEl = editor.addElement({ type: 'chart', x: 0, y: 0 });
editor.registerChartRenderer('bar', () => chartPaints.push('custom-bar'));
editor.render();
assert.ok(chartPaints.includes('custom-bar'), 'chart renderer override used');
const direct = [];
drawChart(new Proxy({}, { get: (t, k) => k === 'measureText' ? (s) => ({ width: 10 }) : () => {} }), chartEl, {
  chartRenderers: { bar: () => direct.push('injected') }
});
assert.ok(direct.includes('injected'), 'registry-injected chart renderer used');

// ---- registerBackgroundPainter ----
const paints = [];
editor.registerBackgroundPainter('stripes', () => paints.push('stripes'));
editor.getPage().background = { type: 'stripes' };
editor.render();
assert.ok(paints.includes('stripes'), 'background painter used');
editor.getPage().background = { type: 'mystery' };
editor.render();
editor.getPage().background = { type: 'solid', color: '#ffffff' };
assert.ok(true, 'unknown background falls back to solid without throwing');

// ---- registerPanel ----
const rendered = [];
editor.registerPanel({
  id: 'brand',
  label: 'Brand kit',
  icon: '<svg></svg>',
  render: (contentEl, ed) => rendered.push([contentEl, ed])
});
const tabBtn = document.querySelector('[data-tab="brand"]');
assert.ok(tabBtn, 'registered panel tab appears');
tabBtn.click();
assert.equal(rendered.length, 1, 'panel render invoked on tab switch');
assert.equal(rendered[0][1], editor, 'panel render receives the editor');
assert.throws(() => editor.registerPanel({ id: 'brand', render: () => {} }), /already exists/, 'duplicate panel rejected');
assert.throws(() => editor.registerPanel({ id: 'x' }), /render/, 'invalid panel rejected');

// ---- registerElementManifest ----
editor.registerElementManifest('rect', { name: 'Box' });
assert.equal(elementName(createElement('rect', {})), 'Box', 'manifest override applied');
editor.registerElementManifest('rect', { name: 'Rectangle' });

// ---- exclusiveProps still route chart props to charts only ----
const rectEl = editor.addElement({ type: 'rect', x: 0, y: 0, w: 30, h: 30 });
editor.select([chartEl.id, rectEl.id]);
editor.updateSelected({ chart: { ...chartEl.chart, title: 'Renamed' } });
assert.equal(chartEl.chart.title, 'Renamed', 'chart prop applied to chart');
assert.ok(!('chart' in rectEl), 'chart prop skipped for rect');

// ---- registerImage ----
let uploads = 0;
editor.on('upload', () => uploads++);
const entry = editor.registerImage({ src: 'https://example.com/a.png', name: 'A' });
assert.ok(entry.id.startsWith('up_'), 'registerImage returns an entry');
assert.equal(editor.uploads.at(-1).name, 'A', 'uploads library grows');
editor.registerImage('https://example.com/b.png');
assert.equal(uploads, 2, 'upload event emitted per registration');
assert.throws(() => editor.registerImage({}), /src/, 'image without src rejected');

// ---- registerImageSource + uploads panel integration ----
const searched = [];
editor.registerImageSource({
  id: 'stock',
  label: 'Stock photos',
  search: async (query) => {
    searched.push(query);
    return query === 'fail' ? Promise.reject(new Error('boom')) : [
      { src: 'https://example.com/s1.png', name: 'Sunset', thumb: 'https://example.com/s1_t.png' }
    ];
  }
});
editor.ui.sidepanel.setTab('uploads');
const searchBox = [...document.querySelectorAll('input[type="search"]')]
  .find((i) => i.getAttribute('aria-label')?.includes('Stock photos'));
assert.ok(searchBox, 'image source search box rendered');
await new Promise((r) => setTimeout(r, 20));
const thumbs = [...document.querySelectorAll('.sk-upload-thumb')];
assert.ok(thumbs.some((t) => t.title === 'Sunset'), 'provider results rendered');
assert.ok(searched.includes(''), 'initial search ran');
const sunsetThumb = thumbs.find((t) => t.title === 'Sunset');
sunsetThumb.click();
assert.ok(editor.getElements().some((e2) => e2.type === 'image' && e2.name === 'Sunset'), 'provider result added to canvas');
assert.ok(editor.uploads.some((u) => u.name === 'Sunset'), 'provider result added to recents');

// ---- options.ui: partial disable ----
const partial = new Editor({ target: container('ext-partial'), ui: { contextMenu: false, pagesBar: false } });
assert.ok(partial.ui.topbar, 'topbar built when not disabled');
assert.ok(!partial.ui.contextMenu, 'contextMenu disabled via options');
assert.ok(!partial.ui.pagesBar, 'pagesBar disabled via options');
assert.equal(partial.topbarEl.style.display, '', 'enabled module container untouched');
assert.equal(partial.pagesBarEl.style.display, 'none', 'disabled module container hidden');
partial.addText({ text: 'works' });
assert.equal(partial.getElements().length, 1, 'editor functional with partial UI');

// ---- options.ui: custom module constructor ----
class MiniToolbar {
  constructor(editor) { this.editor = editor; this.built = true; }
  update() {}
}
const swapped = new Editor({ target: container('ext-swapped'), ui: { toolbar: MiniToolbar } });
assert.ok(swapped.ui.toolbar instanceof MiniToolbar, 'custom UI module instantiated');
assert.ok(swapped.ui.sidepanel, 'other modules keep defaults');

// ---- options.ui: headless mode ----
const headless = new Editor({ target: container('ext-headless'), ui: false });
assert.ok(!headless.ui.topbar && !headless.ui.sidepanel && !headless.ui.toolbar, 'headless: no UI modules');
assert.equal(headless.topbarEl.style.display, 'none', 'topbar DOM hidden');
assert.equal(headless.sidepanelEl.style.display, 'none', 'sidepanel DOM hidden');
headless.addText({ text: 'Headless', x: 10, y: 10, w: 200 });
headless.undo();
assert.equal(headless.getElements().length, 0, 'headless history works');
headless.destroy();
assert.ok(!headless.container.classList.contains('sk-editor'), 'headless destroy works');

// ---- registerPanel without sidepanel ----
assert.throws(() => headless.registerPanel({ id: 'x', render: () => {} }), /sidepanel/, 'panels need the sidepanel');

console.log('All P1 extensibility tests passed.');
