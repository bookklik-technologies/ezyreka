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

Renderer signature: `(ctx, el, registry)` where `el` is the design element and `registry` is the per-editor asset registry. Drawing uses local coordinates; the outer renderer applies position, rotation, opacity and flips.

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
editor.registerChartRenderer('bar', (ctx, chart, series, plotBox, font, bounds, registry) => {
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
}, (ctx, chart, series, plotBox, font, bounds, registry) => {
  // custom draw
})
```

Painter signature: `(ctx, chart, series, plotBox, font, bounds, registry)`.

Preset fields:

| Field | Description |
| --- | --- |
| `type` | Registry key |
| `label` | Gallery/dropdown label |
| `group` | Gallery grouping |
| `kind` | Built-in Cartesian behavior such as `bar`, `line`, `area` or `stacked-area`; novel geometry needs an explicit painter |
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
Direct `editor.registerElementType`, `registerElementManifest` and `registerChartType` update module-global definitions. Direct element/chart renderer and background-painter registration also update global fallback tables as well as the current editor's overrides. Panels are per editor. Inside a plugin, use `ctx.register*` for isolated registrations; see the [scope table](/advanced/customization#scope-notes).
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

Custom chart painters receive `plotBox: { x, y, w, h }`, a numeric font size, `bounds: { w, h, top, bottom }` and the per-editor registry. The outer chart renderer draws the title and legend and clips to the element. See [a complete custom chart painter](/guide/charts#complete-example-percentage-bars).

Use the [development skills](/advanced/development-skills) for focused instructions on custom elements, charts, backgrounds and UI.
