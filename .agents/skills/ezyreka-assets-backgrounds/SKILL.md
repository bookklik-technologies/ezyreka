---
name: ezyreka-assets-backgrounds
description: "Create or register Ezyreka shape and icon packs, images, image-source providers and page backgrounds. Use for editor asset integration, not raster image generation or general template composition."
---

# Ezyreka Assets and Backgrounds

## Inputs and approach

Identify asset ids, supplied geometry or image URLs, target editor/plugin and desired background behavior. Reuse existing artwork when available; registration does not require image generation.

Read [customization](../../../docs/advanced/customization.md), [image sources](../../../docs/advanced/image-sources.md), [registration implementation](../../../src/core/editor.js), [artwork rendering](../../../src/core/element-artwork.js) and [public types](../../../types/index.d.ts).

## Workflow and contracts

- Use instance asset APIs: `registerShapes`, `registerIcons`, `registerImage`, `registerImageSource`; use their `ctx` equivalents inside plugins.
- Shape paths use 0-100 geometry; icon paths use a 24 by 24 viewBox. Pass SVG path data rather than a complete SVG document to path fields.
- Shape entries need a label and path or preview SVG. Prefer an explicit `shape` id. When supplying `props`, include `props.shape` yourself: the registration implementation does not merge the default shape reference into custom props.
- Icons accept a path string or `{ solid, outline? }`; missing outline falls back to solid. Namespaced asset ids reduce accidental replacement.
- `registerImage` adds an upload-library entry, not a canvas element. Insert an image separately with `addElement({ type: 'image', src, ...geometry })`.
- Providers implement `search(query)` returning an array or Promise of `{ src, name?, thumb? }`. Handle empty queries, failed requests and result mapping. Use `ctx.signal` for owned fetch work where available; provider search itself only receives query.
- For custom backgrounds use `ctx.registerBackgroundPainter(type, (canvas, background, width, height) => ...)`, then `editor.setBackground(data)`. Direct editor painter registration also updates the global fallback.
- Keep background data JSON-compatible. Saved shape/icon references still require their providing registry on reopen. Remote image export requires a source the browser can load with suitable CORS access.

## Example

Inside a plugin with id `brand`:

```js
ctx.registerShapes([{
  label: 'Brand diamond', shape: 'brand-diamond',
  path: 'M50 0L100 50L50 100L0 50Z',
  props: { shape: 'brand-diamond', fill: '#477cf5' }
}]);
ctx.registerIcons({
  'brand-triangle': { solid: 'M12 2L22 22H2Z' }
});
ctx.registerBackgroundPainter('brand-stripes', (canvas, bg, width, height) => {
  const step = Number.isFinite(bg.step) ? Math.max(4, bg.step) : 32;
  canvas.fillStyle = bg.base || '#ffffff';
  canvas.fillRect(0, 0, width, height);
  canvas.fillStyle = bg.stripe || '#e2e8f0';
  for (let x = 0; x < width; x += step) {
    canvas.fillRect(x, 0, step / 2, height);
  }
});
```

After startup, call `editor.setBackground({ type: 'brand-stripes', step: 32 })` when the user requests that background. This example paints solid colors only.

## Deliverables and verification

Deliver asset definitions/provider/painter, registration and insertion instructions. Review geometry scale, icon outline fallback, shape props, provider empty/error states, preview/export and reopening with missing registrations. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
