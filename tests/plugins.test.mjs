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
const { renderPage } = await import('../src/core/renderer.js');
const { chartPreset } = await import('../src/core/charts.js');
const { elementName } = await import('../src/core/elements.js');
const container = (id) => {
  const node = document.createElement('div');
  node.id = id;
  document.body.appendChild(node);
  return node;
};

// ---- Entry validation happens before any setup runs ----
let setups = 0;
const counting = { id: 'p-count', version: '1.0.0', apiVersion: 1, setup: () => setups++ };
assert.throws(() => new Editor({ target: container('pl-v1'), plugins: [{ id: 'p-a', version: '1', apiVersion: 1 }] }), /setup/, 'missing setup rejected');
assert.throws(() => new Editor({ target: container('pl-v2'), plugins: [{ id: 'p-a', version: '1', apiVersion: 1, setup() {} }, { id: 'p-a', version: '1', apiVersion: 1, setup() {} }] }), /more than once/, 'duplicate plugin ids rejected');
assert.throws(() => new Editor({ target: container('pl-v3'), plugins: [{ id: 'p-a', version: '1', apiVersion: '1', setup() {} }] }), /integer/, 'non-integer apiVersion rejected');
assert.throws(() => new Editor({ target: container('pl-v4'), plugins: [{ id: 'p-a', version: '1', apiVersion: 99, setup() {} }] }), /API version 99.*supports 1/s, 'incompatible apiVersion rejected');
assert.throws(() => new Editor({ target: container('pl-v5'), plugins: [{ id: 'p-a', apiVersion: 1, setup() {} }] }), /version/, 'missing version rejected');
assert.throws(() => new Editor({ target: container('pl-v6'), plugins: ['nope'] }), /id/, 'malformed entry rejected');
assert.throws(() => new Editor({ target: container('pl-v7'), plugins: [{ id: '', version: '1', apiVersion: 1, setup() {} }] }), /id/, 'empty id rejected');
assert.equal(setups, 0, 'no setup ran for invalid configurations');

// ---- Setup ordering, options and the bare-plugin shorthand ----
const order = [];
const seenOptions = [];
const makePlugin = (id) => ({
  id, version: '1.0.0', apiVersion: 1,
  setup(ctx, options) {
    order.push(id);
    seenOptions.push(options);
    return () => order.push(id + ':cleanup');
  }
});
const editor = new Editor({
  target: container('pl-app'),
  width: 800,
  height: 600,
  plugins: [
    makePlugin('p-first'),
    { plugin: makePlugin('p-second'), options: { color: '#477cf5' } },
    makePlugin('p-third')
  ]
});
assert.deepEqual(order, ['p-first', 'p-second', 'p-third'], 'plugins setup in configuration order');
assert.deepEqual(seenOptions[1], { color: '#477cf5' }, 'entry options passed through');
assert.deepEqual(seenOptions[0], {}, 'bare plugin shorthand gets empty options');

// ---- Context basics: editor reference, tracked events, dispose callbacks, signal ----
const fires = [];
const disposeCalls = [];
let signal = null;
let ctxEditor = null;
const tracker = {
  id: 'p-tracker',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx) {
    signal = ctx.signal;
    ctxEditor = ctx.editor;
    assert.equal(ctx.apiVersion, 1, 'context exposes the api version');
    ctx.on('change', () => fires.push('on'));
    ctx.once('change', () => fires.push('once'));
    ctx.onDispose(() => disposeCalls.push('disposer'));
    return () => disposeCalls.push('cleanup');
  }
};
const tracked = new Editor({ target: container('pl-tracked'), plugins: [tracker] });
assert.equal(ctxEditor, tracked, 'context exposes the editor');
assert.equal(signal.aborted, false, 'signal starts live');
tracked.commit();
tracked.commit();
assert.deepEqual(fires, ['on', 'once', 'on'], 'tracked on/once fire; once removes itself');
tracked.plugins.dispose();
assert.deepEqual(disposeCalls, ['cleanup', 'disposer'], 'cleanup runs before onDispose callbacks');
assert.equal(signal.aborted, true, 'signal aborted at dispose');
tracked.emit('change');
assert.equal(fires.length, 3, 'tracked listeners removed after dispose');
// Untracked listeners survive a plugin dispose, unlike a full destroy.
const manual = tracked.on('change', () => fires.push('manual'));
tracked.emit('change');
assert.ok(fires.includes('manual'), 'untracked subscriptions are untouched by plugin dispose');
manual();

// ---- Cleanup order is reverse setup order; throwing disposers are contained ----
const destroyOrder = [];
const boom = {
  id: 'p-boom', version: '1.0.0', apiVersion: 1,
  setup(ctx) {
    return () => { destroyOrder.push('boom'); throw new Error('boom'); };
  }
};
const last = {
  id: 'p-last', version: '1.0.0', apiVersion: 1,
  setup(ctx) { return () => destroyOrder.push('last'); }
};
const disposable = new Editor({
  target: container('pl-dispose'),
  plugins: [
    { id: 'p-one', version: '1.0.0', apiVersion: 1, setup: () => () => destroyOrder.push('p-one') },
    boom,
    last
  ]
});
disposable.destroy();
assert.deepEqual(destroyOrder, ['last', 'boom', 'p-one'], 'plugins destroy in reverse setup order');
assert.ok(true, 'a throwing cleanup does not stop the remaining disposals');

// ---- Failed initialization disposes partial state and releases the target ----
const partialCleanups = [];
const failing = {
  id: 'p-failing', version: '1.0.0', apiVersion: 1,
  setup() { throw new Error('kaboom'); }
};
const partial = {
  id: 'p-partial', version: '1.0.0', apiVersion: 1,
  setup() { return () => partialCleanups.push('partial'); }
};
const targetNode = container('pl-retry');
assert.throws(
  () => new Editor({ target: targetNode, plugins: [partial, failing] }),
  /plugin "p-failing" failed to initialize: kaboom/,
  'setup errors fail startup with the plugin id and cause'
);
assert.deepEqual(partialCleanups, ['partial'], 'partially initialized plugins are disposed');
assert.equal(targetNode.__ezyreka, null, 'the target is released for retry');
const retried = new Editor({ target: targetNode, plugins: [makePlugin('p-ok')] });
assert.equal(retried.container, targetNode, 'a fresh editor can retry on the released target');
retried.destroy();

// ---- Async setup is rejected ----
const asyncPlugin = {
  id: 'p-async', version: '1.0.0', apiVersion: 1,
  setup: async () => {}
};
assert.throws(
  () => new Editor({ target: container('pl-async'), plugins: [asyncPlugin] }),
  /plugin "p-async" failed to initialize: setup\(\) must be synchronous/,
  'async setup fails startup'
);

// ---- Invalid cleanup return values are rejected ----
assert.throws(
  () => new Editor({
    target: container('pl-return'),
    plugins: [{ id: 'p-return', version: '1.0.0', apiVersion: 1, setup: () => 42 }]
  }),
  /plugin "p-return" failed to initialize: setup\(\) must return a cleanup function/,
  'non-function cleanup rejected'
);

// ---- Isolated registrations: two editors configure the same plugin ----
const badgeDraws = [];
const badgePlugin = {
  id: 'community-badges',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx, options) {
    ctx.registerElementType('community-badges-badge', {
      defaults: { w: 120, h: 40, fill: options.color },
      manifest: { name: 'Badge', toolbar: ['fill', 'opacity'] },
      render: (canvas, element) => badgeDraws.push(element.type)
    });
    ctx.registerChartType({ type: 'funnel', label: 'Funnel', group: 'Funnel charts', kind: 'bar' });
    ctx.registerBackgroundPainter('polkadots', (canvas) => {
      canvas.fillStyle = '#fff0f6';
      canvas.fill();
    });
    ctx.registerIcons({ ufo: 'M12 4a6 4 0 0 1 6 4l-1 5h-10l-1-5a6 4 0 0 1 6-4zm-3 12h6v2h-6z' });
    ctx.registerShapes([{ label: 'Octopus', path: 'M50 5 C75 5 95 25 95 50 C95 75 75 95 50 95 C25 95 5 75 5 50 C5 25 25 5 50 5 Z' }]);
    ctx.registerPanel({
      id: 'community-badges-panel',
      label: 'Badges',
      render: (contentEl) => { contentEl.textContent = 'Badges panel'; }
    });
    return () => badgeDraws.push('cleanup');
  }
};
const editorA = new Editor({ target: container('pl-a'), plugins: [{ plugin: badgePlugin, options: { color: '#477cf5' } }] });
const editorB = new Editor({ target: container('pl-b'), plugins: [{ plugin: badgePlugin, options: { color: '#ff0000' } }] });

const badgeA = editorA.addElement({ type: 'community-badges-badge', x: 10, y: 10 });
assert.equal(badgeA.fill, '#477cf5', 'editor A uses its configured options');
const badgeB = editorB.addElement({ type: 'community-badges-badge', x: 10, y: 10 });
assert.equal(badgeB.fill, '#ff0000', 'editor B uses its own options');
assert.ok(editorA.registry.elementDefaults['community-badges-badge'] && editorB.registry.elementDefaults['community-badges-badge'], 'each editor owns its registry entry');
assert.notEqual(editorA.registry.elementDefaults['community-badges-badge'],
                editorB.registry.elementDefaults['community-badges-badge'], 'entries are not shared by reference');
editorB.registry.elementDefaults['community-badges-badge'].fill = '#mutated';
assert.equal(editorA.registry.elementDefaults['community-badges-badge'].fill, '#477cf5', 'mutations do not leak between editors');

// Options objects are isolated per editor (defaults are deep-cloned).
assert.throws(() => editorA.plugins.instances[0].context.registerElementType('community-badges-badge', {}), /already exists/, 'duplicate plugin type rejected within an editor');

// Render dispatch is instance-scoped.
editorA.select([badgeA.id]);
editorA.render();
assert.ok(badgeDraws.includes('community-badges-badge'), 'editor A renders the plugin element');

// Editor B without the plugin renders a labeled placeholder and keeps the payload.
const badgeBType = badgeB.type;
// Simulate a missing plugin by loading B's document into a plugin-free editor.
const plain = new Editor({ target: container('pl-plain') });
plain.loadJSON(editorB.getJSON());
const loaded = plain.getElements();
assert.equal(loaded.length, 1, 'placeholder element retained without the plugin');
assert.equal(loaded[0].type, badgeBType, 'unknown type identifier preserved');
assert.equal(loaded[0].fill, '#ff0000', 'custom payload preserved');
assert.equal(loaded[0].__unresolved, true, 'element flagged as unresolved');
plain.render();
assert.ok(true, 'placeholder rendering does not throw');

// Plugin content survives save/load, copy/paste, duplication and undo/redo.
const badge2 = editorA.addElement({ type: 'community-badges-badge', x: 40, y: 40 });
editorA.select([badge2.id]);
editorA.copy();
editorA.paste();
assert.equal(editorA.getElements().filter((e) => e.type === 'community-badges-badge').length, 3, 'copy/paste works for plugin elements');
editorA.duplicateSelected();
editorA.undo();
editorA.redo();
assert.equal(editorA.getElements().filter((e) => e.type === 'community-badges-badge').length, 4, 'plugin elements survive undo/redo');
const roundTrip = new Editor({ target: container('pl-rt'), plugins: [{ plugin: badgePlugin, options: { color: '#477cf5' } }] });
roundTrip.loadJSON(editorA.getJSON());
assert.equal(roundTrip.getElements().filter((e) => e.type === 'community-badges-badge').length, 4, 'plugin content survives save/load with the plugin present');
assert.equal(roundTrip.getElements()[0].__unresolved, undefined, 'elements resolve when the plugin is loaded');
roundTrip.destroy();

// ---- Plugin chart types: editing works with the plugin, placeholders without ----
const chartA = editorA.addElement({ type: 'chart', chart: { type: 'funnel', categories: ['A', 'B'], series: [{ name: 'S', values: [3, 5] }] } });
assert.equal(chartA.chart.type, 'funnel', 'plugin chart type is not coerced');
editorA.select([chartA.id]);
editorA.updateSelected({ chart: { type: 'funnel', categories: ['A', 'B', 'C'], series: [{ name: 'S', values: [3, 5, 7] }] } });
assert.equal(chartA.chart.type, 'funnel', 'chart editing keeps the plugin type');
assert.deepEqual(chartA.chart.categories, ['A', 'B', 'C'], 'chart data edited');
editorA.clearSelection();
editorA.ui.sidepanel.setTab('charts');
assert.ok(editorA.ui.sidepanel.contentEl.textContent.includes('Funnel'), 'plugin chart type appears in the gallery');
const funnelB = editorB.addElement({ type: 'chart', chart: { type: 'funnel', categories: ['A'], series: [{ name: 'S', values: [1] }] } });
assert.equal(funnelB.chart.type, 'funnel', 'both editors keep their own chart registrations');
assert.ok(chartPreset('funnel', editorA.registry), 'funnel preset resolves in editor A');
assert.ok(chartPreset('funnel', editorB.registry), 'funnel preset resolves in editor B');
assert.ok(!chartPreset('funnel', plain.registry), 'funnel preset missing without the plugin');
// ---- Missing capabilities preserve data, render placeholders and block exports ----
const doc = {
  version: 1,
  pages: [
    {
      width: 500,
      height: 500,
      background: { type: 'polkadots' },
      elements: [
        { type: 'community-badges-badge', x: 0, y: 0, w: 100, h: 40, fill: '#ff0000' },
        { type: 'chart', x: 10, y: 60, w: 300, h: 200, chart: { type: 'funnel', categories: ['A'], series: [{ name: 'S', values: [1] }] } },
        { type: 'shape', x: 0, y: 300, w: 50, h: 50, shape: 'octopus' },
        { type: 'icon', x: 60, y: 300, w: 40, h: 40, icon: 'ufo' },
        { type: 'rect', x: 0, y: 0, w: 10, h: 10, hidden: true }
      ]
    },
    { width: 500, height: 500, background: { type: 'solid', color: '#ffffff' }, elements: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10 }] }]
};
plain.loadJSON(doc);
assert.equal(plain.getElements().length, 5, 'all content retained on the unresolved page');
const roundTripped = plain.getJSON();
assert.equal(roundTripped.pages[0].elements[1].chart.type, 'funnel', 'missing charts are not normalized into bar charts');
assert.equal(roundTripped.pages[0].background.type, 'polkadots', 'unknown background data retained');
assert.equal(roundTripped.pages[0].elements[0].fill, '#ff0000', 'unknown element payload retained');
renderPage(document.createElement('canvas').getContext('2d'), roundTripped.pages[0], { registry: plain.registry });
assert.ok(true, 'placeholders render without throwing');
await assert.rejects(
  () => plain.exportImage('png'),
  (error) =>
    /element type "community-badges-badge"/.test(error.message) &&
    /chart type "funnel"/.test(error.message) &&
    /shape "octopus"/.test(error.message) &&
    /icon "ufo"/.test(error.message) &&
    /background type "polkadots"/.test(error.message),
  'export identifies every missing capability'
);
await assert.rejects(() => plain.exportAllPages('png'), /page 1/, 'all-pages export is blocked before any download');
assert.ok(roundTripped.version === 1, 'document version unchanged');

// With the plugin present the same page exports fine.
const withPlugin = new Editor({ target: container('pl-exp'), plugins: [{ plugin: badgePlugin, options: { color: '#477cf5' } }] });
withPlugin.loadJSON(doc);
const url = await withPlugin.exportImage('png');
assert.ok(url.startsWith('data:image/png'), 'export works once the plugin is loaded');
withPlugin.destroy();

// ---- Panels: cleanup lifecycle and disabled UI ----
const panelRenders = [];
const panelCleanups = [];
const panelPlugin = {
  id: 'p-panels', version: '1.0.0', apiVersion: 1,
  setup(ctx) {
    ctx.registerPanel({
      id: 'p-panels-tab',
      label: 'Plugin',
      render(contentEl) {
        panelRenders.push(contentEl);
        return () => panelCleanups.push(contentEl);
      }
    });
  }
};
const panelEditor = new Editor({ target: container('pl-panels'), plugins: [panelPlugin] });
assert.ok(document.querySelector('[data-tab="p-panels-tab"]'), 'queued plugin panel mounted at UI construction');
panelEditor.ui.sidepanel.setTab('p-panels-tab');
assert.equal(panelRenders.length, 1, 'panel render invoked');
panelEditor.ui.sidepanel.rerender();
assert.equal(panelCleanups.length, 1, 'cleanup invoked before rerender');
assert.equal(panelRenders.length, 2, 'panel re-rendered after cleanup');
panelEditor.ui.sidepanel.setTab('elements');
assert.equal(panelCleanups.length, 2, 'cleanup invoked on tab replacement');
panelEditor.ui.sidepanel.setTab('p-panels-tab');
panelEditor.destroy();
assert.equal(panelCleanups.length, 3, 'cleanup invoked on destruction');
// With the sidebar disabled, plugin panel contributions stay unmounted.
const headlessPluginEditor = new Editor({ target: container('pl-noside'), ui: false, plugins: [panelPlugin] });
assert.equal(headlessPluginEditor._pendingPanels.length, 1, 'panel contribution remains queued and unmounted');
assert.ok(!document.querySelector('[data-tab="p-panels-tab"]'), 'no plugin tab rendered without the sidebar');
assert.equal(panelRenders.length, 3, 'panel render never invoked without the sidebar');
headlessPluginEditor.destroy();

// ---- Duplicate panels, image sources and builtin collisions are rejected ----
assert.throws(() => {
  const p1 = new Editor({
    target: container('pl-dup2'),
    plugins: [
      { id: 'p-dup', version: '1', apiVersion: 1, setup: (ctx) => { ctx.registerPanel({ id: 'x', render: () => {} }); } },
      { id: 'p-dup2', version: '1', apiVersion: 1, setup: (ctx) => { ctx.registerPanel({ id: 'x', render: () => {} }); } }
    ]
  });
  p1.destroy();
}, /already exists/, 'duplicate plugin panel ids rejected');
const imageSourceEditor = new Editor({
  target: container('pl-src'),
  plugins: [{
    id: 'p-src', version: '1.0.0', apiVersion: 1,
    setup: (ctx) => {
      ctx.registerImageSource({ id: 'stock', search: async () => [] });
      return () => {};
    }
  }]
});
imageSourceEditor.destroy();
assert.throws(() => new Editor({
  target: container('pl-src2'),
  plugins: [
    { id: 'p-s1', version: '1', apiVersion: 1, setup: (ctx) => { ctx.registerImageSource({ id: 'stock', search: async () => [] }); } },
    { id: 'p-s2', version: '1', apiVersion: 1, setup: (ctx) => { ctx.registerImageSource({ id: 'stock', search: async () => [] }); } }
  ]
}), /already exists/, 'duplicate image source ids rejected');
assert.throws(() => new Editor({
  target: container('pl-builtin'),
  plugins: [{ id: 'p-b', version: '1', apiVersion: 1, setup: (ctx) => { ctx.registerPanel({ id: 'layers', render: () => {} }); } }]
}), /already exists/, 'plugin panels cannot shadow built-in tabs');

// ---- Existing registration APIs keep their current behavior ----
const legacy = new Editor({ target: container('pl-legacy') });
legacy.registerElementType('legacy-shape', {
  defaults: { fill: '#00ff00', w: 30, h: 30 },
  manifest: { name: 'Legacy' },
  render: (ctx, el) => badgeDraws.push('legacy')
});
const le = legacy.addElement({ type: 'legacy-shape' });
assert.equal(elementName(le, legacy.registry), 'Legacy', 'editor.registerElementType still registers globally');
const legacyB = new Editor({ target: container('pl-legacy-b') });
const leB = legacyB.addElement({ type: 'legacy-shape' });
assert.equal(elementName(leB, legacyB.registry), 'Legacy', 'global registration visible to later editors (unchanged behavior)');
legacyB.render();
legacy.destroy();
legacyB.destroy();

// ready event still fires after plugin initialization completes
const readyPluginFired = [];
const readyPlugin = {
  id: 'p-ready2', version: '1.0.0', apiVersion: 1,
  setup(ctx) { ctx.once('ready', () => readyPluginFired.push('ready')); }
};
new Editor({ target: container('pl-ready2'), plugins: [readyPlugin] });
assert.deepEqual(readyPluginFired, ['ready'], 'plugins can subscribe to ready during setup');

console.log('All P1 plugin tests passed.');
