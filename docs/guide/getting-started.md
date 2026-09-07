# Introduction

**Ezyreka** is an embeddable, dependency-free JavaScript library for adding a Canva-style design editor to web apps. It ships as a single JS bundle and can run with the built-in UI or as a headless canvas engine, initialized **programmatically** with JavaScript or **declaratively** via `<div data-ez-editor></div>`.

No frameworks. No runtime dependencies. One script tag.

## Why Ezyreka?

- **Everything on canvas** — HTML5 canvas rendering at device pixel ratio, with a DOM overlay for handles and guides. Nothing is a screenshot: every element stays editable.
- **Full transform system** — move, 8-handle resize, rotate (with 15° snapping), flip, multi-select (shift-click + rubber band), group move.
- **Smart snapping** — edge/center alignment guides against other elements and the page, with pink guide lines.
- **Editable charts** — Bar, Row, Grouped bar, Line, Multi-line, Pie, Donut, Area and Stacked area charts, with spreadsheet paste and a full style editor.
- **Templates** — 32 fully editable built-in templates across six categories, plus your own.
- **Registry-based customization** — templates, fonts, palettes, shapes, icons, panels, element types, chart types and background painters can all be registered at runtime.
- **Headless capable** — run the canvas engine without any UI, or replace individual UI modules.

## Installation

### npm

```bash
npm install @bookklik/ezyreka
```

### CDN

Or use the bundle directly:

```html
<script src="https://unpkg.com/@bookklik/ezyreka/dist/ezyreka.umd.js"></script>
```

## Quick start

### Automatic initialization

Any element with `data-ez-editor` is turned into an editor on page load:

```html
<div
  id="app"
  data-ez-editor
  data-ez-width="1080"
  data-ez-height="1080"
  data-ez-name="My design"
></div>
<script src="https://unpkg.com/@bookklik/ezyreka/dist/ezyreka.umd.js"></script>
```

::: tip
Size the container with CSS (e.g. `#app { width: 100vw; height: 100vh; }`).
:::

### Programmatic initialization

```js
const { Editor } = Ezyreka // UMD global
// or: import { Editor } from '@bookklik/ezyreka' // ESM

const editor = new Editor({
  target: '#app', // selector or HTMLElement
  width: 1080, // page width in px
  height: 1080, // page height in px
  name: 'Untitled design' // file name
})

editor.on('ready', () => {
  editor.addText({ text: 'Hello Ezyreka', fontSize: 96, fontWeight: 800 })
  editor.addElement({ type: 'rect', x: 340, y: 620, w: 400, h: 110, radius: 55 })
})
```

## Next steps

- Browse the full list of [editor options](/guide/editor-options)
- Learn about [elements & shapes](/guide/elements) and [text](/guide/text)
- Add [editable charts](/guide/charts)
- Dive into [customization & registries](/advanced/customization)
- Explore the complete [API reference](/api/editor)
