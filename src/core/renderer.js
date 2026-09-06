import { deg2rad } from './utils.js';
import { ICONS } from './assets.js';

const imageCache = new Map();
const pathCache = new Map();

export function getImage(src) {
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
    img.crossOrigin = 'anonymous';
    img.src = src;
    imageCache.set(src, entry);
  }
  return entry;
}

export function whenImagesReady(srcs) {
  const entries = srcs.map((s) => getImage(s)).filter(Boolean);
  return Promise.all(
    entries.map(
      (e) =>
        new Promise((res) => {
          if (e.loaded || e.error) return res();
          e.resolve = res;
          setTimeout(res, 8000);
        })
    )
  );
}

function getPath(d) {
  if (!pathCache.has(d)) pathCache.set(d, new Path2D(d));
  return pathCache.get(d);
}

export function renderPage(ctx, page, opts = {}) {
  const pw = page.width || 1080;
  const ph = page.height || 1080;
  const transparent = !!opts.transparent;
  drawBackground(ctx, page.background, pw, ph, transparent);
  const elements = page.elements || [];
  for (const el of elements) {
    if (!el.hidden) drawElement(ctx, el);
  }
}

function drawBackground(ctx, bg, pw, ph, transparent) {
  if (transparent) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, pw, ph);
  if (!bg || bg.type === 'solid' || !bg.type) {
    ctx.fillStyle = (bg && bg.color) || '#ffffff';
  } else if (bg.type === 'gradient') {
    const angle = deg2rad(bg.angle ?? 135);
    const cx = pw / 2;
    const cy = ph / 2;
    const len = (Math.abs(Math.cos(angle)) * pw + Math.abs(Math.sin(angle)) * ph) / 2;
    const grad = ctx.createLinearGradient(
      cx - Math.cos(angle) * len,
      cy - Math.sin(angle) * len,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len
    );
    grad.addColorStop(0, bg.from || '#ffffff');
    grad.addColorStop(1, bg.to || '#eeeeee');
    ctx.fillStyle = grad;
  } else if (bg.type === 'image' && bg.src) {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    const entry = getImage(bg.src);
    if (entry && entry.loaded && entry.img.naturalWidth) {
      const scale = Math.max(pw / entry.img.naturalWidth, ph / entry.img.naturalHeight);
      const dw = entry.img.naturalWidth * scale;
      const dh = entry.img.naturalHeight * scale;
      ctx.drawImage(entry.img, (pw - dw) / 2, (ph - dh) / 2, dw, dh);
    }
    ctx.restore();
    return;
  }
  ctx.fill();
  ctx.restore();
}

export function drawElement(ctx, el) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity ?? 1));
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  ctx.translate(cx, cy);
  if (el.rotation) ctx.rotate(deg2rad(el.rotation));
  ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
  ctx.translate(-el.w / 2, -el.h / 2);
  switch (el.type) {
    case 'text': drawText(ctx, el); break;
    case 'rect': drawRect(ctx, el); break;
    case 'ellipse': drawShapePath(ctx, el, ellipsePath); break;
    case 'triangle': drawShapePath(ctx, el, trianglePath); break;
    case 'star': drawShapePath(ctx, el, starPath); break;
    case 'hexagon': drawShapePath(ctx, el, hexagonPath); break;
    case 'diamond': drawShapePath(ctx, el, diamondPath); break;
    case 'heart': drawShapePath(ctx, el, heartPath); break;
    case 'line': drawLine(ctx, el); break;
    case 'image': drawImage(ctx, el); break;
    case 'icon': drawIcon(ctx, el); break;
  }
  ctx.restore();
}

function fillAndStroke(ctx, el, path) {
  if (el.fill !== 'none') {
    ctx.fillStyle = el.fill || '#000000';
    ctx.fill(path);
  }
  if (el.strokeWidth > 0 && el.stroke) {
    ctx.lineWidth = el.strokeWidth;
    ctx.strokeStyle = el.stroke;
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

function drawShapePath(ctx, el, builder) {
  const path = new Path2D(builder(el.w, el.h));
  fillAndStroke(ctx, el, path);
}

const ellipsePath = (w, h) => {
  const p = new Path2D();
  p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  return p;
};
const trianglePath = (w, h) => {
  const p = new Path2D();
  p.moveTo(w / 2, 0);
  p.lineTo(w, h);
  p.lineTo(0, h);
  p.closePath();
  return p;
};
const starPath = (w, h) => {
  const pts = [50, 6, 61, 38, 95, 38, 67, 59, 78, 92, 50, 72, 22, 92, 33, 59, 5, 38, 39, 38];
  const p = new Path2D();
  for (let i = 0; i < pts.length; i += 2) {
    const x = (pts[i] / 100) * w;
    const y = (pts[i + 1] / 100) * h;
    i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  }
  p.closePath();
  return p;
};
const hexagonPath = (w, h) => {
  const pts = [26, 8, 74, 8, 96, 50, 74, 92, 26, 92, 4, 50];
  const p = new Path2D();
  for (let i = 0; i < pts.length; i += 2) {
    const x = (pts[i] / 100) * w;
    const y = (pts[i + 1] / 100) * h;
    i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  }
  p.closePath();
  return p;
};
const diamondPath = (w, h) => {
  const p = new Path2D();
  p.moveTo(w / 2, 0);
  p.lineTo(w, h / 2);
  p.lineTo(w / 2, h);
  p.lineTo(0, h / 2);
  p.closePath();
  return p;
};
const heartPath = (w, h) => {
  const p = new Path2D();
  p.moveTo(w * 0.5, h * 0.86);
  p.bezierCurveTo(w * 0.22, h * 0.64, w * 0.08, h * 0.47, w * 0.08, h * 0.31);
  p.bezierCurveTo(w * 0.08, h * 0.17, w * 0.19, h * 0.09, w * 0.3, h * 0.09);
  p.bezierCurveTo(w * 0.39, h * 0.09, w * 0.46, h * 0.15, w * 0.5, h * 0.23);
  p.bezierCurveTo(w * 0.54, h * 0.15, w * 0.61, h * 0.09, w * 0.7, h * 0.09);
  p.bezierCurveTo(w * 0.81, h * 0.09, w * 0.92, h * 0.17, w * 0.92, h * 0.31);
  p.bezierCurveTo(w * 0.92, h * 0.47, w * 0.78, h * 0.64, w * 0.5, h * 0.86);
  p.closePath();
  return p;
};

function drawLine(ctx, el) {
  ctx.strokeStyle = el.stroke || '#111827';
  ctx.lineWidth = el.strokeWidth || 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(el.w, el.h);
  ctx.stroke();
  if (el.arrow) {
    const angle = Math.atan2(el.h, el.w);
    const size = Math.max(10, (el.strokeWidth || 4) * 4);
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

function drawIcon(ctx, el) {
  const d = ICONS[el.icon] || ICONS.star;
  ctx.save();
  ctx.scale(el.w / 24, el.h / 24);
  ctx.fillStyle = el.fill || '#111827';
  ctx.fill(getPath(d));
  ctx.restore();
}

export function fontString(el) {
  return `${el.italic ? 'italic ' : ''}${el.fontWeight || 400} ${el.fontSize || 48}px ${el.fontFamily || 'Arial'}`;
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
