import assert from 'node:assert';
import { uid, clamp, deepClone, Emitter } from '../src/core/utils.js';
import { History } from '../src/core/history.js';
import { createElement, hitTest, elementCorners, selectionBBox } from '../src/core/elements.js';
import { wrapLines } from '../src/core/renderer.js';
import { ICONS, TEMPLATES } from '../src/core/assets.js';

assert.ok(uid('x').startsWith('x_'), 'uid prefix');
assert.strictEqual(clamp(5, 0, 3), 3, 'clamp max');
assert.strictEqual(clamp(-2, 0, 3), 0, 'clamp min');
assert.deepStrictEqual(deepClone({ a: { b: 1 } }), { a: { b: 1 } }, 'deepClone');

const emitter = new Emitter();
let got = 0;
emitter.on('t', (v) => (got = v));
emitter.emit('t', 42);
assert.strictEqual(got, 42, 'emitter');
const off = emitter.on('t', () => (got = -1));
off();
emitter.emit('t', 7);
assert.strictEqual(got, 7, 'emitter off');

const hist = new History(10);
const s1 = { p: 1 };
const s2 = { p: 2 };
hist.push(s1);
hist.push(s2);
assert.ok(hist.canUndo(), 'canUndo');
const undone = hist.undo(s2);
assert.deepStrictEqual(undone, s1, 'undo restores');
assert.ok(hist.canRedo(), 'canRedo');
const redone = hist.redo(s1);
assert.deepStrictEqual(redone, s2, 'redo restores');

const rect = createElement('rect', { x: 10, y: 20, w: 100, h: 50 });
assert.strictEqual(rect.type, 'rect');
assert.strictEqual(rect.fill, '#FACC15', 'shape default fill');
assert.ok(rect.id.startsWith('rect_'), 'id prefix by type');

const text = createElement('text', {});
assert.strictEqual(text.fontSize, 48, 'text default size');
assert.ok(text.h > 0, 'text default height');

assert.ok(hitTest(rect, 50, 40), 'hit inside');
assert.ok(!hitTest(rect, 200, 40), 'hit outside');

// Positioned elements must be selectable where they are drawn, including after moving.
for (const type of ['rect', 'icon', 'line']) {
  for (const rotation of [0, 45, 90]) {
    const placed = createElement(type, { x: 400, y: 300, w: 120, h: 60, rotation });
    assert.ok(hitTest(placed, 460, 330), `${type} at ${rotation} degrees: hit visible center`);
    assert.ok(!hitTest(placed, 60, 30), `${type} at ${rotation} degrees: no hit at canvas origin`);
    placed.x += 250;
    placed.y += 200;
    assert.ok(hitTest(placed, 710, 530), `${type} at ${rotation} degrees: hit moved center`);
    assert.ok(!hitTest(placed, 460, 330), `${type} at ${rotation} degrees: no hit at old position`);
  }
}

const rotated = createElement('rect', { x: 100, y: 100, w: 100, h: 100, rotation: 45 });
const corners = elementCorners(rotated);
const bbox = selectionBBox([rotated]);
assert.ok(Math.abs(bbox.w - 100 * Math.SQRT2) < 1, 'rotated bbox width');
assert.strictEqual(corners.length, 4, 'corners');

const ctx = { measureText: (s) => ({ width: s.length * 10 }) };
const lines = wrapLines(ctx, 'hello beautiful world', 200);
assert.deepStrictEqual(lines, ['hello beautiful', 'world'], 'wrapLines');
assert.deepStrictEqual(wrapLines(ctx, 'a\n\nb', 1000), ['a', '', 'b'], 'wrapLines newlines');

assert.ok(ICONS.star, 'icon path exists');
assert.ok(Object.keys(ICONS).length >= 15, 'icon count');
assert.ok(TEMPLATES.length >= 4, 'templates count');
for (const tpl of TEMPLATES) {
  for (const el of tpl.page.elements) {
    assert.ok(el.type, 'template element has type');
  }
}

console.log('All smoke tests passed.');
