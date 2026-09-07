import assert from 'node:assert/strict';
import { CHART_PRESETS, sampleChart, normalizeChart, validateChart, pasteChartData, parseChartPaste, chartDomain, chartStacks } from '../src/core/charts.js';
import { createElement, hitTest } from '../src/core/elements.js';
import { drawChart } from '../src/core/chart-renderer.js';

const source = sampleChart('grouped-bar');
const normalized = normalizeChart(source);
normalized.series[0].values[0] = 900;
assert.notEqual(source.series[0].values[0], 900, 'normalization owns nested data');
const element = createElement('chart', { chart: source, x: 300, y: 200 });
assert.equal(element.w, 600);
assert.equal(element.h, 400);
element.chart.categories[0] = 'Changed';
assert.equal(source.categories[0], 'Jan');
assert.ok(hitTest(element, 400, 300), 'charts use positioned element hit testing');

const pasted = pasteChartData(sampleChart('bar'), 'Month\tSales\tCosts\nJun\t12\t-4\nJul\t\t7\n', 0, 0);
assert.deepEqual(pasted.categories.slice(0, 2), ['Jun', 'Jul']);
assert.deepEqual(pasted.series.map(s => s.name), ['Sales', 'Costs']);
assert.deepEqual(pasted.series[0].values.slice(0, 2), [12, null]);
assert.deepEqual(pasted.series[1].values.slice(0, 2), [-4, 7]);
const expanded = pasteChartData(pasted, '100\t200\n300\t400', 6, 2);
assert.equal(expanded.categories.length, 7);
assert.equal(expanded.series.length, 3);
assert.equal(expanded.series[2].values[6], 400);
assert.equal(expanded.series[2].values[0], null);
assert.deepEqual(parseChartPaste('"A\tB"\t2\n"C\nD"\t3'), [['A\tB', '2'], ['C\nD', '3']]);
assert.deepEqual(parseChartPaste('"say ""hello"""\t5'), [['say "hello"', '5']]);
assert.throws(() => parseChartPaste('A\t1\nB'), /rectangular/);
assert.throws(() => parseChartPaste('"unfinished'), /unclosed/);
const snapshot = JSON.stringify(pasted);
assert.throws(() => pasteChartData(pasted, '9\t12\n3\tbad', 1, 1), /finite number/);
assert.throws(() => pasteChartData(pasted, 'Infinity', 1, 1), /finite number/);
assert.equal(JSON.stringify(pasted), snapshot, 'invalid paste is atomic');
const pie = sampleChart('pie');
assert.throws(() => pasteChartData(pie, '-3', 1, 1), /non-negative/);
assert.throws(() => validateChart({ ...pasted, type: 'pie', series: [{ ...pasted.series[1] }] }), /non-negative/);
assert.deepEqual(normalizeChart({ ...pasted, type: 'pie' }).series, pasted.series, 'switching types retains every series');

const stacked = normalizeChart({ type: 'stacked-area', categories: ['A', 'B'], series: [
  { values: [4, -3] }, { values: [-5, 7] }, { values: [6, -2] }
] });
assert.deepEqual(chartStacks(stacked), [[{ start: 0, end: 4 }, { start: 0, end: -3 }],
  [{ start: 0, end: -5 }, { start: 0, end: 7 }], [{ start: 4, end: 10 }, { start: -3, end: -5 }]]);
assert.deepEqual(chartDomain(stacked), [-5, 10]);
assert.throws(() => validateChart(normalizeChart({ type: 'stacked-area', categories: ['A'], series: [
  { values: [Number.MAX_VALUE] }, { values: [Number.MAX_VALUE] }
] })), /too large/, 'overflowing stacked totals are rejected');

function recordingContext() {
  const calls = [];
  const ctx = new Proxy({ globalAlpha: 1, measureText: value => ({ width: String(value).length * 7 }) }, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${String(key)} got finite coordinates`);
        calls.push({ method: key, args });
      };
    }
  });
  return { ctx, calls };
}
for (const preset of CHART_PRESETS) {
  for (const [w, h] of [[600, 400], [120, 80], [8, 8]]) {
    const { ctx, calls } = recordingContext();
    drawChart(ctx, { chart: { ...sampleChart(preset.type), showValues: true, title: 'Example chart' }, w, h });
    assert.ok(calls.some(c => c.method === 'clip'), `${preset.type} clips within its bounds`);
    assert.ok(calls.some(c => ['fillRect', 'fill', 'stroke'].includes(c.method)), `${preset.type} draws`);
  }
}
const empty = recordingContext();
drawChart(empty.ctx, { chart: normalizeChart({ categories: [], series: [] }), w: 600, h: 400 });
assert.ok(empty.calls.some(c => c.method === 'fillText' && c.args[0] === 'No data to display'));
const zero = recordingContext();
drawChart(zero.ctx, { chart: { ...pie, series: [{ name: 'Zero', values: [0, 0, 0, 0, 0] }] }, w: 600, h: 400 });
assert.ok(zero.calls.some(c => c.method === 'fillText' && c.args[0] === 'No data to display'));
const missing = recordingContext();
drawChart(missing.ctx, { chart: normalizeChart({ type: 'line', categories: ['A', 'B', 'C'], series: [{ values: [4, null, 8] }], showAxes: false, showGrid: false }), w: 600, h: 400 });
assert.equal(missing.calls.filter(c => c.method === 'lineTo').length, 0, 'missing values break lines instead of connecting across gaps');
const negatives = recordingContext();
drawChart(negatives.ctx, { chart: stacked, w: 600, h: 400 });
assert.ok(negatives.calls.some(c => c.method === 'fill'));
console.log('All chart model and renderer tests passed.');
