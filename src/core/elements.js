import { uid, rotatePoint, deg2rad } from './utils.js';
import { normalizeChart, validateChart, sampleChart, CHART_PRESETS } from './charts.js';
import { ACCENT } from './constants.js';

const BASE = {
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

const TYPE_DEFAULTS = {
  text: {
    text: 'Your text here',
    fontSize: 48,
    fontFamily: 'Poppins',
    fontWeight: 600,
    italic: false,
    underline: false,
    align: 'left',
    color: '#111827',
    lineHeight: 1.3,
    letterSpacing: 0,
    w: 420,
    h: 64
  },
  rect: { fill: ACCENT, stroke: '', strokeWidth: 0, radius: 0 },
  ellipse: { fill: ACCENT, stroke: '', strokeWidth: 0 },
  triangle: { fill: ACCENT, stroke: '', strokeWidth: 0 },
  star: { fill: '#f59e0b', stroke: '', strokeWidth: 0 },
  hexagon: { fill: ACCENT, stroke: '', strokeWidth: 0 },
  diamond: { fill: ACCENT, stroke: '', strokeWidth: 0 },
  heart: { fill: '#ef4444', stroke: '', strokeWidth: 0 },
  line: { stroke: '#111827', strokeWidth: 4, arrow: false, w: 220, h: 0 },
  image: { src: '' },
  icon: { icon: 'star', iconStyle: 'solid', fill: '#111827', w: 120, h: 120 },
  shape: { shape: 'pentagon', fill: ACCENT, stroke: '', strokeWidth: 0 },
  chart: { w: 600, h: 400 }
};

const TYPE_NAMES = {
  text: 'Text',
  rect: 'Rectangle',
  ellipse: 'Ellipse',
  triangle: 'Triangle',
  star: 'Star',
  hexagon: 'Hexagon',
  diamond: 'Diamond',
  heart: 'Heart',
  line: 'Line',
  image: 'Image',
  icon: 'Icon',
  shape: 'Shape'
};

// Per-type capability manifest: one place describing display names, layer
// icons, double-click behavior, toolbar control groups, hit-testing and
// asset preloading. Consulted by the renderer-adjacent UI, interactions and
// the editor, so a new element type describes itself instead of scattering
// if-chains across modules. `name` may be a string or an element function.
export const ELEMENT_MANIFESTS = {
  text: {
    name: (el) => {
      const t = (el.text || '').trim().replace(/\s+/g, ' ');
      return t ? (t.length > 22 ? t.slice(0, 22) + '…' : t) : 'Text';
    },
    layerIcon: 'text',
    edit: 'text',
    autoFitHeight: true,
    toolbar: ['text', 'opacity'],
    create: (el, props) => {
      if (!props.h) el.h = Math.round(el.fontSize * el.lineHeight) + 8;
    }
  },
  rect: { name: 'Rectangle', toolbar: ['fill', 'opacity'], radius: true },
  ellipse: { name: 'Ellipse', toolbar: ['fill', 'opacity'] },
  triangle: { name: 'Triangle', toolbar: ['fill', 'opacity'] },
  star: { name: 'Star', toolbar: ['fill', 'opacity'] },
  hexagon: { name: 'Hexagon', toolbar: ['fill', 'opacity'] },
  diamond: { name: 'Diamond', toolbar: ['fill', 'opacity'] },
  heart: { name: 'Heart', toolbar: ['fill', 'opacity'] },
  line: { name: 'Line', hitTest: 'segment', toolbar: ['line'] },
  image: { name: 'Image', layerIcon: 'image', toolbar: ['opacity'], preloadProps: ['src'] },
  icon: {
    name: (el) => 'Icon (' + el.icon + ')',
    toolbar: ['fill', 'iconStyle', 'opacity']
  },
  shape: {
    name: (el) => (el.shape || 'Shape').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()),
    toolbar: ['fill', 'opacity']
  },
  chart: {
    name: (el) => el.chart?.title || `${CHART_PRESETS.find(p => p.type === el.chart?.type)?.label || 'Data'} chart`,
    layerIcon: 'chart',
    edit: 'chart',
    toolbar: ['chartEdit', 'opacity'],
    create: (el, props) => {
      el.chart = validateChart(props.chart ? normalizeChart(props.chart) : sampleChart());
    },
    // Props in this map target only this type; the value normalizes them.
    exclusiveProps: { chart: (c) => normalizeChart(validateChart(normalizeChart(c))) }
  }
};

export function manifestFor(type) {
  return ELEMENT_MANIFESTS[type] || {};
}

// Extends or overrides a type's manifest. Global (like setChartColors):
// manifests are behavior contracts, not per-instance assets.
export function registerElementManifest(type, partial = {}) {
  if (typeof type !== 'string' || !type) {
    throw new Error('ezyreka: registerElementManifest needs a type name');
  }
  if (typeof partial !== 'object' || !partial) {
    throw new Error('ezyreka: manifest must be an object');
  }
  ELEMENT_MANIFESTS[type] = { ...ELEMENT_MANIFESTS[type], ...partial };
}

// Registers a brand-new element type: defaults for the factory plus an
// optional manifest. Pair with registerElementRenderer for canvas output.
export function registerElementType(type, { defaults = {}, manifest = {} } = {}) {
  if (typeof type !== 'string' || !/^[a-z][a-z0-9-]*$/i.test(type)) {
    throw new Error('ezyreka: element type names must be simple identifiers');
  }
  if (TYPE_DEFAULTS[type]) throw new Error(`ezyreka: element type "${type}" already exists`);
  if (typeof defaults !== 'object' || !defaults) {
    throw new Error('ezyreka: element type defaults must be an object');
  }
  TYPE_DEFAULTS[type] = defaults;
  registerElementManifest(type, { name: type, ...manifest });
}

export function createElement(type, props = {}) {
  const defaults = TYPE_DEFAULTS[type];
  if (!defaults) throw new Error(`ezyreka: unknown element type "${type}"`);
  const el = {
    ...BASE,
    ...JSON.parse(JSON.stringify(defaults)),
    ...props,
    id: props.id || uid(type),
    type
  };
  const create = manifestFor(type).create;
  if (create) create(el, props);
  return el;
}

export function elementName(el) {
  const name = manifestFor(el.type).name;
  return typeof name === 'function' ? name(el) : (name || el.type);
}

export function elementCenter(el) {
  return { x: el.x + el.w / 2, y: el.y + el.h / 2 };
}

export function elementCorners(el) {
  const c = elementCenter(el);
  const r = deg2rad(el.rotation || 0);
  const pts = [
    { x: el.x, y: el.y },
    { x: el.x + el.w, y: el.y },
    { x: el.x + el.w, y: el.y + el.h },
    { x: el.x, y: el.y + el.h }
  ];
  return pts.map((p) => rotatePoint(p.x, p.y, c.x, c.y, r));
}

export function elementAABB(el) {
  if (!el.rotation) return { x: el.x, y: el.y, w: el.w, h: el.h };
  const pts = elementCorners(el);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

export function selectionBBox(elements) {
  const boxes = elements.map(elementAABB);
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function hitTest(el, wx, wy, tolerance = 4) {
  if (el.hidden || el.locked) return false;
  const c = elementCenter(el);
  const p = rotatePoint(wx, wy, c.x, c.y, deg2rad(-(el.rotation || 0)));
  // Undoing rotation leaves world coordinates; hit areas use the element's local origin.
  p.x -= el.x;
  p.y -= el.y;
  if (manifestFor(el.type).hitTest === 'segment') {
    const tol = Math.max(10, (el.strokeWidth || 4) + tolerance);
    return distToSegment(p.x, p.y, 0, 0, el.w, el.h) <= tol;
  }
  return p.x >= -tolerance && p.y >= -tolerance && p.x <= el.w + tolerance && p.y <= el.h + tolerance;
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

export function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
