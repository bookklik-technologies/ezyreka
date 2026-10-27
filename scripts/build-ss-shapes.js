// Generates src/core/senangstart-shapes.js from @bookklik/senangstart-shapes.
//
// Run with: npm run build:ss-shapes
//
// Only the "solid" variant of each shape converts: Ezyreka redraws shapes with
// its own fill/stroke, so the flat silhouette is the geometry that survives.
// Stroke-drawn assets (outline silhouettes with no fill) cannot be filled, so
// the generator skips them instead of shipping invisible geometry.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PKG = fileURLToPath(new URL('../node_modules/@bookklik/senangstart-shapes/dist/', import.meta.url));
const OUT = fileURLToPath(new URL('../src/core/senangstart-shapes.js', import.meta.url));

// Duplicate built-in panel entries or assets that cannot be expressed as a
// single filled 0-100 path.
const SKIP_SLUGS = new Set([
  'square', // duplicates the built-in Square primitive
  'diamond', // duplicates the built-in Diamond primitive
  'circle', // duplicates the built-in Circle primitive
  'disc-over-bowl', // 103-wide viewBox; would overflow the element box
]);

const catalog = JSON.parse(readFileSync(`${PKG}catalog.json`, 'utf8'));
const svgDir = `${PKG}svg/`;
const files = new Set(readdirSync(svgDir).filter((f) => f.endsWith('.svg')));

// Largest amount by which any scalar in a path extends outside 0-100. Fine
// for a rough clip test: arc flags and rotations are 0/1, radii stay within
// the box, and only true coordinate overshoot can exceed it.
// Largest amount by which any scalar in a path extends outside 0-100. Fine
// for a rough clip test: arc flags and rotations are 0/1, radii stay within
// the box, and only true coordinate overshoot can exceed it.
const overshoot = (d) => {
  let max = 0;
  for (const n of d.match(/-?\d*\.?\d+/g) || []) {
    const v = parseFloat(n);
    if (v < 0) max = Math.max(max, -v);
    else if (v > 100) max = Math.max(max, v - 100);
  }
  return max;
};
// Scalar primitives -> absolute path data on the same viewBox.
const primitiveToPath = (tag, source) => {
  const num = (name) => {
    const v = source.match(new RegExp(`${name}="([-\\d.]+)"`));
    return v ? parseFloat(v[1]) : null;
  };
  if (tag === 'circle' || tag === 'ellipse') {
    const rx = num('rx') ?? num('r');
    const ry = num('ry') ?? num('r');
    const cx = num('cx');
    const cy = num('cy');
    if (rx === null || ry === null || cx === null || cy === null) return null;
    return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  }
  if (tag === 'rect') {
    const x = num('x') ?? 0;
    const y = num('y') ?? 0;
    const w = num('width');
    const h = num('height');
    if (w === null || h === null) return null;
    return `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
  }
  return null;
};

const shapePaths = {};
const panel = [];
const skipped = [];

for (const shape of catalog.shapes) {
  const file = shape.assets.solid;
  if (!file || SKIP_SLUGS.has(shape.slug)) continue;
  if (!files.has(`${file}.svg`)) continue;
  const svg = readFileSync(`${svgDir}${file}.svg`, 'utf8');
  if (svg.match(/viewBox="([^"]+)"/)?.[1] !== '0 0 100 100') {
    skipped.push(`${shape.slug} (viewBox)`);
    continue;
  }
  if (/stroke|url\(|<(g|defs|use|clipPath)\b/.test(svg)) {
    skipped.push(`${shape.slug} (stroke/def)`);
    continue;
  }
  const segments = [];
  let unsupported = '';
  const tags = svg.matchAll(/<(path|circle|ellipse|rect)\b[^>]*>/g);
  for (const m of tags) {
    const tag = m[1];
    if (tag === 'path') {
      const d = m[0].match(/\bd="([^"]+)"/)?.[1];
      if (!d) { unsupported = 'pathless'; break; }
      segments.push(d);
    } else {
      const d = primitiveToPath(tag, m[0]);
      if (!d) { unsupported = tag; break; }
      segments.push(d);
    }
  }
  if (unsupported) {
    skipped.push(`${shape.slug} (${unsupported})`);
    continue;
  }
  const id = `ss-${shape.slug}`;
  // Canvas rendering has no viewBox clip, so assets need to stay inside their
  // 0-100 box. Small paint overshoot (under 2 units) is tolerated; clipped
  // silhouettes that depend on the SVG viewport are skipped instead.
  const over = Math.max(...segments.map(overshoot));
  if (over > 2) {
    skipped.push(`${shape.slug} (overflow ${over.toFixed(1)})`);
    continue;
  }
  const d = segments.join(' ');
  shapePaths[id] = d;
  panel.push([shape.slug, shape.name]);
}

const header = `// GENERATED FILE — do not edit by hand.
// Source: @bookklik/senangstart-shapes (solid variants), converted through
// scripts/build-ss-shapes.js. Regenerate with: npm run build:ss-shapes
`;

const out = `${header}
// Geometry for the kept shapes, keyed by the named shape id that saved
// documents reference.
export const SS_SHAPE_PATHS = ${JSON.stringify(shapePaths, null, 2)};

// [slug, label] pairs in catalog order. Shapes are derived from the path
// table so the geometry is never duplicated in the bundle.
export const SS_LIST = ${JSON.stringify(panel)};

export const SS_SHAPES = SS_LIST.map(([slug, label]) => ({
  type: 'shape',
  label,
  props: { shape: \`ss-\${slug}\` },
  // Same padding transform as the built-in EXTRA_SHAPES previews.
  svg: \`<path d="\${SS_SHAPE_PATHS['ss-' + slug]}" transform="translate(8 8) scale(.84)" fill-rule="evenodd" />\`
}));
`;

writeFileSync(OUT, out);
console.log(`senangstart shapes: kept ${panel.length}, skipped ${skipped.length}`);
console.log(`out: ${OUT}`);
if (skipped.length) console.log(`skipped:\n  ${skipped.join('\n  ')}`);
