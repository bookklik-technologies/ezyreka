import { normalizeChart, validateChart, isCircularChart, isMultiSeriesChart, chartDomain, chartStacks } from './charts.js';

const formatValue = value => new Intl.NumberFormat('en', { notation: Math.abs(value) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 2 }).format(value);

function text(ctx, value, x, y, width, align = 'left') {
  ctx.textAlign = align;
  let label = String(value);
  if (ctx.measureText(label).width > width) {
    while (label.length && ctx.measureText(label + '…').width > width) label = label.slice(0, -1);
    label += '…';
  }
  ctx.fillText(label, x, y);
}

export function drawChart(ctx, element) {
  const chart = normalizeChart(element.chart);
  const w = Math.max(1, element.w), h = Math.max(1, element.h);
  const font = Math.min(chart.fontSize, Math.max(6, Math.min(w / 12, h / 10)));
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  ctx.font = `${font}px Inter, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = chart.textColor;
  let invalid = '';
  try { validateChart(chart); } catch (error) { invalid = error.message; }
  const series = isMultiSeriesChart(chart.type) ? chart.series : chart.series.slice(0, 1);
  if (invalid || !chart.categories.length || !series.some(s => s.values.some(v => v !== null))) {
    text(ctx, invalid || 'No data to display', w / 2, h / 2, w - 16, 'center');
    ctx.restore(); return;
  }
  let top = 14, bottom = 14;
  if (chart.title) {
    ctx.font = `600 ${font * 1.25}px Inter, Arial, sans-serif`;
    text(ctx, chart.title, w / 2, 14 + font / 2, w - 24, 'center');
    ctx.font = `${font}px Inter, Arial, sans-serif`;
    top += font * 2;
  }
  if (chart.showLegend) {
    const entries = isCircularChart(chart.type)
      ? chart.categories.map((name, i) => ({ name, color: chart.categoryColors[i] })) : series;
    const cellWidth = Math.min(150, Math.max(80, w / Math.min(3, entries.length)));
    const columns = Math.max(1, Math.floor((w - 16) / cellWidth));
    const rows = Math.min(Math.ceil(entries.length / columns), Math.max(1, Math.floor(h * 0.22 / (font * 1.6))));
    bottom += rows * font * 1.6;
    entries.slice(0, rows * columns).forEach((entry, i) => {
      const x = 10 + (i % columns) * cellWidth, y = h - bottom + 12 + Math.floor(i / columns) * font * 1.6;
      ctx.fillStyle = entry.color; ctx.fillRect(x, y - font / 3, font * 0.65, font * 0.65);
      ctx.fillStyle = chart.textColor;
      text(ctx, entry.name, x + font, y, cellWidth - font - 8);
    });
  }
  if (isCircularChart(chart.type)) drawCircular(ctx, chart, { x: 12, y: top, w: w - 24, h: Math.max(1, h - top - bottom) }, font);
  else drawCartesian(ctx, chart, series, { w, h, top, bottom }, font);
  ctx.restore();
}

function drawCircular(ctx, chart, box, font) {
  const values = chart.series[0].values;
  const max = values.reduce((result, value) => Math.max(result, value || 0), 0);
  if (!max) {
    ctx.fillStyle = chart.textColor;
    text(ctx, 'No data to display', box.x + box.w / 2, box.y + box.h / 2, box.w, 'center');
    return;
  }
  const total = values.reduce((sum, value) => sum + (value || 0) / max, 0);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const radius = Math.max(1, Math.min(box.w, box.h) / 2 - 4);
  const inner = chart.type === 'donut' ? radius * 0.55 : 0;
  let angle = -Math.PI / 2;
  values.forEach((value, i) => {
    if (!value) return;
    const sweep = (value / max / total) * Math.PI * 2, end = angle + sweep;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, end);
    if (inner) ctx.arc(cx, cy, inner, end, angle, true);
    else ctx.lineTo(cx, cy);
    ctx.closePath(); ctx.fillStyle = chart.categoryColors[i]; ctx.fill();
    if (chart.showValues && sweep * radius > font * 2) {
      const middle = angle + sweep / 2, distance = inner ? radius * 0.78 : radius * 0.65;
      ctx.fillStyle = chart.textColor;
      text(ctx, formatValue(value), cx + Math.cos(middle) * distance, cy + Math.sin(middle) * distance, radius * 0.55, 'center');
    }
    angle = end;
  });
}

function drawCartesian(ctx, chart, series, bounds, font) {
  const horizontal = chart.type === 'row';
  const bar = ['bar', 'row', 'grouped-bar'].includes(chart.type);
  const x = chart.showAxes ? Math.min(bounds.w * 0.28, font * (horizontal ? 6 : 4)) : 12;
  const y = bounds.top + (chart.showValues ? font : 0);
  const w = Math.max(1, bounds.w - x - 16);
  const h = Math.max(1, bounds.h - y - bounds.bottom - (chart.showAxes ? font * 2 : 0));
  const [low, high] = chartDomain(chart);
  const scale = Math.max(Math.abs(low), Math.abs(high), 1);
  const unit = value => (value / scale - low / scale) / (high / scale - low / scale);
  const valueAt = value => horizontal ? x + unit(value) * w : y + (1 - unit(value)) * h;
  const count = chart.categories.length;
  const categoryAt = i => horizontal ? y + (i + 0.5) * h / count
    : bar ? x + (i + 0.5) * w / count : x + (count === 1 ? 0.5 : i / (count - 1)) * w;
  ctx.lineWidth = 1;
  for (let tick = 0; tick <= 4; tick++) {
    const fraction = tick / 4;
    const value = (low / scale * (1 - fraction) + high / scale * fraction) * scale;
    const position = horizontal ? x + fraction * w : y + (1 - fraction) * h;
    if (chart.showGrid) {
      ctx.save(); ctx.globalAlpha *= 0.15; ctx.strokeStyle = chart.textColor;
      ctx.beginPath();
      if (horizontal) { ctx.moveTo(position, y); ctx.lineTo(position, y + h); }
      else { ctx.moveTo(x, position); ctx.lineTo(x + w, position); }
      ctx.stroke(); ctx.restore();
    }
    if (chart.showAxes) {
      ctx.fillStyle = chart.textColor;
      if (horizontal) text(ctx, formatValue(value), position, y + h + font, w / 5, 'center');
      else text(ctx, formatValue(value), x - 8, position, x - 10, 'right');
    }
  }
  if (chart.showAxes) {
    ctx.strokeStyle = chart.textColor; ctx.beginPath();
    if (horizontal) { ctx.moveTo(valueAt(0), y); ctx.lineTo(valueAt(0), y + h); }
    else { ctx.moveTo(x, valueAt(0)); ctx.lineTo(x + w, valueAt(0)); }
    ctx.stroke(); ctx.fillStyle = chart.textColor;
    const step = Math.max(1, Math.ceil(count / Math.max(1, Math.floor((horizontal ? h : w) / (font * (horizontal ? 1.8 : 4))))));
    chart.categories.forEach((label, i) => {
      if (i % step) return;
      if (horizontal) text(ctx, label, x - 8, categoryAt(i), x - 12, 'right');
      else text(ctx, label, categoryAt(i), y + h + font, Math.min(font * 6, w * step / count), 'center');
    });
  }
  const stacks = chart.type === 'stacked-area' ? chartStacks(chart) : null;
  const labels = [];
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  series.forEach((s, si) => {
    ctx.fillStyle = s.color; ctx.strokeStyle = s.color; ctx.lineWidth = Math.max(1, font / 6);
    if (bar) {
      const slot = (horizontal ? h : w) / count;
      const thickness = slot * 0.72 / series.length;
      s.values.forEach((value, i) => {
        if (value === null) return;
        const center = categoryAt(i) - slot * 0.36 + thickness * (si + 0.5);
        const position = valueAt(value), zero = valueAt(0);
        if (horizontal) ctx.fillRect(Math.min(position, zero), center - thickness * 0.45, Math.abs(position - zero), thickness * 0.9);
        else ctx.fillRect(center - thickness * 0.45, Math.min(position, zero), thickness * 0.9, Math.abs(position - zero));
        labels.push({ value, x: horizontal ? position + (value < 0 ? -4 : 4) : center,
          y: horizontal ? center : position + (value < 0 ? font * 0.7 : -font * 0.7),
          align: horizontal ? (value < 0 ? 'right' : 'left') : 'center', width: horizontal ? w / 4 : slot / series.length });
      });
      return;
    }
    let run = [];
    const flush = () => {
      if (!run.length) return;
      if (chart.type === 'area' || stacks) {
        ctx.save(); ctx.globalAlpha *= stacks ? 0.9 : 0.35;
        ctx.beginPath();
        run.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        [...run].reverse().forEach(p => ctx.lineTo(p.x, p.base));
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.beginPath();
      run.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
      run.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, font / 5), 0, Math.PI * 2); ctx.fill();
        labels.push({ value: p.value, x: p.x, y: p.y - font * 0.8, align: 'center', width: w / Math.max(count, 2) });
      });
      run = [];
    };
    s.values.forEach((value, i) => {
      if (value === null) { flush(); return; }
      const stacked = stacks?.[si][i];
      run.push({ x: categoryAt(i), y: valueAt(stacked ? stacked.end : value), base: valueAt(stacked ? stacked.start : 0), value });
    });
    flush();
  });
  ctx.restore();
  if (chart.showValues) {
    ctx.fillStyle = chart.textColor;
    labels.forEach(p => text(ctx, formatValue(p.value), p.x, p.y, Math.max(10, p.width), p.align));
  }
}
