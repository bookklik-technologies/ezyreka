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
  const shape = svg.querySelector('path, circle, line, rect, polyline, polygon');
  assert.ok(shape, `${button.title}: icon shape exists`);
  if (shape.tagName.toLowerCase() === 'path') {
    assert.ok(shape.getAttribute('d'), `${button.title}: icon path exists`);
  }
  assert.strictEqual(shape.namespaceURI, 'http://www.w3.org/2000/svg', `${button.title}: drawable SVG path`);
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

editor.goToPage(0);
const firstPageId = editor.page.id;
editor.movePage(0, 1);
assert.strictEqual(editor.doc.pages[1].id, firstPageId, 'movePage reorders');
assert.strictEqual(editor.pageIndex, 1, 'pageIndex follows moved page');
editor.undo();
assert.strictEqual(editor.doc.pages[0].id, firstPageId, 'undo restores page order');
editor.redo();
assert.strictEqual(editor.doc.pages[1].id, firstPageId, 'redo reapplies page order');

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

assert.strictEqual(editor.theme, 'light', 'default theme');
const themeBtn = document.querySelector('[data-act="theme"]');
assert.ok(themeBtn.querySelector('svg'), 'theme button has icon');
editor.toggleTheme();
assert.strictEqual(editor.theme, 'dark', 'toggleTheme switches to dark');
assert.ok(document.getElementById('app').classList.contains('sk-dark'), 'sk-dark class applied');
editor.setTheme('light');
assert.strictEqual(editor.theme, 'light', 'setTheme light');
assert.ok(!document.getElementById('app').classList.contains('sk-dark'), 'sk-dark class removed');
editor.setTheme('bogus');
assert.strictEqual(editor.theme, 'light', 'invalid theme ignored');

// Charts are native editable elements and share the existing document lifecycle.
const { sampleChart, CHART_PRESETS } = await import('../src/core/charts.js');
editor.loadJSON({ pages: [{ width: 900, height: 700, elements: [] }] });
const sidepanel = editor.ui.sidepanel;
sidepanel.setTab('charts');
assert.equal(document.querySelectorAll('.sk-chart-card').length, 9, 'nine usable chart presets');
for (const preset of CHART_PRESETS) {
  sidepanel.charts.gallery = true;
  sidepanel.charts.render();
  document.querySelector(`[aria-label="Add ${preset.label} chart"]`).click();
  assert.equal(editor.getSelected()[0].chart.type, preset.type, `${preset.label} inserts and selects`);
  assert.equal(editor.getSelected()[0].w, 600);
  assert.equal(editor.getSelected()[0].h, 400);
  assert.ok(document.querySelector('.sk-chart-table'), 'insertion opens data editor');
}
const chartItem = editor.getSelected()[0];
const chartId = chartItem.id;
const changeCell = (selector, value, root = document) => {
  const input = root.querySelector(selector);
  assert.ok(input, selector);
  input.value = value;
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
  return input;
};
const dataCellSelector = '.sk-chart-table input[data-row="1"][data-column="1"]';
const focusedCell = document.querySelector(dataCellSelector);
focusedCell.focus();
changeCell(dataCellSelector, '125');
assert.equal(chartItem.chart.series[0].values[0], 125, 'cell edit reaches model');
assert.equal(document.activeElement, focusedCell, 'editing does not replace focused input');
changeCell(dataCellSelector, 'not a number');
assert.equal(chartItem.chart.series[0].values[0], 125, 'invalid edit preserves model');
assert.equal(focusedCell.getAttribute('aria-invalid'), 'true');
changeCell(dataCellSelector, '126');
const focusedPaste = new window.Event('paste', { bubbles: true, cancelable: true });
Object.defineProperty(focusedPaste, 'clipboardData', { value: { getData: () => '127' } });
focusedCell.dispatchEvent(focusedPaste);
assert.equal(focusedCell.value, '127', 'focused paste cell reflects the applied data');
assert.equal(document.activeElement, focusedCell, 'single-cell paste retains focus');
focusedCell.blur();
const beforePaste = JSON.stringify(chartItem.chart);
const pasteEvent = new window.Event('paste', { bubbles: true, cancelable: true });
Object.defineProperty(pasteEvent, 'clipboardData', { value: { getData: () => 'A\t50\t60\nB\t70\t80' } });
document.querySelector('.sk-chart-table input[data-row="1"][data-column="0"]').dispatchEvent(pasteEvent);
assert.equal(chartItem.chart.categories[0], 'A');
assert.equal(chartItem.chart.series[1].values[1], 80);
editor.undo();
assert.equal(JSON.stringify(editor.getElements().find(e => e.id === chartId).chart), beforePaste, 'paste is one undo step');
editor.redo();
editor.select([chartId]);
sidepanel.charts.open();
assert.equal(editor.getSelected()[0].chart.series[0].values[0], 50, 'redo restores pasted values');
const initialRows = editor.getSelected()[0].chart.categories.length;
document.querySelector('.sk-chart-data-actions button:first-child').click();
assert.equal(editor.getSelected()[0].chart.categories.length, initialRows + 1);
document.querySelector(`[aria-label="Remove category ${initialRows + 1}"]`).click();
assert.equal(editor.getSelected()[0].chart.categories.length, initialRows);
const initialSeries = editor.getSelected()[0].chart.series.length;
document.querySelector('.sk-chart-data-actions button:last-child').click();
assert.equal(editor.getSelected()[0].chart.series.length, initialSeries + 1);
document.querySelector(`[aria-label="Remove series ${initialSeries + 1}"]`).click();
assert.equal(editor.getSelected()[0].chart.series.length, initialSeries);
document.querySelector('.sk-chart-editor-tabs button:last-child').click();
const seriesBeforeSwitch = JSON.stringify(editor.getSelected()[0].chart.series);
changeCell('[aria-label="Chart type"]', 'pie');
assert.equal(editor.getSelected()[0].chart.type, 'pie');
assert.equal(JSON.stringify(editor.getSelected()[0].chart.series), seriesBeforeSwitch, 'switch retains unused series');
assert.ok(document.querySelector('.sk-chart-note').textContent.includes('first series'));
changeCell('[aria-label="Chart type"]', 'bar');
document.querySelector('.sk-chart-editor-tabs button:first-child').click();
changeCell(dataCellSelector, '-10');
document.querySelector('.sk-chart-editor-tabs button:last-child').click();
changeCell('[aria-label="Chart type"]', 'donut');
assert.equal(editor.getSelected()[0].chart.type, 'bar', 'negative data blocks circular type change');
assert.equal(document.querySelector('[aria-label="Chart type"]').value, 'bar');
assert.ok(document.querySelector('.sk-chart-error').textContent.includes('non-negative'));
editor.toggleLock();
assert.ok([...document.querySelectorAll('.sk-chart-style-field input, .sk-chart-style-field select')].every(input => input.disabled));
const lockedData = JSON.stringify(editor.getSelected()[0].chart);
editor.updateSelected({ chart: sampleChart('pie') });
assert.equal(JSON.stringify(editor.getSelected()[0].chart), lockedData, 'locked chart data cannot change');
editor.toggleLock();

// Duplicate and paste must use fresh ids and independent chart data.
editor.duplicateSelected();
const duplicate = editor.getSelected()[0];
assert.notEqual(duplicate.id, chartId);
const originalValue = editor.getElements().find(e => e.id === chartId).chart.series[0].values[0];
editor.updateSelected({ chart: { ...duplicate.chart, title: 'Copy' } });
duplicate.chart.series[0].values[0] = 999;
assert.equal(editor.getElements().find(e => e.id === chartId).chart.series[0].values[0], originalValue);
editor.commit();
editor.copy(); editor.paste();
assert.notEqual(editor.getSelected()[0].id, duplicate.id);
assert.notEqual(editor.getSelected()[0].chart.series, duplicate.chart.series);
const pastedId = editor.getSelected()[0].id;
editor.moveLayer(editor.getElements().length - 1, 0);
assert.equal(editor.getElements()[0].id, pastedId, 'charts reorder with layers');
editor.updateSelected({ x: 30, y: 40, w: 320, h: 240, rotation: 30, flipX: true, flipY: true, opacity: 0.5 });
assert.equal(editor.getSelected()[0].rotation, 30);
editor.updateSelected({ hidden: true }); editor.render();
editor.updateSelected({ hidden: false });
const chartJSON = editor.getJSON();
editor.loadJSON(chartJSON);
editor.select([pastedId]);
assert.equal(editor.getSelected()[0].chart.title, 'Copy', 'saved charts reload as editable data');
assert.notEqual(editor.getSelected()[0].chart.series, chartJSON.pages[0].elements[0].chart.series);
sidepanel.setTab('elements');
editor.select([pastedId]);
assert.equal(sidepanel.activeTab, 'elements', 'ordinary selection does not change sidebar tab');
editor.toolbarEl.querySelector('.sk-btn').click();
assert.equal(sidepanel.activeTab, 'charts', 'toolbar opens chart editor');
sidepanel.setCollapsed(true);
sidepanel.charts.open();
assert.equal(sidepanel.collapsed, false, 'edit chart expands collapsed sidebar');
sidepanel.charts.section = 'Data'; sidepanel.charts.render();
dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')); };
document.querySelector('.sk-chart-expand').click();
const chartDialog = document.querySelector('.sk-chart-dialog');
assert.ok(chartDialog.open, 'expanded data dialog opens');
changeCell(dataCellSelector, '321', chartDialog);
assert.equal(editor.getSelected()[0].chart.series[0].values[0], 321, 'modal shares live data');
const beforeKeyboard = editor.getSelected()[0].x;
chartDialog.querySelector('.sk-chart-done').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
assert.equal(editor.getSelected()[0].x, beforeKeyboard, 'dialog keys do not move canvas elements');
chartDialog.querySelector('.sk-chart-done').click();
assert.ok(!document.querySelector('.sk-chart-dialog'));
assert.equal(editor.getSelected()[0].chart.series[0].values[0], 321, 'closing keeps edits');
const exportCanvas = await editor._renderPageToCanvas(editor.page, 2, false);
assert.equal(exportCanvas.width, 1800); assert.equal(exportCanvas.height, 1400);
const originalToDataURL = dom.window.HTMLCanvasElement.prototype.toDataURL;
const formats = [];
dom.window.HTMLCanvasElement.prototype.toDataURL = function (format) { formats.push(format); return `data:${format};base64,x`; };
dom.window.HTMLAnchorElement.prototype.click = () => {};
await editor.exportImage('png'); await editor.exportImage('jpeg');
assert.deepEqual(formats, ['image/png', 'image/jpeg'], 'chart exports use both formats');
dom.window.HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
editor.addPage();
assert.ok(!document.querySelector('.sk-chart-table'), 'page switch clears stale chart editor');
editor.goToPage(0); editor.select([pastedId]);
editor.setTheme('dark'); sidepanel.charts.open();
assert.ok(document.querySelector('.sk-chart-table'), 'chart editor remains usable in dark theme');
editor.setTheme('light');

// Double-click edits the topmost chart and survives resizing and page changes.
editor.bringToFront();
sidepanel.setTab('elements');
const selectedChart = editor.getSelected()[0];
editor.interactions.onDblClick(pointerAt({ x: selectedChart.x + selectedChart.w / 2, y: selectedChart.y + selectedChart.h / 2 }));
assert.equal(sidepanel.activeTab, 'charts', 'double-click reopens chart controls');
const startWidth = selectedChart.w, startHeight = selectedChart.h;
const resizePoint = editor.interactions.handlePoint(selectedChart, 'se');
editor.interactions.startResize(pointerAt(resizePoint), 'se');
const resizeDelta = rotatePoint(50, 40, 0, 0, deg2rad(selectedChart.rotation));
editor.interactions.onPointerMove(pointerAt({ x: resizePoint.x + resizeDelta.x, y: resizePoint.y + resizeDelta.y }));
editor.interactions.onPointerUp({});
assert.ok(selectedChart.w > startWidth && selectedChart.h > startHeight, 'chart resizes using standard handles');
sidepanel.charts.section = 'Data'; sidepanel.charts.render();
document.querySelector('.sk-chart-expand').click();
editor.goToPage(1);
assert.ok(!document.querySelector('.sk-chart-dialog'), 'changing page closes the stale data dialog');

editor.destroy();
assert.strictEqual(document.getElementById('app').innerHTML, '', 'destroyed');

console.log('All DOM smoke tests passed.');
