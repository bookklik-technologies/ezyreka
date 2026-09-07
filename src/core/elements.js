import { uid, rotatePoint, deg2rad } from './utils.js';
import { normalizeChart, validateChart, sampleChart, CHART_PRESETS } from './charts.js';

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
  rect: { fill: '#d97706', stroke: '', strokeWidth: 0, radius: 0 },
  ellipse: { fill: '#d97706', stroke: '', strokeWidth: 0 },
  triangle: { fill: '#d97706', stroke: '', strokeWidth: 0 },
  star: { fill: '#f59e0b', stroke: '', strokeWidth: 0 },
  hexagon: { fill: '#d97706', stroke: '', strokeWidth: 0 },
  diamond: { fill: '#d97706', stroke: '', strokeWidth: 0 },
  heart: { fill: '#ef4444', stroke: '', strokeWidth: 0 },
  line: { stroke: '#111827', strokeWidth: 4, arrow: false, w: 220, h: 0 },
  image: { src: '' },
  icon: { icon: 'star', iconStyle: 'solid', fill: '#111827', w: 120, h: 120 },
  shape: { shape: 'pentagon', fill: '#d97706', stroke: '', strokeWidth: 0 },
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

export function createElement(type, props = {}) {
  const defaults = TYPE_DEFAULTS[type];
  if (!defaults) throw new Error(`SenangDesign: unknown element type "${type}"`);
  const el = {
    ...BASE,
    ...JSON.parse(JSON.stringify(defaults)),
    ...props,
    id: props.id || uid(type),
    type
  };
  if (type === 'text' && !props.h) {
    el.h = Math.round(el.fontSize * el.lineHeight) + 8;
  }
  if (type === 'chart') el.chart = validateChart(props.chart ? normalizeChart(props.chart) : sampleChart());
  return el;
}

export function elementName(el) {
  if (el.type === 'chart') return el.chart?.title || `${CHART_PRESETS.find(p => p.type === el.chart?.type)?.label || 'Data'} chart`;
  if (el.type === 'text') {
    const t = (el.text || '').trim().replace(/\s+/g, ' ');
    return t ? (t.length > 22 ? t.slice(0, 22) + '…' : t) : 'Text';
  }
  if (el.type === 'icon') return 'Icon (' + el.icon + ')';
  if (el.type === 'shape') return (el.shape || 'Shape').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
  return TYPE_NAMES[el.type] || el.type;
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
  if (el.type === 'line') {
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
