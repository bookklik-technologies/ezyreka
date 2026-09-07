---
name: ezyreka-element-creation
description: "Create or modify Ezyreka canvas elements, custom element types, capability manifests and renderers. Use the dedicated text or chart skill for their specialized content."
---

# Ezyreka Element Creation

## Inputs and approach

Identify the visual, editable properties, dimensions and placement. Prefer built-in elements or registered vector shapes when sufficient; introduce a custom type only for behavior or geometry they cannot express.

Read [elements](../../../docs/guide/elements.md), [extensibility](../../../docs/advanced/extensibility.md), [element factories and manifests](../../../src/core/elements.js), [rendering](../../../src/core/renderer.js) and [public types](../../../types/index.d.ts) as relevant.

## Workflow and contracts

- Insert with `editor.addElement({ type, ...props })`; it returns an element and commits history. Omitted coordinates center that axis in the viewport. Call `editor.select([element.id])` explicitly when selection is intended.
- Patch through `updateSelected`. For a live control, use `updateSelected(patch, false)`, then `commit()` at the end of the interaction. Enforce locked-element behavior in custom controls; generic property updates do not universally reject locked selections.
- In a plugin, register `{ defaults, manifest, render }` with `ctx.registerElementType`. Direct editor registration changes shared type definitions; register once if using that host-level API.
- Render synchronously with `(canvas, element, registry)` in local coordinates from `0,0` to `w,h`. The outer renderer applies translation, rotation, opacity and flips. Do not apply those transforms twice or mutate document data while drawing.
- Use supported manifest controls and behavior from `elements.js`; arbitrary toolbar names do not create new controls. Custom type registration alone does not add an insertion item to the Elements gallery: provide a panel or host button when requested.
- Keep fields JSON-compatible. Functions belong in registrations, never document payloads. Use stable type ids and let factories generate element ids.
- A renderer exposing `fill` controls must handle solid, none and gradient fills; a plain `canvas.fillStyle = element.fill` only supports a solid color string.

## Example

Inside a plugin's synchronous `setup(ctx)`:

```js
ctx.registerElementType('brand-diamond', {
  defaults: { w: 160, h: 100, badgeColor: '#477cf5' },
  manifest: { name: 'Diamond badge', toolbar: ['opacity'] },
  render(canvas, element) {
    canvas.beginPath();
    canvas.moveTo(element.w / 2, 0);
    canvas.lineTo(element.w, element.h / 2);
    canvas.lineTo(element.w / 2, element.h);
    canvas.lineTo(0, element.h / 2);
    canvas.closePath();
    canvas.fillStyle = element.badgeColor;
    canvas.fill();
  }
});
ctx.once('ready', () => {
  const item = ctx.editor.addElement({ type: 'brand-diamond', x: 80, y: 80 });
  ctx.editor.select([item.id]);
});
```

Use the plugin id `brand` for this example. The custom color can be edited with a host control calling `updateSelected({ badgeColor })`.

## Deliverables and verification

Deliver the element data or registration, requested insertion control and usage example. Review resizing, rotation, flips, opacity, duplication, undo/redo, JSON round-trip, preview and export. Verify missing-plugin reopening preserves custom payloads. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
