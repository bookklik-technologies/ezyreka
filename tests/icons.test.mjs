import assert from 'node:assert';
import { ICONS, SHAPE_PATHS, TEMPLATES } from '../src/core/assets.js';
import { createElement } from '../src/core/elements.js';

// The built-in icon library is the SenangStart Icons pack: stroke line
// glyphs on a 24x24 viewBox. Everything below guards that pack's health.
assert.ok(Object.keys(ICONS).length >= 300, 'senangstart icon pack size');
for (const expected of ['star', 'heart', 'sun', 'check', 'arrow-right', 'cog-6-tooth', 'chat-bubble-left-right']) {
  assert.ok(ICONS[expected], `icon "${expected}" exists`);
}

// Every template icon reference resolves against the pack.
const missing = new Set();
for (const tpl of TEMPLATES) {
  for (const page of tpl.pages || [tpl.page]) {
    for (const el of page.elements) {
      if (el.type === 'icon' && !ICONS[el.icon]) missing.add(`${tpl.name}: ${el.icon}`);
      if (el.type === 'shape' && !SHAPE_PATHS[el.shape]) missing.add(`${tpl.name}: ${el.shape}`);
      if (el.iconStyle) missing.add(`${tpl.name}: leftover iconStyle prop`);
    }
  }
}
assert.deepStrictEqual([...missing], [], 'template icons and shapes resolve');

for (const tpl of TEMPLATES) {
  const pages = tpl.pages || [tpl.page];
  for (const page of pages) {
    for (const element of page.elements.filter(item => item.type === 'icon' || item.type === 'shape')) {
      assert.ok(Number.isFinite(element.x) && Number.isFinite(element.y), `${tpl.name}: artwork position`);
      assert.ok(element.w > 0 && element.h > 0, `${tpl.name}: artwork dimensions`);
      assert.ok(element.x >= 0 && element.y >= 0 && element.x + element.w <= page.width && element.y + element.h <= page.height,
        `${tpl.name}: artwork stays inside the page`);
      assert.strictEqual(createElement(element.type, element)[element.type], element[element.type],
        `${tpl.name}: artwork reference survives element creation`);
    }
  }
  if (tpl.pages) {
    assert.strictEqual(pages.length, 6, `${tpl.name}: coordinated collection retains six pages`);
    assert.ok(pages.every(page => page.elements.some(element => element.type === 'shape' || element.type === 'icon')),
      `${tpl.name}: artwork is present throughout the collection`);
  }
}

// Icons render in one style: stroke outlines, no iconStyle bookkeeping.
const icon = createElement('icon', {});
assert.ok(ICONS[icon.icon], 'default element icon resolves');
assert.strictEqual('iconStyle' in icon, false, 'icon default has no iconStyle');

console.log('All icon pack tests passed.');
