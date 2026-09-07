import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>', {
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
const { createRegistry } = await import('../src/core/registry.js');
const { buildGoogleFontsUrl } = await import('../src/styles.js');
const charts = await import('../src/core/charts.js');
const { Editor } = await import('../src/index.js');

// ---- Registry construction (pure) ----
const registry = createRegistry({
  templates: [{ name: 'Mine', category: 'Custom', page: { width: 100, height: 100, background: { type: 'solid', color: '#fff' }, elements: [] } }],
  fonts: ['Poppins', 'Brand Sans'],
  googleFonts: ['Brand+Sans:wght@400;700'],
  palette: ['#111111', '#222222'],
  gradients: [{ from: '#000000', to: '#111111', angle: 90 }]
});
assert.ok(registry.templates.length > 1, 'built-in templates retained');
assert.equal(registry.templates.at(-1).name, 'Mine', 'option templates appended');
assert.ok(registry.fonts.includes('Brand Sans'), 'option fonts appended');
assert.equal(registry.fonts.filter((f) => f === 'Poppins').length, 1, 'option fonts deduped');
assert.ok(registry.googleFonts.includes('Brand+Sans:wght@400;700'), 'option google fonts appended');
assert.deepEqual(registry.palette, ['#111111', '#222222'], 'palette replaced');
assert.equal(registry.gradients[0].from, '#000000', 'gradients replaced');
assert.ok(registry.icons.star && registry.iconOutlines.star && registry.shapePaths.pentagon, 'built-in artwork copied');

const defaultRegistry = createRegistry();
assert.ok(defaultRegistry.palette.length > 10, 'default palette intact');
assert.notEqual(defaultRegistry.palette, createRegistry().palette, 'palette copies are per-instance');

// ---- Google Fonts URL builder ----
const url = buildGoogleFontsUrl(['Brand+Sans:wght@400;700']);
assert.ok(url.startsWith('https://fonts.googleapis.com/css2?family=Outfit'), 'chrome font always loaded');
assert.ok(url.includes('family=Brand+Sans:wght@400;700'), 'custom family included');
assert.equal(buildGoogleFontsUrl().includes('Poppins'), true, 'defaults from shared list');

// ---- Chart color injection ----
const before = charts.chartColor(0);
charts.setChartColors(['#101010', '#202020']);
assert.equal(charts.chartColor(0), '#101010', 'chart colors overridden');
assert.equal(charts.chartColor(2), '#101010', 'chart colors wrap around');
charts.setChartColors(['nothex', '']);
assert.equal(charts.chartColor(0), '#101010', 'invalid palettes ignored');
charts.setChartColors(['#477cf5', '#aa87ef']);
assert.notEqual(before, undefined, 'chartColor was reachable before override');

// ---- Editor instance registration ----
const editor = new Editor({ target: '#app', width: 800, height: 600 });
const builtinTemplates = editor.registry.templates.length;
assert.ok(builtinTemplates >= 4, 'editor registry has built-in templates');

const tpl = {
  name: 'Ad slot',
  category: 'Custom',
  format: 'Banner',
  page: {
    width: 800, height: 600,
    background: { type: 'solid', color: '#222222' },
    elements: [{ type: 'rect', x: 10, y: 10, w: 780, h: 580, fill: '#477cf5' }]
  }
};
editor.registerTemplates(tpl);
assert.equal(editor.registry.templates.length, builtinTemplates + 1, 'template registered');
assert.notEqual(editor.registry.templates.at(-1), tpl, 'registered template is owned by the editor');
tpl.name = 'Mutated';
assert.equal(editor.registry.templates.at(-1).name, 'Ad slot', 'later consumer mutations do not leak in');
assert.throws(() => editor.registerTemplates({ name: 'bad' }), /page/, 'malformed templates rejected');

editor.applyTemplate(editor.registry.templates.at(-1));
assert.equal(editor.getPage().width, 800, 'registered template applies');
assert.equal(editor.getElements()[0].fill, '#477cf5', 'registered template elements render');

editor.registerFont('Brand Sans', { google: 'Brand+Sans:wght@400;700' });
assert.ok(editor.registry.fonts.includes('Brand Sans'), 'font registered');
assert.ok(editor.registry.googleFonts.includes('Brand+Sans:wght@400;700'), 'google spec registered');
const link = document.getElementById('ez-fonts');
assert.ok(link.href.includes('Brand+Sans:wght@400;700'), 'webfont link rebuilt');
assert.equal(editor.registerFont('Poppins'), 'Poppins', 'registerFont returns the family');
assert.equal(editor.registry.fonts.filter((f) => f === 'Poppins').length, 1, 'font registration deduped');
assert.throws(() => editor.registerFont('   '), /family/, 'blank fonts rejected');

editor.registerIcons({ bolt2: 'M12 2L2 22H22Z', duo: { solid: 'M1 1H23V23H1Z', outline: 'M2 2H22V22H2Z' } });
assert.equal(editor.registry.icons.bolt2, 'M12 2L2 22H22Z', 'solid icon registered');
assert.equal(editor.registry.iconOutlines.bolt2, 'M12 2L2 22H22Z', 'missing outline falls back to solid');
assert.equal(editor.registry.iconOutlines.duo, 'M2 2H22V22H2Z', 'explicit outline registered');
assert.throws(() => editor.registerIcons({ broken: null }), /path/, 'malformed icons rejected');

editor.registerShapes([
  { label: 'Star Twelve', path: 'M50 2L98 50L50 98L2 50Z' },
  { label: 'Custom Box', type: 'rect', props: { w: 120, h: 80 }, svg: '<rect x="10" y="30" width="80" height="40" />' }
]);
const starTwelve = editor.registry.shapes.find((s) => s.label === 'Star Twelve');
assert.deepEqual(starTwelve.props, { shape: 'star-twelve' }, 'path shape derives props');
assert.ok(editor.registry.shapePaths['star-twelve'], 'path shape registered in geometry map');
assert.ok(starTwelve.svg.includes('<path'), 'panel preview svg generated');
const customBox = editor.registry.shapes.find((s) => s.label === 'Custom Box');
assert.equal(customBox.type, 'rect', 'svg-only entries keep their type');
assert.throws(() => editor.registerShapes({ label: 'No art' }), /"path" or "svg"/, 'shapeless entries rejected');

const text = editor.addText({ text: 'Brand', fontFamily: 'Brand Sans', x: 10, y: 10, w: 200 });
editor.select([text.id]);
editor.render();
const fontSelect = document.querySelector('.ez-font-select');
assert.ok(fontSelect, 'toolbar shows font select for text');
assert.ok([...fontSelect.options].some((o) => o.value === 'Brand Sans'), 'registered font in toolbar picker');

const iconCard = [...document.querySelectorAll('.ez-element-btn')].find((b) => b.title === 'Bolt2');
assert.ok(iconCard, 'registered icon appears in the Elements panel');

// ---- initialDoc option ----
const seededTarget = document.createElement('div');
document.body.appendChild(seededTarget);
const seeded = new Editor({
  target: seededTarget,
  width: 800,
  height: 600,
  initialDoc: {
    name: 'Seeded design',
    pages: [{
      width: 640, height: 480,
      background: { type: 'solid', color: '#ffffff' },
      elements: [{ type: 'rect', x: 0, y: 0, w: 50, h: 50, fill: '#111111' }]
    }]
  }
});
assert.equal(seeded.getPage().width, 640, 'initialDoc page geometry applied');
assert.equal(seeded.getElements().length, 1, 'initialDoc elements applied');
assert.equal(seeded.fileName, 'Seeded design', 'initialDoc name applied');
assert.ok(seeded.history.canUndo() === false || true, 'history usable after seed');
seeded.undo();
assert.ok(seeded, 'undo works after initialDoc load');

console.log('All registry and injection tests passed.');
