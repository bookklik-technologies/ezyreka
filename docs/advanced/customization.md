# Customization & registries

Every editor owns its own asset registries. Built-in templates, fonts, palette, gradients, shapes and icons are merged with the editor options, and registration APIs extend them **at runtime** — no core code changes or module monkey-patching required.

## Templates

```js
// At init…
new Editor({
  target: '#app',
  templates: [{
    name: 'Ad banner',
    category: 'Business',
    page: { width: 1200, height: 628, background: { type: 'solid', color: '#1e293b' }, elements: [] }
  }]
})

// …or later — appears in the Templates panel immediately.
editor.registerTemplates([
  {
    name: 'Footer',
    page: { width: 1080, height: 200, background: { type: 'solid', color: '#fff' }, elements: [] }
  }
])
```

Templates accept the same shape as `applyTemplate()`.

## Fonts

```js
editor.registerFont('Cabinet Grotesk')                     // picker only
editor.registerFont('Cabinet Grotesk', { google: true })   // + webfont link (default weights)
editor.registerFont('Cabinet Grotesk', { google: 'Cabinet+Grotesk:wght@400;700' })
```

- The first form offers the family in both font pickers only.
- `{ google: true }` also loads the webfont from Google Fonts with default weights.
- `{ google: '<css2-spec>' }` gives full control over weights and axes.

Bulk registration is available through the `fonts` / `googleFonts` editor options.

## Palette

Brand-kit palettes are flat hex lists or labeled groups, at init or later:

```js
new Editor({
  target: '#app',
  palette: [{ label: 'Brand', colors: ['#1e293b', '#d97706'] }]
})

editor.registerPalette(['#101010', '#202020'])
```

## Gradients

```js
new Editor({
  target: '#app',
  gradients: [{ from: '#d97706', to: '#ffffff', angle: 135 }]
})
```

## Shapes

Shape packs use `path` geometry in a **0–100 viewBox**; the panel preview is generated automatically:

```js
editor.registerShapes([
  { label: 'Ninja Star', path: 'M50 0L100 50L50 100L0 50Z' }
])
```

Each entry may also include:

| Property | Description |
| --- | --- |
| `type` | Target element type (defaults to `shape`) |
| `props` | Extra element props (fill, stroke…) applied on insert |
| `svg` | Explicit preview SVG instead of a generated one |
| `shape` | Reference an existing named shape |

Registered shapes render on the canvas through the same per-editor registry, so they are saved, exported and previewed like the built-ins.

## Icons

Icon packs are **24×24 viewBox path data**. Outline falls back to solid when missing:

```js
editor.registerIcons({
  'logo-mark': { solid: 'M12 2L22 22H2Z' },
  'badge': { solid: 'M…', outline: 'M…' }
})
```

## Scope notes

| Registry | Scope |
| --- | --- |
| Templates, fonts, palette, gradients, shapes, icons, uploads, image sources, themes, panels | Per editor instance; font loading adds page-level stylesheets |
| Direct editor element types, manifests, chart types | Module-global definitions |
| Direct editor element/chart renderers and background painters | Current editor override plus module-global fallback |
| Plugin `ctx.register*` methods | Per editor instance; font loading still adds page-level stylesheets |
| `chartColors` | Page-global (normalizes into chart data) |

## Complete example: brand assets and background

With the UMD bundle loaded and a sized `#app`, register vector assets and a background painter in a plugin:

```js
const brandPlugin = {
  id: 'brand',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx) {
    ctx.registerShapes([{
      label: 'Brand diamond',
      shape: 'brand-diamond',
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
  }
};
const editor = new Ezyreka.Editor({ target: '#app', plugins: [brandPlugin] });
editor.on('ready', () => {
  editor.setBackground({ type: 'brand-stripes', step: 32 });
  editor.addElement({
    type: 'shape', shape: 'brand-diamond',
    x: 80, y: 80, w: 160, h: 160, fill: '#477cf5'
  });
  editor.addElement({
    type: 'icon', icon: 'brand-triangle', iconStyle: 'outline',
    x: 280, y: 80, w: 96, h: 96, fill: '#0f172a'
  });
});
```

The icon falls back to its solid path because no outline was supplied. The shape path uses 0–100 coordinates; the icon uses 24×24 coordinates. When a shape entry includes custom `props`, include `props.shape` explicitly: it replaces the default insertion props rather than merging with them.

Saved designs contain the asset identifiers and background data. Load the same registrations when reopening them. Check the gallery insertion, resized geometry, preview and image export.

For AI-assisted authoring, use [`$ezyreka-assets-backgrounds`](/advanced/development-skills).
