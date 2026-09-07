var Ezyreka = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    Editor: () => Editor,
    default: () => index_default,
    version: () => version
  });

  // src/core/utils.js
  var uid = (prefix = "el") => prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  var clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  var deg2rad = (d) => d * Math.PI / 180;
  var rad2deg = (r) => r * 180 / Math.PI;
  function rotatePoint(px, py, cx, cy, rad) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const dx = px - cx;
    const dy = py - cy;
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  }
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function downloadDataURL(dataURL, filename) {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    downloadDataURL(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 2e3);
  }
  function el(tag, className, parent) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (parent) parent.appendChild(n);
    return n;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  var Emitter = class {
    constructor() {
      this._listeners = /* @__PURE__ */ new Map();
    }
    on(event, fn) {
      if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
      this._listeners.get(event).add(fn);
      return () => this.off(event, fn);
    }
    once(event, fn) {
      const off = this.on(event, (payload) => {
        off();
        fn(payload);
      });
      return off;
    }
    off(event, fn) {
      this._listeners.get(event)?.delete(fn);
    }
    emit(event, payload) {
      this._listeners.get(event)?.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error("ezyreka listener error:", err);
        }
      });
      this._listeners.get("*")?.forEach((fn) => {
        try {
          fn(event, payload);
        } catch (err) {
          console.error("ezyreka listener error:", err);
        }
      });
    }
  };
  var HEX6 = /^#([0-9a-f]{6})$/i;
  var HEX3 = /^#([0-9a-f]{3})$/i;
  function isHexColor(value) {
    return typeof value === "string" && (HEX6.test(value) || HEX3.test(value));
  }
  function normalizeHexColor(value) {
    if (typeof value !== "string") return null;
    if (HEX6.test(value)) return value.toLowerCase();
    if (HEX3.test(value)) {
      const [r, g, b] = value.slice(1);
      return ("#" + r + r + g + g + b + b).toLowerCase();
    }
    return null;
  }
  function hexOr(value, fallback) {
    return normalizeHexColor(value) || fallback;
  }

  // src/core/history.js
  var History = class {
    constructor(limit = 100) {
      this.limit = limit;
      this._undoStack = [];
      this._redoStack = [];
    }
    push(snapshot) {
      this._undoStack.push(deepClone(snapshot));
      if (this._undoStack.length > this.limit) this._undoStack.shift();
      this._redoStack.length = 0;
    }
    undo(current) {
      if (this._undoStack.length < 2) return null;
      this._redoStack.push(deepClone(current));
      this._undoStack.pop();
      return this._undoStack.pop();
    }
    redo(current) {
      if (!this._redoStack.length) return null;
      this._undoStack.push(deepClone(current));
      return this._redoStack.pop();
    }
    canUndo() {
      return this._undoStack.length >= 2;
    }
    canRedo() {
      return this._redoStack.length > 0;
    }
    reset() {
      this._undoStack.length = 0;
      this._redoStack.length = 0;
    }
  };

  // src/core/charts.js
  var CHART_COLORS = ["#477cf5", "#aa87ef", "#f6b966", "#ffdf58", "#41bda7", "#ed759b"];
  var activeChartColors = CHART_COLORS;
  function setChartColors(colors) {
    if (!Array.isArray(colors)) return;
    const valid = colors.map((c) => normalizeHexColor(c)).filter(Boolean);
    if (valid.length) activeChartColors = valid;
  }
  var rejectNegativeFirstSeries = (chart) => {
    if (chart.series[0]?.values.some((v) => v !== null && v < 0)) {
      throw new Error("Pie and donut charts need non-negative values in the first series.");
    }
  };
  var rejectOverflowingStacks = (chart) => {
    if (chartStacks(chart).some((series) => series.some((v) => v && !Number.isFinite(v.end)))) {
      throw new Error("Stacked totals are too large. Use smaller values.");
    }
  };
  var CHART_PRESETS = [
    { type: "bar", label: "Bar", group: "Bar charts", kind: "bar" },
    { type: "row", label: "Row", group: "Bar charts", kind: "bar", horizontal: true },
    { type: "grouped-bar", label: "Grouped bar", group: "Bar charts", kind: "bar", multiSeries: true },
    { type: "line", label: "Line", group: "Line charts", kind: "line" },
    { type: "multi-line", label: "Multi-line", group: "Line charts", kind: "line", multiSeries: true },
    { type: "pie", label: "Pie", group: "Pie and donut charts", kind: "circular", circular: true, validate: rejectNegativeFirstSeries },
    { type: "donut", label: "Donut", group: "Pie and donut charts", kind: "circular", circular: true, validate: rejectNegativeFirstSeries },
    { type: "area", label: "Area", group: "Area charts", kind: "area" },
    { type: "stacked-area", label: "Stacked area", group: "Area charts", kind: "stacked-area", multiSeries: true, validate: rejectOverflowingStacks }
  ];
  var chartPreset = (type, registry = null) => registry?.chartPresets?.[type] || CHART_PRESETS.find((p) => p.type === type) || null;
  function chartPresetList(registry = null) {
    return registry && registry.chartPresets ? [...CHART_PRESETS, ...Object.values(registry.chartPresets)] : [...CHART_PRESETS];
  }
  function registerChartPreset(preset) {
    if (!preset || typeof preset.type !== "string" || !preset.label) {
      throw new Error("ezyreka: chart presets need { type, label }");
    }
    if (chartPreset(preset.type)) {
      throw new Error(`ezyreka: chart type "${preset.type}" already exists`);
    }
    CHART_PRESETS.push({ group: "Other charts", ...preset });
    return preset;
  }
  var isCircularChart = (type, registry = null) => chartPreset(type, registry)?.circular === true;
  var isMultiSeriesChart = (type, registry = null) => chartPreset(type, registry)?.multiSeries === true;
  var chartColor = (index) => activeChartColors[index % activeChartColors.length];
  function sampleChart(type = "bar", registry = null) {
    return normalizeChart({
      type,
      categories: ["Jan", "Feb", "Mar", "Apr", "May"],
      series: (isMultiSeriesChart(type, registry) ? [[24, 42, 35, 64, 80], [16, 28, 44, 52, 65], [10, 18, 24, 32, 48]] : [[24, 42, 35, 64, 80]]).map((values, i) => ({ name: `Series ${i + 1}`, values, color: chartColor(i) }))
    }, registry);
  }
  function normalizeChart(input = {}, registry = null) {
    input = input && typeof input === "object" ? input : {};
    const type = typeof input.type === "string" && input.type ? input.type : "bar";
    const categories = Array.isArray(input.categories) ? input.categories.map((v) => String(v ?? "")) : ["Jan", "Feb", "Mar"];
    const source = Array.isArray(input.series) ? input.series : [{ name: "Series 1", values: [24, 42, 35] }];
    return {
      type,
      categories,
      series: source.map((s, i) => ({
        name: String(s?.name ?? `Series ${i + 1}`),
        color: hexOr(s?.color, chartColor(i)),
        values: categories.map((_, r) => Number.isFinite(s?.values?.[r]) ? s.values[r] : null)
      })),
      categoryColors: categories.map((_, i) => hexOr(input.categoryColors?.[i], chartColor(i))),
      title: String(input.title ?? ""),
      showLegend: input.showLegend ?? (isMultiSeriesChart(type, registry) || isCircularChart(type, registry)),
      showValues: input.showValues ?? false,
      showAxes: input.showAxes ?? true,
      showGrid: input.showGrid ?? true,
      fontSize: Number.isFinite(input.fontSize) ? Math.max(8, Math.min(72, input.fontSize)) : 16,
      textColor: hexOr(input.textColor, "#374151")
    };
  }
  function validateChart(chart, registry = null) {
    chartPreset(chart.type, registry)?.validate?.(chart);
    return chart;
  }
  function parseChartValue(text3) {
    if (String(text3).trim() === "") return null;
    const value = Number(String(text3).trim());
    if (!Number.isFinite(value)) throw new Error("Enter a finite number, or leave the value blank.");
    return value;
  }
  function parseChartPaste(text3) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    text3 = String(text3).replace(/\r\n?/g, "\n");
    for (let i = 0; i < text3.length; i++) {
      const ch = text3[i];
      if (ch === '"' && (quoted || cell === "")) {
        if (quoted && text3[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = !quoted;
      } else if (!quoted && (ch === "	" || ch === "\n")) {
        row.push(cell);
        cell = "";
        if (ch === "\n") {
          rows.push(row);
          row = [];
        }
      } else cell += ch;
    }
    if (quoted) throw new Error("The pasted table contains an unclosed quote.");
    if (cell !== "" || row.length || !text3.endsWith("\n")) {
      row.push(cell);
      rows.push(row);
    }
    if (!rows.length || rows.some((r) => r.length !== rows[0].length)) throw new Error("Paste a rectangular table with the same number of columns in every row.");
    return rows;
  }
  function pasteChartData(chart, text3, row, column, registry = null) {
    const cells = parseChartPaste(text3);
    const next = normalizeChart(chart, registry);
    const rowCount = Math.max(next.categories.length, row + cells.length - 1);
    const seriesCount = Math.max(next.series.length, column + cells[0].length - 1);
    while (next.categories.length < rowCount) next.categories.push(`Item ${next.categories.length + 1}`);
    while (next.series.length < seriesCount) next.series.push({ name: `Series ${next.series.length + 1}`, values: [], color: chartColor(next.series.length) });
    next.series.forEach((s) => {
      while (s.values.length < rowCount) s.values.push(null);
    });
    cells.forEach((values, r) => values.forEach((value, c) => {
      const rr = row + r, cc = column + c;
      if (rr === 0) {
        if (cc > 0) next.series[cc - 1].name = value;
      } else if (cc === 0) next.categories[rr - 1] = value;
      else next.series[cc - 1].values[rr - 1] = parseChartValue(value);
    }));
    return validateChart(normalizeChart(next, registry), registry);
  }
  function chartStacks(chart) {
    const positive = chart.categories.map(() => 0), negative = [...positive];
    return chart.series.map((s) => s.values.map((value, i) => {
      if (value === null) return null;
      const totals = value >= 0 ? positive : negative;
      const start = totals[i];
      totals[i] += value;
      return { start, end: totals[i] };
    }));
  }
  function chartDomain(chart, registry = null) {
    let low = 0, high = 0;
    const add = (value) => {
      if (Number.isFinite(value)) {
        low = Math.min(low, value);
        high = Math.max(high, value);
      }
    };
    const kind = chartPreset(chart.type, registry)?.kind;
    if (kind === "stacked-area") chartStacks(chart).forEach((s) => s.forEach((v) => {
      if (v) {
        add(v.start);
        add(v.end);
      }
    }));
    else (isMultiSeriesChart(chart.type, registry) ? chart.series : chart.series.slice(0, 1)).forEach((s) => s.values.forEach(add));
    if (low === high) return [0, 1];
    const magnitude = Math.max(Math.abs(low), Math.abs(high));
    const step = 10 ** Math.floor(Math.log10(magnitude)) / 2;
    if (!Number.isFinite(step) || step === 0) return [low, high];
    const roundedLow = Math.floor(low / step) * step, roundedHigh = Math.ceil(high / step) * step;
    return [Number.isFinite(roundedLow) ? roundedLow : low, Number.isFinite(roundedHigh) ? roundedHigh : high];
  }

  // src/core/element-artwork.js
  var polygon = (sides, inner = 1) => {
    const count = inner === 1 ? sides : sides * 2;
    return Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
      const radius = 48 * (i % 2 ? inner : 1);
      return `${i ? "L" : "M"}${(50 + Math.cos(angle) * radius).toFixed(3)} ${(50 + Math.sin(angle) * radius).toFixed(3)}`;
    }).join(" ") + "Z";
  };
  var GEAR_PATH = Array.from({ length: 32 }, (_, i) => {
    const angle = (i - 0.5) * Math.PI / 16;
    const radius = i % 4 < 2 ? 10 : 8;
    return `${i ? "L" : "M"}${(12 + Math.cos(angle) * radius).toFixed(3)} ${(12 + Math.sin(angle) * radius).toFixed(3)}`;
  }).join(" ") + "ZM16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12Z";
  var SHAPE_PATHS = {
    // Primitives live here too, so their geometry has a single home shared by
    // the canvas renderer, the Elements panel previews and custom registries.
    ellipse: "M0 50A50 50 0 1 1 100 50A50 50 0 1 1 0 50Z",
    triangle: "M50 0L100 100L0 100Z",
    star: "M50 6L61 38L95 38L67 59L78 92L50 72L22 92L33 59L5 38L39 38Z",
    hexagon: "M26 8L74 8L96 50L74 92L26 92L4 50Z",
    diamond: "M50 0L100 50L50 100L0 50Z",
    heart: "M50 86C22 64 8 47 8 31C8 17 19 9 30 9C39 9 46 15 50 23C54 15 61 9 70 9C81 9 92 17 92 31C92 47 78 64 50 86Z",
    pentagon: polygon(5),
    octagon: polygon(8),
    "star-six": polygon(6, 0.52),
    "star-eight": polygon(8, 0.55),
    burst: polygon(16, 0.8),
    sparkle: "M50 2C55 34 66 45 98 50C66 55 55 66 50 98C45 66 34 55 2 50C34 45 45 34 50 2Z",
    arch: "M0 100V50A50 50 0 0 1 100 50V100Z",
    semicircle: "M0 100A50 100 0 0 1 100 100Z",
    "quarter-circle": "M0 0A100 100 0 0 1 100 100H0Z",
    ring: "M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0ZM50 22A28 28 0 1 0 50 78A28 28 0 1 0 50 22Z",
    crescent: "M78 4A50 50 0 1 0 78 96A48 48 0 0 1 78 4Z",
    droplet: "M50 0C42 15 10 48 10 65A40 35 0 0 0 90 65C90 48 58 15 50 0Z",
    leaf: "M3 97C-9 26 26-9 97 3C109 74 74 109 3 97Z",
    blob: "M51 2C76-5 101 17 98 43C95 66 83 97 57 99C28 102 0 84 2 58C4 33 24 9 51 2Z",
    pebble: "M16 15C36-3 72-6 89 16C106 38 99 76 79 92C57 108 21 98 7 75C-6 52 0 30 16 15Z",
    "speech-bubble": "M18 4H82Q98 4 98 20V63Q98 79 82 79H42L16 98V79Q2 79 2 63V20Q2 4 18 4Z",
    ribbon: "M0 12H100L82 50L100 88H0L18 50Z",
    chevron: "M0 0H52L100 50L52 100H0L48 50Z",
    cross: "M34 0H66V34H100V66H66V100H34V66H0V34H34Z",
    "arrow-block": "M0 32H58V0L100 50L58 100V68H0Z"
  };
  var PRIMITIVE_SHAPE_KEYS = ["ellipse", "triangle", "star", "hexagon", "diamond", "heart"];
  var EXTRA_SHAPES = [
    { type: "rect", label: "Rectangle", props: { w: 280, h: 160 }, svg: '<rect x="8" y="26" width="84" height="48" />' },
    { type: "rect", label: "Pill", props: { w: 280, h: 140, radius: 70 }, svg: '<rect x="8" y="29" width="84" height="42" rx="21" />' },
    { type: "ellipse", label: "Oval", props: { w: 280, h: 160 }, svg: '<ellipse cx="50" cy="50" rx="42" ry="24" />' },
    ...Object.keys(SHAPE_PATHS).filter((name) => !PRIMITIVE_SHAPE_KEYS.includes(name)).map((name) => ({
      type: "shape",
      label: name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
      props: { shape: name, ...name === "semicircle" ? { w: 240, h: 120 } : {} },
      svg: `<path d="${SHAPE_PATHS[name]}" transform="${name === "semicircle" ? "translate(8 29) scale(.84 .42)" : "translate(8 8) scale(.84)"}" fill-rule="evenodd" />`
    }))
  ];
  var FLOWER_PATH = "M8.75 6.371A3.5 3.5 0 1 1 15.25 6.371A3.5 3.5 0 1 1 18.5 12A3.5 3.5 0 1 1 15.25 17.629A3.5 3.5 0 1 1 8.75 17.629A3.5 3.5 0 1 1 5.5 12A3.5 3.5 0 1 1 8.75 6.371ZM15 12A3 3 0 1 1 9 12A3 3 0 1 1 15 12Z";
  var ROCKET_HULL = "M8 10C11 4.5 15.5 2 21 3C22 8.5 19.5 13 14 16V19L9 21.5L10 16L8 14L2.5 15L5 10Z";
  var ROCKET_WINDOW = "M18 8A2 2 0 1 1 14 8A2 2 0 1 1 18 8Z";
  var ROCKET_FLAME = "M6.5 17.5C4.5 16.5 2.5 19 2.5 21.5C5 21.5 7.5 19.5 6.5 17.5Z";
  var EXTRA_ICONS = {
    bolt: "M13 2L3 14H10L9 22L21 9H14L15 2Z",
    sparkle: "M12 2C13 8 16 11 22 12C16 13 13 16 12 22C11 16 8 13 2 12C8 11 11 8 12 2Z",
    location: "M12 2A8 8 0 0 0 4 10C4 15 12 22 12 22S20 15 20 10A8 8 0 0 0 12 2ZM12 6A3 3 0 1 1 12 12A3 3 0 1 1 12 6Z",
    bookmark: "M6 2H18A1 1 0 0 1 19 3V22L12 17L5 22V3A1 1 0 0 1 6 2Z",
    flag: "M4 2H6V3C11 0 14 6 21 3V15C14 18 11 12 6 15V22H4Z",
    shield: "M12 2L21 6V11C21 17 17 20 12 22C7 20 3 17 3 11V6ZM10.5 15.5L17 9L15.5 7.5L10.5 12.5L8 10L6.5 11.5Z",
    trophy: "M7 2H17V4H22V8A5 5 0 0 1 17 13H16.6A5 5 0 0 1 13 16V19H17V22H7V19H11V16A5 5 0 0 1 7.4 13H7A5 5 0 0 1 2 8V4H7ZM4 6V8A3 3 0 0 0 7 11V6ZM17 6V11A3 3 0 0 0 20 8V6Z",
    crown: "M2 6L7 10L12 3L17 10L22 6L19 18H5ZM5 20H19V22H5Z",
    gift: "M12 5C8-2 1 3 5 7H2V12H11V7H13V12H22V7H19C23 3 16-2 12 5ZM10 7H7C3 7 5 2 8 5ZM14 7L16 5C19 2 21 7 17 7ZM3 14H11V22H3ZM13 14H21V22H13Z",
    bag: "M8 7V6A4 4 0 0 1 16 6V7H20L22 22H2L4 7ZM10 7H14V6A2 2 0 0 0 10 6Z",
    tag: "M3 2H12L22 12L12 22L2 12V3A1 1 0 0 1 3 2ZM7 5A2 2 0 1 0 7 9A2 2 0 1 0 7 5Z",
    play: "M6 3Q6 2 7 2.6L21 11Q22.5 12 21 13L7 21.4Q6 22 6 21Z",
    music: "M10 4L21 2V17A4 3 0 1 1 19 14.4V7L12 8.3V19A4 3 0 1 1 10 16.4Z",
    headphones: "M2 12A10 10 0 0 1 22 12V19A3 3 0 0 1 19 22H16V12H20A8 8 0 0 0 4 12H8V22H5A3 3 0 0 1 2 19Z",
    coffee: "M3 6H17V7H19A4 4 0 0 1 19 15H16.5A6 6 0 0 1 11 19H9A6 6 0 0 1 3 13ZM17 9V13H19A2 2 0 0 0 19 9ZM2 20H20V22H2ZM6 2H8V5H6ZM11 2H13V5H11Z",
    leaf: "M3 21C-1 7 7 0 22 2C24 17 16 25 3 21ZM6 18L17 7L15.6 5.6L4.6 16.6Z",
    flower: FLOWER_PATH,
    globe: "M12 2A10 10 0 1 0 12 22A10 10 0 1 0 12 2ZM11 4.5C9.8 6 9.2 8.5 9 11H11ZM13 4.5V11H15C14.8 8.5 14.2 6 13 4.5ZM4.1 11H7C7.2 8.8 7.5 6.9 8.2 5A8 8 0 0 0 4.1 11ZM15.8 5C16.5 6.9 16.8 8.8 17 11H19.9A8 8 0 0 0 15.8 5ZM4.1 13A8 8 0 0 0 8.2 19C7.5 17.1 7.2 15.2 7 13ZM9 13C9.2 15.5 9.8 18 11 19.5V13ZM13 13V19.5C14.2 18 14.8 15.5 15 13ZM17 13C16.8 15.2 16.5 17.1 15.8 19A8 8 0 0 0 19.9 13Z",
    rocket: ROCKET_HULL + ROCKET_WINDOW + ROCKET_FLAME,
    briefcase: "M8 3H16A2 2 0 0 1 18 5V7H21A1 1 0 0 1 22 8V13H14V11H10V13H2V8A1 1 0 0 1 3 7H6V5A2 2 0 0 1 8 3ZM8 5V7H16V5ZM2 15H10V17H14V15H22V21H2Z"
  };
  var ICON_OUTLINES = {
    star: "M12 2L15.1 8.3L22 9.3L17 14.2L18.2 21.1L12 17.8L5.8 21.1L7 14.2L2 9.3L8.9 8.3Z",
    heart: "M20.8 4.6A5.5 5.5 0 0 0 12 6A5.5 5.5 0 0 0 3.2 4.6C-2 10 6 17 12 21C18 17 26 10 20.8 4.6Z",
    check: "M4 12L9 17L20 6",
    "arrow-right": "M3 12H21M14 5L21 12L14 19",
    sun: "M16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12ZM12 2V4M12 20V22M2 12H4M20 12H22M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5",
    moon: "M21 13.5A9 9 0 1 1 10.5 3A7 7 0 0 0 21 13.5Z",
    cloud: "M7 19A5 5 0 1 1 7 9A6 6 0 0 1 18.5 8.5A5.3 5.3 0 0 1 18 19Z",
    home: "M3 10L12 3L21 10M5 9V21H10V15H14V21H19V9",
    mail: "M4 4H20Q22 4 22 6V18Q22 20 20 20H4Q2 20 2 18V6Q2 4 4 4ZM2 6L12 13L22 6",
    phone: "M5 3H8L10 8L7.5 10A14 14 0 0 0 14 16.5L16 14L21 16V19Q21 22 18 21C10 20 4 14 3 6Q2 3 5 3Z",
    camera: "M8 6L10 3H14L16 6H20Q22 6 22 8V19Q22 21 20 21H4Q2 21 2 19V8Q2 6 4 6ZM16 13A4 4 0 1 1 8 13A4 4 0 1 1 16 13Z",
    user: "M16 7A4 4 0 1 1 8 7A4 4 0 1 1 16 7ZM4 21V19C4 12 20 12 20 19V21",
    calendar: "M5 4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4ZM8 2V6M16 2V6M3 9H21M6.5 12.5H7.5V13.5H6.5ZM11.5 12.5H12.5V13.5H11.5ZM16.5 12.5H17.5V13.5H16.5ZM6.5 17.5H7.5V18.5H6.5ZM11.5 17.5H12.5V18.5H11.5ZM16.5 17.5H17.5V18.5H16.5Z",
    clock: "M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12ZM12 6V12L16 15",
    chat: "M5 3H19Q22 3 22 6V15Q22 18 19 18H8L3 22V6Q3 3 5 3ZM7 8H17M7 12H14",
    search: "M18 10A8 8 0 1 1 2 10A8 8 0 1 1 18 10ZM16 16L22 22",
    bell: "M18 8A6 6 0 0 0 6 8V12L3 17H21L18 12ZM9 21H15",
    gear: GEAR_PATH,
    trash: "M3 6H21M8 6V3H16V6M5 6L6 21H18L19 6M10 10V17M14 10V17",
    chart: "M3 3V21H22M7 16V11M12 16V5M17 16V8",
    bolt: "M13 2L3 14H10L9 22L21 9H14L15 2Z",
    sparkle: "M12 2C13 8 16 11 22 12C16 13 13 16 12 22C11 16 8 13 2 12C8 11 11 8 12 2Z",
    location: "M20 10C20 15 12 22 12 22S4 15 4 10A8 8 0 1 1 20 10ZM15 10A3 3 0 1 1 9 10A3 3 0 1 1 15 10Z",
    bookmark: "M5 3H19V22L12 17L5 22Z",
    flag: "M4 22V3C10 0 15 6 21 3V15C15 18 10 12 4 15",
    shield: "M12 2L21 6V11C21 17 17 20 12 22C7 20 3 17 3 11V6ZM8 11L11 14L16 9",
    trophy: "M7 3H17V11A5 5 0 0 1 7 11ZM7 5H3V8Q3 12 7 12M17 5H21V8Q21 12 17 12M12 16V21M7 21H17",
    crown: "M2 5L7 10L12 3L17 10L22 5L19 18H5ZM5 22H19",
    gift: "M3 8H21V12H3ZM4 12V22H20V12M12 8V22M12 8C3 9 3 2 7 2C10 2 12 8 12 8C21 9 21 2 17 2C14 2 12 8 12 8Z",
    bag: "M4 7H20L22 22H2ZM8 9V6A4 4 0 0 1 16 6V9",
    tag: "M3 2H12L22 12L12 22L2 12V3ZM8 7A1 1 0 1 1 6 7A1 1 0 1 1 8 7Z",
    play: "M6 3L21 12L6 21Z",
    music: "M10 18V4L21 2V16M10 8L21 6M10 18A3 3 0 1 1 4 18A3 3 0 1 1 10 18ZM21 16A3 3 0 1 1 15 16A3 3 0 1 1 21 16Z",
    headphones: "M3 13V11A9 9 0 0 1 21 11V13M3 12H7V21H5Q3 21 3 19ZM21 12H17V21H19Q21 21 21 19Z",
    coffee: "M3 7H17V13A6 6 0 0 1 11 19H9A6 6 0 0 1 3 13ZM17 8H19A3 3 0 0 1 19 14H17M2 22H20M7 2V4M12 2V4",
    leaf: "M3 21C-1 7 7 0 22 2C24 17 16 25 3 21ZM3 21L16 8",
    flower: FLOWER_PATH,
    globe: "M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12ZM2 12H22M12 2C6 7 6 17 12 22C18 17 18 7 12 2Z",
    rocket: ROCKET_HULL + ROCKET_WINDOW + ROCKET_FLAME + "M8 10L14 16",
    briefcase: "M3 7H21Q22 7 22 8V20Q22 21 21 21H3Q2 21 2 20V8Q2 7 3 7ZM8 7V3H16V7M2 13H10M14 13H22M10 11H14V16H10Z"
  };

  // src/core/templates.js
  var text = (value, x, y, w, size, color, props = {}) => {
    const style = { fontSize: size, fontFamily: "Arial", fontWeight: 400, lineHeight: 1.15, ...props };
    return {
      type: "text",
      text: value,
      x,
      y,
      w,
      color,
      h: Math.ceil(style.fontSize * style.lineHeight * value.split("\n").length + 8),
      ...style
    };
  };
  var label = (value, x, y, w, color, props = {}) => text(value, x, y, w, 20, color, { fontWeight: 700, letterSpacing: 2, ...props });
  var box = (x, y, w, h, fill, props = {}) => ({ type: "rect", x, y, w, h, fill, ...props });
  var circle = (x, y, size, fill, props = {}) => ({ type: "ellipse", x, y, w: size, h: size, fill, ...props });
  var oval = (x, y, w, h, fill, props = {}) => ({ type: "ellipse", x, y, w, h, fill, ...props });
  var rule = (x, y, w, color) => box(x, y, w, 2, color);
  var icon = (name, x, y, size, fill, props = {}) => ({ type: "icon", icon: name, x, y, w: size, h: size, fill, ...props });
  var gradient = (from, to, angle = 135) => ({ type: "gradient", from, to, angle });
  var serif = { fontFamily: "Georgia" };
  var bold = { fontWeight: 700 };
  var display = { fontFamily: "Impact" };
  var mono = { fontFamily: "Courier New" };
  var centered = { align: "center" };
  var right = { align: "right" };
  var template = (name, category, format, width, height, background, elements) => ({
    name,
    category,
    format,
    page: { width, height, background: typeof background === "string" ? { type: "solid", color: background } : background, elements }
  });
  var TEMPLATES = [
    template("Summer Social", "Social", "Square post", 1080, 1080, "#ff7048", [
      box(36, 36, 1008, 1008, "none", { stroke: "#43251e", strokeWidth: 2 }),
      label("[YOUR BRAND] / SUMMER EDIT", 70, 72, 890, "#43251e"),
      rule(70, 123, 940, "#43251e"),
      text("SUNNY", 60, 166, 950, 220, "#fff7cc", display),
      text("SIDE UP.", 65, 392, 950, 180, "#43251e", display),
      circle(718, 630, 250, "#ffde58"),
      icon("sun", 749, 661, 188, "#43251e"),
      text("Long days.\nLittle adventures.", 75, 690, 590, 48, "#43251e", serif),
      box(75, 887, 505, 74, "#43251e", { radius: 37 }),
      label("MAKE A LITTLE SUNSHINE", 98, 912, 460, "#fff7cc", { ...centered, fontSize: 18 }),
      text("01 / THE GOOD DAYS", 730, 978, 280, 18, "#43251e", mono)
    ]),
    template("Words to Keep", "Social", "Quote card", 1080, 1080, "#f7f5ef", [
      box(0, 0, 28, 1080, "#7460b0"),
      label("WORDS TO KEEP", 85, 70, 700, "#53466f"),
      text("\u201C", 65, 162, 280, 240, "#bcaed7", serif),
      text("Make space\nfor what\nmatters.", 190, 306, 785, 108, "#30293c", { ...serif, lineHeight: 1.1 }),
      box(192, 708, 280, 12, "#cbbfeb"),
      text("A small reminder for a full life.", 195, 785, 740, 30, "#655e70"),
      rule(85, 933, 910, "#c9c3d1"),
      label("[AUTHOR / YOUR NAME]", 85, 969, 760, "#53466f", { fontSize: 17 }),
      icon("star", 932, 960, 40, "#7460b0")
    ]),
    template("New Collection", "Social", "Portrait story", 1080, 1920, "#efe9df", [
      label("[YOUR STUDIO]", 75, 84, 700, "#373a31"),
      label("VOL. 01", 805, 84, 200, "#373a31", right),
      text("Everyday\nobjects.", 72, 208, 936, 144, "#373a31", { ...serif, lineHeight: 1.05 }),
      box(75, 565, 930, 795, "#b8c3aa", { radius: 430 }),
      circle(623, 634, 235, "#e5d3a2"),
      oval(220, 1170, 660, 100, "#8c9d80"),
      box(305, 939, 270, 272, "#a5513e", { radius: 55 }),
      oval(305, 905, 270, 90, "#bd7054"),
      oval(329, 923, 222, 48, "#613f32"),
      box(659, 865, 100, 334, "#f4e7c9", { radius: 40 }),
      oval(629, 820, 160, 125, "#f4e7c9"),
      box(703, 746, 10, 118, "#465941", { rotation: 12 }),
      oval(712, 751, 105, 42, "#465941", { rotation: -25 }),
      label("THE NEW COLLECTION", 78, 1443, 920, "#675b4b"),
      text("Considered shapes.\nMade for your everyday.", 75, 1510, 930, 46, "#373a31", serif),
      rule(75, 1690, 930, "#a7aa98"),
      text("[Launch date]  /  [Your website]", 75, 1730, 830, 27, "#373a31"),
      icon("arrow-right", 930, 1725, 58, "#373a31"),
      label("EXPLORE THE COLLECTION", 75, 1830, 900, "#675b4b", { fontSize: 18 })
    ]),
    template("Open Conversations", "Social", "Podcast cover", 1080, 1080, "#102d36", [
      box(48, 48, 984, 984, "none", { stroke: "#5e7b80", strokeWidth: 2 }),
      label("[YOUR PODCAST NETWORK]", 85, 85, 890, "#baf2d1"),
      text("OPEN", 75, 180, 910, 220, "#baf2d1", display),
      text("conversations", 83, 420, 930, 84, "#fff3de", serif),
      ...[70, 145, 220, 110, 270, 170, 95, 210, 140, 60].map((h, i) => box(95 + i * 52, 705 - h / 2, 26, h, "#baf2d1", { radius: 13 })),
      circle(725, 580, 220, "#f18a65"),
      icon("chat", 780, 635, 110, "#102d36"),
      rule(85, 892, 910, "#5e7b80"),
      text("Ideas worth listening to.", 85, 932, 680, 30, "#fff3de"),
      label("[HOST NAME]", 735, 936, 245, "#baf2d1", { ...right, fontSize: 18 })
    ]),
    template("Studio Pitch", "Business", "Presentation", 1920, 1080, "#f4f2ec", [
      box(1250, 0, 670, 1080, "#203fba"),
      box(1345, 130, 475, 475, "none", { stroke: "#c8d1ff", strokeWidth: 3 }),
      circle(1345, 130, 475, "#c8d1ff"),
      box(1582, 368, 238, 237, "#203fba"),
      box(1345, 650, 475, 210, "#b6e9c0"),
      text("N", 1390, 661, 390, 155, "#203fba", { ...display, ...centered }),
      label("[YOUR STUDIO]", 95, 88, 1030, "#203fba", { fontSize: 26 }),
      text("Ideas into\nimpact.", 88, 250, 1110, 164, "#202633", { ...serif, lineHeight: 1.05 }),
      text("A clear vision for your next chapter.", 98, 650, 1030, 39, "#5c626d"),
      rule(98, 839, 1040, "#b8bcc4"),
      label("STRATEGY / IDENTITY / EXPERIENCE", 98, 885, 1060, "#203fba"),
      text("[Client name]  /  [Presentation date]", 98, 961, 1060, 25, "#5c626d"),
      label("01", 1700, 945, 115, "#ffffff", { ...right, fontSize: 32 })
    ]),
    template("Studio Business Card", "Business", "Business card", 1050, 600, "#202b27", [
      box(32, 32, 986, 536, "none", { stroke: "#728b77", strokeWidth: 2 }),
      circle(68, 65, 92, "#d6eea6"),
      icon("star", 90, 87, 48, "#202b27"),
      label("[YOUR STUDIO]", 195, 97, 760, "#d6eea6", { fontSize: 17 }),
      text("[Your Name]", 65, 222, 920, 74, "#f8f4e9", serif),
      text("[Your role / specialty]", 70, 328, 880, 26, "#a8b9aa"),
      rule(70, 420, 910, "#728b77"),
      text("[Email address]\n[Your website]", 70, 455, 560, 23, "#f8f4e9", { lineHeight: 1.5 }),
      text("[Phone number]", 650, 485, 330, 23, "#d6eea6", right)
    ]),
    template("Project Proposal", "Business", "Document cover", 1240, 1754, "#f1f3f6", [
      box(0, 0, 1240, 250, "#172c49"),
      label("[YOUR COMPANY]", 90, 100, 900, "#ffffff", { fontSize: 28 }),
      label("PROPOSAL / [YEAR]", 90, 333, 1060, "#345fea"),
      text("A plan for\nwhat\u2019s next.", 82, 449, 1080, 132, "#172c49", { ...serif, lineHeight: 1.07 }),
      text("[Project title]", 90, 795, 1060, 42, "#52617a"),
      box(90, 953, 1060, 309, "#345fea"),
      box(125, 988, 240, 239, "#9fb7ff"),
      box(385, 1080, 300, 147, "#dce5ff"),
      box(705, 1160, 410, 67, "#ffffff"),
      label("PROJECT PROPOSAL", 90, 1365, 1060, "#345fea"),
      rule(90, 1430, 1060, "#aab4c4"),
      label("PREPARED FOR", 90, 1480, 510, "#52617a", { fontSize: 17 }),
      label("PREPARED BY", 660, 1480, 490, "#52617a", { fontSize: 17 }),
      text("[Client name]", 90, 1530, 510, 32, "#172c49"),
      text("[Team name]", 660, 1530, 490, 32, "#172c49"),
      text("[Date]  /  [Contact email]", 90, 1650, 1060, 25, "#52617a")
    ]),
    template("Certificate of Completion", "Business", "Certificate", 1600, 1130, "#faf7ed", [
      box(0, 0, 215, 1130, "#233c36"),
      rule(275, 65, 1250, "#b69a57"),
      box(275, 1020, 1250, 3, "#b69a57"),
      circle(44, 390, 128, "#b69a57"),
      icon("star", 77, 423, 62, "#faf7ed"),
      box(74, 510, 27, 145, "#b69a57"),
      box(118, 510, 27, 145, "#b69a57"),
      label("[ISSUING ORGANIZATION]", 300, 125, 1190, "#233c36", { ...centered, fontSize: 23 }),
      text("Certificate", 290, 237, 1220, 120, "#233c36", { ...serif, ...centered }),
      label("OF COMPLETION", 300, 397, 1190, "#8a713a", { ...centered, fontSize: 23 }),
      text("This certificate is presented to", 300, 500, 1190, 29, "#63726a", centered),
      text("[Participant Name]", 305, 578, 1180, 68, "#233c36", { ...serif, ...centered }),
      rule(430, 686, 930, "#b69a57"),
      text("For completing [Course or Workshop Name]", 310, 741, 1180, 30, "#63726a", centered),
      rule(360, 917, 370, "#63726a"),
      rule(1060, 917, 370, "#63726a"),
      text("[Date]", 360, 940, 370, 24, "#233c36", centered),
      text("[Signature / Name]", 1060, 940, 370, 24, "#233c36", centered)
    ]),
    template("Weekend Sale", "Events", "Sale poster", 1080, 1350, "#efefdf", [
      label("[YOUR BRAND] / LIMITED-TIME OFFERS", 65, 65, 950, "#252525", { fontSize: 19 }),
      rule(65, 116, 950, "#252525"),
      text("WEEKEND", 55, 182, 980, 163, "#252525", display),
      text("SALE", 52, 354, 976, 325, "#e14432", display),
      box(65, 745, 950, 216, "#e14432"),
      label("YOUR OFFER", 95, 779, 700, "#fff8e4"),
      text("[Discount / deal]", 94, 827, 880, 69, "#fff8e4", bold),
      text("Good finds. A fresh reason to shop.", 65, 1020, 950, 34, "#252525", serif),
      rule(65, 1125, 950, "#252525"),
      text("[Start date] \u2014 [End date]\n[Store address / website]", 65, 1171, 820, 28, "#252525", { lineHeight: 1.5 }),
      icon("arrow-right", 935, 1195, 60, "#e14432")
    ]),
    template("After Hours", "Events", "Music flyer", 1080, 1350, "#151320", [
      label("[PROMOTER] PRESENTS", 65, 65, 800, "#f9b7dc"),
      ...[0, 1, 2, 3, 4].map((i) => oval(130 + i * 67, 185 + i * 50, 700 - i * 90, 480 - i * 52, "none", { stroke: ["#6254ed", "#8577ff", "#c298ff", "#edabec", "#ffd5b4"][i], strokeWidth: 22, rotation: -22 })),
      text("AFTER", 62, 732, 950, 176, "#fcebd9", display),
      text("HOURS", 63, 905, 950, 176, "#f9b7dc", display),
      rule(65, 1133, 950, "#8577ff"),
      text("[Artist / lineup]\n[Date] / [Time] / [Venue]", 65, 1170, 810, 29, "#fcebd9", { lineHeight: 1.5 }),
      icon("star", 927, 1178, 72, "#f9b7dc")
    ]),
    template("Make Something", "Events", "Workshop invite", 1080, 1350, "#f7eecf", [
      box(0, 0, 1080, 105, "#2b4791"),
      label("[YOUR CREATIVE CLUB] PRESENTS", 65, 37, 950, "#f7eecf"),
      text("MAKE", 63, 174, 950, 202, "#2b4791", display),
      text("something", 65, 414, 950, 116, "#d95137", { ...serif, italic: true }),
      text("YOUR OWN.", 65, 564, 950, 137, "#2b4791", display),
      box(80, 778, 200, 200, "#e7b730", { rotation: -8 }),
      icon("star", 369, 770, 230, "#d95137"),
      circle(715, 786, 195, "#2b4791"),
      circle(775, 846, 75, "#f7eecf"),
      rule(65, 1065, 950, "#2b4791"),
      text("[Workshop title]", 65, 1102, 950, 37, "#2b4791", bold),
      text("[Date & time]  /  [Venue]\nReserve your spot: [Website / email]", 65, 1175, 950, 27, "#2b4791", { lineHeight: 1.5 })
    ]),
    template("Together Forever", "Events", "Wedding invitation", 1080, 1500, "#ede8df", [
      box(65, 65, 950, 1370, "#f9f6ee", { radius: 440 }),
      oval(470, 140, 140, 190, "none", { stroke: "#8a7756", strokeWidth: 3 }),
      icon("heart", 510, 205, 60, "#8a7756"),
      label("TOGETHER WITH THEIR FAMILIES", 160, 402, 760, "#675e4d", { ...centered, fontSize: 17 }),
      text("[Name]", 140, 527, 800, 113, "#465443", { ...serif, ...centered }),
      text("&", 140, 688, 800, 80, "#8a7756", { ...serif, ...centered, italic: true }),
      text("[Name]", 140, 810, 800, 113, "#465443", { ...serif, ...centered }),
      text("invite you to celebrate their wedding", 150, 984, 780, 27, "#675e4d", centered),
      rule(407, 1076, 266, "#a99b80"),
      label("[DAY / MONTH / YEAR]", 180, 1130, 720, "#465443", { ...centered, fontSize: 21 }),
      text("[Time]  /  [Venue]\n[City]", 200, 1203, 680, 27, "#675e4d", { ...centered, lineHeight: 1.5 }),
      text("RSVP: [Contact]", 240, 1330, 600, 22, "#675e4d", centered)
    ]),
    template("Coffee & Company", "Lifestyle", "Caf\xE9 post", 1080, 1080, "#f3dfb7", [
      box(35, 35, 1010, 1010, "none", { stroke: "#743c29", strokeWidth: 3 }),
      label("[YOUR CAF\xC9]", 75, 73, 930, "#743c29", centered),
      text("Coffee first.", 68, 180, 940, 125, "#743c29", { ...serif, ...centered }),
      text("Good company always.", 85, 344, 910, 38, "#743c29", { ...serif, ...centered, italic: true }),
      oval(239, 760, 600, 90, "#d2ad7c"),
      circle(683, 550, 180, "none", { stroke: "#466056", strokeWidth: 38 }),
      box(292, 530, 438, 261, "#466056", { radius: 90 }),
      oval(292, 504, 438, 92, "#658073"),
      oval(318, 521, 386, 54, "#382d24"),
      text("c.", 430, 612, 180, 104, "#f3dfb7", { ...serif, ...centered, italic: true }),
      rule(85, 903, 910, "#b1845f"),
      text("[Opening hours]  /  [Your address]", 85, 949, 910, 27, "#743c29", centered)
    ]),
    template("Seasonal Table", "Lifestyle", "Restaurant menu", 1080, 1500, "#f9f3e5", [
      box(35, 35, 1010, 1430, "none", { stroke: "#354e3c", strokeWidth: 2 }),
      label("[YOUR RESTAURANT]", 85, 84, 910, "#354e3c", centered),
      text("Seasonal\ntable", 85, 173, 910, 107, "#354e3c", { ...serif, ...centered, lineHeight: 1.03 }),
      rule(85, 455, 910, "#354e3c"),
      ...[
        ["TO START", "Garden salad", "Roasted tomato soup"],
        ["THE MAIN EVENT", "Wild mushroom pasta", "Herb-roasted vegetables"],
        ["SOMETHING SWEET", "Lemon & almond cake", "Seasonal fruit bowl"]
      ].flatMap(([heading, first, second], i) => {
        const y = 500 + i * 245;
        return [
          label(heading, 85, y, 910, "#a05b3e"),
          text(first, 85, y + 58, 715, 34, "#354e3c", serif),
          text("[Price]", 810, y + 63, 185, 25, "#354e3c", right),
          text(second, 85, y + 124, 715, 34, "#354e3c", serif),
          text("[Price]", 810, y + 129, 185, 25, "#354e3c", right)
        ];
      }),
      rule(85, 1265, 910, "#354e3c"),
      text("Fresh ingredients. Thoughtfully prepared.", 85, 1310, 910, 28, "#354e3c", { ...serif, ...centered, italic: true }),
      text("[Address]  /  [Contact]", 85, 1389, 910, 22, "#68745e", centered)
    ]),
    template("A Moment of Calm", "Lifestyle", "Wellness post", 1080, 1080, "#dce5dd", [
      box(580, 45, 455, 990, "#a9bdac", { radius: 225 }),
      circle(657, 161, 300, "#f1e6c9"),
      oval(640, 790, 335, 118, "#45665d"),
      oval(683, 688, 250, 117, "#739080"),
      oval(729, 601, 159, 100, "#cad2b9"),
      label("[YOUR WELLNESS STUDIO]", 65, 73, 930, "#304e46", { fontSize: 18 }),
      text("A softer\nstart.", 62, 281, 640, 111, "#304e46", { ...serif, lineHeight: 1.08 }),
      text("Pause. Breathe.\nCome back to yourself.", 67, 596, 480, 33, "#304e46", { lineHeight: 1.4 }),
      rule(67, 813, 405, "#839b87"),
      text("[Class / session]\n[Date & time]", 67, 853, 465, 27, "#304e46", { lineHeight: 1.5 }),
      label("FIND YOUR MOMENT", 67, 986, 450, "#304e46", { fontSize: 17 })
    ]),
    template("Take the Scenic Route", "Lifestyle", "Travel poster", 1080, 1350, "#f6e3bb", [
      label("[DESTINATION / TRAVEL BRAND]", 65, 65, 950, "#284c46", centered),
      text("THE SCENIC", 62, 171, 956, 136, "#284c46", { ...display, ...centered }),
      text("ROUTE", 65, 309, 950, 216, "#284c46", { ...display, ...centered }),
      box(65, 590, 950, 470, "#b2c9bb"),
      circle(717, 630, 155, "#ec8c46"),
      { type: "triangle", x: 75, y: 670, w: 640, h: 390, fill: "#668876" },
      { type: "triangle", x: 425, y: 756, w: 570, h: 304, fill: "#284c46" },
      box(65, 990, 950, 70, "#284c46"),
      text("Less hurry. More wonder.", 65, 1115, 950, 42, "#284c46", { ...serif, ...centered, italic: true }),
      rule(65, 1210, 950, "#9ca784"),
      text("[Travel dates]  /  [Booking website]", 65, 1252, 950, 27, "#284c46", centered)
    ]),
    // New purposes: each composition is designed for its content and canvas format.
    template("Product Launch", "Social", "Product launch announcement", 1080, 1080, gradient("#4134b6", "#ba4b9b"), [
      label("[YOUR BRAND]", 70, 65, 760, "#ffffff"),
      box(778, 60, 232, 52, "#d7ff85", { radius: 26 }),
      label("JUST DROPPED", 788, 77, 212, "#28254b", { ...centered, fontSize: 15 }),
      text("Meet your\nnext favourite.", 65, 204, 940, 104, "#ffffff", { ...bold, lineHeight: 1.08 }),
      circle(665, 565, 300, "none", { stroke: "#d7ff85", strokeWidth: 3 }),
      circle(715, 615, 200, "#d7ff85"),
      icon("star", 759, 659, 112, "#4134b6"),
      label("INTRODUCING", 70, 603, 555, "#e7d8ff"),
      text("[Product\nname]", 65, 656, 590, 75, "#ffffff", serif),
      rule(70, 905, 940, "#d1a7df"),
      text("[Launch date]  /  [Website]", 70, 957, 855, 28, "#ffffff"),
      icon("arrow-right", 943, 945, 60, "#d7ff85")
    ]),
    template("Customer Spotlight", "Social", "Customer testimonial", 1080, 1080, "#f8f7f2", [
      label("[YOUR BRAND]", 80, 70, 920, "#353b37"),
      rule(80, 132, 920, "#c4cbc3"),
      label("CUSTOMER SPOTLIGHT", 80, 204, 920, "#527961"),
      text("\u201C", 65, 278, 250, 194, "#adc7ae", serif),
      text("[Share a short\ncustomer quote\nhere.]", 85, 435, 910, 72, "#353b37", { ...serif, lineHeight: 1.16 }),
      box(80, 808, 8, 120, "#527961"),
      text("[Customer name]", 120, 815, 850, 33, "#353b37", bold),
      text("[Role / company]", 120, 872, 850, 27, "#687269"),
      text("[Your website]", 80, 990, 920, 22, "#687269")
    ]),
    template("We\u2019re Hiring", "Business", "Recruitment poster", 1080, 1350, "#e5edff", [
      label("[YOUR COMPANY]", 65, 67, 760, "#17316b"),
      icon("arrow-right", 904, 60, 100, "#335ee8", { rotation: -45 }),
      text("GOOD PEOPLE.\nBIG IDEAS.", 60, 222, 960, 109, "#17316b", display),
      box(65, 540, 950, 142, "#335ee8"),
      text("WE\u2019RE HIRING", 90, 563, 900, 82, "#ffffff", display),
      label("OPEN POSITION", 65, 754, 950, "#335ee8"),
      text("[Job title]", 65, 807, 950, 64, "#17316b", bold),
      text("[Location]  /  [Work arrangement]", 65, 909, 950, 29, "#4c6189"),
      rule(65, 1030, 950, "#a5b5d8"),
      label("LET\u2019S BUILD SOMETHING TOGETHER", 65, 1077, 950, "#17316b", { fontSize: 19 }),
      text("Apply: [Email / careers URL]\nApplications close: [Date]", 65, 1142, 950, 28, "#17316b", { lineHeight: 1.6 })
    ]),
    template("Services & Pricing", "Business", "Service pricing sheet", 1080, 1500, "#f3eee6", [
      label("[YOUR BUSINESS]", 75, 74, 930, "#443b33"),
      text("Good work.\nClear pricing.", 70, 195, 940, 97, "#443b33", { ...serif, lineHeight: 1.06 }),
      text("[A short introduction to your services]", 75, 462, 930, 28, "#75695c"),
      ...["01", "02", "03"].flatMap((n, i) => {
        const y = 570 + i * 232;
        return [
          rule(75, y, 930, "#baad9b"),
          label(n, 75, y + 42, 90, "#9a6546"),
          text("[Service name]", 195, y + 34, 555, 39, "#443b33", serif),
          text("[Price]", 780, y + 43, 225, 31, "#443b33", right),
          text("[What\u2019s included in this service]", 195, y + 111, 790, 27, "#75695c")
        ];
      }),
      box(75, 1280, 930, 145, "#443b33"),
      label("LET\u2019S FIND THE RIGHT FIT", 105, 1312, 870, "#f3eee6", { fontSize: 18 }),
      text("[Contact email]  /  [Website]", 105, 1363, 870, 27, "#f3eee6")
    ]),
    template("Simple Invoice", "Business", "Invoice document", 1240, 1754, "#ffffff", [
      box(75, 75, 60, 60, "#242424"),
      label("[YOUR BUSINESS]", 165, 95, 940, "#242424", { fontSize: 26 }),
      text("INVOICE", 75, 235, 1090, 112, "#242424", bold),
      rule(75, 403, 1090, "#242424"),
      label("BILL TO", 75, 454, 510, "#686868", { fontSize: 18 }),
      text("[Client name]\n[Client address]\n[Client email]", 75, 502, 530, 28, "#242424", { lineHeight: 1.6 }),
      text("Invoice: [Number]\nIssued: [Date]\nDue: [Date]", 735, 502, 430, 28, "#242424", { ...right, lineHeight: 1.6 }),
      box(75, 718, 1090, 72, "#242424"),
      label("DESCRIPTION", 100, 743, 540, "#ffffff", { fontSize: 18 }),
      label("QTY", 660, 743, 100, "#ffffff", { ...right, fontSize: 18 }),
      label("RATE", 800, 743, 145, "#ffffff", { ...right, fontSize: 18 }),
      label("AMOUNT", 975, 743, 165, "#ffffff", { ...right, fontSize: 18 }),
      ...[0, 1, 2].flatMap((i) => {
        const y = 832 + i * 100;
        return [
          text("[Service / item]", 100, y, 530, 28, "#242424"),
          text("[Qty]", 655, y, 105, 25, "#242424", right),
          text("[Rate]", 800, y, 145, 25, "#242424", right),
          text("[Amount]", 975, y, 165, 25, "#242424", right),
          rule(75, y + 65, 1090, "#dedede")
        ];
      }),
      text("Subtotal\nTax", 735, 1160, 190, 26, "#686868", { lineHeight: 1.8 }),
      text("[Amount]\n[Amount]", 955, 1160, 185, 26, "#242424", { ...right, lineHeight: 1.8 }),
      box(715, 1282, 450, 84, "#f0f0ee"),
      label("TOTAL", 738, 1312, 185, "#242424"),
      text("[Amount]", 945, 1309, 195, 28, "#242424", { ...bold, ...right }),
      label("PAYMENT DETAILS", 75, 1440, 1090, "#686868", { fontSize: 18 }),
      text("[Payment instructions]\n[Currency / payment terms]", 75, 1487, 1090, 27, "#242424", { lineHeight: 1.5 }),
      rule(75, 1635, 1090, "#dedede"),
      text("[Business email]  /  [Phone number]", 75, 1665, 1090, 24, "#686868")
    ]),
    template("Birthday Celebration", "Events", "Birthday invitation", 1080, 1500, "#f8c8d5", [
      ...[[95, 145, -20], [900, 228, 23], [90, 1050, 15], [923, 956, -15]].map(([x, y, rotation]) => box(x, y, 22, 72, "#bb443d", { rotation })),
      circle(845, 520, 65, "#f4a92f"),
      circle(138, 660, 40, "#6d4aa1"),
      icon("star", 825, 750, 96, "#6d4aa1", { rotation: 18 }),
      label("YOU\u2019RE INVITED", 155, 90, 770, "#65394e", centered),
      text("Let\u2019s\ncelebrate!", 135, 213, 810, 110, "#65394e", { ...serif, ...centered, lineHeight: 1.06 }),
      text("[Age]", 195, 530, 690, 244, "#bb443d", { ...display, ...centered }),
      text("[Name]\u2019s birthday", 145, 870, 790, 55, "#65394e", { ...serif, ...centered }),
      box(170, 1010, 740, 350, "#fff2d5", { radius: 32 }),
      label("[DAY / MONTH / YEAR]", 205, 1060, 670, "#65394e", { ...centered, fontSize: 23 }),
      text("[Time]  /  [Venue]\n[Address]", 205, 1130, 670, 29, "#65394e", { ...centered, lineHeight: 1.6 }),
      text("RSVP: [Contact]", 205, 1270, 670, 26, "#65394e", centered),
      label("BRING YOUR PARTY SPIRIT", 150, 1420, 780, "#65394e", { ...centered, fontSize: 17 })
    ]),
    template("Live Webinar", "Events", "Webinar invitation", 1080, 1500, "#121d31", [
      ...[0, 1, 2, 3, 4].map((i) => box(700 + i * 63, 0, 1, 495, "#2c3b55")),
      ...[0, 1, 2, 3, 4].map((i) => rule(700, 65 + i * 82, 315, "#2c3b55")),
      box(65, 65, 257, 60, "#b7f28f", { radius: 30 }),
      label("LIVE WEBINAR", 82, 86, 223, "#121d31", { ...centered, fontSize: 17 }),
      text("[Webinar\ntitle]", 60, 235, 940, 122, "#f0f4fc", { ...bold, lineHeight: 1.08 }),
      text("Fresh perspectives. Practical ideas.", 65, 565, 950, 34, "#aebed7"),
      rule(65, 673, 950, "#41516b"),
      label("YOUR SPEAKER", 65, 730, 740, "#b7f28f"),
      text("[Speaker name]", 65, 785, 760, 54, "#f0f4fc", serif),
      text("[Role / organization]", 65, 865, 760, 29, "#aebed7"),
      icon("chat", 869, 776, 116, "#b7f28f", { iconStyle: "outline" }),
      label("ON THE AGENDA", 65, 993, 950, "#b7f28f"),
      text("[Topic one]  /  [Topic two]  /  Q&A", 65, 1048, 950, 29, "#f0f4fc"),
      text("[Date]  /  [Time & timezone]", 65, 1166, 950, 32, "#f0f4fc"),
      box(65, 1290, 950, 135, "#b7f28f", { radius: 12 }),
      label("SAVE YOUR SEAT", 100, 1320, 760, "#121d31"),
      text("[Registration URL]", 100, 1366, 760, 27, "#121d31"),
      icon("arrow-right", 898, 1330, 70, "#121d31")
    ]),
    template("Recipe Card", "Lifestyle", "Recipe card", 1080, 1500, "#f9f0de", [
      label("FROM THE KITCHEN OF [NAME]", 70, 70, 940, "#6f492f", { fontSize: 18 }),
      text("[Recipe\nname]", 65, 175, 930, 110, "#6f492f", { ...serif, lineHeight: 1.06 }),
      rule(70, 476, 940, "#b99b76"),
      text("Prep: [Time]   /   Cook: [Time]   /   Serves: [#]", 70, 515, 940, 25, "#6f492f"),
      box(70, 619, 352, 594, "#ebdfbf", { radius: 12 }),
      label("INGREDIENTS", 97, 656, 295, "#6f492f", { fontSize: 17 }),
      ...[0, 1, 2, 3, 4].flatMap((i) => [circle(99, 735 + i * 82, 8, "#8c703c"), text("[Qty / ingredient]", 122, 723 + i * 82, 273, 24, "#6f492f")]),
      label("THE METHOD", 480, 656, 530, "#6f492f"),
      ...[0, 1, 2].flatMap((i) => [label(`0${i + 1}`, 480, 732 + i * 158, 60, "#a7613f"), text("[Add a short\ninstruction here.]", 555, 725 + i * 158, 455, 28, "#6f492f", { lineHeight: 1.4 })]),
      rule(70, 1290, 940, "#b99b76"),
      text("Kitchen notes", 70, 1327, 940, 34, "#6f492f", { ...serif, italic: true }),
      text("[A serving suggestion or useful tip]", 70, 1390, 940, 25, "#8c7359")
    ]),
    template("Weekly Planner", "Lifestyle", "Weekly planner", 1600, 1130, "#f5f3ed", [
      text("A little room for everything.", 60, 60, 1480, 71, "#3d514d", serif),
      label("WEEK OF [DATE]", 65, 181, 1465, "#73847a", { fontSize: 22 }),
      ...["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].flatMap((day, i) => {
        const x = 65 + i * 211;
        return [
          box(x, 275, 195, 535, "#ffffff", { radius: 10 }),
          box(x, 275, 195, 64, i > 4 ? "#d8dfca" : "#dbe7e1", { radius: 10 }),
          label(day, x + 16, 297, 163, "#3d514d", { ...centered, fontSize: 17 }),
          text("[Plans]", x + 16, 370, 163, 24, "#73847a"),
          ...[0, 1, 2, 3, 4].map((j) => rule(x + 16, 447 + j * 69, 163, "#e1e6df"))
        ];
      }),
      label("THIS WEEK\u2019S PRIORITY", 65, 879, 640, "#3d514d"),
      text("[One thing to focus on]", 65, 935, 640, 29, "#73847a"),
      label("NOTES & LITTLE REMINDERS", 820, 879, 715, "#3d514d"),
      text("[Your notes]", 820, 935, 715, 29, "#73847a"),
      rule(65, 1035, 650, "#c9d2c8"),
      rule(820, 1035, 715, "#c9d2c8")
    ]),
    template("Fitness Tracker", "Lifestyle", "Weekly fitness tracker", 1600, 1130, "#edf1e8", [
      box(0, 0, 1600, 250, "#253e36"),
      text("SHOW UP FOR YOU.", 60, 48, 1480, 99, "#d5f589", display),
      label("WEEK OF [DATE] / YOUR PACE. YOUR PROGRESS.", 65, 183, 1470, "#edf1e8", { fontSize: 21 }),
      box(65, 314, 1470, 62, "#d5f589"),
      label("ACTIVITY", 90, 335, 450, "#253e36", { fontSize: 18 }),
      ...["M", "T", "W", "T", "F", "S", "S"].map((day, i) => label(day, 580 + i * 132, 335, 110, "#253e36", { ...centered, fontSize: 18 })),
      ...["[Activity one]", "[Activity two]", "[Activity three]", "[Activity four]"].flatMap((activity, row) => {
        const y = 412 + row * 112;
        return [text(activity, 90, y + 9, 450, 32, "#253e36"), ...[0, 1, 2, 3, 4, 5, 6].map((i) => box(613 + i * 132, y, 44, 44, "none", { stroke: "#8da395", strokeWidth: 2, radius: 7 })), rule(65, y + 78, 1470, "#c9d3c7")];
      }),
      label("MY WEEKLY GOAL", 65, 915, 660, "#253e36"),
      text("[A goal that works for you]", 65, 972, 660, 31, "#61776c"),
      label("HOW I FEEL", 875, 915, 660, "#253e36"),
      text("[Energy, wins & reflections]", 875, 972, 660, 31, "#61776c")
    ]),
    template("Lesson Plan", "Education", "Lesson plan worksheet", 1240, 1754, "#fbfaf6", [
      box(0, 0, 1240, 245, "#294c68"),
      label("[SCHOOL / TEACHER]", 75, 62, 1090, "#d8ebeb", { fontSize: 22 }),
      text("Lesson plan", 70, 117, 1100, 80, "#ffffff", serif),
      text("Subject: [Subject]   /   Grade: [Grade]", 75, 304, 1090, 29, "#294c68"),
      text("Date: [Date]   /   Duration: [Time]", 75, 365, 1090, 29, "#294c68"),
      ...[
        ["01", "LEARNING OBJECTIVES", "[What will students know or be able to do?]", 470, 240],
        ["02", "MATERIALS & PREPARATION", "[Resources, equipment, and setup]", 745, 225],
        ["03", "ACTIVITIES & TIMING", "[Warm-up]  /  [Main activity]  /  [Wrap-up]", 1005, 300],
        ["04", "ASSESSMENT & REFLECTION", "[How will you check understanding?]", 1340, 285]
      ].flatMap(([n, title, prompt, y, h]) => [
        box(75, y, 1090, h, "#eef2ef", { radius: 8 }),
        label(n, 102, y + 30, 65, "#668b8b"),
        label(title, 182, y + 30, 945, "#294c68", { fontSize: 21 }),
        text(prompt, 105, y + 91, 1030, 27, "#617a83"),
        rule(105, y + h - 42, 1030, "#c8d7d5")
      ]),
      text("[Additional notes / follow-up]", 75, 1672, 1090, 24, "#617a83")
    ]),
    template("Study Planner", "Education", "Study schedule planner", 1240, 1754, "#efedf6", [
      label("ONE SESSION AT A TIME", 75, 70, 1090, "#75628e", { fontSize: 22 }),
      text("Make room\nto learn.", 70, 174, 1090, 115, "#40334f", { ...serif, lineHeight: 1.05 }),
      text("Week of [Date]  /  [Subject or course]", 75, 486, 1090, 30, "#75628e"),
      box(75, 584, 1090, 186, "#dcd4ed", { radius: 16 }),
      label("MY TOP PRIORITY", 110, 622, 1020, "#40334f"),
      text("[What do you want to understand?]", 110, 682, 1020, 33, "#40334f"),
      label("WHEN", 95, 843, 255, "#75628e"),
      label("SUBJECT / TASK", 382, 843, 575, "#75628e"),
      label("DONE", 1022, 843, 125, "#75628e", centered),
      ...[0, 1, 2, 3, 4].flatMap((i) => {
        const y = 903 + i * 109;
        return [
          rule(75, y, 1090, "#c4b9d5"),
          text("[Day / time]", 95, y + 35, 265, 27, "#40334f"),
          text("[Topic to study]", 382, y + 35, 580, 29, "#40334f"),
          box(1067, y + 34, 34, 34, "none", { stroke: "#9585ac", strokeWidth: 2, radius: 5 })
        ];
      }),
      rule(75, 1448, 1090, "#c4b9d5"),
      label("WHAT I LEARNED", 75, 1514, 1090, "#75628e"),
      text("[Key takeaways / questions to revisit]", 75, 1579, 1090, 30, "#40334f"),
      rule(75, 1675, 1090, "#c4b9d5")
    ]),
    template("Classroom Rules", "Education", "Classroom rules poster", 1080, 1350, "#fff7df", [
      label("[CLASS / SCHOOL NAME]", 65, 65, 950, "#243d68", centered),
      text("OUR CLASS,\nOUR KIND OF COOL.", 65, 159, 950, 90, "#243d68", { ...display, ...centered, lineHeight: 1.1 }),
      ...[
        ["Listen with care", "Let others finish their thoughts.", "chat", "#f6d776"],
        ["Be kind", "Use words that help and include.", "heart", "#f2b9b0"],
        ["Stay curious", "Ask questions. Try new things.", "star", "#bfccec"],
        ["Look after our space", "Leave it ready for the next person.", "home", "#c2dabb"],
        ["Give it a go", "Progress starts with trying.", "check", "#f0cd9d"]
      ].flatMap(([title, detail, symbol, color], i) => {
        const y = 455 + i * 150;
        return [
          box(65, y, 950, 128, color, { radius: 16 }),
          text(`0${i + 1}`, 89, y + 38, 90, 38, "#243d68", bold),
          text(title, 208, y + 25, 675, 33, "#243d68", bold),
          text(detail, 208, y + 78, 675, 23, "#243d68"),
          icon(symbol, 923, y + 45, 43, "#243d68")
        ];
      }),
      label("WE LEARN BETTER TOGETHER", 65, 1270, 950, "#243d68", { ...centered, fontSize: 19 })
    ]),
    template("Volunteer Call", "Community", "Volunteer recruitment poster", 1080, 1350, "#f2efdf", [
      label("[ORGANIZATION / COMMUNITY GROUP]", 65, 65, 950, "#31584c", { fontSize: 18 }),
      text("A little time.\nA lot of good.", 60, 168, 960, 109, "#31584c", { ...serif, lineHeight: 1.05 }),
      circle(115, 525, 150, "#d6906d"),
      circle(465, 500, 150, "#caab75"),
      circle(815, 525, 150, "#9e725b"),
      box(75, 691, 230, 163, "#e1b14f", { radius: 70 }),
      box(425, 666, 230, 188, "#89ab94", { radius: 70 }),
      box(775, 691, 230, 163, "#d88c6e", { radius: 70 }),
      icon("heart", 492, 710, 95, "#31584c"),
      box(65, 910, 950, 85, "#31584c"),
      label("VOLUNTEERS WELCOME", 90, 940, 900, "#f2efdf", { ...centered, fontSize: 23 }),
      text("[Activity / cause]", 65, 1036, 950, 41, "#31584c", serif),
      text("[Date & time]  /  [Location]", 65, 1114, 950, 29, "#617266"),
      rule(65, 1200, 950, "#acb6a6"),
      text("Join us: [Signup URL / contact]", 65, 1240, 950, 28, "#31584c", bold)
    ]),
    template("Fundraiser", "Community", "Fundraiser announcement", 1080, 1350, "#922f3f", [
      label("[ORGANIZATION NAME]", 65, 65, 950, "#ffe9d3"),
      text("TOGETHER,\nWE CAN.", 60, 176, 960, 158, "#ffe9d3", display),
      text("Help support [cause].", 65, 572, 950, 48, "#ffe9d3", serif),
      box(65, 704, 950, 213, "#ffe9d3", { radius: 16 }),
      label("OUR FUNDRAISING GOAL", 100, 742, 800, "#922f3f", { fontSize: 19 }),
      text("[Goal amount]", 100, 793, 715, 64, "#922f3f", bold),
      icon("heart", 859, 788, 90, "#922f3f"),
      text("[How contributions will be used]", 65, 976, 950, 30, "#ffe9d3"),
      text("[Event date / campaign deadline]", 65, 1050, 950, 28, "#f0b7ac"),
      rule(65, 1150, 950, "#c7797d"),
      label("TAKE PART", 65, 1192, 950, "#ffe9d3"),
      text("[Donation URL / contact]", 65, 1245, 950, 32, "#ffe9d3")
    ]),
    template("Neighborhood Meetup", "Community", "Neighborhood meetup notice", 1080, 1350, "#d4dfed", [
      box(53, 66, 974, 1218, "#b4c2d3", { rotation: -2 }),
      box(65, 65, 950, 1218, "#fff8e7"),
      box(400, 43, 280, 55, "#e2b168", { rotation: -3 }),
      label("[NEIGHBORHOOD NAME]", 110, 155, 860, "#354d69", centered),
      text("Hello,\nneighbour!", 110, 267, 860, 112, "#354d69", { ...serif, ...centered, lineHeight: 1.06 }),
      ...[0, 1, 2].flatMap((i) => [
        box(273 + i * 180, 693, 130, 140, ["#d98668", "#83a38f", "#e1b168"][i]),
        { type: "triangle", x: 258 + i * 180, y: 606, w: 160, h: 100, fill: "#354d69" },
        box(320 + i * 180, 760, 36, 73, "#fff8e7")
      ]),
      text("Good company starts close to home.", 120, 889, 840, 32, "#354d69", { ...serif, ...centered }),
      rule(125, 979, 830, "#c3c9c7"),
      label("[MEETUP / ACTIVITY]", 125, 1020, 830, "#354d69", { ...centered, fontSize: 24 }),
      text("[Date & time]  /  [Meeting place]", 125, 1088, 830, 27, "#354d69", centered),
      text("Say hello: [Contact]", 125, 1170, 830, 26, "#354d69", centered)
    ])
  ];

  // src/core/assets.js
  var GOOGLE_FONT_FAMILIES = [
    "Poppins:wght@400;600;700;800",
    "Inter:wght@400;600;700;800",
    "Montserrat:wght@400;600;700;800",
    "Playfair+Display:wght@400;700",
    "Lobster",
    "Bebas+Neue",
    "Rubik:wght@400;600;700"
  ];
  var FONTS = [
    "Poppins",
    "Inter",
    "Montserrat",
    "Playfair Display",
    "Lobster",
    "Bebas Neue",
    "Rubik",
    "Arial",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Impact"
  ];
  var PALETTE = [
    "#ffffff",
    "#f1f5f9",
    "#cbd5e1",
    "#64748b",
    "#1e293b",
    "#000000",
    "#fecaca",
    "#ef4444",
    "#b91c1c",
    "#fed7aa",
    "#f97316",
    "#c2410c",
    "#fde68a",
    "#f59e0b",
    "#b45309",
    "#fef08a",
    "#eab308",
    "#84cc16",
    "#a7f3d0",
    "#10b981",
    "#047857",
    "#99f6e4",
    "#14b8a6",
    "#0f766e",
    "#bae6fd",
    "#0ea5e9",
    "#0369a1",
    "#c7d2fe",
    "#6366f1",
    "#4338ca",
    "#e9d5ff",
    "#a855f7",
    "#7d2ae8",
    "#fbcfe8",
    "#ec4899",
    "#be185d"
  ];
  var GRADIENTS = [
    { from: "#b45309", to: "#f59e0b", angle: 135 },
    { from: "#0ea5e9", to: "#22d3ee", angle: 135 },
    { from: "#f59e0b", to: "#ef4444", angle: 135 },
    { from: "#10b981", to: "#84cc16", angle: 135 },
    { from: "#6366f1", to: "#ec4899", angle: 160 },
    { from: "#0f172a", to: "#475569", angle: 135 },
    { from: "#fda4af", to: "#fed7aa", angle: 135 },
    { from: "#111111", to: "#333333", angle: 90 }
  ];
  var shapePreview = (name) => `<path d="${SHAPE_PATHS[name]}" />`;
  var SHAPES = [
    { type: "rect", label: "Square", svg: '<rect x="12" y="12" width="76" height="76" />' },
    { type: "rect", label: "Rounded", props: { radius: 40 }, svg: '<rect x="12" y="12" width="76" height="76" rx="15.2" />' },
    { type: "ellipse", label: "Circle", svg: shapePreview("ellipse") },
    { type: "triangle", label: "Triangle", svg: shapePreview("triangle") },
    { type: "star", label: "Star", svg: shapePreview("star") },
    { type: "hexagon", label: "Hexagon", svg: shapePreview("hexagon") },
    { type: "diamond", label: "Diamond", svg: shapePreview("diamond") },
    { type: "heart", label: "Heart", svg: shapePreview("heart") },
    { type: "line", label: "Line", props: { w: 260, h: 0, strokeWidth: 6 }, svg: '<line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" stroke-width="6" fill="none" />' },
    { type: "line", label: "Arrow", props: { w: 260, h: 0, arrow: true, strokeWidth: 6 }, svg: '<path d="M10 50H66" stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M88 50L66 40V60Z" />' },
    ...EXTRA_SHAPES
  ];
  var BASE_ICONS = {
    star: "M12 1.8l3 6.4 7 .9-5.2 4.8 1.4 6.9L12 17.4 5.8 20.8l1.4-6.9L2 9.1l7-.9z",
    heart: "M12 21.2S3.6 15.8 1.9 10.4C.7 6.6 3.2 3 6.8 3 9 3 10.9 4.2 12 6c1.1-1.8 3-3 5.2-3 3.6 0 6.1 3.6 4.9 7.4C20.4 15.8 12 21.2 12 21.2z",
    check: "M2.5 12.5L5.5 9.5L9 13L18.5 3.5L21.5 6.5L9 19Z",
    "arrow-right": "M3 9.5H13V3L22 12L13 21V14.5H3Z",
    sun: "M12 6.5A5.5 5.5 0 1 1 6.5 12 5.5 5.5 0 0 1 12 6.5zm0-5.5l1.8 3.4h-3.6zM12 23l-1.8-3.4h3.6zM1 12l3.4-1.8v3.6zM23 12l-3.4 1.8v-3.6zM4.2 4.2l3.8 1.5-2.3 2.3zM19.8 19.8L16 18.3l2.3-2.3zM19.8 4.2l-1.5 3.8L16 5.7zM4.2 19.8l1.5-3.8 2.3 2.3z",
    moon: "M20.4 14.2A8.8 8.8 0 0 1 9.8 3.6 9.2 9.2 0 1 0 20.4 14.2z",
    cloud: "M6.5 19a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.8 8.6 4 4 0 0 1 17.5 19z",
    home: "M12 3l9 8h-2.5v9.5H14V15h-4v5.5H5.5V11H3z",
    mail: "M4 4H20A2 2 0 0 1 22 6V18A2 2 0 0 1 20 20H4A2 2 0 0 1 2 18V6A2 2 0 0 1 4 4ZM4 6.5L12 12L20 6.5V8.7L12 14.2L4 8.7Z",
    phone: "M6.6 3c.5 0 1 .3 1.2.8l1.7 3.6c.2.5.1 1.1-.3 1.5L7.8 10.3a13.4 13.4 0 0 0 5.9 5.9l1.4-1.4c.4-.4 1-.5 1.5-.3l3.6 1.7c.5.2.8.7.8 1.2v3.1c0 .8-.6 1.4-1.4 1.4C10.2 21.9 2.1 13.8 2.1 4.4 2.1 3.6 2.7 3 3.5 3z",
    camera: "M9 4l-1.5 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4zm3 5.5A4.5 4.5 0 1 1 7.5 14 4.5 4.5 0 0 1 12 9.5zm0 2A2.5 2.5 0 1 0 14.5 14 2.5 2.5 0 0 0 12 11.5z",
    user: "M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 9c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5z",
    calendar: "M7 2H9V4H15V2H17V4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4H7ZM5 8V10H19V8ZM6 12V14H8V12ZM11 12V14H13V12ZM16 12V14H18V12ZM6 17V19H8V17ZM11 17V19H13V17ZM16 17V19H18V17Z",
    clock: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v5.2l4 2.4-.8 1.4L11 13V7z",
    chat: "M5 3H19Q22 3 22 6V15Q22 18 19 18H8L3 22V6Q3 3 5 3ZM7 7H17A1 1 0 0 1 17 9H7A1 1 0 0 1 7 7ZM7 11H14A1 1 0 0 1 14 13H7A1 1 0 0 1 7 11Z",
    search: "M10 2A8 8 0 1 0 14.2 16.8L19.9 22.5L22.5 19.9L16.8 14.2A8 8 0 0 0 10 2ZM10 5.5A4.5 4.5 0 1 1 10 14.5A4.5 4.5 0 1 1 10 5.5Z",
    bell: "M12 2a6 6 0 0 1 6 6v4l2 3v1H4v-1l2-3V8a6 6 0 0 1 6-6zm-2.5 16h5A2.5 2.5 0 0 1 12 21.5 2.5 2.5 0 0 1 9.5 18z",
    gear: GEAR_PATH,
    trash: "M9 3h6l1 2h4v2H4V5h4zM5 8h14l-1 13H6z",
    chart: "M4 20V4h2v14h14v2zm3-3V9h3v8zm5 0V5h3v12zm5 0v-6h3v6z"
  };
  var ICON_PATHS = Object.fromEntries(
    [...Object.entries(BASE_ICONS), ...Object.entries(EXTRA_ICONS)].map(([name, solid]) => [name, { solid, outline: ICON_OUTLINES[name] || solid }])
  );
  var ICONS = Object.fromEntries(
    Object.entries(ICON_PATHS).map(([name, pair]) => [name, pair.solid])
  );
  var UI_ICON_PATHS = {
    "undo": '<path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />',
    "redo": '<path d="m15 14 5-5-5-5" /><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />',
    "zoom-in": '<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="11" x2="11" y1="8" y2="14" /><line x1="8" x2="14" y1="11" y2="11" />',
    "zoom-out": '<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="8" x2="14" y1="11" y2="11" />',
    "fit": '<path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />',
    "download": '<path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" />',
    "trash": '<path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    "unlock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />',
    "eye-off": '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />',
    "front": '<rect x="8" y="8" width="8" height="8" rx="2" /><path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" /><path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />',
    "back": '<rect x="14" y="14" width="8" height="8" rx="2" /><rect x="2" y="2" width="8" height="8" rx="2" /><path d="M7 14v1a2 2 0 0 0 2 2h1" /><path d="M14 7h1a2 2 0 0 1 2 2v1" />',
    "plus": '<path d="M5 12h14" /><path d="M12 5v14" />',
    "close": '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
    "chevron": '<path d="m6 9 6 6 6-6" />',
    "chart": '<path d="M3 3v18h18" /><path d="M7 17v-5M12 17V7M17 17V4" />',
    "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />',
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />',
    "text": '<path d="M12 4v16" /><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" /><path d="M9 20h6" />',
    "shapes": '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" /><rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="3.5" />',
    "templates": '<rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" />',
    "upload": '<path d="M12 3v12" /><path d="m17 8-5-5-5 5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
    "palette": '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />',
    "alignLeft": '<path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" />',
    "alignCenter": '<path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" />',
    "alignRight": '<path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" />',
    "bold": '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />',
    "italic": '<line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" />',
    "underline": '<path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" x2="20" y1="20" y2="20" />',
    "grid": '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />',
    "duplicate": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    "sun": '<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />',
    "moon": '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />'
  };
  var UI_ICONS = Object.fromEntries(
    Object.entries(UI_ICON_PATHS).map(([name, markup]) => [
      name,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${markup}</svg>`
    ])
  );

  // src/core/registry.js
  var asArray = (value, fallback) => Array.isArray(value) ? value : fallback;
  function createRegistry(options = {}) {
    return {
      templates: [...TEMPLATES, ...deepList(options.templates)],
      fonts: [.../* @__PURE__ */ new Set([...FONTS, ...asArray(options.fonts, [])])],
      googleFonts: [...GOOGLE_FONT_FAMILIES, ...asArray(options.googleFonts, [])],
      palette: asArray(options.palette, [...PALETTE]),
      gradients: asArray(options.gradients, [...GRADIENTS]),
      shapes: [...SHAPES],
      icons: { ...ICONS },
      iconOutlines: { ...ICON_OUTLINES },
      shapePaths: { ...SHAPE_PATHS },
      // Per-instance renderer overrides, consulted by renderer.js before the
      // module-level registries.
      elementRenderers: {},
      chartRenderers: {},
      backgroundPainters: {},
      // Image source providers for the Uploads panel (stock/CDN/brand assets).
      imageSources: asArray(options.imageSources, []),
      // Instance-scoped element type definitions and chart presets, used by
      // plugins (via the plugin context) so registrations never touch the
      // module-global tables. Instance entries resolve before global defaults.
      elementDefaults: {},
      elementManifests: {},
      chartPresets: {}
    };
  }
  function deepList(list) {
    if (!Array.isArray(list)) return [];
    return list.map((item) => JSON.parse(JSON.stringify(item)));
  }

  // src/core/constants.js
  var ACCENT = "#d97706";
  var DEFAULT_FONT = "Arial";
  var GRADIENT_FALLBACKS = { from: "#ffffff", to: "#eeeeee" };
  var CHART_FONT_STACK = "Inter, Arial, sans-serif";
  var BUILTIN_PANEL_IDS = ["templates", "elements", "text", "charts", "uploads", "background", "layers"];

  // src/core/elements.js
  var BASE = {
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    flipX: false,
    flipY: false
  };
  var TYPE_DEFAULTS = {
    text: {
      text: "Your text here",
      fontSize: 48,
      fontFamily: "Poppins",
      fontWeight: 600,
      italic: false,
      underline: false,
      align: "left",
      color: "#111827",
      lineHeight: 1.3,
      letterSpacing: 0,
      w: 420,
      h: 64
    },
    rect: { fill: ACCENT, stroke: "", strokeWidth: 0, radius: 0 },
    ellipse: { fill: ACCENT, stroke: "", strokeWidth: 0 },
    triangle: { fill: ACCENT, stroke: "", strokeWidth: 0 },
    star: { fill: "#f59e0b", stroke: "", strokeWidth: 0 },
    hexagon: { fill: ACCENT, stroke: "", strokeWidth: 0 },
    diamond: { fill: ACCENT, stroke: "", strokeWidth: 0 },
    heart: { fill: "#ef4444", stroke: "", strokeWidth: 0 },
    line: { stroke: "#111827", strokeWidth: 4, arrow: false, w: 220, h: 0 },
    image: { src: "" },
    icon: { icon: "star", iconStyle: "solid", fill: "#111827", w: 120, h: 120 },
    shape: { shape: "pentagon", fill: ACCENT, stroke: "", strokeWidth: 0 },
    chart: { w: 600, h: 400 }
  };
  var ELEMENT_MANIFESTS = {
    text: {
      name: (el2) => {
        const t = (el2.text || "").trim().replace(/\s+/g, " ");
        return t ? t.length > 22 ? t.slice(0, 22) + "\u2026" : t : "Text";
      },
      layerIcon: "text",
      edit: "text",
      autoFitHeight: true,
      toolbar: ["text", "opacity"],
      create: (el2, props) => {
        if (!props.h) el2.h = Math.round(el2.fontSize * el2.lineHeight) + 8;
      }
    },
    rect: { name: "Rectangle", toolbar: ["fill", "opacity"], radius: true },
    ellipse: { name: "Ellipse", toolbar: ["fill", "opacity"] },
    triangle: { name: "Triangle", toolbar: ["fill", "opacity"] },
    star: { name: "Star", toolbar: ["fill", "opacity"] },
    hexagon: { name: "Hexagon", toolbar: ["fill", "opacity"] },
    diamond: { name: "Diamond", toolbar: ["fill", "opacity"] },
    heart: { name: "Heart", toolbar: ["fill", "opacity"] },
    line: { name: "Line", hitTest: "segment", toolbar: ["line"] },
    image: { name: "Image", layerIcon: "image", toolbar: ["opacity"], preloadProps: ["src"] },
    icon: {
      name: (el2) => "Icon (" + el2.icon + ")",
      toolbar: ["fill", "iconStyle", "opacity"]
    },
    shape: {
      name: (el2) => (el2.shape || "Shape").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
      toolbar: ["fill", "opacity"]
    },
    chart: {
      name: (el2, registry) => el2.chart?.title || `${chartPreset(el2.chart?.type, registry)?.label || "Data"} chart`,
      layerIcon: "chart",
      edit: "chart",
      toolbar: ["chartEdit", "opacity"],
      create: (el2, props, registry) => {
        el2.chart = props.chart ? validateChart(normalizeChart(props.chart, registry), registry) : sampleChart("bar", registry);
      },
      // Props in this map target only this type; the value normalizes them.
      exclusiveProps: { chart: (c, registry) => normalizeChart(validateChart(normalizeChart(c, registry), registry), registry) }
    }
  };
  function manifestFor(type, registry = null) {
    const local = registry && registry.elementManifests && registry.elementManifests[type];
    const global = ELEMENT_MANIFESTS[type];
    if (!local) return global || {};
    return local === global ? local : { ...global, ...local };
  }
  function allManifests(registry = null) {
    const types = /* @__PURE__ */ new Set([...Object.keys(ELEMENT_MANIFESTS), ...Object.keys(registry?.elementManifests || {})]);
    const merged = {};
    for (const type of types) merged[type] = manifestFor(type, registry);
    return merged;
  }
  function registerElementManifest(type, partial = {}) {
    if (typeof type !== "string" || !type) {
      throw new Error("ezyreka: registerElementManifest needs a type name");
    }
    if (typeof partial !== "object" || !partial) {
      throw new Error("ezyreka: manifest must be an object");
    }
    ELEMENT_MANIFESTS[type] = { ...ELEMENT_MANIFESTS[type], ...partial };
  }
  function registerElementType(type, { defaults = {}, manifest = {} } = {}) {
    if (typeof type !== "string" || !/^[a-z][a-z0-9-]*$/i.test(type)) {
      throw new Error("ezyreka: element type names must be simple identifiers");
    }
    if (TYPE_DEFAULTS[type]) throw new Error(`ezyreka: element type "${type}" already exists`);
    if (typeof defaults !== "object" || !defaults) {
      throw new Error("ezyreka: element type defaults must be an object");
    }
    TYPE_DEFAULTS[type] = defaults;
    registerElementManifest(type, { name: type, ...manifest });
  }
  function createElement(type, props = {}, registry = null) {
    const defaults = registry && registry.elementDefaults && registry.elementDefaults[type] || TYPE_DEFAULTS[type];
    if (!defaults) return createPlaceholderElement(type, props);
    const el2 = {
      ...BASE,
      ...JSON.parse(JSON.stringify(defaults)),
      ...props,
      id: props.id || uid(type),
      type
    };
    const create = manifestFor(type, registry).create;
    if (create) create(el2, props, registry);
    delete el2.__unresolved;
    delete el2.__missingType;
    return el2;
  }
  function hasElementType(type, registry = null) {
    return Boolean(registry && registry.elementDefaults && registry.elementDefaults[type] || TYPE_DEFAULTS[type]);
  }
  function createPlaceholderElement(type, props = {}) {
    const source = typeof props === "object" && props ? props : {};
    const el2 = {
      ...BASE,
      ...source,
      id: source.id || uid(type),
      type,
      __unresolved: true,
      __missingType: source.__missingType || type
    };
    return el2;
  }
  function elementName(el2, registry = null) {
    if (el2.__unresolved) return `Unsupported (${el2.__missingType || el2.type})`;
    const name = manifestFor(el2.type, registry).name;
    return typeof name === "function" ? name(el2, registry) : name || el2.type;
  }
  function elementCenter(el2) {
    return { x: el2.x + el2.w / 2, y: el2.y + el2.h / 2 };
  }
  function elementCorners(el2) {
    const c = elementCenter(el2);
    const r = deg2rad(el2.rotation || 0);
    const pts = [
      { x: el2.x, y: el2.y },
      { x: el2.x + el2.w, y: el2.y },
      { x: el2.x + el2.w, y: el2.y + el2.h },
      { x: el2.x, y: el2.y + el2.h }
    ];
    return pts.map((p) => rotatePoint(p.x, p.y, c.x, c.y, r));
  }
  function elementAABB(el2) {
    if (!el2.rotation) return { x: el2.x, y: el2.y, w: el2.w, h: el2.h };
    const pts = elementCorners(el2);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
  }
  function selectionBBox(elements) {
    const boxes = elements.map(elementAABB);
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  function hitTest(el2, wx, wy, tolerance = 4, registry = null) {
    if (el2.hidden || el2.locked) return false;
    const c = elementCenter(el2);
    const p = rotatePoint(wx, wy, c.x, c.y, deg2rad(-(el2.rotation || 0)));
    p.x -= el2.x;
    p.y -= el2.y;
    if (manifestFor(el2.type, registry).hitTest === "segment") {
      const tol = Math.max(10, (el2.strokeWidth || 4) + tolerance);
      return distToSegment(p.x, p.y, 0, 0, el2.w, el2.h) <= tol;
    }
    return p.x >= -tolerance && p.y >= -tolerance && p.x <= el2.w + tolerance && p.y <= el2.h + tolerance;
  }
  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }
  function rectsIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // src/core/plugins.js
  var PLUGIN_API_VERSION = 1;
  function fail(pluginId, cause) {
    return new Error(`ezyreka: plugin "${pluginId}" failed to initialize: ${cause}`);
  }
  function normalizePluginEntries(entries) {
    const list = Array.isArray(entries) ? entries : entries ? [entries] : [];
    const normalized = [];
    const seen = /* @__PURE__ */ new Set();
    for (const entry of list) {
      const plugin = entry?.plugin && typeof entry.plugin === "object" ? entry.plugin : entry;
      const options = plugin !== entry && entry && typeof entry === "object" ? entry.options : void 0;
      const id = plugin?.id;
      if (typeof id !== "string" || !id.trim()) {
        throw new Error('ezyreka: plugins need a non-empty string "id"');
      }
      if (seen.has(id)) {
        throw new Error(`ezyreka: plugin "${id}" is configured more than once`);
      }
      seen.add(id);
      if (typeof plugin.version !== "string" || !plugin.version.trim()) {
        throw new Error(`ezyreka: plugin "${id}" needs a "version" string`);
      }
      if (!Number.isInteger(plugin.apiVersion)) {
        throw new Error(`ezyreka: plugin "${id}" needs an integer "apiVersion"`);
      }
      if (plugin.apiVersion !== PLUGIN_API_VERSION) {
        throw new Error(
          `ezyreka: plugin "${id}" targets API version ${plugin.apiVersion}, but this editor supports ${PLUGIN_API_VERSION}`
        );
      }
      if (typeof plugin.setup !== "function") {
        throw new Error(`ezyreka: plugin "${id}" needs a synchronous setup(ctx, options) function`);
      }
      normalized.push({ plugin, options: options ?? {} });
    }
    return normalized;
  }
  function requireName(id, kind, value) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`ezyreka: plugin "${id}" register${kind} needs a ${kind.toLowerCase()} name`);
    }
    return value.trim();
  }
  var PluginManager = class {
    constructor(editor, entries) {
      this.editor = editor;
      this.entries = entries;
      this.instances = [];
      this.disposed = false;
    }
    // Runs setup for every configured entry in order. A failure disposes the
    // plugins that already initialized and rethrows with the plugin id and
    // cause, so the host can inspect and retry on a released target.
    initialize() {
      for (const { plugin, options } of this.entries) {
        const instance = this._createContext(plugin);
        let cleanup;
        try {
          cleanup = plugin.setup(instance.context, options);
        } catch (error) {
          this.dispose();
          throw fail(plugin.id, error?.message || String(error));
        }
        if (cleanup && typeof cleanup.then === "function") {
          this.dispose();
          throw fail(plugin.id, "setup() must be synchronous (returned a promise)");
        }
        if (cleanup !== void 0 && cleanup !== null && typeof cleanup !== "function") {
          this.dispose();
          throw fail(plugin.id, "setup() must return a cleanup function, nothing, undefined or null");
        }
        instance.cleanup = typeof cleanup === "function" ? cleanup : null;
      }
    }
    _createContext(plugin) {
      const editor = this.editor;
      const id = plugin.id;
      const unsubs = [];
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const instance = { plugin, unsubs, controller, cleanup: null, disposers: [] };
      this.instances.push(instance);
      const ctx = {
        pluginId: id,
        apiVersion: PLUGIN_API_VERSION,
        editor,
        signal: controller?.signal ?? null,
        on(event, handler) {
          const off = editor.on(event, handler);
          unsubs.push(off);
          return () => {
            const index = unsubs.indexOf(off);
            if (index >= 0) unsubs.splice(index, 1);
            off();
          };
        },
        once(event, handler) {
          const off = editor.once(event, handler);
          unsubs.push(off);
          return () => {
            const index = unsubs.indexOf(off);
            if (index >= 0) unsubs.splice(index, 1);
            off();
          };
        },
        onDispose(fn) {
          if (typeof fn !== "function") {
            throw new Error(`ezyreka: plugin "${id}" onDispose needs a function`);
          }
          instance.disposers.push(fn);
        },
        // ---- Isolated registration methods. Every "new capability" method
        // rejects duplicates within this editor; override-style hooks
        // (renderers, painters) may replace existing entries locally. ----
        registerElementType(type, def = {}) {
          const name = requireName(id, "ElementType", type);
          if (!name || !/^[a-z][a-z0-9-]*$/i.test(name)) {
            throw new Error(`ezyreka: plugin "${id}" element type names must be simple identifiers`);
          }
          if (editor.registry.elementDefaults[name] || editor.registry.elementManifests[name] || hasElementType(name)) {
            throw new Error(`ezyreka: plugin "${id}" element type "${name}" already exists in this editor`);
          }
          const { defaults, manifest, render } = def || {};
          if (defaults !== void 0 && (typeof defaults !== "object" || !defaults)) {
            throw new Error(`ezyreka: plugin "${id}" element type defaults must be an object`);
          }
          editor.registry.elementDefaults[name] = deepClone(defaults || {});
          editor.registry.elementManifests[name] = { name, ...manifest || {} };
          if (typeof render === "function") editor.registry.elementRenderers[name] = render;
          editor._refreshPanels("layers");
          return name;
        },
        registerElementRenderer(type, renderer) {
          const name = requireName(id, "ElementRenderer", type);
          if (typeof renderer !== "function") {
            throw new Error(`ezyreka: plugin "${id}" element renderer must be a function`);
          }
          editor.registry.elementRenderers[name] = renderer;
          editor.markDirty();
        },
        registerChartType(preset, renderFn) {
          if (!preset || typeof preset.type !== "string" || !preset.label) {
            throw new Error(`ezyreka: plugin "${id}" chart presets need { type, label }`);
          }
          const name = preset.type.trim();
          if (editor.registry.chartPresets[name] || chartPreset(name)) {
            throw new Error(`ezyreka: plugin "${id}" chart type "${name}" already exists in this editor`);
          }
          editor.registry.chartPresets[name] = { group: "Other charts", ...preset, type: name };
          if (typeof renderFn === "function") editor.registry.chartRenderers[name] = renderFn;
          editor._refreshPanels("charts");
          return preset;
        },
        registerChartRenderer(type, renderer) {
          const name = requireName(id, "ChartRenderer", type);
          if (typeof renderer !== "function") {
            throw new Error(`ezyreka: plugin "${id}" chart renderer must be a function`);
          }
          editor.registry.chartRenderers[name] = renderer;
          editor.markDirty();
        },
        registerBackgroundPainter(type, painter) {
          const name = requireName(id, "BackgroundPainter", type);
          if (typeof painter !== "function") {
            throw new Error(`ezyreka: plugin "${id}" background painter must be a function`);
          }
          editor.registry.backgroundPainters[name] = painter;
          editor.markDirty();
        },
        registerPanel(panel) {
          if (!panel || typeof panel.id !== "string" || typeof panel.render !== "function") {
            throw new Error(`ezyreka: plugin "${id}" panels need { id, label, icon, render(contentEl, editor) }`);
          }
          const taken = BUILTIN_PANEL_IDS.includes(panel.id) || editor._pendingPanels.some((p) => p.id === panel.id) || editor.ui?.sidepanel?.tabs.some((t) => t.id === panel.id);
          if (taken) {
            throw new Error(`ezyreka: plugin "${id}" panel "${panel.id}" already exists in this editor`);
          }
          if (editor.ui?.sidepanel) {
            editor.ui.sidepanel.registerPanel(panel);
          } else {
            editor._pendingPanels.push({ ...panel, pluginId: id });
          }
          return panel;
        },
        registerImageSource(source) {
          if (!source || typeof source.id !== "string" || typeof source.search !== "function") {
            throw new Error(`ezyreka: plugin "${id}" image sources need { id, search(query) }`);
          }
          if (editor.registry.imageSources.some((s) => s.id === source.id)) {
            throw new Error(`ezyreka: plugin "${id}" image source "${source.id}" already exists in this editor`);
          }
          editor.registry.imageSources.push(source);
          editor._refreshPanels("uploads");
          return source;
        },
        registerTemplates(templates) {
          editor.registerTemplates(templates);
        },
        registerFont(name, opts) {
          return editor.registerFont(name, opts);
        },
        registerIcons(icons) {
          editor.registerIcons(icons);
        },
        registerShapes(shapes) {
          editor.registerShapes(shapes);
        },
        registerImage(image) {
          return editor.registerImage(image);
        },
        registerTheme(name, vars) {
          return editor.registerTheme(name, vars);
        }
      };
      instance.context = ctx;
      return instance;
    }
    // Disposes in reverse initialization order: aborts pending async work,
    // unsubscribes tracked listeners, runs cleanup and onDispose callbacks
    // exactly once (cleanup first), and keeps going when a disposer throws.
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      for (let i = this.instances.length - 1; i >= 0; i--) {
        const instance = this.instances[i];
        try {
          instance.controller?.abort();
        } catch {
        }
        for (const off of instance.unsubs) {
          try {
            off();
          } catch {
          }
        }
        instance.unsubs = [];
        if (typeof instance.cleanup === "function") {
          try {
            instance.cleanup();
          } catch (error) {
            console.warn(`ezyreka: plugin "${instance.plugin.id}" cleanup failed:`, error);
          }
        }
        instance.cleanup = null;
        for (let j = instance.disposers.length - 1; j >= 0; j--) {
          try {
            instance.disposers[j]();
          } catch (error) {
            console.warn(`ezyreka: plugin "${instance.plugin.id}" onDispose callback failed:`, error);
          }
        }
        instance.disposers = [];
      }
      this.instances = [];
    }
  };

  // src/core/chart-renderer.js
  var formatValue = (value) => new Intl.NumberFormat("en", { notation: Math.abs(value) >= 1e4 ? "compact" : "standard", maximumFractionDigits: 2 }).format(value);
  function text2(ctx, value, x, y, width, align = "left") {
    ctx.textAlign = align;
    let label2 = String(value);
    if (ctx.measureText(label2).width > width) {
      while (label2.length && ctx.measureText(label2 + "\u2026").width > width) label2 = label2.slice(0, -1);
      label2 += "\u2026";
    }
    ctx.fillText(label2, x, y);
  }
  var circularPainter = (ctx, chart, series, box2, font) => drawCircular(ctx, chart, box2, font);
  var cartesianPainter = (ctx, chart, series, box2, font, bounds, registry) => drawCartesian(ctx, chart, series, bounds, font, registry);
  var chartRenderers = {
    bar: cartesianPainter,
    row: cartesianPainter,
    "grouped-bar": cartesianPainter,
    line: cartesianPainter,
    "multi-line": cartesianPainter,
    area: cartesianPainter,
    "stacked-area": cartesianPainter,
    pie: circularPainter,
    donut: circularPainter
  };
  function registerChartRenderer(type, renderer) {
    if (typeof type !== "string" || !type) throw new Error("ezyreka: chart renderer needs a type name");
    if (typeof renderer !== "function") throw new Error("ezyreka: chart renderer must be a function");
    chartRenderers[type] = renderer;
  }
  function drawChart(ctx, element, registry = {}) {
    const chart = normalizeChart(element.chart, registry);
    const w = Math.max(1, element.w), h = Math.max(1, element.h);
    const font = Math.min(chart.fontSize, Math.max(6, Math.min(w / 12, h / 10)));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.font = `${font}px ${CHART_FONT_STACK}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = chart.textColor;
    let invalid = chartPreset(chart.type, registry) ? "" : `Chart type "${chart.type}" unavailable`;
    if (!invalid) {
      try {
        validateChart(chart, registry);
      } catch (error) {
        invalid = error.message;
      }
    }
    const series = isMultiSeriesChart(chart.type, registry) ? chart.series : chart.series.slice(0, 1);
    if (invalid || !chart.categories.length || !series.some((s) => s.values.some((v) => v !== null))) {
      text2(ctx, invalid || "No data to display", w / 2, h / 2, w - 16, "center");
      ctx.restore();
      return;
    }
    let top = 14, bottom = 14;
    if (chart.title) {
      ctx.font = `600 ${font * 1.25}px ${CHART_FONT_STACK}`;
      text2(ctx, chart.title, w / 2, 14 + font / 2, w - 24, "center");
      ctx.font = `${font}px ${CHART_FONT_STACK}`;
      top += font * 2;
    }
    if (chart.showLegend) {
      const entries = isCircularChart(chart.type, registry) ? chart.categories.map((name, i) => ({ name, color: chart.categoryColors[i] })) : series;
      const cellWidth = Math.min(150, Math.max(80, w / Math.min(3, entries.length)));
      const columns = Math.max(1, Math.floor((w - 16) / cellWidth));
      const rows = Math.min(Math.ceil(entries.length / columns), Math.max(1, Math.floor(h * 0.22 / (font * 1.6))));
      bottom += rows * font * 1.6;
      entries.slice(0, rows * columns).forEach((entry, i) => {
        const x = 10 + i % columns * cellWidth, y = h - bottom + 12 + Math.floor(i / columns) * font * 1.6;
        ctx.fillStyle = entry.color;
        ctx.fillRect(x, y - font / 3, font * 0.65, font * 0.65);
        ctx.fillStyle = chart.textColor;
        text2(ctx, entry.name, x + font, y, cellWidth - font - 8);
      });
    }
    const painter = registry.chartRenderers && registry.chartRenderers[chart.type] || chartRenderers[chart.type] || (isCircularChart(chart.type, registry) ? circularPainter : cartesianPainter);
    painter(ctx, chart, series, { x: 12, y: top, w: w - 24, h: Math.max(1, h - top - bottom) }, font, { w, h, top, bottom }, registry);
    ctx.restore();
  }
  function drawCircular(ctx, chart, box2, font) {
    const values = chart.series[0].values;
    const max = values.reduce((result, value) => Math.max(result, value || 0), 0);
    if (!max) {
      ctx.fillStyle = chart.textColor;
      text2(ctx, "No data to display", box2.x + box2.w / 2, box2.y + box2.h / 2, box2.w, "center");
      return;
    }
    const total = values.reduce((sum, value) => sum + (value || 0) / max, 0);
    const cx = box2.x + box2.w / 2, cy = box2.y + box2.h / 2;
    const radius = Math.max(1, Math.min(box2.w, box2.h) / 2 - 4);
    const inner = chart.type === "donut" ? radius * 0.55 : 0;
    let angle = -Math.PI / 2;
    values.forEach((value, i) => {
      if (!value) return;
      const sweep = value / max / total * Math.PI * 2, end = angle + sweep;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle, end);
      if (inner) ctx.arc(cx, cy, inner, end, angle, true);
      else ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = chart.categoryColors[i];
      ctx.fill();
      if (chart.showValues && sweep * radius > font * 2) {
        const middle = angle + sweep / 2, distance = inner ? radius * 0.78 : radius * 0.65;
        ctx.fillStyle = chart.textColor;
        text2(ctx, formatValue(value), cx + Math.cos(middle) * distance, cy + Math.sin(middle) * distance, radius * 0.55, "center");
      }
      angle = end;
    });
  }
  function drawCartesian(ctx, chart, series, bounds, font, registry = null) {
    const preset = chartPreset(chart.type, registry) || {};
    const horizontal = preset.horizontal === true;
    const bar = preset.kind === "bar";
    const x = chart.showAxes ? Math.min(bounds.w * 0.28, font * (horizontal ? 6 : 4)) : 12;
    const y = bounds.top + (chart.showValues ? font : 0);
    const w = Math.max(1, bounds.w - x - 16);
    const h = Math.max(1, bounds.h - y - bounds.bottom - (chart.showAxes ? font * 2 : 0));
    const [low, high] = chartDomain(chart, registry);
    const scale = Math.max(Math.abs(low), Math.abs(high), 1);
    const unit = (value) => (value / scale - low / scale) / (high / scale - low / scale);
    const valueAt = (value) => horizontal ? x + unit(value) * w : y + (1 - unit(value)) * h;
    const count = chart.categories.length;
    const categoryAt = (i) => horizontal ? y + (i + 0.5) * h / count : bar ? x + (i + 0.5) * w / count : x + (count === 1 ? 0.5 : i / (count - 1)) * w;
    ctx.lineWidth = 1;
    for (let tick = 0; tick <= 4; tick++) {
      const fraction = tick / 4;
      const value = (low / scale * (1 - fraction) + high / scale * fraction) * scale;
      const position = horizontal ? x + fraction * w : y + (1 - fraction) * h;
      if (chart.showGrid) {
        ctx.save();
        ctx.globalAlpha *= 0.15;
        ctx.strokeStyle = chart.textColor;
        ctx.beginPath();
        if (horizontal) {
          ctx.moveTo(position, y);
          ctx.lineTo(position, y + h);
        } else {
          ctx.moveTo(x, position);
          ctx.lineTo(x + w, position);
        }
        ctx.stroke();
        ctx.restore();
      }
      if (chart.showAxes) {
        ctx.fillStyle = chart.textColor;
        if (horizontal) text2(ctx, formatValue(value), position, y + h + font, w / 5, "center");
        else text2(ctx, formatValue(value), x - 8, position, x - 10, "right");
      }
    }
    if (chart.showAxes) {
      ctx.strokeStyle = chart.textColor;
      ctx.beginPath();
      if (horizontal) {
        ctx.moveTo(valueAt(0), y);
        ctx.lineTo(valueAt(0), y + h);
      } else {
        ctx.moveTo(x, valueAt(0));
        ctx.lineTo(x + w, valueAt(0));
      }
      ctx.stroke();
      ctx.fillStyle = chart.textColor;
      const step = Math.max(1, Math.ceil(count / Math.max(1, Math.floor((horizontal ? h : w) / (font * (horizontal ? 1.8 : 4))))));
      chart.categories.forEach((label2, i) => {
        if (i % step) return;
        if (horizontal) text2(ctx, label2, x - 8, categoryAt(i), x - 12, "right");
        else text2(ctx, label2, categoryAt(i), y + h + font, Math.min(font * 6, w * step / count), "center");
      });
    }
    const stacks = preset.kind === "stacked-area" ? chartStacks(chart) : null;
    const labels = [];
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    series.forEach((s, si) => {
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1, font / 6);
      if (bar) {
        const slot = (horizontal ? h : w) / count;
        const thickness = slot * 0.72 / series.length;
        s.values.forEach((value, i) => {
          if (value === null) return;
          const center = categoryAt(i) - slot * 0.36 + thickness * (si + 0.5);
          const position = valueAt(value), zero = valueAt(0);
          if (horizontal) ctx.fillRect(Math.min(position, zero), center - thickness * 0.45, Math.abs(position - zero), thickness * 0.9);
          else ctx.fillRect(center - thickness * 0.45, Math.min(position, zero), thickness * 0.9, Math.abs(position - zero));
          labels.push({
            value,
            x: horizontal ? position + (value < 0 ? -4 : 4) : center,
            y: horizontal ? center : position + (value < 0 ? font * 0.7 : -font * 0.7),
            align: horizontal ? value < 0 ? "right" : "left" : "center",
            width: horizontal ? w / 4 : slot / series.length
          });
        });
        return;
      }
      let run = [];
      const flush = () => {
        if (!run.length) return;
        if (preset.kind === "area" || stacks) {
          ctx.save();
          ctx.globalAlpha *= stacks ? 0.9 : 0.35;
          ctx.beginPath();
          run.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
          [...run].reverse().forEach((p) => ctx.lineTo(p.x, p.base));
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.beginPath();
        run.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.stroke();
        run.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.5, font / 5), 0, Math.PI * 2);
          ctx.fill();
          labels.push({ value: p.value, x: p.x, y: p.y - font * 0.8, align: "center", width: w / Math.max(count, 2) });
        });
        run = [];
      };
      s.values.forEach((value, i) => {
        if (value === null) {
          flush();
          return;
        }
        const stacked = stacks?.[si][i];
        run.push({ x: categoryAt(i), y: valueAt(stacked ? stacked.end : value), base: valueAt(stacked ? stacked.start : 0), value });
      });
      flush();
    });
    ctx.restore();
    if (chart.showValues) {
      ctx.fillStyle = chart.textColor;
      labels.forEach((p) => text2(ctx, formatValue(p.value), p.x, p.y, Math.max(10, p.width), p.align));
    }
  }

  // src/core/renderer.js
  var imageCache = /* @__PURE__ */ new Map();
  var pathCache = /* @__PURE__ */ new Map();
  function getImage(src) {
    if (!src) return null;
    let entry = imageCache.get(src);
    if (!entry) {
      const img = new Image();
      entry = { img, loaded: false };
      img.onload = () => {
        entry.loaded = true;
        entry.resolve?.();
      };
      img.onerror = () => {
        entry.error = true;
        entry.resolve?.();
      };
      img.crossOrigin = "anonymous";
      img.src = src;
      imageCache.set(src, entry);
    }
    return entry;
  }
  function whenImagesReady(srcs) {
    const entries = srcs.map((s) => getImage(s)).filter(Boolean);
    return Promise.all(
      entries.map(
        (e) => new Promise((res) => {
          if (e.loaded || e.error) return res();
          e.resolve = res;
          setTimeout(res, 8e3);
        })
      )
    );
  }
  function getPath(d) {
    if (!pathCache.has(d)) pathCache.set(d, new Path2D(d));
    return pathCache.get(d);
  }
  function resolveFill(ctx, fill, w, h, fallback = "#000000") {
    if (!fill || fill.type !== "gradient") return typeof fill === "string" && fill ? fill : fallback;
    const angle = deg2rad(fill.angle ?? 135);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const len = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
    const gradient2 = ctx.createLinearGradient(
      w / 2 - dx * len,
      h / 2 - dy * len,
      w / 2 + dx * len,
      h / 2 + dy * len
    );
    const stops = Array.isArray(fill.stops) && fill.stops.length ? fill.stops.map((s) => ({ color: hexOr(s?.color, "#000000"), offset: clamp(Number(s?.offset ?? 0), 0, 1) })) : [
      { color: hexOr(fill.from, GRADIENT_FALLBACKS.from), offset: 0 },
      { color: hexOr(fill.to, GRADIENT_FALLBACKS.to), offset: 1 }
    ];
    stops.forEach((s) => gradient2.addColorStop(s.offset, s.color));
    return gradient2;
  }
  function renderPage(ctx, page, opts = {}) {
    const pw = page.width || 1080;
    const ph = page.height || 1080;
    const transparent = !!opts.transparent;
    drawBackground(ctx, page.background, pw, ph, transparent, opts.registry || {});
    const elements = page.elements || [];
    for (const el2 of elements) {
      if (!el2.hidden) drawElement(ctx, el2, opts);
    }
  }
  var backgroundPainters = {
    solid(ctx, bg, pw, ph) {
      ctx.fillStyle = bg && bg.color || "#ffffff";
      ctx.fill();
    },
    gradient(ctx, bg, pw, ph) {
      ctx.fillStyle = resolveFill(ctx, bg, pw, ph);
      ctx.fill();
    },
    image(ctx, bg, pw, ph) {
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      const entry = getImage(bg.src);
      if (entry && entry.loaded && entry.img.naturalWidth) {
        const scale = Math.max(pw / entry.img.naturalWidth, ph / entry.img.naturalHeight);
        const dw = entry.img.naturalWidth * scale;
        const dh = entry.img.naturalHeight * scale;
        ctx.drawImage(entry.img, (pw - dw) / 2, (ph - dh) / 2, dw, dh);
      }
    }
  };
  function registerBackgroundPainter(type, painter) {
    if (typeof type !== "string" || !type) throw new Error("ezyreka: background painter needs a type name");
    if (typeof painter !== "function") throw new Error("ezyreka: background painter must be a function");
    backgroundPainters[type] = painter;
  }
  function drawBackground(ctx, bg, pw, ph, transparent, registry = {}) {
    if (transparent) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    const type = bg && bg.type || "solid";
    const painters = { ...backgroundPainters, ...registry.backgroundPainters || {} };
    if (!painters[type]) {
      painters.solid(ctx, { color: "#ffffff" }, pw, ph);
      ctx.restore();
      ctx.save();
      drawPlaceholder(ctx, { w: pw, h: ph }, `Background "${type}" unavailable`);
      ctx.restore();
      return;
    }
    painters[type](ctx, bg, pw, ph);
    ctx.restore();
  }
  var elementRenderers = {
    chart: drawChart,
    text: drawText,
    rect: drawRect,
    ellipse: (ctx, el2, r) => drawShapePrimitive(ctx, el2, "ellipse", r),
    triangle: (ctx, el2, r) => drawShapePrimitive(ctx, el2, "triangle", r),
    star: (ctx, el2, r) => drawShapePrimitive(ctx, el2, "star", r),
    hexagon: (ctx, el2, r) => drawShapePrimitive(ctx, el2, "hexagon", r),
    diamond: (ctx, el2, r) => drawShapePrimitive(ctx, el2, "diamond", r),
    heart: (ctx, el2, r) => drawShapePrimitive(ctx, el2, "heart", r),
    line: drawLine,
    image: drawImage,
    icon: drawIcon,
    shape: drawVectorShape
  };
  function registerElementRenderer(type, renderer) {
    if (typeof type !== "string" || !type) throw new Error("ezyreka: element renderer needs a type name");
    if (typeof renderer !== "function") throw new Error("ezyreka: element renderer must be a function");
    elementRenderers[type] = renderer;
  }
  function drawElement(ctx, el2, opts = {}) {
    const r = opts.registry || {};
    const draw = r.elementRenderers && r.elementRenderers[el2.type] || elementRenderers[el2.type];
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, el2.opacity ?? 1));
    const cx = el2.x + el2.w / 2;
    const cy = el2.y + el2.h / 2;
    ctx.translate(cx, cy);
    if (el2.rotation) ctx.rotate(deg2rad(el2.rotation));
    ctx.scale(el2.flipX ? -1 : 1, el2.flipY ? -1 : 1);
    ctx.translate(-el2.w / 2, -el2.h / 2);
    if (draw) draw(ctx, el2, r);
    else drawPlaceholder(ctx, el2, `Unsupported (${el2.__missingType || el2.type})`);
    ctx.restore();
  }
  function drawPlaceholder(ctx, el2, label2) {
    const w = Math.max(1, el2.w || 0);
    const h = Math.max(1, el2.h || 0);
    ctx.save();
    ctx.fillStyle = "rgba(100, 116, 139, 0.1)";
    ctx.fillRect(0, 0, w, h);
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#94a3b8";
    ctx.strokeRect(0.75, 0.75, Math.max(0, w - 1.5), Math.max(0, h - 1.5));
    ctx.setLineDash([]);
    if (h > 26 && w > 40) {
      const font = Math.max(9, Math.min(14, h / 3, w / (label2.length * 0.62)));
      ctx.fillStyle = "#64748b";
      ctx.font = `600 ${font}px ${DEFAULT_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let text3 = label2;
      while (text3.length && ctx.measureText(text3 + "\u2026").width > w - 12) text3 = text3.slice(0, -1);
      if (text3 !== label2) text3 += "\u2026";
      ctx.fillText(text3, w / 2, h / 2);
    }
    ctx.restore();
  }
  function fillAndStroke(ctx, el2, path, fillRule = "nonzero") {
    if (el2.fill !== "none") {
      ctx.fillStyle = resolveFill(ctx, el2.fill, el2.w, el2.h);
      ctx.fill(path, fillRule);
    }
    if (el2.strokeWidth > 0 && el2.stroke !== "none") {
      ctx.lineWidth = el2.strokeWidth;
      ctx.strokeStyle = el2.stroke || "#000000";
      ctx.stroke(path);
    }
  }
  function drawRect(ctx, el2) {
    const r = Math.min(el2.radius || 0, el2.w / 2, el2.h / 2);
    const path = new Path2D();
    if (r > 0) {
      path.moveTo(r, 0);
      path.arcTo(el2.w, 0, el2.w, el2.h, r);
      path.arcTo(el2.w, el2.h, 0, el2.h, r);
      path.arcTo(0, el2.h, 0, 0, r);
      path.arcTo(0, 0, el2.w, 0, r);
      path.closePath();
    } else {
      path.rect(0, 0, el2.w, el2.h);
    }
    fillAndStroke(ctx, el2, path);
  }
  function drawVectorShape(ctx, el2, registry = {}) {
    const paths = registry.shapePaths || SHAPE_PATHS;
    if (paths[el2.shape] === void 0) {
      drawPlaceholder(ctx, el2, `Shape "${el2.shape || ""}" unavailable`);
      return;
    }
    const source = getPath(paths[el2.shape]);
    const path = new Path2D();
    path.addPath(source, new DOMMatrix().scale(el2.w / 100, el2.h / 100));
    ctx.lineJoin = "round";
    fillAndStroke(ctx, el2, path, "evenodd");
  }
  function drawShapePrimitive(ctx, el2, name, registry = {}) {
    const paths = registry.shapePaths || SHAPE_PATHS;
    const source = getPath(paths[name] || paths.pentagon);
    const path = new Path2D();
    path.addPath(source, new DOMMatrix().scale(el2.w / 100, el2.h / 100));
    ctx.lineJoin = "round";
    fillAndStroke(ctx, el2, path);
  }
  function drawLine(ctx, el2) {
    ctx.strokeStyle = el2.stroke || "#111827";
    ctx.lineWidth = el2.strokeWidth || 4;
    ctx.lineCap = "round";
    const length = Math.hypot(el2.w, el2.h);
    const size = el2.arrow ? Math.min(length, Math.max(10, ctx.lineWidth * 4)) : 0;
    if (!el2.arrow || length > size) {
      const shaftScale = el2.arrow ? (length - size) / length : 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(el2.w * shaftScale, el2.h * shaftScale);
      ctx.stroke();
    }
    if (el2.arrow && length > 0) {
      const angle = Math.atan2(el2.h, el2.w);
      ctx.save();
      ctx.translate(el2.w, el2.h);
      ctx.rotate(angle);
      ctx.fillStyle = el2.stroke || "#111827";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, -size / 2.4);
      ctx.lineTo(-size, size / 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  function drawImage(ctx, el2) {
    const entry = getImage(el2.src);
    if (!entry || !entry.loaded || !entry.img.naturalWidth) {
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(0, 0, el2.w, el2.h);
      return;
    }
    const iw = entry.img.naturalWidth;
    const ih = entry.img.naturalHeight;
    const scale = Math.max(el2.w / iw, el2.h / ih);
    const sw = el2.w / scale;
    const sh = el2.h / scale;
    ctx.drawImage(entry.img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, el2.w, el2.h);
  }
  function drawIcon(ctx, el2, registry = {}) {
    const outline = el2.iconStyle === "outline";
    const paths = outline ? registry.iconOutlines || ICON_OUTLINES : registry.icons || ICONS;
    const d = paths[el2.icon];
    if (d === void 0) {
      drawPlaceholder(ctx, el2, `Icon "${el2.icon || ""}" unavailable`);
      return;
    }
    const fill = el2.fill === "none" ? null : resolveFill(ctx, el2.fill, el2.w, el2.h, "#111827");
    ctx.save();
    ctx.scale(el2.w / 24, el2.h / 24);
    if (el2.fill !== "none") {
      if (outline) {
        ctx.strokeStyle = fill;
        ctx.lineWidth = 1.75;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(getPath(d));
      } else {
        ctx.fillStyle = fill;
        ctx.fill(getPath(d), "evenodd");
      }
    }
    ctx.restore();
  }
  function fontString(el2) {
    return `${el2.italic ? "italic " : ""}${el2.fontWeight || 400} ${el2.fontSize || 48}px ${el2.fontFamily || DEFAULT_FONT}`;
  }
  function wrapLines(ctx, text3, maxWidth) {
    const out = [];
    for (const para of String(text3 ?? "").split("\n")) {
      if (!para) {
        out.push("");
        continue;
      }
      const words = para.split(/(\s+)/);
      let line = "";
      for (const word of words) {
        const test = line + word;
        if (ctx.measureText(test).width > maxWidth && line.trim()) {
          out.push(line.trimEnd());
          line = word.trimStart();
        } else {
          line = test;
        }
      }
      out.push(line);
    }
    return out;
  }
  function measureTextElement(ctx, el2) {
    ctx.save();
    ctx.font = fontString(el2);
    try {
      if ("letterSpacing" in ctx) ctx.letterSpacing = (el2.letterSpacing || 0) + "px";
    } catch {
    }
    const lines = wrapLines(ctx, el2.text, el2.w);
    ctx.restore();
    return lines;
  }
  function drawText(ctx, el2) {
    ctx.save();
    ctx.font = fontString(el2);
    try {
      if ("letterSpacing" in ctx) ctx.letterSpacing = (el2.letterSpacing || 0) + "px";
    } catch {
    }
    ctx.textBaseline = "top";
    ctx.fillStyle = el2.color || "#111827";
    const lines = wrapLines(ctx, el2.text, el2.w);
    const lineH = (el2.fontSize || 48) * (el2.lineHeight || 1.3);
    lines.forEach((line, i) => {
      const w = ctx.measureText(line).width;
      let x = 0;
      if (el2.align === "center") x = (el2.w - w) / 2;
      else if (el2.align === "right") x = el2.w - w;
      const y = i * lineH + (lineH - (el2.fontSize || 48)) / 2;
      ctx.fillText(line, x, y);
      if (el2.underline && line) {
        ctx.fillRect(x, y + (el2.fontSize || 48) * 1.02, w, Math.max(1, (el2.fontSize || 48) / 15));
      }
    });
    ctx.restore();
  }

  // src/interactions.js
  var SNAP_THRESHOLD = 6;
  var Interactions = class {
    constructor(editor) {
      this.editor = editor;
      this.drag = null;
      this.spaceDown = false;
      editor._isActive = true;
      this._bind();
    }
    _bind() {
      const ed = this.editor;
      this._onDocPointerDown = (e) => {
        ed._isActive = ed.container.contains(e.target);
      };
      this._onPointerMove = (e) => this.onPointerMove(e);
      this._onPointerUp = (e) => this.onPointerUp(e);
      this._onKeyDown = (e) => this.onKeyDown(e);
      this._onKeyUp = (e) => {
        if (e.code === "Space") {
          this.spaceDown = false;
          ed.viewport.classList.remove("ez-panning");
        }
      };
      ed.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
      ed.overlay.addEventListener("pointerdown", (e) => {
        if (e.target === ed.overlay) this.onPointerDown(e);
      });
      window.addEventListener("pointermove", this._onPointerMove);
      window.addEventListener("pointerup", this._onPointerUp);
      ed.viewport.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
      window.addEventListener("keydown", this._onKeyDown);
      window.addEventListener("keyup", this._onKeyUp);
      document.addEventListener("pointerdown", this._onDocPointerDown, true);
      ed.canvas.addEventListener("dblclick", (e) => this.onDblClick(e));
      ed.viewport.addEventListener("dragover", (e) => e.preventDefault());
      ed.viewport.addEventListener("drop", (e) => this.onDrop(e));
    }
    destroy() {
      const ed = this.editor;
      window.removeEventListener("pointermove", this._onPointerMove);
      window.removeEventListener("pointerup", this._onPointerUp);
      window.removeEventListener("keydown", this._onKeyDown);
      window.removeEventListener("keyup", this._onKeyUp);
      document.removeEventListener("pointerdown", this._onDocPointerDown, true);
      ed.viewport.classList.remove("ez-panning");
      this.drag = null;
    }
    clientToWorld(e) {
      const rect = this.editor.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / this.editor.zoom,
        y: (e.clientY - rect.top) / this.editor.zoom
      };
    }
    onWheel(e) {
      const ed = this.editor;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 15e-4);
        ed.setZoom(clamp(ed.zoom * factor, 0.05, 5), { x: e.clientX, y: e.clientY });
      }
    }
    onDrop(e) {
      e.preventDefault();
      const ed = this.editor;
      const files = [...e.dataTransfer?.files || []].filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      const world = this.clientToWorld(e);
      files.forEach(async (file, i) => {
        const src = await ed.addUpload(file);
        ed.addElement({
          type: "image",
          src,
          name: file.name,
          x: world.x - 100 + i * 30,
          y: world.y - 100 + i * 30
        });
      });
    }
    onDblClick(e) {
      const ed = this.editor;
      const p = this.clientToWorld(e);
      const els = ed.getElements();
      for (let i = els.length - 1; i >= 0; i--) {
        if (hitTest(els[i], p.x, p.y, 4, ed.registry)) {
          ed.select([els[i].id]);
          const edit = manifestFor(els[i].type, ed.registry).edit;
          if (edit === "chart") ed.ui.sidepanel?.charts?.open();
          else if (edit === "text") ed.startTextEdit(els[i]);
          return;
        }
      }
    }
    onPointerDown(e) {
      const ed = this.editor;
      if (e.button === 1 || this.spaceDown) {
        this.startPan(e);
        return;
      }
      if (e.button !== 0) return;
      if (ed._editing) ed.commitTextEdit();
      const p = this.clientToWorld(e);
      const els = ed.getElements();
      for (let i = els.length - 1; i >= 0; i--) {
        if (hitTest(els[i], p.x, p.y, 4, ed.registry)) {
          const el2 = els[i];
          if (e.shiftKey) {
            ed.toggleSelect(el2.id);
          } else if (!ed.selection.has(el2.id)) {
            ed.select([el2.id]);
          }
          if (!el2.locked) this.startMove(e);
          return;
        }
      }
      if (!e.shiftKey) ed.clearSelection();
      this.startRubberBand(e);
    }
    startPan(e) {
      const ed = this.editor;
      e.preventDefault();
      this.drag = {
        mode: "pan",
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: ed.viewport.scrollLeft,
        scrollTop: ed.viewport.scrollTop
      };
      ed.viewport.classList.add("ez-panning");
    }
    startMove(e) {
      const ed = this.editor;
      const selected = ed.getSelected();
      const p = this.clientToWorld(e);
      this.drag = {
        mode: "move",
        start: p,
        originals: selected.map((el2) => ({ el: el2, x: el2.x, y: el2.y })),
        moved: false
      };
    }
    startRubberBand(e) {
      const ed = this.editor;
      const p = this.clientToWorld(e);
      ed.updateOverlay();
      this.drag = { mode: "band", start: p };
      const band = document.createElement("div");
      band.className = "ez-band";
      ed.overlay.appendChild(band);
      this.drag.band = band;
    }
    startResize(e, dir) {
      const ed = this.editor;
      const el2 = ed.getSelected()[0];
      if (!el2 || el2.locked) return;
      e.stopPropagation();
      e.preventDefault();
      const c0 = elementCenter(el2);
      const opposite = {
        nw: "se",
        n: "s",
        ne: "sw",
        e: "w",
        se: "nw",
        s: "n",
        sw: "ne",
        w: "e"
      }[dir];
      const anchor = this.handlePoint(el2, opposite);
      this.drag = {
        mode: "resize",
        dir,
        el: el2,
        c0,
        anchor,
        aspect: el2.w / Math.max(1, el2.h),
        startW: el2.w,
        startH: el2.h
      };
    }
    startRotate(e) {
      const ed = this.editor;
      const el2 = ed.getSelected()[0];
      if (!el2 || el2.locked) return;
      e.stopPropagation();
      e.preventDefault();
      const c = elementCenter(el2);
      const p = this.clientToWorld(e);
      const startAngle = Math.atan2(p.y - c.y, p.x - c.x);
      this.drag = { mode: "rotate", el: el2, center: c, startAngle, startRotation: el2.rotation || 0 };
    }
    handlePoint(el2, dir) {
      const c = elementCenter(el2);
      const r = deg2rad(el2.rotation || 0);
      const local = {
        nw: { x: el2.x, y: el2.y },
        n: { x: c.x, y: el2.y },
        ne: { x: el2.x + el2.w, y: el2.y },
        e: { x: el2.x + el2.w, y: c.y },
        se: { x: el2.x + el2.w, y: el2.y + el2.h },
        s: { x: c.x, y: el2.y + el2.h },
        sw: { x: el2.x, y: el2.y + el2.h },
        w: { x: el2.x, y: c.y }
      }[dir];
      return rotatePoint(local.x, local.y, c.x, c.y, r);
    }
    onPointerMove(e) {
      const drag = this.drag;
      if (!drag) return;
      const ed = this.editor;
      if (drag.mode === "pan") {
        ed.viewport.scrollLeft = drag.scrollLeft - (e.clientX - drag.startX);
        ed.viewport.scrollTop = drag.scrollTop - (e.clientY - drag.startY);
        return;
      }
      if (drag.mode === "band") {
        const p = this.clientToWorld(e);
        const r = normRect(drag.start, p);
        drag.rect = r;
        Object.assign(drag.band.style, {
          left: r.x * ed.zoom + "px",
          top: r.y * ed.zoom + "px",
          width: r.w * ed.zoom + "px",
          height: r.h * ed.zoom + "px",
          display: "block"
        });
        return;
      }
      if (drag.mode === "move") {
        const p = this.clientToWorld(e);
        let dx = p.x - drag.start.x;
        let dy = p.y - drag.start.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
        if (e.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }
        const originals = drag.originals;
        const movingBox = selectionBBox(originals.map((o) => ({ ...o.el, x: o.x + dx, y: o.y + dy })));
        const others = ed.getElements().filter((el2) => !ed.selection.has(el2.id) && !el2.hidden && !el2.locked);
        const snap = computeSnap(movingBox, others, ed.getPage(), e.altKey ? 0 : SNAP_THRESHOLD);
        dx += snap.dx;
        dy += snap.dy;
        for (const o of originals) {
          o.el.x = o.x + dx;
          o.el.y = o.y + dy;
        }
        ed.setGuides(snap.guides);
        ed.markDirty();
        return;
      }
      if (drag.mode === "resize") {
        const p = this.clientToWorld(e);
        applyResize(drag, p, e.shiftKey);
        ed.markDirty();
        return;
      }
      if (drag.mode === "rotate") {
        const p = this.clientToWorld(e);
        const angle = Math.atan2(p.y - drag.center.y, p.x - drag.center.x);
        let deg = drag.startRotation + rad2deg(angle - drag.startAngle);
        const snapTo = Math.round(deg / 15) * 15;
        if (Math.abs(deg - snapTo) < 4) deg = snapTo;
        drag.el.rotation = (deg % 360 + 360) % 360;
        ed.markDirty();
      }
    }
    onPointerUp(e) {
      const drag = this.drag;
      if (!drag) return;
      const ed = this.editor;
      this.drag = null;
      if (drag.mode === "pan") {
        ed.viewport.classList.remove("ez-panning");
        return;
      }
      if (drag.mode === "band") {
        drag.band.remove();
        ed.markDirty();
        if (drag.rect) {
          const hits = ed.getElements().filter((el2) => !el2.hidden && !el2.locked && rectsIntersect(drag.rect, elementAABB(el2)));
          if (hits.length) {
            if (e.shiftKey) {
              const ids = new Set(ed.selection);
              hits.forEach((h) => ids.add(h.id));
              ed.select([...ids]);
            } else {
              ed.select(hits.map((h) => h.id));
            }
          }
        }
        return;
      }
      if (drag.mode === "move") {
        ed.setGuides([]);
        if (drag.moved) {
          ed.markDirty();
          ed.commit();
        }
        return;
      }
      if (drag.mode === "resize" || drag.mode === "rotate") {
        if (manifestFor(drag.el.type, ed.registry).autoFitHeight) ed.fitTextHeight(drag.el);
        ed.markDirty();
        ed.commit();
      }
    }
    onKeyDown(e) {
      const ed = this.editor;
      if (!ed._isActive) return;
      const target = e.target;
      const typing = target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (typing || ed._editing) return;
      if (e.code === "Space" && !this.spaceDown) {
        e.preventDefault();
        this.spaceDown = true;
        ed.viewport.classList.add("ez-panning");
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        e.shiftKey ? ed.redo() : ed.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        ed.redo();
        return;
      }
      if (mod && e.shiftKey && key === "l") {
        e.preventDefault();
        return ed.toggleTheme();
      }
      if (mod && key === "c") return ed.copy();
      if (mod && key === "x") return ed.cut();
      if (mod && key === "v") return ed.paste();
      if (mod && key === "d") {
        e.preventDefault();
        return ed.duplicateSelected();
      }
      if (mod && key === "a") {
        e.preventDefault();
        return ed.select(ed.getElements().filter((el2) => !el2.locked && !el2.hidden).map((el2) => el2.id));
      }
      if (key === "delete" || key === "backspace") {
        if (ed.selection.size) {
          e.preventDefault();
          ed.deleteSelected();
        }
        return;
      }
      if (key === "escape") return ed.clearSelection();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
        if (!ed.selection.size) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        ed.getSelected().forEach((el2) => {
          el2.x += dx;
          el2.y += dy;
        });
        ed.markDirty();
        ed.commit();
        return;
      }
      if (mod && (key === "=" || key === "+")) {
        e.preventDefault();
        ed.setZoom(ed.zoom * 1.2);
      }
      if (mod && key === "-") {
        e.preventDefault();
        ed.setZoom(ed.zoom / 1.2);
      }
      if (mod && key === "0") {
        e.preventDefault();
        ed.zoomFit();
      }
      if (mod && key === "s") {
        e.preventDefault();
        ed.downloadJSON();
      }
    }
  };
  function normRect(a, b) {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y)
    };
  }
  function applyResize(drag, pWorld, keepAspect) {
    const { el: el2, c0, anchor, dir } = drag;
    const r = deg2rad(-(el2.rotation || 0));
    const pLocal = rotatePoint(pWorld.x, pWorld.y, c0.x, c0.y, r);
    const aLocal = rotatePoint(anchor.x, anchor.y, c0.x, c0.y, r);
    const horizontal = dir.includes("e") || dir.includes("w");
    const vertical = dir.includes("n") || dir.includes("s");
    const sx = dir.includes("w") ? -1 : 1;
    const sy = dir.includes("n") ? -1 : 1;
    let w = horizontal ? Math.max(8, sx * (pLocal.x - aLocal.x)) : drag.startW;
    let h = vertical ? Math.max(8, sy * (pLocal.y - aLocal.y)) : drag.startH;
    if (keepAspect && horizontal && vertical) {
      w = Math.max(w, 8 * drag.aspect);
      h = w / drag.aspect;
    }
    const mid = {
      x: aLocal.x + (horizontal ? sx * w / 2 : 0),
      y: aLocal.y + (vertical ? sy * h / 2 : 0)
    };
    const newCenter = rotatePoint(mid.x, mid.y, c0.x, c0.y, -r);
    el2.w = w;
    el2.h = h;
    el2.x = newCenter.x - w / 2;
    el2.y = newCenter.y - h / 2;
  }
  function computeSnap(box2, others, page, threshold) {
    const result = { dx: 0, dy: 0, guides: [] };
    if (!threshold) return result;
    const pw = page.width;
    const ph = page.height;
    const xTargets = [];
    const yTargets = [];
    for (const o of others) {
      const b = elementAABB(o);
      xTargets.push({ v: b.x, a: b.y, b: b.y + b.h });
      xTargets.push({ v: b.x + b.w / 2, a: b.y, b: b.y + b.h });
      xTargets.push({ v: b.x + b.w, a: b.y, b: b.y + b.h });
      yTargets.push({ v: b.y, a: b.x, b: b.x + b.w });
      yTargets.push({ v: b.y + b.h / 2, a: b.x, b: b.x + b.w });
      yTargets.push({ v: b.y + b.h, a: b.x, b: b.x + b.w });
    }
    xTargets.push({ v: 0, a: 0, b: ph }, { v: pw / 2, a: 0, b: ph }, { v: pw, a: 0, b: ph });
    yTargets.push({ v: 0, a: 0, b: pw }, { v: ph / 2, a: 0, b: pw }, { v: ph, a: 0, b: pw });
    const movers = (list, size) => [0, size / 2, size];
    let bestX = null;
    for (const m of movers(0, box2.w)) {
      for (const t of xTargets) {
        const d = t.v - (box2.x + m);
        if (Math.abs(d) < threshold && (!bestX || Math.abs(d) < Math.abs(bestX.d))) {
          bestX = { d, v: t.v, a: t.a, b: t.b };
        }
      }
    }
    let bestY = null;
    for (const m of movers(0, box2.h)) {
      for (const t of yTargets) {
        const d = t.v - (box2.y + m);
        if (Math.abs(d) < threshold && (!bestY || Math.abs(d) < Math.abs(bestY.d))) {
          bestY = { d, v: t.v, a: t.a, b: t.b };
        }
      }
    }
    if (bestX) {
      result.dx = bestX.d;
      result.guides.push({
        axis: "x",
        v: bestX.v,
        from: Math.min(bestX.a, box2.y) - 12,
        to: Math.max(bestX.b, box2.y + box2.h) + 12
      });
    }
    if (bestY) {
      result.dy = bestY.d;
      result.guides.push({
        axis: "y",
        v: bestY.v,
        from: Math.min(bestY.a, box2.x) - 12,
        to: Math.max(bestY.b, box2.x + box2.w) + 12
      });
    }
    return result;
  }

  // src/ui/contextmenu.js
  function showMenu(editor, clientX, clientY, items) {
    closeMenus(editor);
    const container = editor.container;
    const rect = container.getBoundingClientRect();
    const menu = el("div", "ez-menu", container);
    for (const item of items) {
      if (item === "-") {
        el("div", "ez-menu-sep", menu);
        continue;
      }
      const row = el("div", "ez-menu-item" + (item.danger ? " ez-danger" : ""), menu);
      row.innerHTML = `${item.icon ? item.icon : ""}<span>${escapeHtml(item.label)}</span>${item.shortcut ? `<span class="ez-menu-shortcut">${escapeHtml(item.shortcut)}</span>` : ""}`;
      if (item.disabled) {
        row.classList.add("ez-disabled");
      } else {
        row.addEventListener("click", () => {
          closeMenus(editor);
          item.action?.();
        });
      }
    }
    menu.style.left = "0px";
    menu.style.top = "0px";
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    menu.style.left = clampNum(clientX - rect.left, 4, rect.width - mw - 4) + "px";
    menu.style.top = clampNum(clientY - rect.top, 4, rect.height - mh - 4) + "px";
    editor._openMenu = menu;
    setTimeout(() => {
      const closer = (ev) => {
        if (!menu.contains(ev.target)) {
          closeMenus(editor);
          window.removeEventListener("pointerdown", closer, true);
        }
      };
      window.addEventListener("pointerdown", closer, true);
    }, 0);
    return menu;
  }
  function closeMenus(editor) {
    if (editor._openMenu) {
      editor._openMenu.remove();
      editor._openMenu = null;
    }
  }
  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  var ContextMenu = class {
    constructor(editor) {
      this.editor = editor;
      editor.canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const p = editor.interactions.clientToWorld(e);
        const els = editor.getElements();
        let hit = null;
        for (let i = els.length - 1; i >= 0; i--) {
          if (editor.hitTestElement(els[i], p.x, p.y)) {
            hit = els[i];
            break;
          }
        }
        if (hit && !editor.selection.has(hit.id)) editor.select([hit.id]);
        const has = editor.selection.size > 0;
        const items = [];
        if (has) {
          items.push(
            { label: "Copy", shortcut: "Ctrl+C", action: () => editor.copy() },
            { label: "Paste", shortcut: "Ctrl+V", action: () => editor.paste() },
            { label: "Duplicate", shortcut: "Ctrl+D", action: () => editor.duplicateSelected() },
            { label: "Delete", shortcut: "Del", danger: true, action: () => editor.deleteSelected() },
            "-",
            { label: "Bring to front", action: () => editor.bringToFront() },
            { label: "Bring forward", action: () => editor.bringForward() },
            { label: "Send backward", action: () => editor.sendBackward() },
            { label: "Send to back", action: () => editor.sendToBack() },
            "-",
            { label: "Flip horizontal", action: () => editor.updateSelected({ flipX: !editor.getSelected()[0].flipX }) },
            { label: "Flip vertical", action: () => editor.updateSelected({ flipY: !editor.getSelected()[0].flipY }) },
            {
              label: editor.getSelected().some((s) => s.locked) ? "Unlock" : "Lock",
              action: () => editor.toggleLock()
            }
          );
        } else {
          items.push(
            { label: "Paste", shortcut: "Ctrl+V", disabled: !editor.clipboard.length, action: () => editor.paste() },
            "-",
            { label: "Select all", shortcut: "Ctrl+A", action: () => editor.selectAll() }
          );
        }
        showMenu(editor, e.clientX, e.clientY, items);
      });
    }
  };

  // src/ui/topbar.js
  var RESIZE_PRESETS = [
    { group: "Social media", sizes: [
      { id: "social-square", label: "Square post", width: 1080, height: 1080 },
      { id: "social-portrait", label: "Portrait post (4:5)", width: 1080, height: 1350 },
      { id: "social-story", label: "Story / Reel (9:16)", width: 1080, height: 1920 },
      { id: "social-landscape", label: "Landscape post (16:9)", width: 1920, height: 1080 }
    ] },
    { group: "Print", sizes: [
      { id: "print-a5", label: "A5", width: 1748, height: 2480 },
      { id: "print-a4", label: "A4", width: 2480, height: 3508 },
      { id: "print-a3", label: "A3", width: 3508, height: 4961 },
      { id: "print-letter", label: "US Letter", width: 2550, height: 3300 },
      { id: "print-business-card", label: "Business card (3.5 \xD7 2 in)", width: 1050, height: 600 }
    ] },
    { group: "Presentation", sizes: [
      { id: "presentation-wide", label: "Widescreen (16:9)", width: 1920, height: 1080 },
      { id: "presentation-standard", label: "Standard (4:3)", width: 1024, height: 768 },
      { id: "presentation-wide-16-10", label: "Widescreen (16:10)", width: 1920, height: 1200 }
    ] }
  ];
  var Topbar = class {
    constructor(editor) {
      this.editor = editor;
      this.root = editor.topbarEl;
      this.render();
    }
    render() {
      const ed = this.editor;
      this.root.innerHTML = `
      <div class="ez-brand"><span class="ez-logo">E</span><span class="ez-brand-name">Ezyreka</span></div>
      <input class="ez-filename" value="${ed.fileName.replace(/"/g, "&quot;")}" spellcheck="false" />
      <button class="ez-btn ez-btn-ghost" data-act="resize" title="Resize current canvas" aria-haspopup="dialog">Resize</button>
      <div class="ez-topbar-group">
        <button class="ez-icon-btn" data-act="undo" title="Undo (Ctrl+Z)">${UI_ICONS.undo}</button>
        <button class="ez-icon-btn" data-act="redo" title="Redo (Ctrl+Shift+Z)">${UI_ICONS.redo}</button>
      </div>
      <div class="ez-topbar-group">
        <button class="ez-icon-btn" data-act="zoom-out" title="Zoom out (Ctrl+-)">${UI_ICONS["zoom-out"]}</button>
        <button class="ez-zoom-btn" data-act="zoom-menu">100%</button>
        <button class="ez-icon-btn" data-act="zoom-in" title="Zoom in (Ctrl++)">${UI_ICONS["zoom-in"]}</button>
        <button class="ez-icon-btn" data-act="zoom-fit" title="Fit to screen (Ctrl+0)">${UI_ICONS.fit}</button>
      </div>
      <div class="ez-topbar-spacer"></div>
      <button class="ez-icon-btn" data-act="theme" title="Switch theme (Ctrl+Shift+L)"></button>
      <button class="ez-btn ez-btn-ghost" data-act="open">Open</button>
      <button class="ez-btn ez-btn-ghost" data-act="save-json">Save</button>
      <button class="ez-btn ez-btn-primary" data-act="download">${UI_ICONS.download}<span>Download</span></button>
      <input type="file" class="ez-hidden" accept="application/json" data-role="open-input" />
    `;
      this.root.querySelector('[data-act="undo"]').onclick = () => ed.undo();
      this.root.querySelector('[data-act="resize"]').onclick = () => this.resizeDialog();
      this.root.querySelector('[data-act="redo"]').onclick = () => ed.redo();
      this.root.querySelector('[data-act="zoom-out"]').onclick = () => ed.setZoom(ed.zoom / 1.2);
      this.root.querySelector('[data-act="zoom-in"]').onclick = () => ed.setZoom(ed.zoom * 1.2);
      this.root.querySelector('[data-act="zoom-fit"]').onclick = () => ed.zoomFit();
      this.root.querySelector('[data-act="zoom-menu"]').onclick = (e) => this.zoomMenu(e);
      this.root.querySelector('[data-act="download"]').onclick = (e) => this.downloadMenu(e);
      this.root.querySelector('[data-act="save-json"]').onclick = () => ed.downloadJSON();
      const nameInput = this.root.querySelector(".ez-filename");
      nameInput.onchange = () => ed.setFileName(nameInput.value.trim() || "Untitled design");
      nameInput.onkeydown = (e) => {
        if (e.key === "Enter") nameInput.blur();
      };
      const openBtn = this.root.querySelector('[data-act="open"]');
      const openInput = this.root.querySelector('[data-role="open-input"]');
      openBtn.onclick = () => openInput.click();
      openInput.onchange = async () => {
        const file = openInput.files[0];
        if (!file) return;
        try {
          const json = JSON.parse(await file.text());
          ed.loadJSON(json);
        } catch (err) {
          alert("Invalid design file: " + err.message);
        }
        openInput.value = "";
      };
      this.root.querySelector('[data-act="theme"]').onclick = () => ed.toggleTheme();
      this._unsubs = [
        ed.on("theme", () => this.updateThemeIcon()),
        ed.on("zoom", () => this.updateZoomLabel()),
        ed.on("rename", (name) => {
          const input = this.root.querySelector(".ez-filename");
          if (input && document.activeElement !== input) input.value = name;
        })
      ];
      this.updateThemeIcon();
      this.updateZoomLabel();
    }
    destroy() {
      this._unsubs?.forEach((off) => off());
      this._unsubs = [];
    }
    updateZoomLabel() {
      const btn = this.root.querySelector('[data-act="zoom-menu"]');
      if (btn) btn.textContent = Math.round(this.editor.zoom * 100) + "%";
    }
    resizeDialog() {
      const ed = this.editor;
      closeMenus(ed);
      const page = ed.getPage();
      const titleId = uid("resize-title");
      const helpId = uid("resize-help");
      const presetHelpId = uid("resize-preset-help");
      const dialog = el("dialog", "ez-resize-dialog", ed.container);
      dialog.setAttribute("aria-labelledby", titleId);
      dialog.setAttribute("aria-describedby", helpId);
      dialog.innerHTML = `
      <form class="ez-resize-form">
        <h2 id="${titleId}">Resize canvas</h2>
        <p id="${helpId}">Resize the current page. Elements keep their size and position.</p>
        <fieldset class="ez-resize-presets" aria-describedby="${presetHelpId}">
          <legend>Size preset</legend>
          <div class="ez-resize-categories" aria-label="Preset categories"></div>
          <div class="ez-resize-gallery"></div>
          <label class="ez-resize-custom">
            <input type="radio" name="preset" value="custom" />
            <span>Custom size</span><span class="ez-resize-custom-hint">Set your own dimensions</span>
          </label>
        </fieldset>
        <p class="ez-resize-preset-help" id="${presetHelpId}" aria-live="polite"></p>
        <div class="ez-resize-fields">
          <label>Width (px)<input class="ez-input" name="width" type="number" min="1" max="10000" step="1" required /></label>
          <label>Height (px)<input class="ez-input" name="height" type="number" min="1" max="10000" step="1" required /></label>
        </div>
        <p class="ez-resize-limit">Enter whole numbers from 1 to 10,000 pixels.</p>
        <div class="ez-resize-actions">
          <button class="ez-btn ez-btn-ghost" type="button" data-act="cancel">Cancel</button>
          <button class="ez-btn ez-btn-primary" type="submit">Resize canvas</button>
        </div>
      </form>
    `;
      const form = dialog.querySelector("form");
      const gallery = dialog.querySelector(".ez-resize-gallery");
      const categories = dialog.querySelector(".ez-resize-categories");
      const presetHelp = dialog.querySelector(".ez-resize-preset-help");
      const width = form.elements.namedItem("width");
      const height = form.elements.namedItem("height");
      width.value = page.width;
      height.value = page.height;
      const sizes = RESIZE_PRESETS.flatMap((group) => group.sizes);
      const categoryButtons = [];
      const presetGroups = [];
      const showCategory = (index) => {
        categoryButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
        presetGroups.forEach((group, i) => {
          group.hidden = i !== index;
        });
        gallery.scrollTop = 0;
      };
      for (const [index, group] of RESIZE_PRESETS.entries()) {
        const category = el("button", "ez-resize-category", categories);
        category.type = "button";
        category.textContent = group.group;
        category.onclick = () => showCategory(index);
        categoryButtons.push(category);
        const grid = el("div", "ez-resize-grid", gallery);
        grid.setAttribute("role", "group");
        grid.setAttribute("aria-label", group.group);
        presetGroups.push(grid);
        for (const size of group.sizes) {
          const card = el("label", "ez-resize-card", grid);
          const scale = 72 / Math.max(size.width, size.height);
          card.innerHTML = `
          <input type="radio" name="preset" value="${size.id}" />
          <span class="ez-resize-thumbnail ez-resize-art-${index}" aria-hidden="true">
            <span class="ez-resize-paper" style="width:${size.width * scale}px;height:${size.height * scale}px">
              <span class="ez-resize-art-orb"></span><span class="ez-resize-art-block"></span>
              <span class="ez-resize-art-line"></span>
            </span>
            <span class="ez-resize-check">\u2713</span>
          </span>
          <span class="ez-resize-card-name">${size.label}</span>
          <span class="ez-resize-card-size">${size.width} \xD7 ${size.height} px</span>
        `;
        }
      }
      const preset = form.elements.namedItem("preset");
      const updatePresetHelp = () => {
        const selected = sizes.find((size) => size.id === preset.value);
        presetHelp.textContent = preset.value.startsWith("print-") ? `${selected.label} selected. Print sizes use 300 pixels per inch, without bleed.` : selected ? `${selected.label} selected. You can also adjust the dimensions below.` : "Custom size selected. Enter your own dimensions below.";
      };
      preset.value = sizes.find((size) => size.width === page.width && size.height === page.height)?.id || "custom";
      showCategory(Math.max(0, RESIZE_PRESETS.findIndex((group) => group.sizes.some((size) => size.id === preset.value))));
      dialog.querySelector(".ez-resize-presets").addEventListener("change", () => {
        const size = sizes.find((size2) => size2.id === preset.value);
        if (size) {
          width.value = size.width;
          height.value = size.height;
        }
        updatePresetHelp();
        if (!size) width.focus();
      });
      const useCustomSize = () => {
        preset.value = "custom";
        updatePresetHelp();
      };
      width.addEventListener("input", useCustomSize);
      height.addEventListener("input", useCustomSize);
      updatePresetHelp();
      dialog.querySelector('[data-act="cancel"]').onclick = () => dialog.close();
      dialog.addEventListener("keydown", (e) => e.stopPropagation());
      dialog.addEventListener("close", () => {
        dialog.remove();
        this.root.querySelector('[data-act="resize"]').focus();
      });
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        if (ed.getPage() !== page) {
          dialog.close();
          return;
        }
        ed.resizeCanvas(width.valueAsNumber, height.valueAsNumber);
        dialog.close();
      };
      dialog.showModal();
      form.querySelector('input[name="preset"]:checked').focus();
    }
    updateThemeIcon() {
      const btn = this.root.querySelector('[data-act="theme"]');
      if (!btn) return;
      const dark = this.editor.theme === "dark";
      btn.innerHTML = dark ? UI_ICONS.sun : UI_ICONS.moon;
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
    zoomMenu(e) {
      const btn = e.currentTarget;
      const r = btn.getBoundingClientRect();
      showMenu(this.editor, r.left, r.bottom + 4, [
        { label: "Fit to screen", action: () => this.editor.zoomFit() },
        { label: "100%", action: () => this.editor.setZoom(1) },
        "-",
        { label: "50%", action: () => this.editor.setZoom(0.5) },
        { label: "75%", action: () => this.editor.setZoom(0.75) },
        { label: "150%", action: () => this.editor.setZoom(1.5) },
        { label: "200%", action: () => this.editor.setZoom(2) }
      ]);
    }
    downloadMenu(e) {
      const btn = e.currentTarget;
      const r = btn.getBoundingClientRect();
      showMenu(this.editor, r.right - 190, r.bottom + 4, [
        { label: "PNG image", action: () => this.editor.exportImage("png", { scale: 2 }) },
        { label: "JPG image", action: () => this.editor.exportImage("jpeg", { scale: 2 }) },
        { label: "PNG (transparent)", action: () => this.editor.exportImage("png", { scale: 2, transparent: true }) },
        { label: "PNG at 4x", action: () => this.editor.exportImage("png", { scale: 4 }) },
        "-",
        { label: "Design file (.json)", action: () => this.editor.downloadJSON() }
      ]);
    }
  };

  // src/ui/chartpanel.js
  var ChartPanel = class {
    constructor(sidepanel) {
      this.sidepanel = sidepanel;
      this.editor = sidepanel.editor;
      this.bindings = [];
      this.gallery = false;
      this.key = null;
      this._unsubs = ["selection", "change", "page"].map((event) => this.editor.on(event, () => {
        const target = this.target();
        if (event === "page" || target?.id !== this.lastId) this.gallery = false;
        this.lastId = target?.id;
        this.refresh();
      }));
    }
    destroy() {
      this._unsubs?.forEach((off) => off());
      this._unsubs = [];
    }
    target(id) {
      const selection = this.editor.getSelected();
      return selection.length === 1 && selection[0].type === "chart" && (!id || selection[0].id === id) ? selection[0] : null;
    }
    open() {
      if (!this.target()) return;
      this.gallery = false;
      this.key = null;
      this.sidepanel.setTab("charts");
      this.refresh();
    }
    refresh() {
      if (this.dialog) {
        const target = this.target(this.dialogId);
        if (!target || target.hidden) this.dialog.close();
        else {
          const key = `${target.id}:${target.locked}:${target.chart.categories.length}:${target.chart.series.length}`;
          if (key !== this.dialogKey) {
            this.dialogKey = key;
            this.renderModalTable();
          }
        }
      }
      if (this.sidepanel.activeTab === "charts") {
        const target = this.target();
        const key = this.gallery || !target ? "gallery" : `${target.id}:${target.locked}:${target.chart.type}:${target.chart.categories.length}:${target.chart.series.length}`;
        if (key !== this.key) this.render();
      }
      this.bindings = this.bindings.filter((binding) => binding.input.isConnected);
      for (const { input, id, read } of this.bindings) {
        const target = this.target(id);
        if (!target || input === document.activeElement) continue;
        if (input.type === "checkbox") input.checked = !!read(target.chart);
        else input.value = read(target.chart) ?? "";
        input.removeAttribute("aria-invalid");
      }
    }
    button(parent, label2, action, className = "ez-btn ez-btn-ghost") {
      const button = el("button", className, parent);
      button.type = "button";
      button.textContent = label2;
      button.onclick = action;
      return button;
    }
    error(message) {
      const root = this.dialog || this.sidepanel.contentEl;
      const error = root.querySelector(".ez-chart-error");
      if (error) {
        error.textContent = message;
        error.hidden = !message;
      }
    }
    apply(id, mutate, control) {
      const target = this.target(id);
      if (!target || target.locked) return;
      try {
        const registry = this.editor.registry;
        const next = normalizeChart(target.chart, registry);
        const result = normalizeChart(mutate(next) || next, registry);
        validateChart(result, registry);
        control?.removeAttribute("aria-invalid");
        const binding = this.bindings.find((b) => b.input === control);
        if (binding) {
          if (control.type === "checkbox") control.checked = !!binding.read(result);
          else control.value = binding.read(result) ?? "";
        }
        this.error("");
        if (JSON.stringify(result) !== JSON.stringify(target.chart)) this.editor.updateSelected({ chart: result });
      } catch (error) {
        if (control?.tagName === "SELECT") {
          const binding = this.bindings.find((b) => b.input === control);
          if (binding) control.value = binding.read(target.chart);
        }
        control?.setAttribute("aria-invalid", "true");
        this.error(error.message);
      }
    }
    bind(input, target, read, write) {
      input.disabled = !!target.locked;
      if (input.type === "checkbox") input.checked = !!read(target.chart);
      else input.value = read(target.chart) ?? "";
      input.onchange = () => this.apply(target.id, (chart) => write(chart, input), input);
      this.bindings.push({ input, id: target.id, read });
    }
    render() {
      const root = this.sidepanel.contentEl;
      root.innerHTML = "";
      this.bindings = this.bindings.filter((binding) => binding.input.isConnected);
      const target = this.target();
      if (this.gallery || !target) {
        this.key = "gallery";
        this.renderGallery(root);
        return;
      }
      this.key = `${target.id}:${target.locked}:${target.chart.type}:${target.chart.categories.length}:${target.chart.series.length}`;
      this.sidepanel.panelHeader("Charts", "Edit your chart with data, labels, and colors.");
      this.button(root, "Back to charts", () => {
        this.gallery = true;
        this.render();
      }, "ez-btn ez-btn-ghost ez-panel-action");
      if (target.locked) el("p", "ez-chart-note", root).textContent = "This chart is locked. Unlock it in Layers to edit.";
      const error = el("p", "ez-chart-error", root);
      error.setAttribute("role", "alert");
      error.hidden = true;
      const tabs = el("div", "ez-panel-filters ez-chart-editor-tabs", root);
      for (const tab of ["Data", "Style"]) {
        const active = (this.section || "Data") === tab;
        const button = this.button(tabs, tab, () => {
          this.section = tab;
          this.render();
        }, "ez-panel-filter");
        button.classList.toggle("ez-active", active);
        button.setAttribute("aria-pressed", String(active));
      }
      if (this.section === "Style") this.renderStyle(root, target);
      else {
        el("p", "ez-chart-note", root).textContent = "Edit cells or paste a table from a spreadsheet. Paste into the Category header to include column headers.";
        this.renderTable(root, target);
        this.button(root, "Expand data table", () => this.expand(), "ez-btn ez-btn-ghost ez-chart-expand");
      }
    }
    renderGallery(root) {
      this.sidepanel.panelHeader("Charts", "Choose a chart, then make it yours with data and colors.");
      if (this.target()) this.button(root, "Edit selected chart", () => this.open(), "ez-btn ez-btn-ghost ez-panel-action");
      const presets = chartPresetList(this.editor.registry);
      for (const group of [...new Set(presets.map((p) => p.group))]) {
        this.sidepanel.sectionTitle(group, root);
        const grid = el("div", "ez-chart-gallery", root);
        for (const preset of presets.filter((p) => p.group === group)) {
          const button = this.button(grid, "", () => {
            const item = this.editor.addElement({ type: "chart", chart: sampleChart(preset.type, this.editor.registry) });
            this.editor.select([item.id]);
            this.section = "Data";
            this.open();
          }, "ez-panel-card ez-chart-card");
          button.setAttribute("aria-label", `Add ${preset.label} chart`);
          const canvas = el("canvas", "", button);
          canvas.width = 240;
          canvas.height = 170;
          canvas.setAttribute("aria-hidden", "true");
          const chart = sampleChart(preset.type, this.editor.registry);
          Object.assign(chart, { showAxes: false, showGrid: false, showLegend: false });
          drawChart(canvas.getContext("2d"), { chart, w: canvas.width, h: canvas.height }, this.editor.registry);
          el("span", "", button).textContent = preset.label;
        }
      }
    }
    renderTable(root, target) {
      const wrap = el("div", "ez-chart-table-wrap", root);
      const table = el("table", "ez-chart-table", wrap);
      table.setAttribute("aria-label", "Chart data");
      const head = el("thead", "", table), header = el("tr", "", head);
      const cell = (parent, row, column, read, write) => {
        const container = el(row === 0 ? "th" : "td", "", parent);
        if (row === 0) container.scope = "col";
        const input = el("input", "ez-input", container);
        input.type = "text";
        if (row > 0 && column > 0) input.inputMode = "decimal";
        input.dataset.row = row;
        input.dataset.column = column;
        input.setAttribute("aria-label", row === 0 ? column === 0 ? "Category header, paste table here" : `Series ${column} name` : column === 0 ? `Category ${row}` : `Row ${row}, series ${column} value`);
        this.bind(input, target, read, write);
        if (row === 0 && column === 0) input.readOnly = true;
        input.onpaste = (e) => {
          if (this.target(target.id)?.locked) return;
          const text3 = e.clipboardData?.getData("text/plain");
          if (text3 === void 0) return;
          e.preventDefault();
          this.apply(target.id, (chart) => pasteChartData(chart, text3, row, column, this.editor.registry), input);
        };
        return container;
      };
      cell(header, 0, 0, () => "Category", () => {
      });
      target.chart.series.forEach((s, i) => {
        const th = cell(header, 0, i + 1, (c) => c.series[i]?.name, (c, input) => {
          c.series[i].name = input.value;
        });
        const remove = this.button(th, "Remove", () => this.apply(target.id, (c) => {
          c.series.splice(i, 1);
        }), "ez-chart-remove");
        remove.setAttribute("aria-label", `Remove series ${i + 1}`);
        remove.disabled = !!target.locked;
      });
      el("th", "", header).textContent = "";
      const body = el("tbody", "", table);
      target.chart.categories.forEach((label2, i) => {
        const row = el("tr", "", body);
        cell(row, i + 1, 0, (c) => c.categories[i], (c, input) => {
          c.categories[i] = input.value;
        });
        target.chart.series.forEach((s, j) => cell(row, i + 1, j + 1, (c) => c.series[j]?.values[i], (c, input) => {
          c.series[j].values[i] = parseChartValue(input.value);
        }));
        const remove = this.button(el("td", "", row), "Remove", () => this.apply(target.id, (c) => {
          c.categories.splice(i, 1);
          c.categoryColors.splice(i, 1);
          c.series.forEach((s) => s.values.splice(i, 1));
        }), "ez-chart-remove");
        remove.setAttribute("aria-label", `Remove category ${i + 1}`);
        remove.disabled = !!target.locked;
      });
      const actions = el("div", "ez-chart-data-actions", root);
      this.button(actions, "Add row", () => this.apply(target.id, (c) => {
        c.categoryColors.push(chartColor(c.categories.length));
        c.categories.push(`Item ${c.categories.length + 1}`);
        c.series.forEach((s) => s.values.push(null));
      })).disabled = !!target.locked;
      this.button(actions, "Add series", () => this.apply(target.id, (c) => {
        c.series.push({ name: `Series ${c.series.length + 1}`, color: chartColor(c.series.length), values: c.categories.map(() => null) });
      })).disabled = !!target.locked;
    }
    renderStyle(root, target) {
      const chart = target.chart;
      const field = (label2, type2, read, write) => {
        const wrap = el("label", "ez-chart-style-field", root);
        el("span", "", wrap).textContent = label2;
        const input = el(type2 === "select" ? "select" : "input", "ez-input", wrap);
        if (type2 !== "select") input.type = type2;
        input.setAttribute("aria-label", label2);
        this.bind(input, target, read, write);
        return input;
      };
      const type = field("Chart type", "select", (c) => c.type, (c, input) => {
        c.type = input.value;
      });
      chartPresetList(this.editor.registry).forEach((p) => {
        const option = el("option", "", type);
        option.value = p.type;
        option.textContent = p.label;
      });
      type.value = chart.type;
      if (!isMultiSeriesChart(chart.type, this.editor.registry) && chart.series.length > 1) {
        el("p", "ez-chart-note", root).textContent = "This chart displays the first series. Additional series are kept when switching chart types.";
      }
      field("Title", "text", (c) => c.title, (c, input) => {
        c.title = input.value;
      });
      for (const [key, label2] of [["showLegend", "Legend"], ["showValues", "Value labels"], ...!isCircularChart(chart.type, this.editor.registry) ? [["showAxes", "Axes"], ["showGrid", "Gridlines"]] : []]) {
        field(label2, "checkbox", (c) => c[key], (c, input) => {
          c[key] = input.checked;
        });
      }
      const size = field("Text size", "number", (c) => c.fontSize, (c, input) => {
        if (!Number.isFinite(input.valueAsNumber) || input.valueAsNumber < 8 || input.valueAsNumber > 72) throw new Error("Text size must be from 8 to 72 pixels.");
        c.fontSize = input.valueAsNumber;
      });
      size.min = 8;
      size.max = 72;
      field("Text color", "color", (c) => c.textColor, (c, input) => {
        c.textColor = input.value;
      });
      if (isCircularChart(chart.type, this.editor.registry)) chart.categories.forEach((name, i) => {
        field(`${name || `Category ${i + 1}`} color`, "color", (c) => c.categoryColors[i], (c, input) => {
          c.categoryColors[i] = input.value;
        });
      });
      else (isMultiSeriesChart(chart.type, this.editor.registry) ? chart.series : chart.series.slice(0, 1)).forEach((s, i) => {
        field(`${s.name || `Series ${i + 1}`} color`, "color", (c) => c.series[i]?.color, (c, input) => {
          c.series[i].color = input.value;
        });
      });
    }
    expand() {
      const target = this.target();
      if (!target || this.dialog) return;
      const dialog = el("dialog", "ez-chart-dialog", this.editor.container);
      this.dialog = dialog;
      this.dialogId = target.id;
      const title = el("h2", "", dialog);
      title.id = uid("chart-data");
      title.textContent = "Chart data";
      dialog.setAttribute("aria-labelledby", title.id);
      const error = el("p", "ez-chart-error", dialog);
      error.setAttribute("role", "alert");
      error.hidden = true;
      this.modalTable = el("div", "", dialog);
      this.button(dialog, "Done", () => dialog.close(), "ez-btn ez-btn-primary ez-chart-done");
      dialog.addEventListener("keydown", (e) => e.stopPropagation());
      dialog.addEventListener("close", () => {
        dialog.remove();
        this.dialog = null;
        this.dialogKey = null;
        this.refresh();
        this.sidepanel.contentEl.querySelector(".ez-chart-expand")?.focus();
      });
      this.renderModalTable();
      dialog.showModal();
    }
    renderModalTable() {
      const target = this.target(this.dialogId);
      if (!target) return;
      this.dialogKey = `${target.id}:${target.locked}:${target.chart.categories.length}:${target.chart.series.length}`;
      this.modalTable.innerHTML = "";
      this.bindings = this.bindings.filter((binding) => binding.input.isConnected);
      this.renderTable(this.modalTable, target);
    }
  };

  // src/ui/colorfield.js
  function colorField(parent, { title = "Color", value = "#000000", onInput, onCommit, bare = false } = {}) {
    const group = bare ? parent : el("span", "ez-color-field", parent);
    const wrap = el(bare ? "span" : "label", "ez-color-wrap", group);
    wrap.title = title;
    const input = el("input", "ez-color-input", wrap);
    input.type = "color";
    input.setAttribute("aria-label", title);
    const hex = el("input", "ez-input ez-hex-input", group);
    hex.type = "text";
    hex.spellcheck = false;
    hex.maxLength = 7;
    hex.placeholder = "#hex";
    hex.setAttribute("aria-label", `${title} hex value`);
    let current = normalizeHexColor(value) || "#000000";
    const apply = (next) => {
      current = normalizeHexColor(next) || current;
      wrap.style.backgroundColor = current;
      if (document.activeElement !== input) input.value = current;
      if (document.activeElement !== hex) hex.value = current;
    };
    input.addEventListener("input", () => {
      current = input.value;
      wrap.style.backgroundColor = current;
      if (document.activeElement !== hex) hex.value = current;
      onInput?.(current);
    });
    input.addEventListener("change", () => onCommit?.());
    hex.addEventListener("input", () => {
      const normalized = normalizeHexColor(hex.value.trim());
      if (normalized) {
        current = normalized;
        wrap.style.backgroundColor = current;
        if (document.activeElement !== input) input.value = normalized;
        onInput?.(normalized);
      }
    });
    hex.addEventListener("change", () => {
      hex.value = current;
      onCommit?.();
    });
    apply(value);
    return {
      group,
      wrap,
      input,
      hex,
      set: apply,
      get value() {
        return current;
      },
      set value(next) {
        apply(next);
      }
    };
  }

  // src/ui/sidepanel.js
  function normalizePalette(palette) {
    if (!Array.isArray(palette)) return [];
    const flat = palette.filter((entry) => typeof entry === "string");
    const groups = palette.filter((entry) => entry && Array.isArray(entry.colors));
    if (groups.length) return groups;
    return flat.length ? [{ colors: flat }] : [];
  }
  var BUILTIN_TABS = [
    { id: "templates", label: "Templates", icon: UI_ICONS.templates },
    { id: "elements", label: "Elements", icon: UI_ICONS.shapes },
    { id: "text", label: "Text", icon: UI_ICONS.text },
    { id: "charts", label: "Charts", icon: UI_ICONS.chart },
    { id: "uploads", label: "Uploads", icon: UI_ICONS.upload },
    { id: "background", label: "Background", icon: UI_ICONS.palette },
    { id: "layers", label: "Layers", icon: UI_ICONS.layers }
  ];
  var Sidepanel = class {
    constructor(editor) {
      this.editor = editor;
      this.tabsEl = editor.sidepanelEl.querySelector(".ez-sidepanel-tabs");
      this.contentEl = editor.sidepanelEl.querySelector(".ez-sidepanel-content");
      this.contentEl.id = uid("panel");
      this.contentEl.setAttribute("role", "tabpanel");
      this.tabsEl.setAttribute("role", "tablist");
      this.tabsEl.setAttribute("aria-label", "Design tools");
      this.tabsEl.setAttribute("aria-orientation", "vertical");
      this.collapsed = false;
      this.collapseBtn = el("button", "ez-sidepanel-toggle", editor.sidepanelEl.querySelector(".ez-sidepanel-rail"));
      this.tabsEl.before(this.collapseBtn);
      this.collapseBtn.type = "button";
      this.collapseBtn.innerHTML = UI_ICONS.chevron;
      this.collapseBtn.setAttribute("aria-controls", this.contentEl.id);
      this.collapseBtn.onclick = () => this.setCollapsed(!this.collapsed);
      this.collapseBtn.onkeydown = (e) => {
        if (e.key === " ") e.stopPropagation();
      };
      this.activeTab = "elements";
      this.tabs = [...BUILTIN_TABS];
      this._tabCleanup = null;
      this.renderTabs();
      this.setTab("elements");
      this.charts = new ChartPanel(this);
      const pending = editor._pendingPanels || [];
      editor._pendingPanels = [];
      for (const panel of pending) this.registerPanel(panel);
      this._unsubs = [
        editor.on("selection", () => {
          if (this.activeTab === "layers") this.renderLayers();
        }),
        editor.on("change", () => {
          if (this.activeTab === "layers") this.renderLayers();
          if (this.activeTab === "background") this.syncBackgroundControls?.();
        }),
        editor.on("upload", () => {
          if (this.activeTab === "uploads") this.renderUploads();
        }),
        editor.on("page", () => {
          if (this.activeTab === "background") this.renderBackground();
          if (this.activeTab === "layers") this.renderLayers();
        })
      ];
    }
    destroy() {
      this._runTabCleanup();
      this._unsubs?.forEach((off) => off());
      this._unsubs = [];
    }
    // Custom panel renders may return a cleanup function; it runs before the
    // content is cleared on rerender, tab replacement and destruction.
    _runTabCleanup() {
      const cleanup = this._tabCleanup;
      this._tabCleanup = null;
      if (typeof cleanup === "function") {
        try {
          cleanup();
        } catch (error) {
          console.warn("ezyreka: panel cleanup failed:", error);
        }
      }
    }
    renderTabs() {
      this.tabsEl.innerHTML = "";
      for (const tab of this.tabs) {
        const btn = el("button", "ez-tab-btn" + (tab.id === this.activeTab ? " ez-active" : ""), this.tabsEl);
        btn.type = "button";
        btn.id = `${this.contentEl.id}-${tab.id}`;
        btn.dataset.tab = tab.id;
        btn.title = tab.label;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-label", tab.label);
        btn.setAttribute("aria-controls", this.contentEl.id);
        btn.innerHTML = `${tab.icon}<span>${tab.label}</span>`;
        btn.onclick = () => {
          if (tab.id === this.activeTab && !this.collapsed) this.setCollapsed(true);
          else this.setTab(tab.id);
        };
        btn.onkeydown = (e) => {
          if (e.key === " ") e.stopPropagation();
          const index = this.tabs.indexOf(tab);
          const next = e.key === "ArrowDown" ? (index + 1) % this.tabs.length : e.key === "ArrowUp" ? (index + this.tabs.length - 1) % this.tabs.length : e.key === "Home" ? 0 : e.key === "End" ? this.tabs.length - 1 : null;
          if (next === null) return;
          e.preventDefault();
          e.stopPropagation();
          this.setTab(this.tabs[next].id);
          this.tabsEl.children[next].focus();
        };
      }
    }
    setTab(id) {
      const tab = this.tabs.find((t) => t.id === id);
      if (!tab) return;
      const alreadyRendered = this.activeTab === id && this.contentEl.hasChildNodes();
      this.activeTab = id;
      this.setCollapsed(false);
      this.contentEl.setAttribute("aria-labelledby", `${this.contentEl.id}-${id}`);
      if (alreadyRendered) return;
      this._runTabCleanup();
      this.contentEl.innerHTML = "";
      this.contentEl.scrollTop = 0;
      if (typeof tab.render === "function") {
        const cleanup = tab.render(this.contentEl, this.editor);
        if (typeof cleanup === "function") this._tabCleanup = cleanup;
        return;
      }
      ({
        templates: () => this.renderTemplates(),
        elements: () => this.renderElements(),
        text: () => this.renderText(),
        charts: () => this.charts.render(),
        uploads: () => this.renderUploads(),
        background: () => this.renderBackground(),
        layers: () => this.renderLayers()
      })[id]?.();
    }
    registerPanel(panel) {
      if (!panel || typeof panel.id !== "string" || typeof panel.render !== "function") {
        throw new Error("ezyreka: panels need { id, label, icon, render(contentEl, editor) }");
      }
      if (this.tabs.some((t) => t.id === panel.id)) {
        throw new Error(`ezyreka: panel "${panel.id}" already exists`);
      }
      this.tabs.push({
        id: panel.id,
        label: panel.label || panel.id,
        icon: panel.icon || UI_ICONS.shapes,
        render: panel.render
      });
      this.renderTabs();
      return panel;
    }
    // Rebuilds the active tab, e.g. after registering templates, fonts or icons.
    rerender() {
      this._runTabCleanup();
      this.contentEl.innerHTML = "";
      this.setTab(this.activeTab);
    }
    setCollapsed(collapsed) {
      this.collapsed = collapsed;
      this.editor.sidepanelEl.classList.toggle("ez-collapsed", collapsed);
      if (collapsed && this.contentEl.contains(document.activeElement)) this.collapseBtn.focus();
      this.contentEl.hidden = collapsed;
      const label2 = collapsed ? "Expand sidebar" : "Collapse sidebar";
      this.collapseBtn.title = label2;
      this.collapseBtn.setAttribute("aria-label", label2);
      this.collapseBtn.setAttribute("aria-expanded", String(!collapsed));
      for (const btn of this.tabsEl.children) {
        const active = btn.dataset.tab === this.activeTab;
        btn.classList.toggle("ez-active", active);
        btn.setAttribute("aria-selected", String(active));
        btn.setAttribute("aria-expanded", String(active && !collapsed));
        btn.tabIndex = active ? 0 : -1;
      }
      this.editor.markDirty();
    }
    panelHeader(title, description) {
      const header = el("header", "ez-panel-header", this.contentEl);
      el("h2", "ez-panel-heading", header).textContent = title;
      el("p", "ez-panel-description", header).textContent = description;
      return header;
    }
    sectionTitle(text3, parent = this.contentEl) {
      const t = el("h3", "ez-panel-title", parent);
      t.textContent = text3;
      return t;
    }
    renderTemplates() {
      this.panelHeader("Templates", "Find your starting point. Make every detail yours.");
      const search = el("input", "ez-input ez-panel-search ez-template-search", this.contentEl);
      search.type = "search";
      search.placeholder = "Search templates\u2026";
      search.setAttribute("aria-label", "Search templates");
      search.value = this.templateQuery || "";
      const filters = el("div", "ez-panel-filters ez-template-filters", this.contentEl);
      filters.setAttribute("role", "group");
      filters.setAttribute("aria-label", "Template categories");
      const categories = ["All", ...new Set(this.editor.registry.templates.map((tpl) => tpl.category))];
      for (const category of categories) {
        const button = el("button", "ez-panel-filter ez-template-filter", filters);
        button.type = "button";
        button.textContent = category;
        button.onclick = () => {
          this.templateCategory = category;
          update();
        };
      }
      const count = el("div", "ez-panel-count ez-template-count", this.contentEl);
      count.setAttribute("role", "status");
      const grid = el("div", "ez-template-grid", this.contentEl);
      const update = () => {
        const category = this.templateCategory || "All";
        const query = (this.templateQuery || "").trim().toLowerCase();
        for (const button of filters.children) {
          const active = button.textContent === category;
          button.classList.toggle("ez-active", active);
          button.setAttribute("aria-pressed", String(active));
        }
        const matches = this.editor.registry.templates.filter(
          (tpl) => (category === "All" || tpl.category === category) && `${tpl.name} ${tpl.category} ${tpl.format}`.toLowerCase().includes(query)
        );
        count.textContent = `${matches.length} editable ${matches.length === 1 ? "template" : "templates"}`;
        grid.innerHTML = "";
        if (!matches.length) {
          const empty = el("p", "ez-empty ez-template-empty", grid);
          empty.textContent = "No templates found. Try another search or category.";
        }
        for (const tpl of matches) {
          const card = el("button", "ez-panel-card ez-template-card", grid);
          card.type = "button";
          card.setAttribute("aria-label", `Use ${tpl.name}, ${tpl.format}, ${tpl.page.width} by ${tpl.page.height} pixels`);
          const preview = el("div", "ez-template-preview", card);
          const canvas = document.createElement("canvas");
          const pw = tpl.page.width;
          const ph = tpl.page.height;
          const scale = 380 / Math.max(pw, ph);
          canvas.width = Math.round(pw * scale);
          canvas.height = Math.round(ph * scale);
          canvas.setAttribute("aria-hidden", "true");
          const ctx = canvas.getContext("2d");
          ctx.scale(scale, scale);
          renderPage(ctx, { ...tpl.page, elements: tpl.page.elements.map((e) => createElement(e.type, e, this.editor.registry)) }, { registry: this.editor.registry });
          preview.appendChild(canvas);
          const label2 = el("div", "ez-template-name", card);
          label2.textContent = tpl.name;
          const meta = el("div", "ez-template-meta", card);
          meta.textContent = `${tpl.format} \xB7 ${pw} \xD7 ${ph}`;
          card.onclick = () => this.editor.applyTemplate(tpl);
        }
      };
      search.addEventListener("input", () => {
        this.templateQuery = search.value;
        update();
      });
      update();
    }
    renderElements() {
      this.panelHeader("Elements", "Add shapes and icons to make your design yours.");
      const search = el("input", "ez-input ez-panel-search ez-elements-search", this.contentEl);
      search.type = "search";
      search.placeholder = "Search shapes & icons";
      search.setAttribute("aria-label", "Search shapes and icons");
      search.value = this.elementQuery || "";
      const filters = el("div", "ez-panel-filters ez-element-filters", this.contentEl);
      filters.setAttribute("role", "group");
      filters.setAttribute("aria-label", "Element types");
      for (const category of ["All", "Shapes", "Icons"]) {
        const button = el("button", "ez-panel-filter ez-element-filter", filters);
        button.type = "button";
        button.textContent = category;
        button.onclick = () => {
          this.elementCategory = category;
          update();
        };
      }
      const count = el("div", "ez-panel-count ez-element-count", this.contentEl);
      count.setAttribute("role", "status");
      const results = el("div", "ez-element-results", this.contentEl);
      const addCard = (grid, label2, svg, props) => {
        const button = el("button", "ez-panel-card ez-element-btn", grid);
        button.type = "button";
        button.title = label2;
        button.setAttribute("aria-label", `Add ${label2}`);
        button.innerHTML = svg;
        const caption = el("span", "ez-element-label", button);
        caption.textContent = label2;
        button.onclick = () => {
          const added = this.editor.addElement(props);
          this.editor.select([added.id]);
        };
      };
      const update = () => {
        const category = this.elementCategory || "All";
        const query = (this.elementQuery || "").trim().toLowerCase();
        const style = this.elementIconStyle || "solid";
        for (const button of filters.children) {
          const active = button.textContent === category;
          button.classList.toggle("ez-active", active);
          button.setAttribute("aria-pressed", String(active));
        }
        const shapes = category === "Icons" ? [] : this.editor.registry.shapes.filter((shape) => shape.label.toLowerCase().includes(query));
        const icons = category === "Shapes" ? [] : Object.keys(this.editor.registry.icons).filter((name) => name.replace(/-/g, " ").includes(query));
        const total = shapes.length + icons.length;
        count.textContent = `${total} ${total === 1 ? "element" : "elements"}`;
        results.innerHTML = "";
        if (!total) {
          const empty = el("p", "ez-empty", results);
          empty.textContent = "No elements found. Try another search or filter.";
        }
        if (shapes.length) {
          this.sectionTitle("Shapes", results);
          const grid = el("div", "ez-element-grid", results);
          for (const shape of shapes) {
            addCard(
              grid,
              shape.label,
              `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" focusable="false">${shape.svg}</svg>`,
              { type: shape.type, ...shape.props || {} }
            );
          }
        }
        if (icons.length) {
          const heading = el("div", "ez-element-heading", results);
          this.sectionTitle("Icons", heading);
          const styles = el("div", "ez-icon-styles", heading);
          styles.setAttribute("role", "group");
          styles.setAttribute("aria-label", "Icon style");
          for (const variant of ["solid", "outline"]) {
            const button = el("button", "ez-icon-style" + (style === variant ? " ez-active" : ""), styles);
            button.type = "button";
            button.textContent = variant === "solid" ? "Solid" : "Outline";
            button.setAttribute("aria-pressed", String(style === variant));
            button.onclick = () => {
              this.elementIconStyle = variant;
              update();
              results.querySelector(`.ez-icon-style.ez-active`).focus({ preventScroll: true });
            };
          }
          const grid = el("div", "ez-element-grid", results);
          for (const name of icons) {
            const label2 = name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
            const attrs = style === "outline" ? 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"' : 'fill="currentColor" fill-rule="evenodd"';
            addCard(
              grid,
              label2,
              `<svg viewBox="0 0 24 24" ${attrs} aria-hidden="true" focusable="false"><path d="${style === "outline" ? this.editor.registry.iconOutlines[name] : this.editor.registry.icons[name]}" /></svg>`,
              { type: "icon", icon: name, iconStyle: style, w: 160, h: 160 }
            );
          }
        }
      };
      search.addEventListener("input", () => {
        this.elementQuery = search.value;
        update();
      });
      update();
    }
    renderText() {
      this.panelHeader("Text", "Add text, then choose a font for your selection.");
      this.sectionTitle("Default text styles");
      const presets = [
        { label: "Add a heading", size: 72, weight: 700, h: 100 },
        { label: "Add a subheading", size: 40, weight: 600, h: 60 },
        { label: "Add body text", size: 24, weight: 400, h: 40 }
      ];
      const styles = el("div", "ez-text-presets", this.contentEl);
      for (const p of presets) {
        const btn = el("button", "ez-panel-card ez-text-preset", styles);
        btn.type = "button";
        btn.style.fontSize = Math.max(14, p.size / 3) + "px";
        btn.style.fontWeight = p.weight;
        btn.textContent = p.label;
        btn.onclick = () => {
          const el2 = this.editor.addText({
            text: p.label.replace("Add a ", "").replace("Add ", ""),
            fontSize: p.size,
            fontWeight: p.weight,
            h: p.h
          });
          this.editor.select([el2.id]);
        };
      }
      this.sectionTitle("Fonts (apply to selection)");
      const fontList = el("div", "ez-font-list", this.contentEl);
      for (const font of this.editor.registry.fonts) {
        const btn = el("button", "ez-panel-card ez-font-item", fontList);
        btn.type = "button";
        btn.style.fontFamily = font;
        btn.textContent = font;
        btn.onclick = () => {
          const sel = this.editor.getSelected().filter((s) => s.type === "text");
          if (sel.length) this.editor.updateSelected({ fontFamily: font });
        };
      }
    }
    renderUploads() {
      const ed = this.editor;
      const scrollTop = this.contentEl.scrollTop;
      this.contentEl.innerHTML = "";
      this.panelHeader("Uploads", "Upload images or drag and drop them onto the canvas.");
      const btn = el("button", "ez-upload-btn", this.contentEl);
      btn.type = "button";
      btn.innerHTML = `${UI_ICONS.upload}<span>Upload an image</span>`;
      btn.onclick = () => ed.openFilePicker();
      this.sectionTitle("Recent uploads");
      const grid = el("div", "ez-upload-grid", this.contentEl);
      if (!ed.uploads.length) {
        const empty = el("div", "ez-empty", grid);
        empty.textContent = "No uploads yet. Upload an image to get started.";
      }
      for (const up of ed.uploads) {
        const thumb = el("button", "ez-panel-card ez-upload-thumb", grid);
        thumb.type = "button";
        thumb.title = up.name;
        thumb.setAttribute("aria-label", `Add ${up.name} to canvas`);
        const img = document.createElement("img");
        img.src = up.src;
        img.alt = up.name;
        thumb.appendChild(img);
        thumb.onclick = () => {
          const el2 = ed.addElement({ type: "image", src: up.src, name: up.name });
          ed.select([el2.id]);
        };
      }
      for (const source of ed.registry.imageSources || []) {
        this.renderImageSource(source);
      }
      this.contentEl.scrollTop = scrollTop;
    }
    // Renders one registered image source provider: an optional search box
    // plus its result thumbnails. Providers shape their own results.
    renderImageSource(source) {
      const ed = this.editor;
      this.sectionTitle(source.label || source.id);
      if (typeof source.search !== "function") return;
      const search = el("input", "ez-input ez-panel-search", this.contentEl);
      search.type = "search";
      search.placeholder = `Search ${source.label || source.id}\u2026`;
      search.setAttribute("aria-label", `Search ${source.label || source.id} images`);
      const results = el("div", "ez-upload-grid", this.contentEl);
      const status = el("div", "ez-empty", this.contentEl);
      status.hidden = true;
      const renderResults = (items) => {
        results.innerHTML = "";
        status.hidden = true;
        if (!items.length) {
          status.textContent = "No images found.";
          status.hidden = false;
          return;
        }
        for (const item of items) {
          if (!item?.src) continue;
          const name = item.name || "Image";
          const thumb = el("button", "ez-panel-card ez-upload-thumb", results);
          thumb.type = "button";
          thumb.title = name;
          thumb.setAttribute("aria-label", `Add ${name} to canvas`);
          const img = document.createElement("img");
          img.src = item.thumb || item.src;
          img.alt = name;
          img.loading = "lazy";
          thumb.appendChild(img);
          thumb.onclick = () => {
            const el2 = ed.addElement({ type: "image", src: item.src, name });
            ed.select([el2.id]);
            ed.registerImage({ src: item.src, name });
          };
        }
      };
      let timer = 0;
      let seq = 0;
      const runSearch = () => {
        const query = search.value.trim();
        const run = ++seq;
        Promise.resolve(source.search(query)).then((items) => {
          if (run === seq) renderResults(Array.isArray(items) ? items : []);
        }).catch(() => {
          if (run !== seq) return;
          results.innerHTML = "";
          status.textContent = "Image search failed. Try again.";
          status.hidden = false;
        });
      };
      search.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(runSearch, 250);
      });
      runSearch();
    }
    renderBackground() {
      const ed = this.editor;
      const bg = ed.getPage().background || {};
      this.contentEl.innerHTML = "";
      this.panelHeader("Background", "Set the mood with a color, gradient, or image.");
      this.sectionTitle("Solid colors");
      for (const group of normalizePalette(ed.registry.palette)) {
        if (group.label) this.sectionTitle(group.label);
        const swatches = el("div", "ez-swatch-grid", this.contentEl);
        for (const color of group.colors) {
          const sw = el("button", "ez-swatch", swatches);
          sw.style.background = color;
          if (color === "#ffffff") sw.classList.add("ez-swatch-border");
          sw.title = color;
          sw.onclick = () => ed.setBackground({ type: "solid", color });
        }
      }
      this.sectionTitle("Gradients");
      const grads = el("div", "ez-swatch-grid", this.contentEl);
      const gradients = this.editor.registry.gradients;
      for (const g of gradients) {
        const sw = el("button", "ez-swatch", grads);
        sw.style.background = `linear-gradient(${(g.angle ?? 135) + 90}deg, ${g.from}, ${g.to})`;
        sw.title = `${g.from} \u2192 ${g.to}`;
        sw.onclick = () => ed.setBackground({ ...g, type: "gradient" });
      }
      this.sectionTitle("Custom gradient");
      const gradient2 = bg.type === "gradient" ? bg : gradients[0] || { from: GRADIENT_FALLBACKS.from, to: GRADIENT_FALLBACKS.to, angle: 135 };
      const gradientRow = el("div", "ez-bg-gradient-controls", this.contentEl);
      const fields = {};
      for (const [key, label2] of [["from", "Start color"], ["to", "End color"], ["angle", "Angle"]]) {
        const wrap = el(key === "angle" ? "label" : "div", "ez-bg-gradient-field", gradientRow);
        el("span", "ez-num-label", wrap).textContent = label2;
        if (key === "angle") {
          wrap.classList.add("ez-bg-gradient-angle");
          const field = el("input", "ez-input", wrap);
          field.type = "number";
          field.setAttribute("aria-label", "Background gradient angle");
          field.min = 0;
          field.max = 360;
          field.step = 1;
          field.value = gradient2.angle ?? 135;
          field.oninput = () => applyGradient(false);
          field.onchange = () => ed.commit();
          fields.angle = field;
        } else {
          fields[key] = colorField(wrap, {
            title: `Background gradient ${label2.toLowerCase()}`,
            value: gradient2[key] || GRADIENT_FALLBACKS[key],
            onInput: () => applyGradient(false),
            onCommit: () => ed.commit()
          });
        }
      }
      const preview = el("div", "ez-bg-gradient-preview", this.contentEl);
      preview.setAttribute("aria-hidden", "true");
      const updatePreview = () => {
        const angle = Number.isFinite(fields.angle.valueAsNumber) ? clamp(fields.angle.valueAsNumber, 0, 360) : 135;
        preview.style.background = `linear-gradient(${angle + 90}deg, ${fields.from.value}, ${fields.to.value})`;
      };
      const applyGradient = (commit = true) => {
        if (!Number.isFinite(fields.angle.valueAsNumber)) return;
        const angle = clamp(fields.angle.valueAsNumber, 0, 360);
        ed.setBackground({ type: "gradient", from: fields.from.value, to: fields.to.value, angle }, commit);
        updatePreview();
      };
      const apply = el("button", "ez-btn ez-btn-ghost ez-bg-gradient-apply", this.contentEl);
      apply.type = "button";
      apply.textContent = "Apply gradient";
      apply.onclick = () => applyGradient();
      this.sectionTitle("Solid color & image");
      const row = el("div", "ez-bg-custom", this.contentEl);
      const solidField = colorField(row, {
        title: "Background solid color",
        value: hexOr(bg.color, "#ffffff"),
        onInput: (value) => ed.setBackground({ type: "solid", color: value }, false),
        onCommit: () => ed.commit()
      });
      const input = solidField.input;
      const imgBtn = el("button", "ez-btn ez-btn-ghost ez-grow", row);
      imgBtn.textContent = "Image background";
      imgBtn.onclick = async () => {
        const file = await ed.pickImageFile();
        if (!file) return;
        const src = await readAsDataURL(file);
        ed.setBackground({ type: "image", src });
      };
      const rm = el("button", "ez-btn ez-btn-ghost ez-grow ez-bg-remove", row);
      rm.textContent = "Remove image";
      rm.onclick = () => ed.setBackground({ type: "solid", color: "#ffffff" });
      this.syncBackgroundControls = () => {
        const current = ed.getPage().background || {};
        if (current.type === "gradient") {
          fields.from.value = current.from || GRADIENT_FALLBACKS.from;
          fields.to.value = current.to || GRADIENT_FALLBACKS.to;
          fields.angle.value = current.angle ?? 135;
        }
        if (isHexColor(current.color || "")) solidField.value = current.color;
        rm.style.display = current.type === "image" ? "" : "none";
        updatePreview();
      };
      this.syncBackgroundControls();
    }
    renderLayers() {
      const ed = this.editor;
      const scrollTop = this.contentEl.scrollTop;
      this.contentEl.innerHTML = "";
      this.panelHeader("Layers", "Drag layers to reorder. Top layers appear in front.");
      this.sectionTitle("Page layers");
      const list = el("div", "ez-layer-list", this.contentEl);
      let draggedId = null;
      const clearDropMarks = () => {
        list.querySelectorAll(".ez-drop-before, .ez-drop-after").forEach((row) => row.classList.remove("ez-drop-before", "ez-drop-after"));
      };
      const endDrag = () => {
        draggedId = null;
        clearDropMarks();
        list.querySelectorAll(".ez-dragging").forEach((row) => row.classList.remove("ez-dragging"));
      };
      const forwardGapEvent = (e, handler) => {
        if (e.target !== list || draggedId === null) return;
        const row = [...list.children].find((child) => e.clientY < child.getBoundingClientRect().bottom) || list.lastElementChild;
        row?.[handler]?.(e);
      };
      list.ondragover = (e) => forwardGapEvent(e, "ondragover");
      list.ondrop = (e) => forwardGapEvent(e, "ondrop");
      const els = ed.getElements();
      if (!els.length) {
        const empty = el("div", "ez-empty", this.contentEl);
        empty.textContent = "This page is empty. Add elements from the panels.";
        return;
      }
      for (let i = els.length - 1; i >= 0; i--) {
        const item = els[i];
        const row = el("div", "ez-layer-item" + (ed.selection.has(item.id) ? " ez-active" : ""), list);
        row.dataset.id = item.id;
        const handle = el("button", "ez-layer-drag-handle", row);
        handle.type = "button";
        handle.textContent = "\u283F";
        handle.title = "Drag to reorder, or use Up/Down arrow keys";
        handle.setAttribute("aria-label", `Reorder ${elementName(item, ed.registry)}. Use Up or Down arrow keys.`);
        handle.draggable = true;
        handle.onkeydown = (e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          e.stopPropagation();
          const from = ed.getElements().findIndex((layer) => layer.id === item.id);
          ed.moveLayer(from, from + (e.key === "ArrowUp" ? 1 : -1));
          const movedRow = [...this.contentEl.querySelectorAll(".ez-layer-item")].find((layer) => layer.dataset.id === item.id);
          movedRow?.querySelector(".ez-layer-drag-handle").focus({ preventScroll: true });
        };
        row.ondragstart = (e) => {
          draggedId = item.id;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item.id);
          e.dataTransfer.setDragImage(row, 16, row.offsetHeight / 2);
          requestAnimationFrame(() => {
            if (draggedId === item.id) row.classList.add("ez-dragging");
          });
        };
        row.ondragend = endDrag;
        row.ondragover = (e) => {
          if (draggedId === null) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          clearDropMarks();
          if (draggedId === item.id) return;
          const rect = row.getBoundingClientRect();
          row.classList.add(e.clientY < rect.top + rect.height / 2 ? "ez-drop-before" : "ez-drop-after");
        };
        row.ondragleave = (e) => {
          if (!row.contains(e.relatedTarget)) row.classList.remove("ez-drop-before", "ez-drop-after");
        };
        row.ondrop = (e) => {
          if (draggedId === null) return;
          e.preventDefault();
          const layers = ed.getElements();
          const from = layers.findIndex((layer) => layer.id === draggedId);
          const target = layers.findIndex((layer) => layer.id === item.id);
          const rect = row.getBoundingClientRect();
          const before = e.clientY < rect.top + rect.height / 2;
          endDrag();
          if (from < 0 || target < 0 || from === target) return;
          const insertion = target + (before ? 1 : 0);
          ed.moveLayer(from, insertion - (from < insertion ? 1 : 0));
        };
        const icon2 = UI_ICONS[manifestFor(item.type, ed.registry).layerIcon || "shapes"];
        const name = el("span", "ez-layer-name", row);
        name.draggable = true;
        name.title = "Click to select, or drag to reorder";
        name.innerHTML = `${icon2}<span>${escapeHtml(elementName(item, ed.registry))}</span>`;
        name.onclick = () => ed.select([item.id]);
        const btns = el("span", "ez-layer-actions", row);
        const mkBtn = (html, title, fn, cls = "") => {
          const b = el("button", "ez-icon-btn ez-sm " + cls, btns);
          b.innerHTML = html;
          b.title = title;
          b.onclick = (e) => {
            e.stopPropagation();
            fn();
          };
        };
        mkBtn(item.hidden ? UI_ICONS["eye-off"] : UI_ICONS.eye, item.hidden ? "Show" : "Hide", () => {
          item.hidden = !item.hidden;
          ed.markDirty();
          ed.commit();
          this.renderLayers();
        });
        mkBtn(item.locked ? UI_ICONS.lock : UI_ICONS.unlock, item.locked ? "Unlock" : "Lock", () => {
          item.locked = !item.locked;
          ed.commit();
          this.renderLayers();
        });
        mkBtn(UI_ICONS.trash, "Delete", () => {
          ed.select([item.id]);
          ed.deleteSelected();
        });
      }
      this.contentEl.scrollTop = scrollTop;
    }
  };

  // src/ui/toolbar.js
  var Toolbar = class {
    constructor(editor) {
      this.editor = editor;
      this.root = editor.toolbarEl;
      this.root.classList.add("ez-floating-toolbar");
      this.lastSig = null;
      this._unsubs = [editor.on("selection", () => this.lastSig = null)];
    }
    destroy() {
      this._unsubs?.forEach((off) => off());
      this._unsubs = [];
    }
    selectionSig() {
      const sel = this.editor.getSelected();
      return sel.map((s) => s.id + ":" + s.type).join("|");
    }
    update() {
      const ed = this.editor;
      const sel = ed.getSelected();
      if (!sel.length || ed._editing) {
        this.root.style.display = "none";
        return;
      }
      const sig = this.selectionSig();
      if (sig !== this.lastSig) {
        this.lastSig = sig;
        this.buildControls(sel);
      }
      this.syncValues(sel);
      this.position(sel);
    }
    position(sel) {
      const ed = this.editor;
      const containerRect = ed.container.getBoundingClientRect();
      const canvasRect = ed.canvas.getBoundingClientRect();
      const bounds = selectionBBox(sel);
      const x = canvasRect.left - containerRect.left + bounds.x * ed.zoom;
      const y = canvasRect.top - containerRect.top + bounds.y * ed.zoom;
      this.root.style.display = "flex";
      const tw = this.root.offsetWidth;
      const th = this.root.offsetHeight;
      const left = clamp(x, 8, containerRect.width - tw - 8);
      const gap = 48;
      const above = y - th - gap;
      const below = y + bounds.h * ed.zoom + gap;
      const maxTop = Math.max(8, containerRect.height - th - 8);
      const top = clamp(above < 8 && below <= maxTop ? below : above, 8, maxTop);
      this.root.style.left = left + "px";
      this.root.style.top = top + "px";
    }
    buildControls(sel) {
      const ed = this.editor;
      this.root.innerHTML = "";
      this.fillControls = null;
      const first = sel[0];
      const groups = ["chartEdit", "text", "fill", "line", "iconStyle", "opacity"];
      const common = groups.filter((group) => sel.every((s) => manifestFor(s.type, ed.registry).toolbar?.includes(group)));
      if (common.includes("chartEdit") && sel.length === 1) {
        const edit = el("button", "ez-btn ez-btn-ghost", this.root);
        edit.textContent = "Edit chart";
        edit.onclick = () => ed.ui.sidepanel?.charts?.open();
      }
      if (common.includes("text")) {
        const fontSel = el("select", "ez-input ez-font-select", this.root);
        for (const f of ed.registry.fonts)
          fontSel.innerHTML += `<option>${f}</option>`;
        fontSel.value = first.fontFamily;
        this.bind(fontSel, "fontFamily", (n) => n.value);
        this.numInput("Size", first.fontSize, 4, 800, (v) => ({ fontSize: v }));
        const mkToggle = (icon2, prop, title) => {
          const b = el("button", "ez-tool-toggle", this.root);
          b.innerHTML = icon2;
          b.title = title;
          b.dataset.prop = prop;
          b.onclick = () => ed.updateSelected({ [prop]: !first[prop] });
        };
        mkToggle(UI_ICONS.bold, "fontWeight", "Bold");
        mkToggle(UI_ICONS.italic, "italic", "Italic");
        mkToggle(UI_ICONS.underline, "underline", "Underline");
        const alignBtn = el("button", "ez-tool-toggle", this.root);
        alignBtn.title = "Alignment";
        alignBtn.dataset.prop = "align";
        alignBtn.onclick = () => {
          const order = ["left", "center", "right"];
          const next = order[(order.indexOf(first.align) + 1) % 3];
          ed.updateSelected({ align: next });
        };
        this.colorInput("Text color", first.color, "color");
      }
      if (common.includes("fill")) {
        this.fillInput();
        if (first.stroke !== void 0 && first.type !== "image") {
          this.colorInput("Stroke", first.stroke || "#000000", "stroke");
          this.numInput("Stroke", first.strokeWidth || 0, 0, 100, (v) => ({ strokeWidth: v }));
        }
        if (manifestFor(first.type, ed.registry).radius) {
          this.numInput("Radius", first.radius || 0, 0, 400, (v) => ({ radius: v }));
        }
      }
      if (common.includes("line")) {
        this.colorInput("Color", first.stroke, "stroke");
        this.numInput("Width", first.strokeWidth, 1, 100, (v) => ({ strokeWidth: v }));
        const arrowBtn = el("button", "ez-tool-toggle", this.root);
        arrowBtn.textContent = "\u27F6";
        arrowBtn.title = "Arrow head";
        arrowBtn.dataset.prop = "arrow";
        arrowBtn.onclick = () => ed.updateSelected({ arrow: !first.arrow });
      }
      if (common.includes("iconStyle")) {
        const style = el("select", "ez-input", this.root);
        style.setAttribute("aria-label", "Icon style");
        style.innerHTML = '<option value="solid">Solid</option><option value="outline">Outline</option>';
        style.value = first.iconStyle || "solid";
        this.bind(style, "iconStyle");
      }
      if (common.includes("opacity")) {
        this.numInput("Opacity", Math.round((first.opacity ?? 1) * 100), 0, 100, (v) => ({ opacity: v / 100 }));
      }
      const actions = el("div", "ez-toolbar-sep-actions", this.root);
      const mk = (icon2, title, fn) => {
        const b = el("button", "ez-icon-btn ez-sm", actions);
        b.innerHTML = icon2;
        b.title = title;
        b.onclick = fn;
      };
      mk(UI_ICONS.duplicate, "Duplicate (Ctrl+D)", () => ed.duplicateSelected());
      mk(UI_ICONS.front, "Bring to front", () => ed.bringToFront());
      mk(UI_ICONS.back, "Send to back", () => ed.sendToBack());
      mk(
        sel.some((s) => s.locked) ? UI_ICONS.unlock : UI_ICONS.lock,
        sel.some((s) => s.locked) ? "Unlock" : "Lock",
        () => ed.toggleLock()
      );
      mk(UI_ICONS.trash, "Delete (Del)", () => ed.deleteSelected());
    }
    syncValues(sel) {
      const first = sel[0];
      this.syncFill(first.fill);
      this.root.querySelectorAll("[data-prop]").forEach((btn) => {
        const prop = btn.dataset.prop;
        let active = false;
        if (prop === "fontWeight") active = first.fontWeight >= 600;
        else if (prop === "align") {
          btn.innerHTML = first.align === "center" ? UI_ICONS.alignCenter : first.align === "right" ? UI_ICONS.alignRight : UI_ICONS.alignLeft;
        } else active = !!first[prop];
        btn.classList.toggle("ez-active", active);
      });
      this.root.querySelectorAll("input[data-bind], select[data-bind]").forEach((input) => {
        const prop = input.dataset.bind;
        let v = first[prop];
        if (prop === "stroke") v = v || "#000000";
        if (prop === "iconStyle") v = v || "solid";
        if (prop === "opacity") v = Math.round((v ?? 1) * 100);
        if (document.activeElement !== input) input.value = v ?? "";
      });
      this.root.querySelectorAll("input[data-hex-for]").forEach((hex) => {
        if (document.activeElement === hex) return;
        const target = this.root.querySelector(`[data-bind="${hex.dataset.hexFor}"]`);
        if (target) hex.value = target.value;
      });
    }
    bind(input, prop, getter = (n) => n.value) {
      input.dataset.bind = prop;
      input.addEventListener("input", () => {
        const value = getter(input);
        if (value !== void 0 && value !== null && !Number.isNaN(value)) {
          this.editor.updateSelected({ [prop]: value }, false);
        }
      });
      input.addEventListener("change", () => this.editor.commit());
    }
    fillInput() {
      const ed = this.editor;
      const wrap = el("label", "ez-num-wrap", this.root);
      el("span", "ez-num-label", wrap).textContent = "Fill";
      const mode = el("select", "ez-input", wrap);
      mode.setAttribute("aria-label", "Fill type");
      mode.innerHTML = '<option value="solid">Solid</option><option value="gradient">Gradient</option><option value="none">None</option>';
      mode.onchange = () => {
        const fill = ed.getSelected()[0]?.fill;
        const color = fill?.type === "gradient" ? fill.from : fill;
        const from = color && color !== "none" ? color : ACCENT;
        ed.updateSelected({ fill: mode.value === "gradient" ? { type: "gradient", from, to: "#ffffff", angle: 135 } : mode.value === "none" ? "none" : from });
      };
      const colors = {};
      for (const [key, title] of [["solid", "Fill color"], ["from", "Gradient start color"], ["to", "Gradient end color"]]) {
        const field = colorField(this.root, {
          title,
          value: "#000000",
          onInput: (value) => {
            const fill = ed.getSelected()[0]?.fill;
            if (key === "solid") ed.updateSelected({ fill: value }, false);
            else if (fill?.type === "gradient") ed.updateSelected({ fill: { ...fill, [key]: value } }, false);
          },
          onCommit: () => ed.commit()
        });
        colors[key] = { label: field.group, input: field.input, field };
      }
      const angleWrap = el("label", "ez-num-wrap", this.root);
      el("span", "ez-num-label", angleWrap).textContent = "Angle";
      const angle = el("input", "ez-input ez-num-input", angleWrap);
      angle.type = "number";
      angle.min = 0;
      angle.max = 360;
      angle.step = 1;
      angle.setAttribute("aria-label", "Gradient angle");
      angle.oninput = () => {
        const fill = ed.getSelected()[0]?.fill;
        const value = angle.valueAsNumber;
        if (fill?.type === "gradient" && Number.isFinite(value)) {
          ed.updateSelected({ fill: { ...fill, angle: clamp(value, 0, 360) } }, false);
        }
      };
      angle.onchange = () => ed.commit();
      this.fillControls = { mode, colors, angleWrap, angle };
    }
    syncFill(fill) {
      if (!this.fillControls) return;
      const { mode, colors, angleWrap, angle } = this.fillControls;
      const gradient2 = fill?.type === "gradient";
      mode.value = gradient2 ? "gradient" : fill === "none" ? "none" : "solid";
      for (const [key, { label: label2, input, field }] of Object.entries(colors)) {
        label2.style.display = (key === "solid" ? !gradient2 && fill !== "none" : gradient2) ? "" : "none";
        const color = key === "solid" ? fill : fill?.[key] || GRADIENT_FALLBACKS[key];
        if (document.activeElement !== input) input.value = hexOr(color, "#000000");
        if (document.activeElement !== field.hex) field.hex.value = hexOr(color, "#000000");
      }
      angleWrap.style.display = gradient2 ? "" : "none";
      if (document.activeElement !== angle) angle.value = gradient2 ? fill.angle ?? 135 : 135;
    }
    colorInput(title, value, prop) {
      const ed = this.editor;
      const field = colorField(this.root, {
        title,
        value: hexOr(value, "#000000"),
        onInput: (next) => ed.updateSelected({ [prop]: next }, false),
        onCommit: () => ed.commit()
      });
      field.input.dataset.bind = prop;
      field.hex.dataset.hexFor = prop;
    }
    numInput(label2, value, min, max, mapper) {
      const ed = this.editor;
      const wrap = el("label", "ez-num-wrap", this.root);
      const span = el("span", "ez-num-label", wrap);
      span.textContent = label2;
      const input = el("input", "ez-input ez-num-input", wrap);
      input.type = "number";
      input.min = min;
      input.max = max;
      input.value = value;
      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        if (!Number.isNaN(v)) {
          this.editor.updateSelected(mapper(v), false);
        }
      });
      input.addEventListener("change", () => this.editor.commit());
    }
  };

  // src/ui/pagesbar.js
  var PagesBar = class {
    constructor(editor) {
      this.editor = editor;
      this.root = editor.pagesBarEl;
      this.dragIndex = null;
      this._unsubs = [
        editor.on("page", () => this.render()),
        editor.on("change", () => this.render())
      ];
      this.render();
    }
    destroy() {
      this._unsubs?.forEach((off) => off());
      this._unsubs = [];
    }
    render() {
      const ed = this.editor;
      this.root.innerHTML = "";
      ed.doc.pages.forEach((page, i) => {
        const chip = el("button", "ez-page-chip" + (i === ed.pageIndex ? " ez-active" : ""), this.root);
        chip.innerHTML = `<span class="ez-page-num">${i + 1}</span><span class="ez-page-dim">${page.width}\xD7${page.height}</span>`;
        chip.title = "Page " + (i + 1) + " \u2014 drag to reorder";
        chip.draggable = true;
        chip.dataset.index = i;
        chip.onclick = () => ed.goToPage(i);
        chip.ondragstart = (e) => {
          this.dragIndex = i;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(i));
          requestAnimationFrame(() => chip.classList.add("ez-dragging"));
        };
        chip.ondragend = () => {
          this.dragIndex = null;
          this._clearDropMarks();
        };
        chip.ondragover = (e) => {
          if (this.dragIndex === null || this.dragIndex === i) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          const before = this._dropBefore(e, chip);
          chip.classList.toggle("ez-drop-before", before);
          chip.classList.toggle("ez-drop-after", !before);
        };
        chip.ondragleave = () => chip.classList.remove("ez-drop-before", "ez-drop-after");
        chip.ondrop = (e) => {
          e.preventDefault();
          const raw = this.dragIndex !== null ? String(this.dragIndex) : e.dataTransfer.getData("text/plain");
          const from = Number(raw);
          if (raw === "" || Number.isNaN(from) || from === i) return;
          const before = this._dropBefore(e, chip);
          ed.movePage(from, from < i ? before ? i - 1 : i : before ? i : i + 1);
        };
      });
      const actions = el("div", "ez-page-actions", this.root);
      const mk = (icon2, title, fn) => {
        const b = el("button", "ez-icon-btn ez-sm", actions);
        b.innerHTML = icon2;
        b.title = title;
        b.onclick = fn;
      };
      mk(UI_ICONS.plus, "Add page", () => ed.addPage());
      mk(UI_ICONS.duplicate, "Duplicate page", () => ed.duplicatePage());
      if (ed.doc.pages.length > 1) mk(UI_ICONS.trash, "Delete page", () => ed.deletePage());
    }
    _dropBefore(e, chip) {
      const rect = chip.getBoundingClientRect();
      return e.clientX < rect.left + rect.width / 2;
    }
    _clearDropMarks() {
      this.root.querySelectorAll(".ez-drop-before, .ez-drop-after, .ez-dragging").forEach((c) => c.classList.remove("ez-drop-before", "ez-drop-after", "ez-dragging"));
    }
  };

  // src/styles.js
  var injected = false;
  function injectStyles() {
    if (injected || document.getElementById("ez-styles")) return;
    injected = true;
    const style = document.createElement("style");
    style.id = "ez-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  var UI_FONT_FAMILY = "Outfit:wght@400;500;600;700;800";
  function buildGoogleFontsUrl(families = GOOGLE_FONT_FAMILIES) {
    const all = [UI_FONT_FAMILY, ...families.filter((f) => f && f !== UI_FONT_FAMILY)];
    return `https://fonts.googleapis.com/css2?family=${all.join("&family=")}&display=swap`;
  }
  function injectFonts(families = GOOGLE_FONT_FAMILIES) {
    const href = buildGoogleFontsUrl(families);
    let link = document.getElementById("ez-fonts");
    if (!link) {
      link = document.createElement("link");
      link.id = "ez-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    return link;
  }
  var CSS = `
.ez-editor {
  --ez-accent: #d97706;
  --ez-accent-soft: #fdf0dd;
  --ez-bg: #f5f5f7;
  --ez-panel: #ffffff;
  --ez-border: #e4e4ea;
  --ez-text: #1e2130;
  --ez-text-dim: #7a7d8c;
  --ez-danger: #e11d48;
  --ez-surface: #ffffff;
  --ez-surface-2: #fafafc;
  --ez-surface-3: #f0f0f3;
  --ez-hover: #ececf2;
  --ez-border-strong: #c9c9d4;
  --ez-canvas-bg: #e9eaf1;
  --ez-canvas-dot: #dcdde6;
  --ez-scrollbar: #d6d6e0;
  --ez-danger-soft: #fdeef2;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 480px;
  min-width: 720px;
  overflow: hidden;
  background: var(--ez-bg);
  color: var(--ez-text);
  font-family: Outfit, 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  user-select: none;
  box-sizing: border-box;
}
.ez-editor *, .ez-editor *::before, .ez-editor *::after { box-sizing: border-box; }
.ez-editor button, .ez-editor input, .ez-editor select, .ez-editor textarea { font-family: inherit; }
.ez-editor button { cursor: pointer; }

.ez-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 14px;
  background: var(--ez-panel);
  border-bottom: 1px solid var(--ez-border);
  flex-shrink: 0;
  z-index: 30;
}
.ez-brand { display: flex; align-items: center; gap: 8px; }
.ez-logo {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, #b45309, #f59e0b);
  color: #fff; font-weight: 800; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
}
.ez-brand-name { font-weight: 700; font-size: 15px; }
.ez-filename {
  border: 1px solid transparent; border-radius: 8px;
  background: transparent; padding: 6px 10px;
  font-size: 14px; font-weight: 600; color: var(--ez-text);
  width: 190px; font-family: inherit;
}
.ez-filename:hover { border-color: var(--ez-border); }
.ez-filename:focus { outline: none; border-color: var(--ez-accent); background: var(--ez-surface); }
.ez-topbar-group { display: flex; align-items: center; gap: 2px; padding: 0 6px; }
.ez-topbar-spacer { flex: 1; }
.ez-topbar > .ez-btn, .ez-topbar > .ez-icon-btn, .ez-topbar-group, .ez-brand { flex-shrink: 0; }
.ez-resize-dialog {
  width: 560px; max-width: calc(100% - 32px); max-height: calc(100% - 32px); padding: 24px;
  border: 1px solid var(--ez-border); border-radius: 14px;
  background: var(--ez-panel); color: var(--ez-text); font: inherit;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);
}
.ez-resize-dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
.ez-resize-form h2 { margin: 0 0 8px; font-size: 18px; }
.ez-resize-form p { margin: 0 0 20px; color: var(--ez-text-dim); font-size: 12px; line-height: 1.5; }
.ez-resize-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ez-resize-fields label { display: flex; flex-direction: column; gap: 8px; font-size: 12px; font-weight: 600; }
.ez-resize-presets { min-width: 0; padding: 0; margin: 0; border: 0; }
.ez-resize-presets legend { padding: 0; margin-bottom: 12px; font-size: 12px; font-weight: 600; }
.ez-resize-categories { display: flex; gap: 4px; padding: 4px; background: var(--ez-surface-3); border-radius: 10px; margin-bottom: 14px; }
.ez-resize-category { flex: 1; border: 0; border-radius: 7px; padding: 8px 4px; background: transparent; color: var(--ez-text-dim); font-size: 12px; font-weight: 600; }
.ez-resize-category[aria-pressed="true"] { background: var(--ez-panel); color: var(--ez-text); box-shadow: 0 1px 4px #00000012; }
.ez-resize-gallery { max-height: 310px; overflow-y: auto; padding: 3px; margin: -3px; scrollbar-width: thin; }
.ez-resize-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.ez-resize-grid[hidden] { display: none; }
.ez-resize-card { position: relative; display: flex; flex-direction: column; gap: 5px; min-width: 0; padding: 6px; border: 1px solid transparent; border-radius: 12px; cursor: pointer; }
.ez-resize-card:hover { background: var(--ez-surface-3); }
.ez-resize-card:has(input:checked) { background: var(--ez-accent-soft); border-color: var(--ez-accent); }
.ez-resize-card > input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ez-resize-card:has(input:focus-visible), .ez-resize-category:focus-visible, .ez-resize-custom:has(input:focus-visible) { outline: 2px solid var(--ez-accent); outline-offset: 2px; }
.ez-resize-thumbnail { position: relative; display: flex; justify-content: center; align-items: center; height: 100px; border-radius: 8px; background: var(--ez-surface-3); overflow: hidden; }
.ez-resize-paper { position: relative; display: block; flex-shrink: 0; overflow: hidden; border: 2px solid #fff; border-radius: 3px; background: #e6f7ed; box-shadow: 4px 4px 0 #00000020; }
.ez-resize-art-orb { position: absolute; width: 60%; aspect-ratio: 1; border-radius: 50%; right: -8%; top: 10%; background: linear-gradient(135deg, #86efac, #22c55e); }
.ez-resize-art-block { position: absolute; width: 65%; height: 36%; left: -8%; bottom: 14%; background: #16a34a; transform: rotate(-18deg); border-radius: 3px; }
.ez-resize-art-line { position: absolute; width: 45%; height: 3px; top: 17%; left: 12%; background: #fff; box-shadow: 0 6px 0 #ffffffb3; }
.ez-resize-art-1 .ez-resize-paper { background: #fff; }
.ez-resize-art-1 .ez-resize-art-orb { border-radius: 0; width: 76%; height: 28%; top: 10%; right: 12%; background: #86efac; }
.ez-resize-art-1 .ez-resize-art-block { transform: none; width: 76%; height: 25%; left: 12%; bottom: 12%; border-radius: 0; }
.ez-resize-art-1 .ez-resize-art-line { top: 46%; background: #dedde5; box-shadow: 0 6px 0 #dedde5; }
.ez-resize-art-2 .ez-resize-paper { background: #14532d; }
.ez-resize-art-2 .ez-resize-art-block { width: 30%; left: 12%; background: #86efac; }
.ez-resize-check { position: absolute; top: 6px; right: 6px; display: none; align-items: center; justify-content: center; width: 19px; height: 19px; border-radius: 50%; background: var(--ez-accent); color: #fff; font-size: 12px; font-weight: 700; }
.ez-resize-card:has(input:checked) .ez-resize-check { display: flex; }
.ez-resize-card-name { font-size: 12px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.ez-resize-card-size { font-size: 11px; color: var(--ez-text-dim); line-height: 1.4; }
.ez-resize-custom { display: flex; align-items: center; gap: 8px; padding: 11px 12px; margin-top: 14px; border: 1px solid var(--ez-border); border-radius: 9px; font-size: 12px; cursor: pointer; }
.ez-resize-custom:has(input:checked) { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
.ez-resize-custom input { margin: 0; accent-color: var(--ez-accent); }
.ez-resize-custom-hint { margin-left: auto; font-size: 11px; color: var(--ez-text-dim); }
@media (max-width: 480px) {
  .ez-resize-dialog { padding: 18px; }
  .ez-resize-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ez-resize-custom-hint { display: none; }
}
.ez-resize-form .ez-resize-preset-help { margin: 8px 0 16px; font-size: 11px; }
.ez-resize-fields input { width: 100%; min-width: 0; height: 38px; }
.ez-resize-form .ez-resize-limit { margin: 10px 0 20px; font-size: 11px; }
.ez-resize-actions { display: flex; justify-content: flex-end; gap: 8px; }
.ez-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: transparent; color: var(--ez-text); padding: 0;
}
.ez-icon-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; }
.ez-icon-btn:hover { background: var(--ez-hover); }
.ez-icon-btn.ez-sm { width: 26px; height: 26px; border-radius: 6px; }
.ez-icon-btn.ez-sm svg { width: 14px; height: 14px; }
.ez-zoom-btn {
  min-width: 54px; height: 30px; border: none; border-radius: 8px;
  background: transparent; font-weight: 600; font-size: 13px; color: var(--ez-text);
}
.ez-zoom-btn:hover { background: var(--ez-hover); }
.ez-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; border-radius: 8px;
  border: 1px solid transparent; font-size: 13px; font-weight: 600;
}
.ez-btn svg { width: 15px; height: 15px; fill: none; stroke: currentColor; }
.ez-btn-ghost { background: var(--ez-surface); border-color: var(--ez-border); color: var(--ez-text); }
.ez-btn-ghost:hover { border-color: var(--ez-border-strong); background: var(--ez-surface-2); }
.ez-btn-primary { background: var(--ez-accent); color: #fff; }
.ez-btn-primary:hover { background: #b45309; }
.ez-hidden { display: none !important; }
.ez-grow { flex: 1; justify-content: center; }

.ez-body { display: flex; flex: 1; min-height: 0; }

.ez-sidepanel {
  width: 368px; min-width: 368px;
  background: var(--ez-panel);
  border-right: 1px solid var(--ez-border);
  display: flex; min-height: 0; z-index: 20;
}
.ez-sidepanel-rail {
  width: 80px; flex-shrink: 0; display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden; border-right: 1px solid var(--ez-border);
  background: var(--ez-surface-2); padding: 8px 6px; gap: 8px;
}
.ez-sidepanel-tabs {
  display: flex; flex-direction: column; gap: 6px;
}
.ez-tab-btn {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
  min-height: 66px; padding: 10px 2px; border: none; border-radius: 10px; background: transparent;
  font-size: 10px; font-weight: 600; color: var(--ez-text-dim);
}
.ez-tab-btn svg { width: 24px; height: 24px; flex-shrink: 0; fill: none; stroke: currentColor; }
.ez-tab-btn:hover { color: var(--ez-text); background: var(--ez-hover); }
.ez-tab-btn.ez-active { color: var(--ez-accent); background: var(--ez-accent-soft); }
.ez-tab-btn:focus-visible, .ez-sidepanel-toggle:focus-visible { outline: 2px solid var(--ez-accent); outline-offset: -2px; }
.ez-sidepanel-toggle {
  display: flex; align-items: center; justify-content: center; align-self: center;
  width: 36px; height: 32px; flex-shrink: 0; padding: 0; border: none; border-radius: 8px;
  background: transparent; color: var(--ez-text-dim);
}
.ez-sidepanel-toggle:hover { background: var(--ez-hover); color: var(--ez-text); }
.ez-sidepanel-toggle svg { width: 20px; height: 20px; transform: rotate(90deg); }
.ez-sidepanel-content {
  --ez-panel-gap: 12px;
  --ez-panel-section-gap: 24px;
  --ez-panel-radius: 10px;
  flex: 1; min-width: 0; overflow-y: auto; padding: 16px;
  scrollbar-gutter: stable;
}
.ez-sidepanel-content[hidden] { display: none; }
.ez-sidepanel.ez-collapsed { width: 56px; min-width: 56px; }
.ez-collapsed .ez-sidepanel-rail { width: 55px; border-right: none; }
.ez-collapsed .ez-tab-btn { min-height: 46px; padding: 10px 0; }
.ez-collapsed .ez-tab-btn span { display: none; }
.ez-collapsed .ez-sidepanel-toggle svg { transform: rotate(-90deg); }
.ez-sidepanel-content::-webkit-scrollbar { width: 8px; }
.ez-sidepanel-content::-webkit-scrollbar-thumb { background: var(--ez-scrollbar); border-radius: 4px; }
.ez-panel-header { margin-bottom: 20px; }
.ez-panel-heading { margin: 0 0 8px; font-size: 16px; font-weight: 700; line-height: 1.4; color: var(--ez-text); }
.ez-panel-description { margin: 0; font-size: 12px; line-height: 1.6; color: var(--ez-text-dim); }
.ez-panel-title {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; line-height: 1.5; color: var(--ez-text-dim);
  margin: var(--ez-panel-section-gap) 0 var(--ez-panel-gap);
}
.ez-panel-title:first-child, .ez-panel-header + .ez-panel-title { margin-top: 0; }
.ez-sidepanel-content .ez-input { height: 36px; border-radius: 8px; font-size: 12px; }
.ez-panel-search { width: 100%; }
.ez-panel-filters { display: flex; flex-wrap: wrap; gap: 6px; margin: var(--ez-panel-gap) 0; }
.ez-panel-filter {
  padding: 6px 10px; min-height: 30px; border: 1px solid var(--ez-border); border-radius: 20px;
  background: var(--ez-surface); color: var(--ez-text-dim); font-size: 11px; font-weight: 600; line-height: 1.4;
}
.ez-panel-filter:hover { border-color: var(--ez-accent); color: var(--ez-accent); }
.ez-panel-filter.ez-active { color: var(--ez-accent); background: var(--ez-accent-soft); border-color: var(--ez-accent); }
.ez-panel-count { color: var(--ez-text-dim); font-size: 11px; line-height: 1.5; margin: 0 0 var(--ez-panel-gap); }
.ez-panel-card {
  min-width: 0; border: 1px solid var(--ez-border); border-radius: var(--ez-panel-radius);
  background: var(--ez-surface); color: var(--ez-text);
  transition: background .15s, border-color .15s;
}
.ez-panel-card:hover { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
.ez-sidepanel-content :is(button, input, select):focus-visible { outline: 2px solid var(--ez-accent); outline-offset: 2px; }
.ez-sidepanel-content .ez-btn { min-height: 36px; height: auto; padding: 8px 12px; font-size: 12px; justify-content: center; }
.ez-panel-action { width: 100%; }
.ez-empty {
  grid-column: 1 / -1; margin: 0; padding: 16px; border: 1px dashed var(--ez-border-strong);
  border-radius: var(--ez-panel-radius, 10px); background: var(--ez-surface-2);
  color: var(--ez-text-dim); font-size: 12px; line-height: 1.6;
}

.ez-chart-note { color: var(--ez-text-dim); font-size: 12px; line-height: 1.6; margin: 8px 0 14px; }
.ez-chart-gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ez-panel-gap); }
.ez-chart-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 8px 8px 12px; font-size: 11px; font-weight: 600; line-height: 1.4;
}
.ez-chart-card canvas { width: 100%; height: auto; display: block; border-radius: 6px; background: var(--ez-surface-2); }
.ez-chart-editor-tabs .ez-panel-filter { flex: 1; }
.ez-chart-error { color: var(--ez-danger); background: var(--ez-danger-soft); border-radius: 8px; padding: 10px; font-size: 12px; line-height: 1.5; }
.ez-chart-error[hidden] { display: none; }
.ez-chart-table-wrap { overflow: auto; max-height: 420px; border: 1px solid var(--ez-border); border-radius: 8px; }
.ez-chart-table { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 12px; }
.ez-chart-table th, .ez-chart-table td { padding: 4px; border-bottom: 1px solid var(--ez-border); text-align: left; }
.ez-chart-table th { position: sticky; top: 0; z-index: 1; background: var(--ez-surface-2); }
.ez-chart-table .ez-input { width: 100px; min-width: 80px; }
.ez-chart-table td:first-child .ez-input, .ez-chart-table th:first-child .ez-input { width: 110px; }
.ez-chart-table [aria-invalid='true'], .ez-chart-style-field [aria-invalid='true'] { border-color: var(--ez-danger); }
.ez-chart-remove { padding: 4px; border: none; background: transparent; color: var(--ez-text-dim); font-size: 10px; }
.ez-chart-remove:hover { color: var(--ez-danger); }
.ez-chart-data-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.ez-chart-expand { margin-top: 12px; width: 100%; justify-content: center; }
.ez-chart-style-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0; font-size: 12px; }
.ez-chart-style-field > span { min-width: 0; overflow-wrap: anywhere; }
.ez-chart-style-field .ez-input { width: 140px; min-width: 0; flex-shrink: 0; }
.ez-chart-style-field input[type='checkbox'] { width: 18px; height: 18px; accent-color: var(--ez-accent); }
.ez-chart-style-field input[type='color'] { width: 48px; padding: 2px; }
.ez-chart-dialog { width: 900px; max-width: calc(100vw - 40px); max-height: calc(100vh - 40px); overflow: auto;
  border: 1px solid var(--ez-border); border-radius: 14px; padding: 24px; background: var(--ez-panel); color: var(--ez-text); font: inherit; }
.ez-chart-dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
.ez-chart-dialog h2 { margin: 0 0 20px; font-size: 20px; }
.ez-chart-dialog .ez-chart-table-wrap { max-height: 55vh; }
.ez-chart-dialog .ez-chart-table .ez-input { width: 100%; min-width: 110px; }
.ez-chart-done { margin-top: 20px; float: right; }
.ez-chart-dialog button:disabled, .ez-chart-table button:disabled, .ez-chart-data-actions button:disabled { opacity: 0.45; cursor: default; }
.ez-chart-table input:disabled, .ez-chart-style-field input:disabled, .ez-chart-style-field select:disabled { opacity: 0.65; }

.ez-template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ez-panel-gap); align-items: start; }
.ez-template-card {
  overflow: hidden; padding: 0; text-align: left;
}
.ez-template-preview { aspect-ratio: 1; padding: 8px; background: var(--ez-surface-3); }
.ez-template-card canvas { display: block; width: 100%; height: 100%; object-fit: contain; }
.ez-template-name { padding: 9px 8px 4px; font-size: 11.5px; font-weight: 600; line-height: 1.35; }
.ez-template-meta { padding: 0 8px 10px; color: var(--ez-text-dim); font-size: 10px; line-height: 1.5; }
.ez-template-empty { grid-column: 1 / -1; }

.ez-element-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--ez-panel-gap); gap: 8px; }
.ez-element-heading .ez-panel-title { margin: 0; }
.ez-icon-styles { display: flex; padding: 3px; border-radius: 8px; background: var(--ez-surface-3); }
.ez-icon-style { border: 0; border-radius: 5px; padding: 5px 8px; font-size: 10px; font-weight: 600; color: var(--ez-text-dim); background: transparent; }
.ez-icon-style.ez-active { background: var(--ez-surface); color: var(--ez-accent); box-shadow: 0 1px 3px #17132b14; }
.ez-element-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: var(--ez-panel-section-gap); }
.ez-element-btn {
  padding: 10px 3px 7px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
}
.ez-element-btn:hover { color: var(--ez-accent); }
.ez-element-btn svg { width: 34px; height: 34px; max-width: 100%; flex-shrink: 0; }
.ez-element-label { display: block; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; line-height: 1.3; text-align: center; }

.ez-text-presets, .ez-font-list { display: flex; flex-direction: column; gap: 8px; }
.ez-text-preset {
  display: block; width: 100%; text-align: left; min-height: 44px;
  padding: 12px; line-height: 1.4; overflow-wrap: anywhere;
}
.ez-text-preset:hover, .ez-font-item:hover { color: var(--ez-accent); }
.ez-font-item {
  text-align: left; min-height: 40px; padding: 10px 12px; font-size: 14px; line-height: 1.4;
}

.ez-upload-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 40px; padding: 10px 12px; border: 1px dashed var(--ez-border-strong); border-radius: var(--ez-panel-radius);
  background: var(--ez-surface-2); font-weight: 600; font-size: 12px; color: var(--ez-text);
}
.ez-upload-btn svg { width: 17px; height: 17px; fill: none; stroke: currentColor; }
.ez-upload-btn:hover { border-color: var(--ez-accent); color: var(--ez-accent); }
.ez-upload-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ez-upload-thumb {
  aspect-ratio: 1; overflow: hidden; padding: 0;
}
.ez-upload-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.ez-swatch-grid { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 6px; }
.ez-swatch {
  aspect-ratio: 1; border-radius: 7px; border: 1px solid rgba(0,0,0,0.08); padding: 0;
}
.ez-swatch:hover { transform: scale(1.12); }
.ez-swatch-border { border-color: #c9c9d4; }
.ez-bg-custom { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.ez-bg-custom .ez-btn { min-width: 0; }
.ez-bg-gradient-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 8px; }
.ez-bg-gradient-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ez-bg-gradient-angle { grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: space-between; }
.ez-bg-gradient-angle > .ez-input { width: 80px; height: 36px; }
.ez-bg-gradient-field .ez-color-field, .ez-bg-custom .ez-color-field {
  display: flex; min-width: 0; height: 36px; gap: 6px; padding: 4px;
  border: 1px solid var(--ez-border); border-radius: 8px; background: var(--ez-surface);
}
.ez-bg-gradient-field .ez-color-field:focus-within, .ez-bg-custom .ez-color-field:focus-within { border-color: var(--ez-accent); }
.ez-bg-gradient-field .ez-color-wrap, .ez-bg-custom .ez-color-wrap { width: 26px; height: 26px; border-radius: 5px; }
.ez-bg-gradient-field .ez-hex-input, .ez-bg-custom .ez-hex-input {
  flex: 1; min-width: 0; width: 0; height: 26px; padding: 0; border: 0; border-radius: 0; background: transparent;
}
.ez-bg-gradient-preview { height: 42px; border: 1px solid var(--ez-border); border-radius: var(--ez-panel-radius); margin: var(--ez-panel-gap) 0; }
.ez-bg-gradient-apply { width: 100%; }

.ez-layer-list { display: flex; flex-direction: column; gap: 8px; }
.ez-layer-drag-handle {
  border: none; background: transparent; color: var(--ez-text-dim);
  padding: 0; width: 18px; height: 24px; flex-shrink: 0; font-size: 20px; cursor: grab;
}
.ez-layer-drag-handle:active { cursor: grabbing; }
.ez-layer-drag-handle:focus-visible { outline: 2px solid var(--ez-accent); border-radius: 4px; }
.ez-layer-item.ez-dragging { opacity: 0.45; }
.ez-layer-item.ez-drop-before { box-shadow: 0 -3px 0 -1px var(--ez-accent); }
.ez-layer-item.ez-drop-after { box-shadow: 0 3px 0 -1px var(--ez-accent); }
.ez-layer-item {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  min-height: 40px; padding: 8px; border-radius: var(--ez-panel-radius); border: 1px solid var(--ez-border); background: var(--ez-surface);
}
.ez-layer-item:hover { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
.ez-layer-item.ez-active { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
.ez-layer-name {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  font-size: 12px; font-weight: 500; cursor: pointer;
}
.ez-layer-name svg { width: 14px; height: 14px; fill: none; stroke: var(--ez-text-dim); flex-shrink: 0; }
.ez-layer-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ez-layer-actions { display: flex; flex-shrink: 0; gap: 2px; }
.ez-layer-actions .ez-icon-btn { width: 24px; height: 24px; color: var(--ez-text-dim); }
.ez-layer-actions .ez-icon-btn:hover { color: var(--ez-text); }

.ez-canvas-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.ez-viewport {
  flex: 1; overflow: auto; display: flex; position: relative;
  background: var(--ez-canvas-bg);
  background-image: radial-gradient(var(--ez-canvas-dot) 1px, transparent 1px);
  background-size: 22px 22px;
}
.ez-viewport.ez-panning { cursor: grabbing !important; }
.ez-stage-wrap {
  margin: auto;
  padding: 48px;
  min-width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ez-stage {
  position: relative; margin: 0; padding: 0;
  box-shadow: 0 2px 18px rgba(20, 20, 50, 0.14);
  flex-shrink: 0;
  touch-action: none;
}
.ez-stage canvas, .ez-overlay { touch-action: none; }
.ez-stage canvas { display: block; background: #fff; }
.ez-editor input, .ez-editor [contenteditable] { user-select: text; }
.ez-overlay { position: absolute; inset: 0; overflow: visible; pointer-events: none; }

.ez-sel-box {
  position: absolute; border: 1.6px solid var(--ez-accent);
  pointer-events: none;
}
.ez-sel-box.ez-multi { border-style: dashed; }
.ez-sel-name {
  position: absolute; transform: translate(0, -130%);
  background: var(--ez-accent); color: #fff; font-size: 11px; font-weight: 600;
  padding: 2px 7px; border-radius: 5px; white-space: nowrap;
}
.ez-handle {
  position: absolute; width: 11px; height: 11px; border-radius: 50%;
  background: #fff; border: 1.6px solid var(--ez-accent);
  pointer-events: auto; z-index: 5;
}
.ez-handle[data-dir='n'], .ez-handle[data-dir='s'] { cursor: ns-resize; left: 50%; margin-left: -5.5px; }
.ez-handle[data-dir='e'], .ez-handle[data-dir='w'] { cursor: ew-resize; top: 50%; margin-top: -5.5px; }
.ez-handle[data-dir='nw'], .ez-handle[data-dir='se'] { cursor: nwse-resize; }
.ez-handle[data-dir='ne'], .ez-handle[data-dir='sw'] { cursor: nesw-resize; }
.ez-handle[data-dir='nw'] { left: -6px; top: -6px; }
.ez-handle[data-dir='ne'] { right: -6px; top: -6px; }
.ez-handle[data-dir='se'] { right: -6px; bottom: -6px; }
.ez-handle[data-dir='sw'] { left: -6px; bottom: -6px; }
.ez-handle[data-dir='n'] { top: -6px; }
.ez-handle[data-dir='s'] { bottom: -6px; }
.ez-handle[data-dir='e'] { right: -6px; }
.ez-handle[data-dir='w'] { left: -6px; }
.ez-rotate-handle {
  position: absolute; left: 50%; top: -34px; width: 22px; height: 22px;
  margin-left: -11px; border-radius: 50%; background: #fff;
  border: 1.6px solid var(--ez-accent); pointer-events: auto; cursor: grab; z-index: 5;
  display: flex; align-items: center; justify-content: center;
}
.ez-rotate-handle::after {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--ez-accent);
}
.ez-guide { position: absolute; background: #f43f8e; pointer-events: none; z-index: 8; }
.ez-guide.ez-guide-x { width: 1.5px; }
.ez-guide.ez-guide-y { height: 1.5px; }
.ez-band {
  position: absolute; display: none; border: 1px solid var(--ez-accent);
  background: rgba(217, 119, 6, 0.1); pointer-events: none; z-index: 4;
}
.ez-text-editor {
  position: absolute; outline: 1.6px solid var(--ez-accent);
  background: transparent; cursor: text; pointer-events: auto;
  white-space: pre-wrap; word-break: break-word; overflow: hidden;
  user-select: text; z-index: 10; caret-color: #000;
}

.ez-pagesbar {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 12px; background: var(--ez-panel);
  border-top: 1px solid var(--ez-border); flex-shrink: 0; flex-wrap: wrap; z-index: 20;
}
.ez-page-chip {
  display: flex; align-items: center; gap: 7px;
  border: 1.5px solid var(--ez-border); background: var(--ez-surface); border-radius: 8px;
  padding: 5px 10px; font-size: 12px; font-weight: 600; color: var(--ez-text-dim);
}
.ez-page-chip:hover { border-color: var(--ez-border-strong); }
.ez-page-chip.ez-active { border-color: var(--ez-accent); color: var(--ez-text); background: var(--ez-accent-soft); }
.ez-page-num {
  width: 18px; height: 18px; border-radius: 5px; background: var(--ez-hover);
  display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
}
.ez-page-chip.ez-active .ez-page-num { background: var(--ez-accent); color: #fff; }
.ez-page-chip.ez-dragging { opacity: 0.45; }
.ez-page-chip.ez-drop-before { box-shadow: -3px 0 0 -1px var(--ez-accent); }
.ez-page-chip.ez-drop-after { box-shadow: 3px 0 0 -1px var(--ez-accent); }
.ez-page-actions { display: flex; align-items: center; gap: 2px; margin-left: 6px; }

.ez-floating-toolbar {
  position: absolute; display: none; align-items: center; gap: 6px;
  background: var(--ez-panel); border: 1px solid var(--ez-border);
  border-radius: 10px; padding: 6px 8px; z-index: 40;
  box-shadow: 0 6px 24px rgba(20, 20, 50, 0.16);
  max-width: calc(100% - 16px); flex-wrap: wrap;
}
.ez-tool-toggle {
  min-width: 30px; height: 30px; border: none; border-radius: 7px;
  background: transparent; color: var(--ez-text); font-size: 13px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 6px;
}
.ez-tool-toggle svg { width: 16px; height: 16px; fill: none; stroke: currentColor; }
.ez-tool-toggle:hover { background: var(--ez-hover); }
.ez-tool-toggle.ez-active { background: var(--ez-accent-soft); color: var(--ez-accent); }
.ez-toolbar-sep-actions { display: flex; align-items: center; gap: 2px; border-left: 1px solid var(--ez-border); padding-left: 6px; }
.ez-input {
  height: 30px; border: 1px solid var(--ez-border); border-radius: 7px;
  padding: 0 7px; font-size: 12.5px; background: var(--ez-surface); color: var(--ez-text); font-family: inherit;
}
.ez-input:focus { outline: none; border-color: var(--ez-accent); }
.ez-font-select { width: 132px; }
.ez-num-wrap { display: inline-flex; align-items: center; gap: 4px; }
.ez-num-label { font-size: 11px; font-weight: 600; color: var(--ez-text-dim); }
.ez-num-input { width: 56px; }
.ez-color-wrap {
  display: block; position: relative; width: 30px; height: 30px; border-radius: 7px;
  border: 1px solid var(--ez-border); overflow: hidden; cursor: pointer; flex-shrink: 0;
}
.ez-color-wrap:focus-within { outline: 2px solid var(--ez-accent); outline-offset: 2px; }
.ez-color-input {
  position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
  border: none; padding: 0; opacity: 0; cursor: pointer;
}
.ez-color-field { display: inline-flex; align-items: center; gap: 4px; }
.ez-hex-input {
  width: 62px; padding: 2px 6px; font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ez-menu {
  position: absolute; z-index: 100; min-width: 190px;
  background: var(--ez-panel); border: 1px solid var(--ez-border); border-radius: 10px;
  box-shadow: 0 8px 30px rgba(20, 20, 50, 0.18); padding: 5px;
}
.ez-menu-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 7px; font-size: 13px; font-weight: 500;
  cursor: pointer; color: var(--ez-text);
}
.ez-menu-item svg { width: 15px; height: 15px; fill: none; stroke: currentColor; opacity: 0.75; }
.ez-menu-item:hover { background: var(--ez-accent-soft); }
.ez-menu-item.ez-danger { color: var(--ez-danger); }
.ez-menu-item.ez-danger:hover { background: var(--ez-danger-soft); }
.ez-menu-item.ez-disabled { opacity: 0.45; pointer-events: none; }
.ez-menu-shortcut { margin-left: auto; font-size: 11px; color: var(--ez-text-dim); }
.ez-menu-sep { height: 1px; background: var(--ez-border); margin: 5px 8px; }

.ez-editor.ez-dark {
  --ez-accent-soft: #3f2d12;
  --ez-bg: #17181d;
  --ez-panel: #23252b;
  --ez-border: #383a41;
  --ez-text: #e8e9ee;
  --ez-text-dim: #9a9da8;
  --ez-danger: #fb7185;
  --ez-surface: #2b2d34;
  --ez-surface-2: #26282e;
  --ez-surface-3: #303239;
  --ez-hover: #34363d;
  --ez-border-strong: #4a4c55;
  --ez-canvas-bg: #1d1e23;
  --ez-canvas-dot: #2c2d33;
  --ez-scrollbar: #43454d;
  --ez-danger-soft: #401f27;
}
.ez-editor.ez-dark .ez-stage { box-shadow: 0 2px 24px rgba(0, 0, 0, 0.5); }
.ez-editor.ez-dark .ez-floating-toolbar { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); }
.ez-editor.ez-dark .ez-menu { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55); }
.ez-editor.ez-dark .ez-swatch { border-color: rgba(255, 255, 255, 0.15); }
`;

  // src/core/editor.js
  var Editor = class extends Emitter {
    constructor(options = {}) {
      super();
      const target = typeof options.target === "string" ? document.querySelector(options.target) : options.target;
      if (!target) throw new Error('ezyreka: "target" element is required');
      if (target.__ezyreka) return target.__ezyreka;
      this.options = {
        width: 1080,
        height: 1080,
        name: "Untitled design",
        ...options,
        target
      };
      this.fileName = this.options.name;
      this.zoom = 1;
      this._themes = { ...options.themes || {} };
      this._appliedVars = [];
      const themeOption = typeof options.theme === "string" ? options.theme : "light";
      this.theme = themeOption === "dark" || themeOption === "light" || this._themes[themeOption] ? themeOption : "light";
      this.pageIndex = 0;
      this.selection = /* @__PURE__ */ new Set();
      this.clipboard = [];
      this._pasteCount = 0;
      this.uploads = [];
      this._guides = [];
      this._editing = false;
      this._measureCtx = document.createElement("canvas").getContext("2d");
      this.registry = createRegistry(options);
      if (Array.isArray(options.chartColors)) setChartColors(options.chartColors);
      this._pluginEntries = normalizePluginEntries(options.plugins);
      this._pendingPanels = [];
      this.doc = {
        version: 1,
        pages: [
          {
            id: uid("page"),
            width: this.options.width,
            height: this.options.height,
            background: { type: "solid", color: "#ffffff" },
            elements: []
          }
        ]
      };
      injectStyles();
      this._fontStylesheet = injectFonts(this.registry.googleFonts);
      this._buildDOM(target);
      this.setTheme(this.theme);
      this.history = options.history || new History();
      for (const method of ["push", "undo", "redo", "reset"]) {
        if (typeof this.history[method] !== "function") {
          throw new Error(`ezyreka: custom history must implement ${method}()`);
        }
      }
      this.history.push(deepClone(this.doc));
      this.interactions = new Interactions(this);
      this.plugins = new PluginManager(this, this._pluginEntries);
      try {
        this.plugins.initialize();
      } catch (error) {
        this.interactions?.destroy();
        target.__ezyreka = null;
        throw error;
      }
      const uiDefaults = {
        topbar: Topbar,
        sidepanel: Sidepanel,
        toolbar: Toolbar,
        contextMenu: ContextMenu,
        pagesBar: PagesBar
      };
      const uiSpec = options.ui === false ? {} : { ...uiDefaults, ...options.ui || {} };
      this.ui = {};
      for (const [key, Impl] of Object.entries(uiSpec)) {
        if (typeof Impl === "function") this.ui[key] = new Impl(this);
      }
      if (!this.ui.topbar) this.topbarEl.style.display = "none";
      if (!this.ui.sidepanel) this.sidepanelEl.style.display = "none";
      if (!this.ui.toolbar) this.toolbarEl.style.display = "none";
      if (!this.ui.pagesBar) this.pagesBarEl.style.display = "none";
      this.zoomFit();
      if (options.initialDoc) this.loadJSON(options.initialDoc);
      this._resizeObserver = new ResizeObserver(() => this.markDirty());
      this._resizeObserver.observe(this.viewport);
      target.__ezyreka = this;
      this._fontSet = document.fonts;
      this._onFontsChanged = () => {
        if (target.__ezyreka === this) this.markDirty();
      };
      this._fontStylesheet.addEventListener("load", this._onFontsChanged);
      this._fontSet?.addEventListener("loadingdone", this._onFontsChanged);
      this._fontSet?.addEventListener("loadingerror", this._onFontsChanged);
      this._fontSet?.ready?.then(this._onFontsChanged);
      queueMicrotask(() => {
        if (target.__ezyreka === this) this.emit("ready", this);
      });
    }
    _buildDOM(target) {
      target.classList.add("ez-editor");
      target.innerHTML = "";
      this.container = target;
      this.topbarEl = el("div", "ez-topbar", target);
      const body = el("div", "ez-body", target);
      this.sidepanelEl = el("div", "ez-sidepanel", body);
      const sidepanelRail = el("div", "ez-sidepanel-rail", this.sidepanelEl);
      el("div", "ez-sidepanel-tabs", sidepanelRail);
      el("div", "ez-sidepanel-content", this.sidepanelEl);
      const canvasWrap = el("div", "ez-canvas-wrap", body);
      this.viewport = el("div", "ez-viewport", canvasWrap);
      const stageWrap = el("div", "ez-stage-wrap", this.viewport);
      this.stage = el("div", "ez-stage", stageWrap);
      this.canvas = document.createElement("canvas");
      this.stage.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.overlay = el("div", "ez-overlay", this.stage);
      this.pagesBarEl = el("div", "ez-pagesbar", canvasWrap);
      this.toolbarEl = el("div", "ez-floating-toolbar", target);
      const fileInput = el("input", "ez-hidden", target);
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.multiple = true;
      this._fileInput = fileInput;
      fileInput.addEventListener("change", async () => {
        for (const file of [...fileInput.files]) await this.addUpload(file);
        fileInput.value = "";
      });
    }
    get page() {
      return this.doc.pages[clamp(this.pageIndex, 0, this.doc.pages.length - 1)];
    }
    getPage() {
      return this.page;
    }
    getElements() {
      return this.page.elements;
    }
    markDirty() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        this.render();
      });
    }
    render() {
      const pw = this.page.width;
      const ph = this.page.height;
      const dpr = window.devicePixelRatio || 1;
      const cssW = pw * this.zoom;
      const cssH = ph * this.zoom;
      this.stage.style.width = cssW + "px";
      this.stage.style.height = cssH + "px";
      const bw = Math.max(1, Math.round(cssW * dpr));
      const bh = Math.max(1, Math.round(cssH * dpr));
      if (this.canvas.width !== bw || this.canvas.height !== bh) {
        this.canvas.width = bw;
        this.canvas.height = bh;
        this.canvas.style.width = cssW + "px";
        this.canvas.style.height = cssH + "px";
      }
      this.ctx.setTransform(this.zoom * dpr, 0, 0, this.zoom * dpr, 0, 0);
      renderPage(this.ctx, this.page, { registry: this.registry });
      if (!this._editing && this.interactions?.drag?.mode !== "band") this.updateOverlay();
      this.ui?.toolbar?.update();
    }
    updateOverlay() {
      const ov = this.overlay;
      ov.innerHTML = "";
      for (const g of this._guides) {
        const line = el("div", "ez-guide " + (g.axis === "x" ? "ez-guide-x" : "ez-guide-y"), ov);
        if (g.axis === "x") {
          line.style.left = g.v * this.zoom - 0.75 + "px";
          line.style.top = g.from * this.zoom + "px";
          line.style.height = (g.to - g.from) * this.zoom + "px";
        } else {
          line.style.top = g.v * this.zoom - 0.75 + "px";
          line.style.left = g.from * this.zoom + "px";
          line.style.width = (g.to - g.from) * this.zoom + "px";
        }
      }
      const sel = this.getSelected();
      if (!sel.length) return;
      const z = this.zoom;
      if (sel.length === 1) {
        const elx = sel[0];
        const box2 = el("div", "ez-sel-box", ov);
        Object.assign(box2.style, {
          left: elx.x * z + "px",
          top: elx.y * z + "px",
          width: elx.w * z + "px",
          height: elx.h * z + "px",
          transform: `rotate(${elx.rotation || 0}deg)`,
          transformOrigin: "50% 50%"
        });
        const label2 = el("div", "ez-sel-name", box2);
        label2.textContent = elementName(elx, this.registry);
        for (const dir of ["nw", "n", "ne", "e", "se", "s", "sw", "w"]) {
          const h = el("div", "ez-handle", box2);
          h.dataset.dir = dir;
          h.addEventListener("pointerdown", (e) => this.interactions.startResize(e, dir));
        }
        const rot = el("div", "ez-rotate-handle", box2);
        rot.title = "Rotate";
        rot.addEventListener("pointerdown", (e) => this.interactions.startRotate(e));
      } else {
        const bbox = selectionBBox(sel);
        const box2 = el("div", "ez-sel-box ez-multi", ov);
        Object.assign(box2.style, {
          left: bbox.x * z + "px",
          top: bbox.y * z + "px",
          width: bbox.w * z + "px",
          height: bbox.h * z + "px"
        });
      }
    }
    setGuides(guides) {
      this._guides = guides || [];
      if (!this._editing) this.updateOverlay();
    }
    select(ids, { silent = false } = {}) {
      this.selection = new Set(ids);
      if (!silent) {
        this.emit("selection", this.getSelected());
        this.markDirty();
      }
    }
    toggleSelect(id) {
      const next = new Set(this.selection);
      next.has(id) ? next.delete(id) : next.add(id);
      this.select([...next]);
    }
    selectAll() {
      this.select(
        this.getElements().filter((e2) => !e2.locked && !e2.hidden).map((e2) => e2.id)
      );
    }
    clearSelection() {
      if (this._editing) this.commitTextEdit();
      if (this.selection.size) this.select([]);
    }
    getSelected() {
      return this.getElements().filter((e2) => this.selection.has(e2.id));
    }
    hitTestElement(elx, wx, wy) {
      return hitTest(elx, wx, wy, 4, this.registry);
    }
    viewportCenter() {
      const canvasRect = this.canvas.getBoundingClientRect();
      const vRect = this.viewport.getBoundingClientRect();
      return {
        x: (vRect.left + vRect.width / 2 - canvasRect.left) / this.zoom,
        y: (vRect.top + vRect.height / 2 - canvasRect.top) / this.zoom
      };
    }
    addElement(props = {}) {
      if (!hasElementType(props.type, this.registry)) {
        throw new Error(`ezyreka: unknown element type "${props.type}"`);
      }
      const center = this.viewportCenter();
      const elx = createElement(props.type, props, this.registry);
      if (props.x === void 0) elx.x = Math.round(center.x - elx.w / 2);
      if (props.y === void 0) elx.y = Math.round(center.y - elx.h / 2);
      this.page.elements.push(elx);
      this.markDirty();
      this.commit();
      return elx;
    }
    addText(props = {}) {
      const elx = this.addElement({ type: "text", ...props });
      elx.__fresh = true;
      return elx;
    }
    updateSelected(props, commit = true) {
      const selected = this.getSelected();
      const manifests = allManifests(this.registry);
      const exclusiveKey = Object.keys(props).find((key) => Object.values(manifests).some((m) => m.exclusiveProps && key in m.exclusiveProps));
      if (exclusiveKey !== void 0) {
        const entry = Object.values(manifests).find((m) => m.exclusiveProps && exclusiveKey in m.exclusiveProps);
        const types = new Set(Object.entries(manifests).filter(([, m]) => m.exclusiveProps && exclusiveKey in m.exclusiveProps).map(([type]) => type));
        const targets = selected.filter((item) => types.has(item.type) && !item.locked);
        if (!targets.length) return;
        const value = entry.exclusiveProps[exclusiveKey](props[exclusiveKey], this.registry);
        targets.forEach((item) => Object.assign(item, props, { [exclusiveKey]: value }));
      } else selected.forEach((elx) => Object.assign(elx, props));
      this.markDirty();
      if (commit) this.commit();
    }
    commit() {
      this.history.push(deepClone(this.doc));
      this.emit("change", { doc: this.doc, selection: this.getSelected() });
    }
    deleteSelected() {
      const ids = this.selection;
      if (!ids.size) return;
      this.page.elements = this.page.elements.filter((e2) => !ids.has(e2.id));
      this.clearSelection();
      this.markDirty();
      this.commit();
    }
    duplicateSelected() {
      const sel = this.getSelected();
      if (!sel.length) return;
      const clones = sel.map((elx) => {
        const clone = createElement(elx.type, { ...deepClone(elx), id: void 0, x: elx.x + 24, y: elx.y + 24 }, this.registry);
        return clone;
      });
      this.page.elements.push(...clones);
      this.select(clones.map((c) => c.id));
      this.markDirty();
      this.commit();
    }
    copy() {
      const sel = this.getSelected();
      if (sel.length) {
        this.clipboard = deepClone(sel);
        this._pasteCount = 0;
      }
    }
    cut() {
      this.copy();
      this.deleteSelected();
    }
    paste() {
      if (!this.clipboard.length) return;
      const offset = 24 * (++this._pasteCount || 1);
      const clones = this.clipboard.map(
        (elx) => createElement(elx.type, { ...deepClone(elx), id: void 0, x: elx.x + offset, y: elx.y + offset }, this.registry)
      );
      this.page.elements.push(...clones);
      this.select(clones.map((c) => c.id));
      this.markDirty();
      this.commit();
    }
    _reorder(fn) {
      const els = this.page.elements;
      const indices = this.getSelected().map((elx) => els.indexOf(elx)).filter((i) => i >= 0).sort((a, b) => a - b);
      if (!indices.length) return;
      fn(els, indices);
      this.markDirty();
      this.commit();
    }
    bringToFront() {
      this._reorder((els, idx) => {
        const picked = idx.map((i) => els[i]);
        this.page.elements = els.filter((e2) => !picked.includes(e2)).concat(picked);
      });
    }
    bringForward() {
      this._reorder((els, idx) => {
        for (let i = idx.length - 1; i >= 0; i--) {
          const j = idx[i];
          if (j < els.length - 1 && !idx.includes(j + 1)) {
            [els[j], els[j + 1]] = [els[j + 1], els[j]];
          }
        }
      });
    }
    sendBackward() {
      this._reorder((els, idx) => {
        for (const i of idx) {
          if (i > 0 && !idx.includes(i - 1)) {
            [els[i], els[i - 1]] = [els[i - 1], els[i]];
          }
        }
      });
    }
    sendToBack() {
      this._reorder((els, idx) => {
        const picked = idx.map((i) => els[i]);
        this.page.elements = picked.concat(els.filter((e2) => !picked.includes(e2)));
      });
    }
    moveLayer(from, to) {
      const els = this.getElements();
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || to < 0 || from >= els.length || to >= els.length) return;
      const [item] = els.splice(from, 1);
      els.splice(to, 0, item);
      this.markDirty();
      this.commit();
    }
    toggleLock() {
      const sel = this.getSelected();
      if (!sel.length) return;
      const lock = !sel.every((s) => s.locked);
      sel.forEach((s) => s.locked = lock);
      this.commit();
      this.markDirty();
    }
    setZoom(zoom, anchor) {
      const z = clamp(zoom, 0.05, 5);
      if (z === this.zoom) return;
      const vRect = this.viewport.getBoundingClientRect();
      const a = anchor || { x: vRect.left + vRect.width / 2, y: vRect.top + vRect.height / 2 };
      const canvasRect = this.canvas.getBoundingClientRect();
      const wx = (a.x - canvasRect.left) / this.zoom;
      const wy = (a.y - canvasRect.top) / this.zoom;
      this.zoom = z;
      this.render();
      const rect2 = this.canvas.getBoundingClientRect();
      this.viewport.scrollLeft += rect2.left + wx * z - a.x;
      this.viewport.scrollTop += rect2.top + wy * z - a.y;
      this.emit("zoom", z);
    }
    zoomFit() {
      const pw = this.page.width;
      const ph = this.page.height;
      const vRect = this.viewport.getBoundingClientRect();
      if (!vRect.width || !vRect.height) {
        this.zoom = 1;
        this.render();
        this.emit("zoom", this.zoom);
        return;
      }
      const z = clamp(Math.min((vRect.width - 96) / pw, (vRect.height - 96) / ph), 0.05, 2);
      this.zoom = z;
      this.render();
      this.viewport.scrollLeft = (this.viewport.scrollWidth - this.viewport.clientWidth) / 2;
      this.viewport.scrollTop = (this.viewport.scrollHeight - this.viewport.clientHeight) / 2;
      this.emit("zoom", z);
    }
    fitTextHeight(elx) {
      if (elx.type !== "text") return;
      const lines = measureTextElement(this._measureCtx, elx);
      const needed = lines.length * elx.fontSize * elx.lineHeight + 6;
      if (needed > elx.h) elx.h = Math.round(needed);
    }
    startTextEdit(elx) {
      if (this._editing) this.commitTextEdit();
      this._editing = true;
      this.editingId = elx.id;
      const z = this.zoom;
      const ed = el("div", "ez-text-editor", this.overlay);
      ed.contentEditable = "true";
      ed.innerText = elx.text || "";
      Object.assign(ed.style, {
        left: elx.x * z + "px",
        top: elx.y * z + "px",
        width: elx.w * z + "px",
        minHeight: elx.h * z + "px",
        fontFamily: elx.fontFamily,
        fontSize: elx.fontSize * z + "px",
        fontWeight: elx.fontWeight,
        fontStyle: elx.italic ? "italic" : "normal",
        textDecoration: elx.underline ? "underline" : "none",
        lineHeight: String(elx.lineHeight),
        letterSpacing: (elx.letterSpacing || 0) * z + "px",
        color: elx.color,
        textAlign: elx.align,
        transform: `rotate(${elx.rotation || 0}deg)`,
        transformOrigin: "50% 50%"
      });
      this._textEditorEl = ed;
      ed.addEventListener("input", () => {
        elx.text = ed.innerText.replace(/\n$/, "");
        this.markDirty();
      });
      ed.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          this.commitTextEdit();
        }
        e.stopPropagation();
      });
      ed.addEventListener("blur", () => this.commitTextEdit());
      this.ui.toolbar?.update();
      ed.focus();
      if (elx.__fresh) {
        const range = document.createRange();
        range.selectNodeContents(ed);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
        delete elx.__fresh;
      } else {
        const range = document.createRange();
        range.selectNodeContents(ed);
        range.collapse(false);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
      }
    }
    commitTextEdit() {
      if (!this._editing) return;
      const ed = this._textEditorEl;
      const elx = this.getElements().find((e2) => e2.id === this.editingId);
      this._editing = false;
      this._textEditorEl = null;
      this.editingId = null;
      if (ed) ed.remove();
      if (elx) {
        elx.text = (elx.text || "").replace(/\n+$/, "");
        if (!elx.text.trim()) {
          this.page.elements = this.page.elements.filter((e2) => e2.id !== elx.id);
          this.select([]);
        } else {
          this.fitTextHeight(elx);
        }
      }
      this.markDirty();
      this.commit();
    }
    undo() {
      const snap = this.history.undo(deepClone(this.doc));
      if (!snap) return;
      this._applySnapshot(snap);
    }
    redo() {
      const snap = this.history.redo(deepClone(this.doc));
      if (!snap) return;
      this._applySnapshot(snap);
    }
    _applySnapshot(snap) {
      if (this._editing) this.commitTextEdit();
      this.doc = snap;
      this.pageIndex = clamp(this.pageIndex, 0, this.doc.pages.length - 1);
      this.selection = /* @__PURE__ */ new Set();
      this.emit("selection", []);
      this.markDirty();
      this.emit("change", { doc: this.doc, selection: [] });
    }
    getJSON() {
      return deepClone(this.doc);
    }
    loadJSON(doc) {
      if (!doc || !Array.isArray(doc.pages) || !doc.pages.length) {
        throw new Error("Invalid design document");
      }
      this.doc = {
        version: 1,
        pages: doc.pages.map((p) => ({
          id: uid("page"),
          width: p.width || this.options.width,
          height: p.height || this.options.height,
          background: p.background || { type: "solid", color: "#ffffff" },
          elements: (p.elements || []).map((e2) => createElement(e2.type, e2, this.registry))
        }))
      };
      if (typeof doc.name === "string" && doc.name) this.setFileName(doc.name);
      this.pageIndex = 0;
      this.selection = /* @__PURE__ */ new Set();
      this.history.reset();
      this.history.push(deepClone(this.doc));
      this.emit("selection", []);
      this.zoomFit();
      this.emit("change", { doc: this.doc, selection: [] });
    }
    applyTemplate(tpl) {
      if (!tpl || typeof tpl !== "object" || !tpl.page || !Number.isFinite(tpl.page.width) || !Number.isFinite(tpl.page.height) || !Array.isArray(tpl.page.elements)) {
        throw new Error("ezyreka: templates need { name, page: { width, height, elements } }");
      }
      if (this._editing) this.commitTextEdit();
      this.doc = {
        version: 1,
        pages: [
          {
            id: uid("page"),
            width: tpl.page.width,
            height: tpl.page.height,
            background: deepClone(tpl.page.background),
            elements: tpl.page.elements.map((e2) => createElement(e2.type, e2, this.registry))
          }
        ]
      };
      this.pageIndex = 0;
      this.selection = /* @__PURE__ */ new Set();
      this.emit("selection", []);
      this.commit();
      this.zoomFit();
    }
    resizeCanvas(width, height) {
      if (![width, height].every((value) => Number.isInteger(value) && value >= 1 && value <= 1e4)) {
        throw new RangeError("Canvas dimensions must be whole numbers from 1 to 10000 pixels.");
      }
      if (this.page.width === width && this.page.height === height) return;
      if (this._editing) this.commitTextEdit();
      this.page.width = width;
      this.page.height = height;
      this.zoomFit();
      this.commit();
    }
    setBackground(bg, commit = true) {
      this.page.background = bg;
      this.markDirty();
      if (commit) this.commit();
    }
    addUpload(file) {
      return readAsDataURL(file).then((src) => {
        this.uploads.push({ id: uid("up"), src, name: file.name });
        this.emit("upload", this.uploads);
        return src;
      });
    }
    openFilePicker() {
      this._fileInput.click();
    }
    pickImageFile() {
      return new Promise((resolve) => {
        const input = el("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";
        document.body.appendChild(input);
        input.onchange = () => {
          resolve(input.files[0] || null);
          input.remove();
        };
        input.click();
      });
    }
    // ---- Customization: register assets on this editor's registry ----
    registerTemplates(templates) {
      const list = Array.isArray(templates) ? templates : [templates];
      for (const tpl of list) {
        if (!tpl || typeof tpl !== "object" || !tpl.page || !Number.isFinite(tpl.page.width) || !Number.isFinite(tpl.page.height) || !Array.isArray(tpl.page.elements)) {
          throw new Error("ezyreka: templates need { name, page: { width, height, elements } }");
        }
      }
      this.registry.templates.push(...list.map((tpl) => deepClone(tpl)));
      this._refreshPanels("templates");
    }
    registerFont(name, { google } = {}) {
      if (typeof name !== "string" || !name.trim()) {
        throw new Error("ezyreka: registerFont needs a font family name");
      }
      name = name.trim();
      if (!this.registry.fonts.includes(name)) this.registry.fonts.push(name);
      if (google) {
        const family = typeof google === "string" && google.trim() ? google.trim() : name.replace(/ /g, "+");
        const spec = /[:@]/.test(family) ? family : `${family}:wght@400;600;700`;
        if (!this.registry.googleFonts.includes(spec)) this.registry.googleFonts.push(spec);
        injectFonts(this.registry.googleFonts);
      }
      this._refreshPanels("text");
      return name;
    }
    registerIcons(icons) {
      if (!icons || typeof icons !== "object") {
        throw new Error("ezyreka: registerIcons needs { name: pathOrPathPair }");
      }
      for (const [name, def] of Object.entries(icons)) {
        const solid = typeof def === "string" ? def : def?.solid;
        const outline = typeof def === "string" ? def : def?.outline;
        if (typeof solid !== "string") {
          throw new Error(`ezyreka: icon "${name}" needs an SVG path string`);
        }
        this.registry.icons[name] = solid;
        this.registry.iconOutlines[name] = typeof outline === "string" ? outline : solid;
      }
      this._refreshPanels("elements");
    }
    registerShapes(shapes) {
      const list = Array.isArray(shapes) ? shapes : [shapes];
      const entries = list.map((item) => {
        if (!item || typeof item.label !== "string") {
          throw new Error("ezyreka: shapes need at least { label }");
        }
        const entry = { type: item.type || "shape", label: item.label, props: item.props };
        if (typeof item.path === "string") {
          const name = item.shape || item.label.toLowerCase().replace(/\s+/g, "-");
          this.registry.shapePaths[name] = item.path;
          entry.svg = item.svg || `<path d="${item.path}" transform="translate(8 8) scale(.84)" fill-rule="evenodd" />`;
          entry.props = item.props || { shape: name };
        } else {
          if (typeof item.svg !== "string") {
            throw new Error(`ezyreka: shape "${item.label}" needs "path" or "svg"`);
          }
          entry.svg = item.svg;
        }
        return entry;
      });
      this.registry.shapes.push(...entries);
      this._refreshPanels("elements");
    }
    // ---- Customization: extend rendering, panels and image sources ----
    /** Overrides or adds the canvas renderer for an element type: fn(ctx, el, registry). */
    registerElementRenderer(type, renderer) {
      registerElementRenderer(type, renderer);
      this.registry.elementRenderers[type] = renderer;
      this.markDirty();
    }
    /** Registers a brand-new element type: { defaults, manifest, render }. */
    registerElementType(type, def = {}) {
      registerElementType(type, { defaults: def.defaults, manifest: def.manifest });
      if (typeof def.render === "function") {
        registerElementRenderer(type, def.render);
        this.registry.elementRenderers[type] = def.render;
      }
      this._refreshPanels("layers");
    }
    /** Overrides or adds the painter for a chart type: fn(ctx, chart, series, plotBox, font, bounds). */
    registerChartRenderer(type, renderer) {
      registerChartRenderer(type, renderer);
      this.registry.chartRenderers[type] = renderer;
      this.markDirty();
    }
    /**
     * Registers a brand-new chart type: a preset ({ type, label, group, kind,
     * circular, multiSeries, validate }) plus an optional painter. It becomes
     * available in the gallery, type dropdown, normalization and validation.
     */
    registerChartType(preset, renderFn) {
      registerChartPreset(preset);
      if (typeof renderFn === "function") this.registerChartRenderer(preset.type, renderFn);
      this._refreshPanels("charts");
      return preset;
    }
    /** Replaces this editor's color swatches; entries are hex strings or { label, colors } groups. */
    registerPalette(palette) {
      if (!Array.isArray(palette) || !palette.length) {
        throw new Error("ezyreka: registerPalette needs a non-empty array");
      }
      this.registry.palette = palette;
      this._refreshPanels("background");
    }
    /** Registers a background type painter: fn(ctx, bg, pageWidth, pageHeight). */
    registerBackgroundPainter(type, painter) {
      registerBackgroundPainter(type, painter);
      this.registry.backgroundPainters[type] = painter;
      this.markDirty();
    }
    /** Extends or overrides an element type's capability manifest. */
    registerElementManifest(type, manifest) {
      registerElementManifest(type, manifest);
      this._refreshPanels("layers");
    }
    /** Adds a sidebar tab: { id, label, icon, render(contentEl, editor) }. */
    registerPanel(panel) {
      if (!this.ui.sidepanel) {
        throw new Error("ezyreka: registerPanel requires the sidepanel UI module");
      }
      this.ui.sidepanel.registerPanel(panel);
    }
    /** Registers an existing image (URL or data URL) into the uploads library. */
    registerImage(image) {
      const src = typeof image === "string" ? image : image?.src;
      const name = typeof image === "object" && image?.name || "Image";
      if (typeof src !== "string" || !src) {
        throw new Error("ezyreka: registerImage needs a src string or { src, name }");
      }
      const entry = { id: uid("up"), src, name };
      this.uploads.push(entry);
      this.emit("upload", this.uploads);
      return entry;
    }
    /** Adds an image source provider: { id, label?, search(query) => [{ src, name, thumb? }] }. */
    registerImageSource(source) {
      if (!source || typeof source.id !== "string" || typeof source.search !== "function") {
        throw new Error("ezyreka: image sources need { id, search(query) }");
      }
      this.registry.imageSources.push(source);
      this._refreshPanels("uploads");
      return source;
    }
    _refreshPanels(...tabs) {
      if (this.ui?.sidepanel && tabs.includes(this.ui.sidepanel.activeTab)) {
        this.ui.sidepanel.rerender();
      }
      if (this.ui?.toolbar) this.ui.toolbar.lastSig = null;
    }
    /** Registers a named theme from CSS custom properties, usable via setTheme(). */
    registerTheme(name, vars) {
      if (typeof name !== "string" || !name || typeof vars !== "object" || !vars) {
        throw new Error("ezyreka: registerTheme needs a name and a CSS variables object");
      }
      this._themes[name] = vars;
      return name;
    }
    setTheme(theme) {
      const custom = this._themes[theme];
      if (theme !== "dark" && theme !== "light" && !custom) return;
      this.theme = theme;
      this.container.classList.toggle("ez-dark", theme === "dark");
      for (const name of this._appliedVars) this.container.style.removeProperty(name);
      this._appliedVars = [];
      const vars = { ...this.options.cssVars || {}, ...custom || {} };
      for (const [name, value] of Object.entries(vars)) {
        this.container.style.setProperty(name, String(value));
        this._appliedVars.push(name);
      }
      this.emit("theme", theme);
    }
    toggleTheme() {
      this.setTheme(this.theme === "dark" ? "light" : "dark");
    }
    setFileName(name) {
      this.fileName = name;
      this.emit("rename", name);
    }
    addPage() {
      const page = {
        id: uid("page"),
        width: this.page.width,
        height: this.page.height,
        background: { type: "solid", color: "#ffffff" },
        elements: []
      };
      this.doc.pages.splice(this.pageIndex + 1, 0, page);
      this.pageIndex += 1;
      this.clearSelection();
      this.markDirty();
      this.commit();
      this.emit("page", this.pageIndex);
    }
    duplicatePage() {
      const src = this.page;
      const page = {
        id: uid("page"),
        width: src.width,
        height: src.height,
        background: deepClone(src.background),
        elements: src.elements.map((e2) => createElement(e2.type, e2, this.registry))
      };
      this.doc.pages.splice(this.pageIndex + 1, 0, page);
      this.pageIndex += 1;
      this.clearSelection();
      this.markDirty();
      this.commit();
      this.emit("page", this.pageIndex);
    }
    deletePage(index = this.pageIndex) {
      if (this.doc.pages.length <= 1) return;
      this.doc.pages.splice(index, 1);
      this.pageIndex = clamp(this.pageIndex, 0, this.doc.pages.length - 1);
      this.clearSelection();
      this.markDirty();
      this.commit();
      this.emit("page", this.pageIndex);
    }
    movePage(from, to) {
      const n = this.doc.pages.length;
      if (from === to || from < 0 || from >= n || to < 0 || to >= n) return;
      if (this._editing) this.commitTextEdit();
      const [page] = this.doc.pages.splice(from, 1);
      this.doc.pages.splice(to, 0, page);
      if (this.pageIndex === from) this.pageIndex = to;
      else if (from < this.pageIndex && to >= this.pageIndex) this.pageIndex -= 1;
      else if (from > this.pageIndex && to <= this.pageIndex) this.pageIndex += 1;
      this.clearSelection();
      this.markDirty();
      this.commit();
      this.emit("page", this.pageIndex);
    }
    goToPage(index) {
      if (index < 0 || index >= this.doc.pages.length || index === this.pageIndex) return;
      if (this._editing) this.commitTextEdit();
      const sizeChanged = this.page.width !== this.doc.pages[index].width || this.page.height !== this.doc.pages[index].height;
      this.pageIndex = index;
      this.clearSelection();
      this.markDirty();
      if (sizeChanged) this.zoomFit();
      this.emit("page", index);
    }
    async _renderPageToCanvas(page, scale, transparent) {
      const srcs = [];
      if (page.background?.type === "image" && page.background.src) srcs.push(page.background.src);
      for (const e2 of page.elements) {
        for (const prop of manifestFor(e2.type, this.registry).preloadProps || []) {
          if (e2[prop]) srcs.push(e2[prop]);
        }
      }
      await whenImagesReady(srcs);
      await (document.fonts?.ready || Promise.resolve());
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(page.width * scale);
      canvas.height = Math.round(page.height * scale);
      const ctx = canvas.getContext("2d");
      if (!transparent) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.scale(scale, scale);
      renderPage(ctx, page, {
        transparent: transparent && page.background?.type !== "image",
        registry: this.registry
      });
      return canvas;
    }
    // Collects the capabilities a page needs that this editor cannot resolve:
    // unknown element/chart/background types and unregistered shapes or icons.
    // Only visible content blocks an export.
    _missingCapabilities(page) {
      const registry = this.registry;
      const issues = [];
      const bgType = page.background && page.background.type || "solid";
      if (!["solid", "gradient", "image"].includes(bgType) && !registry.backgroundPainters[bgType]) {
        issues.push(`background type "${bgType}"`);
      }
      for (const el2 of page.elements) {
        if (el2.hidden) continue;
        if (el2.__unresolved || !hasElementType(el2.type, registry)) {
          issues.push(`element type "${el2.__missingType || el2.type}"`);
          continue;
        }
        if (el2.type === "shape" && el2.shape && registry.shapePaths[el2.shape] === void 0 && SHAPE_PATHS[el2.shape] === void 0) {
          issues.push(`shape "${el2.shape}"`);
        }
        if (el2.type === "icon" && el2.icon) {
          const paths = el2.iconStyle === "outline" ? registry.iconOutlines || ICON_OUTLINES : registry.icons || ICONS;
          if (paths[el2.icon] === void 0) issues.push(`icon "${el2.icon}"`);
        }
        if (el2.type === "chart" && el2.chart?.type && !chartPreset(el2.chart.type, registry)) {
          issues.push(`chart type "${el2.chart.type}"`);
        }
      }
      return [...new Set(issues)];
    }
    _assertExportable(pages) {
      const problems = pages.map((page, index) => ({ index, issues: this._missingCapabilities(page) })).filter((p) => p.issues.length);
      if (!problems.length) return;
      const detail = problems.map((p) => `page ${p.index + 1}: ${p.issues.join(", ")}`).join("; ");
      throw new Error(
        `ezyreka: image export blocked by unresolved content (load the providing plugins or remove it): ${detail}`
      );
    }
    async exportImage(format = "png", { scale = 2, transparent = false, pageIndex = null } = {}) {
      const page = pageIndex === null ? this.page : this.doc.pages[clamp(pageIndex, 0, this.doc.pages.length - 1)];
      this._assertExportable([page]);
      const canvas = await this._renderPageToCanvas(page, scale, transparent && format === "png");
      const dataURL = canvas.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
      const ext = format === "jpeg" ? "jpg" : "png";
      downloadDataURL(dataURL, `${this.fileName.replace(/[^\w\- ]+/g, "").trim() || "design"}.${ext}`);
      this.emit("export", { format, scale });
      return dataURL;
    }
    async exportAllPages(format = "png", { scale = 2 } = {}) {
      this._assertExportable(this.doc.pages);
      for (let i = 0; i < this.doc.pages.length; i++) {
        const page = this.doc.pages[i];
        const canvas = await this._renderPageToCanvas(page, scale, false);
        canvas.toBlob((blob) => {
          const name = `${this.fileName.replace(/[^\w\- ]+/g, "").trim() || "design"}-page-${i + 1}.${format === "jpeg" ? "jpg" : "png"}`;
          downloadBlob(blob, name);
        }, format === "jpeg" ? "image/jpeg" : "image/png");
      }
    }
    downloadJSON() {
      const blob = new Blob([JSON.stringify({ name: this.fileName, ...this.getJSON() }, null, 2)], {
        type: "application/json"
      });
      downloadBlob(blob, `${this.fileName.replace(/[^\w\- ]+/g, "").trim() || "design"}.json`);
      this.emit("save", this.fileName);
    }
    destroy() {
      this._fontStylesheet?.removeEventListener("load", this._onFontsChanged);
      this._fontSet?.removeEventListener("loadingdone", this._onFontsChanged);
      this._fontSet?.removeEventListener("loadingerror", this._onFontsChanged);
      this.plugins?.dispose();
      this.interactions?.destroy();
      closeMenus(this);
      for (const module of Object.values(this.ui || {})) module?.destroy?.();
      if (this._editing) {
        this._editing = false;
        this._textEditorEl?.remove();
        this._textEditorEl = null;
      }
      this._resizeObserver?.disconnect();
      if (this._raf) cancelAnimationFrame(this._raf);
      this.container.__ezyreka = null;
      this.container.classList.remove("ez-editor");
      this.container.innerHTML = "";
      this._listeners.clear();
    }
  };

  // src/index.js
  var version = "1.0.0";
  function autoInit() {
    document.querySelectorAll("[data-ez-editor]").forEach((node) => {
      if (node.__ezyreka) return;
      const editor = new Editor({
        target: node,
        width: parseInt(node.dataset.ezWidth, 10) || 1080,
        height: parseInt(node.dataset.ezHeight, 10) || 1080,
        name: node.dataset.ezName || "Untitled design"
      });
      node.__ezyreka = editor;
    });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }
  }
  var index_default = { Editor, version, autoInit };
  return __toCommonJS(index_exports);
})();
//# sourceMappingURL=ezyreka.umd.js.map
