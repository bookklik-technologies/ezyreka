# Extensibility

Every canvas dispatch in Ezyreka is a registry, so new visuals plug in **without touching core code**: element types, renderers, chart types, background painters and sidebar panels.

## New element types

A brand-new element type is defaults + manifest + renderer in one call:

```js
editor.registerElementType('badge', {
  defaults: { fill: '#477cf5', w: 120, h: 40 },
  manifest: { name: 'Badge', toolbar: ['fill', 'opacity'] },
  render: (ctx, el) => {
    ctx.fillStyle = el.fill
    ctx.fillRect(0, 0, el.w, el.h)
  }
})

editor.addElement({ type: 'badge', x: 100, y: 100 })
```

Registered types behave like built-ins: they can be selected, transformed, saved, exported and previewed.

## Overriding renderers

Replace the renderer of an existing type:

```js
editor.registerElementRenderer('star', (ctx, el, registry) => {
  // custom draw
})
```

Renderer signature: `(ctx, el, registry)` where `el` is the design element and `registry` is the per-editor asset registry.

## The capability manifest

Each element type has a **capability manifest** centralizing how the editor treats it:

| Key | Controls |
| --- | --- |
| `name` | Display name |
| `layerIcon` | Layers panel icon |
| `edit` | Double-click behavior (e.g. text editing, chart editor) |
| `autoFitHeight` | Auto-height behavior |
| `toolbar` | Floating toolbar controls |
| `hitTest` | Hit-testing |
| `preloadProps` | Export preloading |
| `create` | Factory behavior |
| `exclusiveProps` | Props exclusive to this type |

Extend or override it per type:

```js
editor.registerElementManifest('rect', {
  toolbar: ['fill', 'opacity', 'radius']
})
```

## Charts

Override the painter of an existing chart type:

```js
editor.registerChartRenderer('bar', (ctx, chart, series, plotBox, font, bounds) => {
  // custom draw
})
```

…or register a **full chart type** — the gallery, type dropdown, normalization, validation and rendering all pick it up:

```js
editor.registerChartType({
  type: 'radar',
  label: 'Radar',
  group: 'Radar charts',
  kind: 'radar',
  multiSeries: true,
  validate: (chart) => { /* throw on invalid data */ }
}, (ctx, chart, series, plotBox, font, bounds) => {
  // custom draw
})
```

Painter signature: `(ctx, chart, series, plotBox, font, bounds)`.

Preset fields:

| Field | Description |
| --- | --- |
| `type` | Registry key |
| `label` | Gallery/dropdown label |
| `group` | Gallery grouping |
| `kind` | Painter key to resolve |
| `circular` | Pie-style layout |
| `multiSeries` | Supports multiple series |
| `horizontal` | Horizontal orientation |
| `validate` | Called with the chart config; throw to reject |

## Background painters

New background types become usable via `editor.setBackground({ type: 'stripes', … })`:

```js
editor.registerBackgroundPainter('stripes', (ctx, bg, pw, ph) => {
  // custom draw across the full page (pw × ph)
})
```

::: warning
Element type/manifest and chart type registration are **page-global**; they affect every editor on the page. Background painters and panels are registered per editor.
:::

## Sidebar panels

```js
editor.registerPanel({
  id: 'brand',
  label: 'Brand kit',
  icon: '<svg …>…</svg>', // tool-rail icon
  render(contentEl, ed) {
    // Build your panel DOM into contentEl; subscribe via ed.on(...) as needed.
  }
})
```

- `icon` defaults to the shapes icon
- The panel appears in the tool rail with the built-in tools
- `render(contentEl, editor)` is called when the panel becomes active

## Image sources

Extend the Uploads panel with search providers:

```js
editor.registerImageSource({
  id: 'stock',
  label: 'Stock photos',
  search: async (query) => (await fetch(`https://api.example.com?q=${query}`)).json()
})
```

See [Image sources](/advanced/image-sources) for the full contract.
