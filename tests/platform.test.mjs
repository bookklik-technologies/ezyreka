import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
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

dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new dom.window.Event('close'));
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
const { Emitter, normalizeHexColor, hexOr, isHexColor } = await import('../src/core/utils.js');
const { renderPage } = await import('../src/core/renderer.js');
const { normalizeChart, validateChart, chartPreset, CHART_PRESETS } = await import('../src/core/charts.js');
const { Editor } = await import('../src/index.js');

const container = (id) => {
  const node = document.createElement('div');
  node.id = id;
  document.body.appendChild(node);
  return node;
};

// ---- Emitter: once + wildcard ----
{
  const bus = new Emitter();
  let onceCount = 0;
  bus.once('ping', () => onceCount++);
  bus.emit('ping', 1);
  bus.emit('ping', 2);
  assert.equal(onceCount, 1, 'once fires a single time');

  const seen = [];
  bus.on('*', (event, payload) => seen.push([event, payload]));
  bus.emit('alpha', 10);
  bus.emit('beta', 20);
  assert.deepEqual(seen, [['alpha', 10], ['beta', 20]], 'wildcard receives every event');
}

// ---- Color helpers ----
assert.equal(normalizeHexColor('#ABC'), '#aabbcc', '3-digit hex expands');
assert.equal(normalizeHexColor('#AABBCC'), '#aabbcc', '6-digit hex lowercased');
assert.equal(normalizeHexColor('nope'), null, 'invalid hex rejected');
assert.equal(hexOr('#abc', '#000000'), '#aabbcc', 'hexOr expands');
assert.equal(hexOr('zzz', '#000000'), '#000000', 'hexOr falls back');
assert.ok(isHexColor('#fff') && !isHexColor('#ff'), 'isHexColor accepts 3 and 6 digits only');

// ---- Multi-stop gradients ----
{
  const stops = [];
  const ctx = new Proxy({}, {
    get: (t, key) => {
      if (key === 'createLinearGradient') return () => ({ addColorStop: (offset, color) => stops.push([offset, color]) });
      if (key === 'measureText') return (s) => ({ width: String(s).length * 10 });
      return () => {};
    },
    set: () => true
  });
  renderPage(ctx, {
    width: 100, height: 100,
    background: { type: 'solid', color: '#ffffff' },
    elements: [{
      type: 'rect', x: 0, y: 0, w: 50, h: 50,
      fill: { type: 'gradient', stops: [
        { color: '#111111', offset: 0 }, { color: '#222222', offset: 0.5 }, { color: '#333333', offset: 1 }
      ] }
    }]
  });
  assert.equal(stops.length, 3, 'all three stops painted');
  assert.deepEqual(stops.map(([offset]) => offset), [0, 0.5, 1], 'stop offsets preserved');
  const fallbackStops = [];
  const ctx2 = new Proxy({}, {
    get: (t, key) => {
      if (key === 'createLinearGradient') return () => ({ addColorStop: (offset, color) => fallbackStops.push([offset, color]) });
      if (key === 'measureText') return (s) => ({ width: String(s).length * 10 });
      return () => {};
    },
    set: () => true
  });
  renderPage(ctx2, {
    width: 100, height: 100,
    background: { type: 'solid', color: '#ffffff' },
    elements: [{ type: 'rect', x: 0, y: 0, w: 50, h: 50, fill: { type: 'gradient', from: '#123456', to: '#654321' } }]
  });
  assert.deepEqual(fallbackStops, [[0, '#123456'], [1, '#654321']], 'from/to pair still works');
}

// ---- registerChartType ----
const editor = new Editor({ target: container('p2-app'), width: 800, height: 600 });
const radarPaints = [];
editor.registerChartType(
  {
    type: 'radar', label: 'Radar', group: 'Radar charts', kind: 'radar',
    validate: (chart) => {
      if (chart.series.some(s => s.values.some(v => v !== null && v < 0))) {
        throw new Error('Radar charts need non-negative values.');
      }
    }
  },
  () => radarPaints.push('radar')
);
assert.ok(chartPreset('radar'), 'registered chart preset discoverable');
assert.ok(CHART_PRESETS.some(p => p.type === 'radar'), 'preset listed for the gallery');
assert.equal(normalizeChart({ type: 'radar', categories: ['A'], series: [{ values: [1] }] }).type, 'radar', 'registered type not coerced');
assert.equal(normalizeChart({ type: 'mystery' }).type, 'mystery', 'unknown types keep their identifier');
assert.throws(() => validateChart(normalizeChart({ type: 'radar', categories: ['A'], series: [{ values: [-3] }] })), /non-negative/, 'per-type validation applies');
assert.throws(() => editor.registerChartType({ type: 'radar', label: 'Radar' }), /already exists/, 'duplicate chart type rejected');
assert.throws(() => editor.registerChartType({ label: 'NoType' }), /type, label/, 'malformed preset rejected');
const radar = editor.addElement({ type: 'chart', chart: { type: 'radar', categories: ['A', 'B'], series: [{ values: [2, 4] }] } });
editor.select([radar.id]);
editor.render();
assert.ok(radarPaints.includes('radar'), 'custom chart renderer dispatched');
editor.ui.sidepanel.setTab('charts');
editor.clearSelection();
assert.ok(editor.ui.sidepanel.contentEl.textContent.includes('Radar'), 'new type appears in the gallery');

// ---- Hex text inputs in the toolbar ----
const rect = editor.addElement({ type: 'rect', x: 0, y: 0, w: 40, h: 40 });
editor.select([rect.id]);
editor.render();
const fillHex = [...editor.ui.toolbar.root.querySelectorAll('.ez-hex-input')]
  .find((input) => input.getAttribute('aria-label') === 'Fill color hex value');
assert.ok(fillHex, 'fill hex input rendered');
fillHex.value = '#112233';
fillHex.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal(editor.getSelected()[0].fill, '#112233', 'hex input updates the fill');
fillHex.value = 'zzz';
fillHex.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal(editor.getSelected()[0].fill, '#112233', 'invalid hex ignored');
fillHex.value = '#abc';
fillHex.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal(editor.getSelected()[0].fill, '#aabbcc', '3-digit hex expanded');
fillHex.dispatchEvent(new window.Event('change', { bubbles: true }));

// ---- Palette groups / registerPalette ----
editor.registerPalette([
  { label: 'Brand', colors: ['#101010', '#202020'] },
  { label: 'Neons', colors: ['#00ff00'] }
]);
assert.throws(() => editor.registerPalette([]), /non-empty/, 'empty palette rejected');
editor.ui.sidepanel.setTab('background');
const panelText = editor.ui.sidepanel.contentEl.textContent;
assert.ok(panelText.includes('Brand') && panelText.includes('Neons'), 'palette groups rendered');
const panel = editor.ui.sidepanel.contentEl;
assert.ok(panelText.includes('Brand') && panelText.includes('Neons'), 'palette groups rendered');
assert.equal([...panel.querySelectorAll('.ez-swatch')].filter(s => s.title === '#00ff00').length, 1, 'group swatches rendered');

// ---- Injectable history ----
const pushes = [];
const customHistory = {
  push: (snapshot) => pushes.push(snapshot),
  undo: () => null,
  redo: () => null,
  reset: () => {}
};
const seeded = new Editor({ target: container('p2-hist'), width: 400, height: 300, history: customHistory });
seeded.addElement({ type: 'rect', x: 0, y: 0, w: 20, h: 20 });
assert.ok(pushes.length >= 2, 'custom history receives snapshots');
assert.throws(() => new Editor({ target: container('p2-badhist'), history: {} }), /push\(\)/, 'incomplete history rejected');

// ---- Template schema validation ----
assert.throws(() => editor.applyTemplate({ page: { width: 'big' } }), /templates need/, 'applyTemplate validates');
assert.throws(() => editor.applyTemplate(null), /templates need/, 'applyTemplate rejects null');
editor.applyTemplate({ name: 'ok', page: { width: 400, height: 300, background: { type: 'solid', color: '#fff' }, elements: [] } });
assert.equal(editor.getPage().width, 400, 'valid template still applies');

// ---- Multipage templates: atomic validation, cloning, history and gallery ----
{
  const deck = {
    name: 'Six-page custom deck', category: 'Business', format: 'Presentation',
    pages: Array.from({ length: 6 }, (_, i) => ({
      width: 800, height: 450,
      elements: [{ id: 'reusable-id', type: 'rect', x: 10, y: 10, w: 100, h: 100,
        fill: { type: 'gradient', from: '#112233', to: '#ffffff', angle: i * 30 } }]
    }))
  };
  const host = container('p2-templates');
  const templated = new Editor({ target: host, templates: [deck] });
  const owned = templated.registry.templates.at(-1);
  deck.pages[0].elements[0].fill.from = '#000000';
  assert.equal(owned.pages[0].elements[0].fill.from, '#112233', 'constructor deeply owns multipage templates');
  templated.addElement({ type: 'rect', fill: '#ff0000' });
  templated.addPage();
  const before = templated.getJSON();
  templated.applyTemplate(owned);
  assert.equal(templated.doc.pages.length, 6, 'application replaces the full document');
  assert.equal(templated.pageIndex, 0, 'application opens the cover');
  assert.equal(templated.getSelected().length, 0, 'application clears selection');
  assert.deepEqual(templated.page.background, { type: 'solid', color: '#ffffff' }, 'omitted backgrounds default to white');
  assert.equal(host.querySelectorAll('.ez-page-chip').length, 6, 'page bar lists every template page');
  const firstIds = templated.doc.pages.flatMap(page => [page.id, ...page.elements.map(el => el.id)]);
  assert.equal(new Set(firstIds).size, 12, 'all page and element ids are fresh and unique');
  assert.ok(!firstIds.includes('reusable-id'), 'source ids are not reused');
  templated.undo();
  assert.deepEqual(templated.getJSON(), before, 'one undo restores the previous multipage document');
  templated.redo();
  assert.equal(templated.doc.pages.length, 6, 'redo restores all template pages');
  templated.page.elements[0].fill.from = '#ff0000';
  assert.equal(owned.pages[0].elements[0].fill.from, '#112233', 'editing does not mutate the registered source');
  assert.equal(templated.doc.pages[1].elements[0].fill.from, '#112233', 'page data is independent');
  templated.applyTemplate(owned);
  assert.ok(templated.doc.pages.every(page => !firstIds.includes(page.id) && page.elements.every(el => !firstIds.includes(el.id))), 'reapplication generates new identities');

  const validPage = { width: 800, height: 450, elements: [] };
  const invalid = [
    { name: 'Empty', pages: [] },
    { name: 'Neither' },
    { name: 'Both', page: validPage, pages: [validPage] },
    ...[0, -1, 10001, 1.5, Infinity, '800'].map(width => ({ name: 'Dimensions', pages: [validPage, { ...validPage, width }] })),
    { name: 'Element', pages: [validPage, { ...validPage, elements: [null] }] },
    { name: 'Geometry', pages: [{ ...validPage, elements: [{ type: 'rect', x: NaN }] }] },
    { name: 'Type', pages: [{ ...validPage, elements: [{ type: '' }] }] }
  ];
  const stableDoc = templated.getJSON();
  const stableCount = templated.registry.templates.length;
  for (const candidate of invalid) {
    assert.throws(() => templated.applyTemplate(candidate), /templates need/, 'invalid application rejected');
    assert.deepEqual(templated.getJSON(), stableDoc, 'invalid application leaves all pages intact');
    assert.throws(() => templated.registerTemplates([owned, candidate]), /templates need/, 'invalid registration batch rejected');
    assert.equal(templated.registry.templates.length, stableCount, 'registration batches are atomic');
  }
  assert.throws(() => new Editor({ target: container('p2-invalid-template-option'), templates: [invalid[0]] }), /templates need/, 'constructor uses the same validation');
  templated.registerTemplates(deck);
  deck.pages[1].elements[0].fill.to = '#000000';
  assert.equal(templated.registry.templates.at(-1).pages[1].elements[0].fill.to, '#ffffff', 'runtime registration owns nested page data');

  templated.ui.sidepanel.setTab('templates');
  const cards = [...host.querySelectorAll('.ez-template-card')];
  const card = cards.find(node => node.getAttribute('aria-label').startsWith('Use Business presentation,'));
  assert.ok(card.getAttribute('aria-label').includes('6 pages'), 'accessible label includes page count');
  assert.equal(card.querySelector('.ez-template-page-count').textContent, '6 pages', 'multipage badge visible');
  assert.ok(card.querySelector('.ez-template-meta').textContent.includes('6 pages'), 'metadata includes page count');
  const beforeConfirmation = templated.getJSON();
  const historyBeforeConfirmation = templated.history._undoStack.length;
  card.click();
  let confirmation = host.querySelector('.ez-template-dialog');
  assert.ok(confirmation.open, 'template selection asks for confirmation');
  assert.ok(confirmation.textContent.includes('overwrite all pages and content'), 'warning describes document-wide overwrite');
  assert.ok(confirmation.textContent.includes('Business presentation'), 'warning names the target template');
  assert.equal(document.activeElement.textContent, 'Cancel', 'cancel is focused by default');
  assert.deepEqual(templated.getJSON(), beforeConfirmation, 'opening confirmation does not replace the document');
  confirmation.querySelector('.ez-btn-ghost').click();
  assert.equal(host.querySelector('.ez-template-dialog'), null, 'cancel removes the prompt');
  assert.deepEqual(templated.getJSON(), beforeConfirmation, 'cancel preserves every page');
  assert.equal(templated.history._undoStack.length, historyBeforeConfirmation, 'cancel leaves undo history intact');
  assert.equal(document.activeElement, card, 'cancel returns focus to the template card');
  card.click();
  card.click();
  assert.equal(host.querySelectorAll('.ez-template-dialog').length, 1, 'only one confirmation can be open');
  confirmation = host.querySelector('.ez-template-dialog');
  confirmation.querySelector('.ez-btn-primary').click();
  assert.equal(templated.doc.pages.length, 6, 'gallery applies all six pages');
  assert.equal(templated.page.width, 1920, 'gallery previews and applies cover dimensions');
  const singleCard = cards.find(node => node.getAttribute('aria-label').startsWith('Use Summer Social,'));
  assert.equal(singleCard.querySelector('.ez-template-page-count'), null, 'legacy cards have no multipage badge');
  singleCard.click();
  assert.equal(templated.doc.pages.length, 6, 'legacy templates also wait for confirmation');
  host.querySelector('.ez-template-dialog .ez-btn-primary').click();
  assert.equal(templated.doc.pages.length, 1, 'legacy cards still replace the document with one page');
  card.click();
  templated.ui.sidepanel.setTab('elements');
  assert.equal(host.querySelector('.ez-template-dialog'), null, 'switching panels dismisses stale confirmations');
  assert.equal(templated.doc.pages.length, 1, 'panel cleanup never applies a pending template');
  templated.ui.sidepanel.confirmTemplate(owned, card);
  templated.destroy();
  assert.equal(document.querySelector('.ez-template-dialog'), null, 'destroy removes pending confirmations');

  const pluginHost = new Editor({ target: container('p2-plugin-template'), ui: false,
    plugins: [{ id: 'deck-plugin', version: '1.0.0', apiVersion: 1,
      setup(ctx) { ctx.registerTemplates(deck); }
    }] });
  pluginHost.applyTemplate(pluginHost.registry.templates.at(-1));
  assert.equal(pluginHost.doc.pages.length, 6, 'plugin registration accepts multipage templates');
  pluginHost.destroy();
}

// ---- Editor-only overflow workspace and page-sized exports ----
{
  const overflowEditor = new Editor({ target: container('p2-overflow'), width: 800, height: 600 });
  const outside = overflowEditor.addElement({ type: 'rect', x: -180, y: 700, w: 120, h: 90, fill: '#2855f9' });
  overflowEditor.addElement({ type: 'ellipse', x: 900, y: -120, w: 100, h: 80, rotation: 30, strokeWidth: 8, locked: true });
  overflowEditor.addElement({ type: 'rect', x: -100000, y: -100000, w: 20, h: 20, hidden: true });
  const geometry = overflowEditor.getJSON().pages[0].elements;
  overflowEditor.resizeCanvas(320, 240);
  assert.deepEqual(overflowEditor.getJSON().pages[0].elements, geometry, 'canvas resize preserves every element property');
  assert.ok(overflowEditor._workspaceBounds.x <= -180 && overflowEditor._workspaceBounds.y <= -120, 'workspace exposes negative coordinates');
  assert.ok(overflowEditor._workspaceBounds.x > -1000, 'hidden distant objects are ignored');
  assert.equal(overflowEditor.overflowCanvas.getAttribute('aria-hidden'), 'true', 'overflow bitmap is decorative');
  assert.ok(overflowEditor.overflowCanvas.width <= 1200 && overflowEditor.overflowCanvas.height <= 800, 'overflow bitmap stays viewport-sized');
  const pageRect = overflowEditor.canvas.getBoundingClientRect();
  const point = { clientX: pageRect.left - 120 * overflowEditor.zoom, clientY: pageRect.top + 745 * overflowEditor.zoom, button: 0,
    target: overflowEditor.stageWrap, preventDefault() {}, stopPropagation() {} };
  const mapped = overflowEditor.interactions.clientToWorld(point);
  assert.ok(Math.abs(mapped.x + 120) < 1e-6 && Math.abs(mapped.y - 745) < 1e-6, 'outside points retain page-relative coordinates');
  overflowEditor.interactions.onPointerDown(point);
  assert.equal(overflowEditor.getSelected()[0].id, outside.id, 'outside artwork can be selected');
  overflowEditor.interactions.onPointerUp({});
  const input = document.createElement('div');
  input.contentEditable = 'true';
  input.setAttribute('contenteditable', 'true');
  overflowEditor.overlay.append(input);
  assert.equal(overflowEditor.interactions.isWorkspaceEvent({ target: input }), false, 'inline editing is not intercepted');
  const oldWidth = overflowEditor.page.width;
  const output = await overflowEditor._renderPageToCanvas(overflowEditor.page, 1, false);
  assert.equal(output.width, 320, 'exports use page width rather than workspace width');
  assert.equal(output.height, 240, 'exports use page height rather than workspace height');
  overflowEditor.undo();
  assert.equal(overflowEditor.page.width, 800, 'undo restores the original page dimensions');
  overflowEditor.redo();
  assert.equal(overflowEditor.page.width, oldWidth, 'redo restores the resized page');
  overflowEditor.addPage();
  overflowEditor.render();
  assert.deepEqual(overflowEditor._workspaceBounds, { x: 0, y: 0, w: 320, h: 240 }, 'page changes discard previous workspace extents');
  overflowEditor.goToPage(0);
  overflowEditor.render();
  assert.ok(overflowEditor._workspaceBounds.x < 0, 'returning to the page restores its outside artwork');
  overflowEditor.destroy();
}

// ---- Themes: registration, custom names, cssVars ----
editor.registerTheme('ocean', { '--ez-accent': '#123456', '--ez-bg': '#223344' });
editor.setTheme('ocean');
assert.equal(editor.theme, 'ocean', 'custom theme accepted');
assert.equal(editor.container.style.getPropertyValue('--ez-accent'), '#123456', 'theme vars applied');
assert.ok(!editor.container.classList.contains('ez-dark'), 'custom theme is not dark');
editor.setTheme('light');
assert.equal(editor.container.style.getPropertyValue('--ez-accent'), '', 'custom vars removed on built-in switch');
assert.throws(() => editor.registerTheme('', null), /name and a CSS variables/, 'invalid theme rejected');
editor.setTheme('does-not-exist');
assert.equal(editor.theme, 'light', 'unknown theme names ignored');
const themed = new Editor({
  target: container('p2-themed'),
  theme: 'ocean',
  themes: { ocean: { '--ez-bg': '#010203' } },
  cssVars: { '--ez-accent': '#999999' }
});
assert.equal(themed.container.style.getPropertyValue('--ez-bg'), '#010203', 'initial custom theme applied');
assert.equal(themed.container.style.getPropertyValue('--ez-accent'), '#999999', 'cssVars option applied');

// ---- UI destroy hooks ----
let destroyed = 0;
for (const module of Object.values(editor.ui)) {
  const original = module.destroy?.bind(module);
  module.destroy = original ? () => { original(); destroyed++; } : () => { destroyed++; };
}
editor.destroy();
assert.equal(destroyed, Object.keys(editor.ui).length, 'every UI module torn down on destroy');

console.log('All P2 platform tests passed.');
