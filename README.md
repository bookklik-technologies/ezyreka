# Ezyreka

**Ezyreka** is an embeddable, dependency-free JavaScript library for adding a Canva-style design editor to web apps. It ships as a single JS bundle and can run with the built-in UI or as a headless canvas engine, initialized **programmatically** with JavaScript or **declaratively** via `<div data-ez-editor></div>`.

No frameworks. No runtime dependencies. One script tag.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Documentation:** https://bookklik-technologies.github.io/ezyreka/

## Features

- Canvas engine with a DOM overlay for handles and guides
- Elements: text, images, shapes, lines and icons with full transform, snapping and inline text editing
- Editable charts (data + style), multi-page documents, 32 editable templates
- Layers panel, undo/redo, copy/paste, zoom & pan, context menu, keyboard shortcuts
- PNG/JPEG/JSON export, themes, headless mode, and a customizable UI
- Extensible: custom element types, renderers, chart types, backgrounds, sidebar panels, image sources and **community plugins**

See the [documentation](https://bookklik-technologies.github.io/ezyreka/) for the full feature guides and API reference.

## Installation

```bash
npm install @bookklik/ezyreka
```

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

> Size the container with CSS (e.g. `#app { width: 100vw; height: 100vh; }`).

### Programmatic initialization

```js
const { Editor } = Ezyreka; // UMD global
// or: import { Editor } from '@bookklik/ezyreka'; // ESM

const editor = new Editor({
  target: '#app',          // selector or HTMLElement
  width: 1080,             // page width in px
  height: 1080,            // page height in px
  name: 'Untitled design'  // file name
});

editor.on('ready', () => {
  editor.addText({ text: 'Hello Ezyreka', fontSize: 96, fontWeight: 800 });
  editor.addElement({ type: 'rect', x: 340, y: 620, w: 400, h: 110, radius: 55 });
});
```

## Learn more

- [Getting started](https://bookklik-technologies.github.io/ezyreka/guide/getting-started) — setup, editor options, themes
- [Guides](https://bookklik-technologies.github.io/ezyreka/guide/elements) — elements, text, charts, templates, layers, pages, export
- [API reference](https://bookklik-technologies.github.io/ezyreka/api/editor) — the full `Editor` API, events and document schema
- [Customization & plugins](https://bookklik-technologies.github.io/ezyreka/advanced/plugins) — registries, custom panels, community plugins
- [Development skills](docs/advanced/development-skills.md) — seven repository skills for AI-assisted plugin, element, template, chart, text, asset and UI development
- [Examples](https://bookklik-technologies.github.io/ezyreka/examples/) — plain HTML, React and Vue integrations

## Development

```bash
npm install
npm run build   # build dist/ (ESM + UMD, minified)
npm run dev     # watch + dev server at http://localhost:8080/examples/
npm test        # unit + DOM tests (node + jsdom)
npm run docs:dev  # documentation dev server
```

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses HTML5 canvas 2D, `Path2D`, `ResizeObserver`, `contenteditable` and pointer events.

## License

MIT
