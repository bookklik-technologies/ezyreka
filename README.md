# SenangDesign

**SenangDesign** is a standalone, full-featured, Canva-style design editor for the web. It ships as a single dependency-free JS library that you can initialize **programmatically** with JavaScript or **automatically** via `<div data-sk-editor></div>`.

No frameworks. No runtime dependencies. One script tag.

![SenangDesign](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Canvas engine** — HTML5 canvas rendering at device pixel ratio with DOM overlay for handles and guides
- **Element types** — text, images, 33 shape and line presets, and 41 SVG icons in solid and outline styles; searchable Elements library with labeled previews
- **Full transform system** — move, 8-handle resize, rotate (with 15° snapping), flip, multi-select (shift-click + rubber band), group move
- **Smart snapping** — edge/center alignment guides against other elements and the page, with pink guide lines
- **Inline text editing** — double-click any text to edit in place, auto-growing text boxes, wrapping, alignment, letter spacing
- **Pages** — multi-page documents, add/duplicate/delete/switch pages
- **Templates** — 32 fully editable templates across Social, Business, Events, Lifestyle, Education, and Community, with search, category filters, and live previews; includes announcements, invitations, pricing sheets, invoices, planners, worksheets, and community notices
- **Backgrounds** — solid palette, gradients, image backgrounds
- **Uploads** — image upload, drag & drop onto canvas, recent uploads panel
- **Layers panel** — reorder, show/hide, lock, delete
- **Undo / redo** — full snapshot history
- **Copy / paste / duplicate** — internal clipboard with keyboard shortcuts
- **Zoom & pan** — Ctrl+wheel zoom to cursor, fit to screen, space-drag panning, middle-mouse pan
- **Context menu** — right-click for z-order, flip, lock, duplicate and more
- **Export** — PNG (1x–4x, transparent), JPG, and `.json` design files; save & reopen designs
- **Keyboard shortcuts** — full Canva-style shortcut set (see below)
- **Event API** — `ready`, `change`, `selection`, `zoom`, `page`, `upload`, `export`, `save`, `rename`

## Installation

```bash
npm install senangdesign
```

Or use the bundle directly:

```html
<script src="dist/senangdesign.umd.js"></script>
```

## Quick start

### Automatic initialization

Any element with `data-sk-editor` is turned into an editor on page load:

```html
<div
  id="app"
  data-sk-editor
  data-sk-width="1080"
  data-sk-height="1080"
  data-sk-name="My design"
></div>
<script src="https://unpkg.com/senangdesign/dist/senangdesign.umd.js"></script>
```

> Size the container with CSS (e.g. `#app { width: 100vw; height: 100vh; }`).

### Programmatic initialization

```js
const { Editor } = SenangDesign; // UMD global
// or: import { Editor } from 'senangdesign'; // ESM

const editor = new Editor({
  target: '#app',          // selector or HTMLElement
  width: 1080,             // page width in px
  height: 1080,            // page height in px
  name: 'Untitled design'  // file name
});

editor.on('ready', () => {
  editor.addText({ text: 'Hello SenangDesign', fontSize: 96, fontWeight: 800 });
  editor.addElement({ type: 'rect', x: 340, y: 620, w: 400, h: 110, radius: 55 });
});
```

## API

### Editable charts

Open **Charts** in the sidebar to add a Bar, Row, Grouped bar, Line, Multi-line, Pie, Donut, Area, or Stacked area chart. Each chart is a canvas element with editable data, rather than an image. Use **Edit chart** in its toolbar or double-click it to reopen the editor.

The **Data** tab supports editable categories and series, adding/removing rows and columns, and spreadsheet paste. Paste into a value cell to replace a numeric block, into a category cell to include labels, or into the Category header to include series names. Pasted tables expand the grid and apply as one undo step. Blank values represent missing data; invalid numeric cells reject the entire paste. **Expand data table** provides a larger live editor.

The **Style** tab controls type, title, legend, value labels, axes/gridlines, text size/color, and series or pie-slice colors. Single-series charts display the first series while keeping additional series for later type changes. Pie and donut values must be non-negative; Cartesian charts accept negative values. Charts retain their data through copy/paste, layers, transforms, undo/redo, JSON save/load, and image export. Locked charts are read-only.

```js
const chart = editor.addElement({
  type: 'chart',
  w: 600,
  h: 400,
  chart: {
    type: 'grouped-bar',
    categories: ['Jan', 'Feb', 'Mar'],
    series: [
      { name: 'Sales', values: [24, 42, 35], color: '#477cf5' },
      { name: 'Costs', values: [16, null, 28], color: '#aa87ef' }
    ],
    title: 'Monthly results',
    showLegend: true
  }
});
editor.select([chart.id]);
// Replace the chart configuration; omitted appearance options use defaults.
editor.updateSelected({ chart: { ...chart.chart, title: 'Updated results' } });
```

Charts use the existing dependency-free canvas renderer. Invalid non-finite API/imported values normalize to missing values; negative pie/donut data is rejected. New documents containing charts require a version of the editor with chart support.

The sidebar uses a vertical tool rail with icons and labels. Click its top chevron (or the active tool) to collapse it to icons only. Click a tool icon to reopen its panel. Use Up/Down arrow keys to navigate focused tool tabs.

### `new Editor(options)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `string \| HTMLElement` | *required* | Container element |
| `width` | `number` | `1080` | Initial page width |
| `height` | `number` | `1080` | Initial page height |
| `name` | `string` | `'Untitled design'` | File name |
| `theme` | `'light' \| 'dark'` | `'light'` | UI color scheme |

### Documents

| Method | Description |
| --- | --- |
| `getJSON()` | Deep clone of the design document |
| `loadJSON(doc)` | Replace the design (normalizes & assigns fresh ids) |
| `applyTemplate(tpl)` | Apply a built-in or custom template |

### Elements

| Method | Description |
| --- | --- |
| `addElement(props)` | Add any element type (auto-centered in view) and select it |
| `addText(props)` | Shortcut for text elements |
| `updateSelected(props, commit?)` | Patch all selected elements |
| `deleteSelected()` / `duplicateSelected()` | — |
| `copy()` / `cut()` / `paste()` | Internal clipboard |
| `bringToFront()` / `bringForward()` / `sendBackward()` / `sendToBack()` | Z-order |
| `moveLayer(from, to)` | Reorder by element-array index (0 is backmost); supports undo/redo |
| `toggleLock()` | Lock/unlock selection |
| `getElements()` / `getSelected()` | Current page elements / selection |
| `select(ids)` / `selectAll()` / `clearSelection()` | Selection control |

Shape and icon fills support solid colors, no fill (`'none'`), or a two-color linear gradient. Select **Fill → Gradient** in the floating toolbar to edit both colors and the angle, or set it through the API:

```js
editor.updateSelected({
  fill: { type: 'gradient', from: '#d97706', to: '#ffffff', angle: 135 }
});
```

Angles run clockwise: `0` is left to right and `90` is top to bottom. Gradient fills are preserved in design JSON and PNG/JPEG exports.

In the Layers panel, drag a layer name or its grip above or below another layer. The insertion line shows where it will land; the top layer appears in front on the canvas. You can also focus a grip and use Up/Down arrow keys. Reordering preserves selection and supports undo/redo.

### Pages & view

| Method | Description |
| --- | --- |
| `addPage()` / `duplicatePage()` / `deletePage(i?)` / `goToPage(i)` | Page management |
| `setBackground(bg, commit?)` | `{ type: 'solid', color }` \| `{ type: 'gradient', from, to, angle }` \| `{ type: 'image', src }`; pass `false` for a live preview, then call `commit()` |
| `setZoom(z, anchor?)` / `zoomFit()` | Zoom (0.05–5), anchored zoom support |
| `resizeCanvas(width, height)` | Resize the current page to 1–10,000 whole pixels per side and fit it in view; undoable |
| `undo()` / `redo()` / `commit()` | History |

The Background panel includes gradient presets and a **Custom gradient** section with start/end colors, an angle, and a preview. Editing a gradient control updates the canvas immediately; **Apply gradient** also lets you reuse the displayed colors after switching to a solid or image background. Gradients support undo/redo and are saved with the design.

Use **Resize** in the top bar to browse visual preset cards under **Social media**, **Print**, or **Presentation**, or choose **Custom size** and enter width and height in pixels. Each card previews the format's proportions and shows its name and dimensions; the selected card is highlighted with a checkmark. Presets include square posts, stories/reels, A5/A4/A3, US Letter, business cards, and 16:9, 4:3, and 16:10 slides. Print dimensions are calculated at 300 pixels per inch without bleed. Choosing a preset fills the dimensions; click **Resize canvas** to apply. Resizing preserves element sizes and positions and supports undo/redo. Saved designs and image exports use the updated dimensions.

### Export

| Method | Description |
| --- | --- |
| `exportImage(format?, opts?)` | Download PNG/JPEG. `opts: { scale, transparent, pageIndex }` |
| `exportAllPages(format?, opts?)` | Export every page |
| `downloadJSON()` | Save the design as `.json` |

### Other

| Method | Description |
| --- | --- |
| `setFileName(name)` | Rename the design |
| `setTheme(theme)` / `toggleTheme()` | Switch UI color scheme (`'light'` / `'dark'`) |
| `addUpload(file)` | Register an image file; returns a data URL promise |
| `openFilePicker()` | Open the image upload dialog |
| `destroy()` | Remove the editor and release listeners |
| `on(event, cb)` / `off(event, cb)` | Events: `ready`, `change`, `selection`, `zoom`, `page`, `upload`, `export`, `save`, `rename`, `theme` |

## Element schema

```js
{
  id: 'rect_ab12cd3',
  type: 'rect',            // text | rect | ellipse | triangle | star | hexagon
                           // | diamond | heart | line | image | icon | shape
  x: 100, y: 100,          // top-left (unrotated)
  w: 200, h: 200,
  rotation: 0,             // degrees, rotates around center
  opacity: 1,
  locked: false, hidden: false,
  flipX: false, flipY: false,

  // text
  text: 'Hello', fontSize: 48, fontFamily: 'Poppins', fontWeight: 600,
  italic: false, underline: false, align: 'left',
  color: '#111827', lineHeight: 1.3, letterSpacing: 0,

  // shapes
  fill: '#7d2ae8', stroke: '', strokeWidth: 0, radius: 0,   // radius: rect only

  // line / arrow
  // stroke, strokeWidth, arrow: true

  // image
  src: 'data:image/png;base64,...',

  // icon
  icon: 'star', iconStyle: 'solid', fill: '#111827', // iconStyle: solid | outline

  // vector shape (type: 'shape')
  shape: 'arch'            // e.g. pentagon, burst, ring, blob, speech-bubble
}
```

Icons use `fill` as their color in both styles. Switch between solid and outline
in the Elements panel before insertion, or in the toolbar for selected icons.
Existing documents without `iconStyle` keep their solid appearance. Vector shapes
support fill, stroke, resizing and the same transforms as the basic shapes.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/⌘ + Z` / `Ctrl/⌘ + Shift + Z` | Undo / redo |
| `Ctrl/⌘ + C` / `X` / `V` / `D` | Copy / cut / paste / duplicate |
| `Ctrl/⌘ + A` | Select all |
| `Delete` / `Backspace` | Delete selection |
| `Arrows` / `Shift + Arrows` | Nudge 1px / 10px |
| `Ctrl/⌘ + +/-` / `0` | Zoom in / out / fit |
| `Ctrl/⌘ + S` | Save design file |
| `Escape` | Deselect / finish text editing |
| `Space` + drag | Pan canvas |
| Double-click | Edit text in place |

## Development

```bash
npm install
npm run build   # build dist/ (ESM + UMD, minified)
npm run dev     # watch + dev server at http://localhost:8080/examples/
npm test        # smoke + DOM tests (jsdom)
```

## Repo layout

```
├── src/
│   ├── index.js            # entry: exports + <div data-sk-editor> auto-init
│   ├── styles.js           # injected stylesheet + Google Fonts loader
│   ├── interactions.js     # pointer/keyboard engine: select, move, resize, rotate, snap
│   ├── core/
│   │   ├── editor.js       # Editor class: DOM shell, public API, export, pages, history glue
│   │   ├── renderer.js     # canvas 2D renderer (shapes, text wrap, images, icons)
│   │   ├── elements.js     # element factory, geometry, hit-testing
│   │   ├── history.js      # undo/redo stack
│   │   ├── assets.js       # fonts, palette, shapes, icons, templates, UI icons
│   │   └── utils.js        # geometry, DOM helpers, emitter
│   └── ui/
│       ├── topbar.js       # file name, undo/redo, zoom, open/save/download
│       ├── sidepanel.js    # templates, elements, text, uploads, background, layers
│       ├── toolbar.js      # floating contextual toolbar
│       ├── contextmenu.js  # right-click menu + shared dropdown
│       └── pagesbar.js     # page chips + add/duplicate/delete
├── dist/                   # built bundles (esm + umd)
├── examples/               # auto-init and programmatic demos
├── tests/                  # node smoke tests + jsdom DOM tests
├── types/                  # TypeScript definitions
└── scripts/                # esbuild build & dev scripts
```

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses HTML5 canvas 2D, `Path2D`, `ResizeObserver`, `contenteditable` and pointer events.

## License

MIT
