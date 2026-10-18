import assert from 'node:assert';
import { uid, clamp, deepClone, Emitter } from '../src/core/utils.js';
import { History } from '../src/core/history.js';
import { createElement, hitTest, elementCorners, selectionBBox } from '../src/core/elements.js';
import { wrapLines } from '../src/core/renderer.js';
import { ICONS, TEMPLATES } from '../src/core/assets.js';
import { elementPaintBounds, measureWorkspace, workspaceLayout } from '../src/core/workspace.js';

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
assert.ok(hist.canUndo(), 'redo retains an undoable baseline');
hist.reset();
for (const p of [0, 1, 2, 3]) hist.push({ p });
assert.deepStrictEqual(hist.undo({ p: 3 }), { p: 2 });
assert.deepStrictEqual(hist.undo({ p: 2 }), { p: 1 });
assert.deepStrictEqual(hist.redo({ p: 1 }), { p: 2 });
hist.push({ p: 4 });
assert.ok(!hist.canRedo(), 'a new edit replaces the redo branch');
assert.deepStrictEqual(hist.undo({ p: 4 }), { p: 2 });

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
assert.equal(TEMPLATES.length, 36, 'templates count');
assert.equal(TEMPLATES.filter(tpl => tpl.pages?.length === 6).length, 4, 'four six-page collections');
for (const tpl of TEMPLATES) {
  for (const page of tpl.pages || [tpl.page]) {
    for (const el of page.elements) {
      assert.ok(el.type, 'template element has type');
    }
  }
}

const workspacePage = { width: 100, height: 80, elements: [
  { type: 'rect', x: -20, y: -30, w: 10, h: 20, strokeWidth: 4 },
  { type: 'ellipse', x: 120, y: 100, w: 30, h: 20, rotation: 45, locked: true },
  { type: 'rect', x: -100000, y: -100000, w: 10, h: 10, hidden: true }
] };
const measuredWorkspace = measureWorkspace(workspacePage);
assert.equal(measuredWorkspace.elements.length, 2, 'hidden elements do not enlarge the workspace');
assert.ok(measuredWorkspace.bounds.x < -20 && measuredWorkspace.bounds.y < -30, 'negative coordinates and stroke padding are included');
assert.ok(measuredWorkspace.bounds.x + measuredWorkspace.bounds.w > 150, 'locked and rotated artwork extends workspace bounds');
const workspace = workspaceLayout(workspacePage, measuredWorkspace.bounds, 0.5, 800, 600);
assert.ok(workspace.left + measuredWorkspace.bounds.x * 0.5 >= 48, 'negative artwork remains reachable with a view margin');
assert.ok(workspace.top + measuredWorkspace.bounds.y * 0.5 >= 48, 'top artwork remains reachable with a view margin');
assert.ok(workspace.width >= 800 && workspace.height >= 600, 'workspace is at least viewport-sized');
const arrowBounds = elementPaintBounds({ type: 'line', x: 0, y: 0, w: 100, h: 0, arrow: true, strokeWidth: 12 });
assert.ok(arrowBounds.y <= -20 && arrowBounds.y + arrowBounds.h >= 20, 'arrow heads are included in workspace paint bounds');

console.log('All smoke tests passed.');
