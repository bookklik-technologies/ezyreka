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
| Templates, fonts, palette, gradients, shapes, icons | Per editor instance |
| Element types, manifests, chart types | Page-global |
| `chartColors` | Page-global (normalizes into chart data) |
