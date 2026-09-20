import { deg2rad, clamp, hexOr } from './utils.js';
import { drawChart } from './chart-renderer.js';
import { ICONS, ICON_OUTLINES, SHAPE_PATHS } from './assets.js';
import { DEFAULT_FONT, GRADIENT_FALLBACKS } from './constants.js';

// Module-level caches are shared across editors (same src renders once) but
// bounded: images are capped by the total size of their src strings (data URLs
// dominate this) and paths by entry count, evicting least-recently-used. This
// keeps memory bounded even for editors that are never destroyed.
const IMAGE_CACHE_MAX_BYTES = 64 * 1024 * 1024;
const IMAGE_CACHE_MAX_ENTRIES = 512;
const PATH_CACHE_MAX_ENTRIES = 512;

const imageCache = new Map();
const pathCache = new Map();
let imageCacheBytes = 0;

function touchImageEntry(src, entry, isNew) {
  if (imageCache.get(src) !== entry) return;
  imageCache.delete(src);
  imageCache.set(src, entry); // most-recent position
  if (!isNew) return;
  imageCacheBytes += src.length;
  while (
    (imageCacheBytes > IMAGE_CACHE_MAX_BYTES || imageCache.size > IMAGE_CACHE_MAX_ENTRIES) &&
    imageCache.size > 1
  ) {
    const oldestSrc = imageCache.keys().next().value;
    imageCache.delete(oldestSrc);
    imageCacheBytes -= oldestSrc.length;
  }
}

export function getImage(src) {
  if (!src) return null;
  let entry = imageCache.get(src);
  if (!entry) {
    const img = new Image();
    entry = { img, loaded: false, resolvers: [] };
    img.onload = () => {
      entry.loaded = true;
      flushImageResolvers(entry);
    };
    img.onerror = () => {
      entry.error = true;
      flushImageResolvers(entry);
    };
    img.crossOrigin = 'anonymous';
    img.src = src;
    imageCache.set(src, entry);
    touchImageEntry(src, entry, true);
  } else {
    touchImageEntry(src, entry, false);
  }
  return entry;
}

function flushImageResolvers(entry) {
  const waiters = entry.resolvers.splice(0);
  for (const resolve of waiters) resolve();
}

export function whenImagesReady(srcs) {
  const entries = srcs.map((s) => getImage(s)).filter(Boolean);
  return Promise.all(
    entries.map(
      (e) =>
        new Promise((res) => {
          if (e.loaded || e.error) return res();
          e.resolvers.push(res);
          setTimeout(res, 8000);
        })
    )
  );
}

export function clearImageCache() {
  imageCache.clear();
  imageCacheBytes = 0;
}

export function clearPathCache() {
  pathCache.clear();
}

function getPath(d) {
  let path = pathCache.get(d);
  if (!path) {
    path = new Path2D(d);
    pathCache.set(d, path);
    if (pathCache.size > PATH_CACHE_MAX_ENTRIES) {
      const oldest = pathCache.keys().next().value;
      pathCache.delete(oldest);
    }
  } else {
    pathCache.delete(d);
    pathCache.set(d, path);
  }
  return path;
}

function resolveFill(ctx, fill, w, h, fallback = '#000000') {
  if (!fill || fill.type !== 'gradient') return typeof fill === 'string' && fill ? fill : fallback;
  const angle = deg2rad(fill.angle ?? 135);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const len = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
  const gradient = ctx.createLinearGradient(
    w / 2 - dx * len, h / 2 - dy * len,
    w / 2 + dx * len, h / 2 + dy * len
  );
  // Multi-stop gradients via the API: `stops` overrides the from/to pair.
  const stops = Array.isArray(fill.stops) && fill.stops.length
    ? fill.stops.map((s) => ({ color: hexOr(s?.color, '#000000'), offset: clamp(Number(s?.offset ?? 0), 0, 1) }))
    : [
        { color: hexOr(fill.from, GRADIENT_FALLBACKS.from), offset: 0 },
        { color: hexOr(fill.to, GRADIENT_FALLBACKS.to), offset: 1 }
      ];
  stops.forEach((s) => gradient.addColorStop(s.offset, s.color));
  return gradient;
}

export function renderPage(ctx, page, opts = {}) {
  const pw = page.width || 1080;
  const ph = page.height || 1080;
  const transparent = !!opts.transparent;
  drawBackground(ctx, page.background, pw, ph, transparent, opts.registry || {});
  const elements = page.elements || [];
  for (const el of elements) {
    if (!el.hidden) drawElement(ctx, el, opts);
  }
}

// Background painters, keyed by background type. Register new types (e.g.
// 'pattern') via registerBackgroundPainter instead of editing this module.
const backgroundPainters = {
  solid(ctx, bg, pw, ph) {
    ctx.fillStyle = (bg && bg.color) || '#ffffff';
    ctx.fill();
  },
  gradient(ctx, bg, pw, ph) {
    ctx.fillStyle = resolveFill(ctx, bg, pw, ph);
    ctx.fill();
  },
  image(ctx, bg, pw, ph) {
    ctx.fillStyle = '#ffffff';
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

export function registerBackgroundPainter(type, painter) {
  if (typeof type !== 'string' || !type) throw new Error('ezyreka: background painter needs a type name');
  if (typeof painter !== 'function') throw new Error('ezyreka: background painter must be a function');
  backgroundPainters[type] = painter;
}

function drawBackground(ctx, bg, pw, ph, transparent, registry = {}) {
  if (transparent) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, pw, ph);
  const type = (bg && bg.type) || 'solid';
  const painters = { ...backgroundPainters, ...(registry.backgroundPainters || {}) };
  if (!painters[type]) {
    // Unknown background types keep their data and show a labeled placeholder
    // over a white page, matching the missing-capability experience elsewhere.
    painters.solid(ctx, { color: '#ffffff' }, pw, ph);
    ctx.restore();
    ctx.save();
    drawPlaceholder(ctx, { w: pw, h: ph }, `Background "${type}" unavailable`);
    ctx.restore();
    return;
  }
  painters[type](ctx, bg, pw, ph);
  ctx.restore();
}

// Element renderers, keyed by element type. Register new types via
// registerElementRenderer (or editor.registerElementType) instead of editing
// the dispatch here.
const elementRenderers = {
  chart: drawChart,
  text: drawText,
  rect: drawRect,
  ellipse: (ctx, el, r) => drawShapePrimitive(ctx, el, 'ellipse', r),
  triangle: (ctx, el, r) => drawShapePrimitive(ctx, el, 'triangle', r),
  star: (ctx, el, r) => drawShapePrimitive(ctx, el, 'star', r),
  hexagon: (ctx, el, r) => drawShapePrimitive(ctx, el, 'hexagon', r),
  diamond: (ctx, el, r) => drawShapePrimitive(ctx, el, 'diamond', r),
  heart: (ctx, el, r) => drawShapePrimitive(ctx, el, 'heart', r),
  line: drawLine,
  image: drawImage,
  icon: drawIcon,
  shape: drawVectorShape
};

export function registerElementRenderer(type, renderer) {
  if (typeof type !== 'string' || !type) throw new Error('ezyreka: element renderer needs a type name');
  if (typeof renderer !== 'function') throw new Error('ezyreka: element renderer must be a function');
  elementRenderers[type] = renderer;
}

export function drawElement(ctx, el, opts = {}) {
  const r = opts.registry || {};
  const draw = (r.elementRenderers && r.elementRenderers[el.type]) || elementRenderers[el.type];
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity ?? 1));
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  ctx.translate(cx, cy);
  if (el.rotation) ctx.rotate(deg2rad(el.rotation));
  ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
  ctx.translate(-el.w / 2, -el.h / 2);
  if (draw) draw(ctx, el, r);
  else drawPlaceholder(ctx, el, `Unsupported (${el.__missingType || el.type})`);
  ctx.restore();
}

// Labeled stand-in for content whose capability is missing (unknown element
// type, unregistered shape/icon, unavailable chart type or background).
// Selection, transforms, duplication and history keep working on these.
export function drawPlaceholder(ctx, el, label) {
  const w = Math.max(1, el.w || 0);
  const h = Math.max(1, el.h || 0);
  ctx.save();
  ctx.fillStyle = 'rgba(100, 116, 139, 0.1)';
  ctx.fillRect(0, 0, w, h);
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(0.75, 0.75, Math.max(0, w - 1.5), Math.max(0, h - 1.5));
  ctx.setLineDash([]);
  if (h > 26 && w > 40) {
    const font = Math.max(9, Math.min(14, h / 3, w / (label.length * 0.62)));
    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${font}px ${DEFAULT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let text = label;
    while (text.length && ctx.measureText(text + '…').width > w - 12) text = text.slice(0, -1);
    if (text !== label) text += '…';
    ctx.fillText(text, w / 2, h / 2);
  }
  ctx.restore();
}

function fillAndStroke(ctx, el, path, fillRule = 'nonzero') {
  if (el.fill !== 'none') {
    ctx.fillStyle = resolveFill(ctx, el.fill, el.w, el.h);
    ctx.fill(path, fillRule);
  }
  // An unset stroke uses the black shown in the toolbar. Width zero or an
  // explicit 'none' still disables the border, including in saved designs.
  if (el.strokeWidth > 0 && el.stroke !== 'none') {
    ctx.lineWidth = el.strokeWidth;
    ctx.strokeStyle = el.stroke || '#000000';
    ctx.stroke(path);
  }
}

function drawRect(ctx, el) {
  const r = Math.min(el.radius || 0, el.w / 2, el.h / 2);
  const path = new Path2D();
  if (r > 0) {
    path.moveTo(r, 0);
    path.arcTo(el.w, 0, el.w, el.h, r);
    path.arcTo(el.w, el.h, 0, el.h, r);
    path.arcTo(0, el.h, 0, 0, r);
    path.arcTo(0, 0, el.w, 0, r);
    path.closePath();
  } else {
    path.rect(0, 0, el.w, el.h);
  }
  fillAndStroke(ctx, el, path);
}

function drawVectorShape(ctx, el, registry = {}) {
  const paths = registry.shapePaths || SHAPE_PATHS;
  if (paths[el.shape] === undefined) {
    // Missing referenced shape: keep the element data and label the placeholder.
    drawPlaceholder(ctx, el, `Shape "${el.shape || ''}" unavailable`);
    return;
  }
  const source = getPath(paths[el.shape]);
  const path = new Path2D();
  // Transform geometry before stroking to keep the border width in canvas pixels.
  path.addPath(source, new DOMMatrix().scale(el.w / 100, el.h / 100));
  ctx.lineJoin = 'round';
  fillAndStroke(ctx, el, path, 'evenodd');
}

// Primitives share the vector-shape pipeline; their geometry lives in
// SHAPE_PATHS so panel previews and canvas rendering cannot drift.
function drawShapePrimitive(ctx, el, name, registry = {}) {
  const paths = registry.shapePaths || SHAPE_PATHS;
  const source = getPath(paths[name] || paths.pentagon);
  const path = new Path2D();
  path.addPath(source, new DOMMatrix().scale(el.w / 100, el.h / 100));
  ctx.lineJoin = 'round';
  fillAndStroke(ctx, el, path);
}

function drawLine(ctx, el) {
  ctx.strokeStyle = el.stroke || '#111827';
  ctx.lineWidth = el.strokeWidth || 4;
  ctx.lineCap = 'round';
  const length = Math.hypot(el.w, el.h);
  const size = el.arrow ? Math.min(length, Math.max(10, ctx.lineWidth * 4)) : 0;
  // End the rounded shaft at the head's base so it cannot blunt the tip.
  // Short arrows use only the head, keeping it within the available length.
  if (!el.arrow || length > size) {
    const shaftScale = el.arrow ? (length - size) / length : 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(el.w * shaftScale, el.h * shaftScale);
    ctx.stroke();
  }
  if (el.arrow && length > 0) {
    const angle = Math.atan2(el.h, el.w);
    ctx.save();
    ctx.translate(el.w, el.h);
    ctx.rotate(angle);
    ctx.fillStyle = el.stroke || '#111827';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2.4);
    ctx.lineTo(-size, size / 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawImage(ctx, el) {
  const entry = getImage(el.src);
  if (!entry || !entry.loaded || !entry.img.naturalWidth) {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, el.w, el.h);
    return;
  }
  const iw = entry.img.naturalWidth;
  const ih = entry.img.naturalHeight;
  const scale = Math.max(el.w / iw, el.h / ih);
  const sw = el.w / scale;
  const sh = el.h / scale;
  ctx.drawImage(entry.img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, el.w, el.h);
}

function drawIcon(ctx, el, registry = {}) {
  const outline = el.iconStyle === 'outline';
  const paths = outline ? (registry.iconOutlines || ICON_OUTLINES) : (registry.icons || ICONS);
  const d = paths[el.icon];
  if (d === undefined) {
    drawPlaceholder(ctx, el, `Icon "${el.icon || ''}" unavailable`);
    return;
  }
  // Create the paint in element coordinates before scaling the icon geometry.
  const fill = el.fill === 'none' ? null : resolveFill(ctx, el.fill, el.w, el.h, '#111827');
  ctx.save();
  ctx.scale(el.w / 24, el.h / 24);
  if (el.fill !== 'none') {
    if (outline) {
      ctx.strokeStyle = fill;
      ctx.lineWidth = 1.75;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(getPath(d));
    } else {
      ctx.fillStyle = fill;
      ctx.fill(getPath(d), 'evenodd');
    }
  }
  ctx.restore();
}

export function fontString(el) {
  return `${el.italic ? 'italic ' : ''}${el.fontWeight || 400} ${el.fontSize || 48}px ${el.fontFamily || DEFAULT_FONT}`;
}

export function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text ?? '').split('\n')) {
    if (!para) {
      out.push('');
      continue;
    }
    const words = para.split(/(\s+)/);
    let line = '';
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

export function measureTextElement(ctx, el) {
  ctx.save();
  ctx.font = fontString(el);
  try {
    if ('letterSpacing' in ctx) ctx.letterSpacing = (el.letterSpacing || 0) + 'px';
  } catch {}
  const lines = wrapLines(ctx, el.text, el.w);
  ctx.restore();
  return lines;
}

function drawText(ctx, el) {
  ctx.save();
  ctx.font = fontString(el);
  try {
    if ('letterSpacing' in ctx) ctx.letterSpacing = (el.letterSpacing || 0) + 'px';
  } catch {}
  ctx.textBaseline = 'top';
  ctx.fillStyle = el.color || '#111827';
  const lines = wrapLines(ctx, el.text, el.w);
  const lineH = (el.fontSize || 48) * (el.lineHeight || 1.3);
  lines.forEach((line, i) => {
    const w = ctx.measureText(line).width;
    let x = 0;
    if (el.align === 'center') x = (el.w - w) / 2;
    else if (el.align === 'right') x = el.w - w;
    const y = i * lineH + (lineH - (el.fontSize || 48)) / 2;
    ctx.fillText(line, x, y);
    if (el.underline && line) {
      ctx.fillRect(x, y + (el.fontSize || 48) * 1.02, w, Math.max(1, (el.fontSize || 48) / 15));
    }
  });
  ctx.restore();
}
