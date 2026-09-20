export const uid = (prefix = 'el') =>
  prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;

export function rotatePoint(px, py, cx, cy, rad) {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const dx = px - cx;
  const dy = py - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isMac() {
  try {
    return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
  } catch {
    return false;
  }
}

export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  downloadDataURL(url, filename);
  // The revoke must wait long enough for slow download dialogs (and the
  // browser's actual write) to finish; the URL leaks briefly, which is fine.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Filename-safe base for downloads: keeps letters (any script) and digits,
 * plus '-' and spaces. Returns 'design' when nothing survives.
 */
export function fileBase(name) {
  const base = String(name || '')
    .replace(/[^\p{L}\p{N}\- ]+/gu, '')
    .trim();
  return base || 'design';
}

export function el(tag, className, parent) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (parent) parent.appendChild(n);
  return n;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

/**
 * Safely inserts developer-supplied markup (plugin/registration SVG icons)
 * into `node`: parses via an inert <template> element (scripts never run
 * from template content), strips script-capable elements and inline event
 * handlers, then adopts the sanitized nodes.
 */
export function setSvg(node, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html ?? '');
  const frag = tpl.content;
  frag.querySelectorAll('script, iframe, object, embed, link, meta').forEach((n) => n.remove());
  frag.querySelectorAll('*').forEach((n) => {
    for (const attr of [...n.attributes]) {
      if (/^on/i.test(attr.name)) {
        n.removeAttribute(attr.name);
        continue;
      }
      const value = attr.value.trim().toLowerCase();
      if (
        (attr.name === 'href' || attr.name === 'xlink:href') &&
        (value.startsWith('javascript:') || value.startsWith('data:text/html'))
      ) {
        n.removeAttribute(attr.name);
      }
    }
  });
  node.textContent = '';
  node.append(...frag.childNodes);
}

export class Emitter {
  constructor() {
    this._listeners = new Map();
  }
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
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
        console.error('ezyreka listener error:', err);
      }
    });
    // Wildcard listeners receive every event as (event, payload).
    this._listeners.get('*')?.forEach((fn) => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('ezyreka listener error:', err);
      }
    });
  }
}

// Shared color validation: the single source for the 6-digit hex rule used
// by charts, toolbar pickers, background controls and imports.
const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

export function isHexColor(value) {
  return typeof value === 'string' && (HEX6.test(value) || HEX3.test(value));
}

/** Expands 3-digit hex and lowercases; returns null for anything invalid. */
export function normalizeHexColor(value) {
  if (typeof value !== 'string') return null;
  if (HEX6.test(value)) return value.toLowerCase();
  if (HEX3.test(value)) {
    const [r, g, b] = value.slice(1);
    return ('#' + r + r + g + g + b + b).toLowerCase();
  }
  return null;
}

export function hexOr(value, fallback) {
  return normalizeHexColor(value) || fallback;
}
