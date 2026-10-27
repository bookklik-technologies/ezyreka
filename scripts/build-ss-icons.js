// Generates src/core/senangstart-icons.js from @bookklik/senangstart-icons.
//
// Run with: npm run build:ss-icons
//
// Every SenangStart icon is a single <path> drawn with stroke="currentColor"
// (24x24 viewBox, width 2, round caps/joins), so the path data converts
// directly to Ezyreka's stroke-rendered icon registry.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const PKG = fileURLToPath(new URL('../node_modules/@bookklik/senangstart-icons/dist/icons.min.js', import.meta.url));
const OUT = fileURLToPath(new URL('../src/core/senangstart-icons.js', import.meta.url));
// UMD bundle: evaluate with no DOM and capture the exported icon map.
const context = { module: { exports: {} }, exports: {} };
vm.runInNewContext(readFileSync(PKG, 'utf8'), context);
const icons = context.module.exports.default ?? context.module.exports;

const paths = {};
let skipped = 0;
for (const [name, svg] of Object.entries(icons)) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (viewBox !== '0 0 24 24') { skipped++; continue; }
  const segments = [];
  for (const m of svg.matchAll(/<(path|circle|ellipse|rect)\b[^>]*>/g)) {
    if (m[1] === 'path') {
      const d = m[0].match(/\bd="([^"]+)"/)?.[1];
      if (d) segments.push(d);
    } else { skipped++; segments.length = 0; break; }
  }
  // Single (or few) stroke subpaths only; geometry is used as given.
  if (segments.length) {
    paths[name] = segments.join(' ');
  } else { skipped++; }
}

const header = `// GENERATED FILE — do not edit by hand.
// Source: @bookklik/senangstart-icons (stroke outlines), converted through
// scripts/build-ss-icons.js. Regenerate with: npm run build:ss-icons
`;

if (skipped) console.log(`senangstart icons: kept ${Object.keys(paths).length}, skipped ${skipped}`);

const out = `${header}
export const SS_ICON_PATHS = ${JSON.stringify(paths)};
`;

writeFileSync(OUT, out);
console.log(`senangstart icons: kept ${Object.keys(paths).length}, skipped ${skipped}`);
