import { elementAABB, elementCenter } from './elements.js';
import { rotatePoint, deg2rad } from './utils.js';
import { fontString, measureTextElement } from './renderer.js';

export function unionBounds(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

export function elementPaintBounds(element, ctx) {
  let bounds = elementAABB(element);
  if (element.type === 'text' && ctx) {
    const lines = measureTextElement(ctx, element);
    const size = element.fontSize || 48;
    const lineHeight = size * (element.lineHeight || 1.3);
    const center = elementCenter(element);
    ctx.save();
    ctx.font = fontString(element);
    ctx.textBaseline = 'top';
    try {
      if ('letterSpacing' in ctx) ctx.letterSpacing = (element.letterSpacing || 0) + 'px';
    } catch {}
    lines.forEach((line, i) => {
      const metrics = ctx.measureText(line);
      let x = element.x;
      if (element.align === 'center') x += (element.w - metrics.width) / 2;
      else if (element.align === 'right') x += element.w - metrics.width;
      const y = element.y + i * lineHeight + (lineHeight - size) / 2;
      const left = x - (metrics.actualBoundingBoxLeft || 0);
      const right = x + (metrics.actualBoundingBoxRight ?? metrics.width);
      const top = y - (metrics.actualBoundingBoxAscent || 0);
      const bottom = Math.max(y + (metrics.actualBoundingBoxDescent ?? size),
        element.underline && line ? y + size * 1.02 + Math.max(1, size / 15) : y);
      const points = [[left, top], [right, top], [right, bottom], [left, bottom]]
        .map(([px, py]) => rotatePoint(element.flipX ? center.x * 2 - px : px, element.flipY ? center.y * 2 - py : py,
          center.x, center.y, deg2rad(element.rotation || 0)));
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      bounds = unionBounds(bounds, { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
    });
    ctx.restore();
  }
  // Conservatively include rotated stroke corners and antialiasing at edges.
  const strokeWidth = element.type === 'line' ? (element.strokeWidth || 4)
    : element.stroke === 'none' ? 0 : Math.max(0, element.strokeWidth || 0);
  const arrowPadding = element.type === 'line' && element.arrow
    ? Math.min(Math.hypot(element.w, element.h), Math.max(10, strokeWidth * 4)) / 2.4 : 0;
  const padding = Math.max(strokeWidth * Math.SQRT2 / 2, arrowPadding) + 1;
  return { x: bounds.x - padding, y: bounds.y - padding, w: bounds.w + padding * 2, h: bounds.h + padding * 2 };
}

export function measureWorkspace(page, ctx) {
  let bounds = { x: 0, y: 0, w: page.width, h: page.height };
  const elements = [];
  for (const element of page.elements || []) {
    if (element.hidden) continue;
    const paint = elementPaintBounds(element, ctx);
    if (![paint.x, paint.y, paint.w, paint.h].every(Number.isFinite)) continue;
    bounds = unionBounds(bounds, paint);
    elements.push({ element, bounds: paint });
  }
  return { bounds, elements };
}

export function workspaceLayout(page, bounds, zoom, width, height) {
  // Enough space to center the page even when artwork extends to one side.
  const padX = Math.max(48, (width - page.width * zoom) / 2);
  const padY = Math.max(48, (height - page.height * zoom) / 2);
  return {
    left: padX - bounds.x * zoom,
    top: padY - bounds.y * zoom,
    width: Math.ceil(bounds.w * zoom + padX * 2),
    height: Math.ceil(bounds.h * zoom + padY * 2)
  };
}
