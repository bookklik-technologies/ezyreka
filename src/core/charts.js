import { hexOr, normalizeHexColor } from './utils.js';

export const CHART_COLORS = ['#477cf5', '#aa87ef', '#f6b966', '#ffdf58', '#41bda7', '#ed759b'];
let activeChartColors = CHART_COLORS;
// Replaces the default series palette. Applies to every editor in the page
// (chart colors are baked into normalized chart data, not the registry).
export function setChartColors(colors) {
  if (!Array.isArray(colors)) return;
  const valid = colors.map(c => normalizeHexColor(c)).filter(Boolean);
  if (valid.length) activeChartColors = valid;
}

// Per-type capability table: every type declares its rendering kind and
// data rules, so predicates and validation derive from data instead of
// scattered if-chains. Register new types via registerChartPreset.
const rejectNegativeFirstSeries = chart => {
  if (chart.series[0]?.values.some(v => v !== null && v < 0)) {
    throw new Error('Pie and donut charts need non-negative values in the first series.');
  }
};
const rejectOverflowingStacks = chart => {
  if (chartStacks(chart).some(series => series.some(v => v && !Number.isFinite(v.end)))) {
    throw new Error('Stacked totals are too large. Use smaller values.');
  }
};

export const CHART_PRESETS = [
  { type: 'bar', label: 'Bar', group: 'Bar charts', kind: 'bar' },
  { type: 'row', label: 'Row', group: 'Bar charts', kind: 'bar', horizontal: true },
  { type: 'grouped-bar', label: 'Grouped bar', group: 'Bar charts', kind: 'bar', multiSeries: true },
  { type: 'line', label: 'Line', group: 'Line charts', kind: 'line' },
  { type: 'multi-line', label: 'Multi-line', group: 'Line charts', kind: 'line', multiSeries: true },
  { type: 'pie', label: 'Pie', group: 'Pie and donut charts', kind: 'circular', circular: true, validate: rejectNegativeFirstSeries },
  { type: 'donut', label: 'Donut', group: 'Pie and donut charts', kind: 'circular', circular: true, validate: rejectNegativeFirstSeries },
  { type: 'area', label: 'Area', group: 'Area charts', kind: 'area' },
  { type: 'stacked-area', label: 'Stacked area', group: 'Area charts', kind: 'stacked-area', multiSeries: true, validate: rejectOverflowingStacks }
];

export const chartPreset = type => CHART_PRESETS.find(p => p.type === type) || null;

export function registerChartPreset(preset) {
  if (!preset || typeof preset.type !== 'string' || !preset.label) {
    throw new Error('ezyreka: chart presets need { type, label }');
  }
  if (chartPreset(preset.type)) {
    throw new Error(`ezyreka: chart type "${preset.type}" already exists`);
  }
  CHART_PRESETS.push({ group: 'Other charts', ...preset });
  return preset;
}

export const isCircularChart = type => chartPreset(type)?.circular === true;
export const isMultiSeriesChart = type => chartPreset(type)?.multiSeries === true;
export const chartColor = index => activeChartColors[index % activeChartColors.length];

export function sampleChart(type = 'bar') {
  return normalizeChart({
    type,
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    series: (isMultiSeriesChart(type) ? [[24, 42, 35, 64, 80], [16, 28, 44, 52, 65], [10, 18, 24, 32, 48]] : [[24, 42, 35, 64, 80]])
      .map((values, i) => ({ name: `Series ${i + 1}`, values, color: chartColor(i) }))
  });
}

// Every call returns fresh arrays and objects, including when supplied by the API.
export function normalizeChart(input = {}) {
  input = input && typeof input === 'object' ? input : {};
  const type = chartPreset(input.type) ? input.type : 'bar';
  const categories = Array.isArray(input.categories) ? input.categories.map(v => String(v ?? '')) : ['Jan', 'Feb', 'Mar'];
  const source = Array.isArray(input.series) ? input.series : [{ name: 'Series 1', values: [24, 42, 35] }];
  return {
    type, categories,
    series: source.map((s, i) => ({
      name: String(s?.name ?? `Series ${i + 1}`), color: hexOr(s?.color, chartColor(i)),
      values: categories.map((_, r) => Number.isFinite(s?.values?.[r]) ? s.values[r] : null)
    })),
    categoryColors: categories.map((_, i) => hexOr(input.categoryColors?.[i], chartColor(i))),
    title: String(input.title ?? ''),
    showLegend: input.showLegend ?? (isMultiSeriesChart(type) || isCircularChart(type)),
    showValues: input.showValues ?? false,
    showAxes: input.showAxes ?? true,
    showGrid: input.showGrid ?? true,
    fontSize: Number.isFinite(input.fontSize) ? Math.max(8, Math.min(72, input.fontSize)) : 16,
    textColor: hexOr(input.textColor, '#374151')
  };
}

export function validateChart(chart) {
  chartPreset(chart.type)?.validate?.(chart);
  return chart;
}

export function parseChartValue(text) {
  if (String(text).trim() === '') return null;
  const value = Number(String(text).trim());
  if (!Number.isFinite(value)) throw new Error('Enter a finite number, or leave the value blank.');
  return value;
}

// Clipboard TSV supports spreadsheet quoting, embedded newlines and escaped quotes.
export function parseChartPaste(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  text = String(text).replace(/\r\n?/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && (quoted || cell === '')) {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (ch === '\t' || ch === '\n')) {
      row.push(cell); cell = '';
      if (ch === '\n') { rows.push(row); row = []; }
    } else cell += ch;
  }
  if (quoted) throw new Error('The pasted table contains an unclosed quote.');
  if (cell !== '' || row.length || !text.endsWith('\n')) { row.push(cell); rows.push(row); }
  if (!rows.length || rows.some(r => r.length !== rows[0].length)) throw new Error('Paste a rectangular table with the same number of columns in every row.');
  return rows;
}

// Row 0 contains headers; column 0 contains categories. The corner header is ignored.
export function pasteChartData(chart, text, row, column) {
  const cells = parseChartPaste(text);
  const next = normalizeChart(chart);
  const rowCount = Math.max(next.categories.length, row + cells.length - 1);
  const seriesCount = Math.max(next.series.length, column + cells[0].length - 1);
  while (next.categories.length < rowCount) next.categories.push(`Item ${next.categories.length + 1}`);
  while (next.series.length < seriesCount) next.series.push({ name: `Series ${next.series.length + 1}`, values: [], color: chartColor(next.series.length) });
  next.series.forEach(s => { while (s.values.length < rowCount) s.values.push(null); });
  cells.forEach((values, r) => values.forEach((value, c) => {
    const rr = row + r, cc = column + c;
    if (rr === 0) { if (cc > 0) next.series[cc - 1].name = value; }
    else if (cc === 0) next.categories[rr - 1] = value;
    else next.series[cc - 1].values[rr - 1] = parseChartValue(value);
  }));
  return validateChart(normalizeChart(next));
}

// Stacked positive and negative values have independent zero baselines.
export function chartStacks(chart) {
  const positive = chart.categories.map(() => 0), negative = [...positive];
  return chart.series.map(s => s.values.map((value, i) => {
    if (value === null) return null;
    const totals = value >= 0 ? positive : negative;
    const start = totals[i];
    totals[i] += value;
    return { start, end: totals[i] };
  }));
}

export function chartDomain(chart) {
  let low = 0, high = 0;
  const add = value => { if (Number.isFinite(value)) { low = Math.min(low, value); high = Math.max(high, value); } };
  const kind = chartPreset(chart.type)?.kind;
  if (kind === 'stacked-area') chartStacks(chart).forEach(s => s.forEach(v => { if (v) { add(v.start); add(v.end); } }));
  else (isMultiSeriesChart(chart.type) ? chart.series : chart.series.slice(0, 1)).forEach(s => s.values.forEach(add));
  if (low === high) return [0, 1];
  // Avoid rounding arithmetic overflowing for very large, but finite, inputs.
  const magnitude = Math.max(Math.abs(low), Math.abs(high));
  const step = 10 ** Math.floor(Math.log10(magnitude)) / 2;
  if (!Number.isFinite(step) || step === 0) return [low, high];
  const roundedLow = Math.floor(low / step) * step, roundedHigh = Math.ceil(high / step) * step;
  return [Number.isFinite(roundedLow) ? roundedLow : low, Number.isFinite(roundedHigh) ? roundedHigh : high];
}
