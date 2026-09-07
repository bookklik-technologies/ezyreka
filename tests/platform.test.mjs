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
