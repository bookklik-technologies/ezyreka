# Editor

The `Editor` class is the single entry point to Ezyreka. Every editor owns its own asset registries and event emitter.

```js
import { Editor } from 'ezyreka' // ESM
// const { Editor } = Ezyreka // UMD global

const editor = new Editor({
  target: '#app',
  width: 1080,
  height: 1080
})
```

See [Editor options](/guide/editor-options) for the constructor options.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `fileName` | `string` | Current file name |
| `zoom` | `number` | Current zoom level |
| `theme` | `'light' \| 'dark'` | Current UI theme |
| `pageIndex` | `number` | Current page index |
| `uploads` | `{ id, src, name }[]` | Uploads library entries |
| `doc` | `DesignDocument` | Current design document |

## Documents

| Method | Description |
| --- | --- |
| `getJSON()` | Deep clone of the design document |
| `loadJSON(doc)` | Replace the design (normalizes & assigns fresh ids) |
| `applyTemplate(tpl)` | Apply a built-in or custom template |

## Elements

| Method | Description |
| --- | --- |
| `addElement(props)` | Add any element type (auto-centered in view) and select it |
| `addText(props)` | Shortcut for text elements |
| `updateSelected(props, commit?)` | Patch all selected elements |
| `deleteSelected()` | Delete the selection |
| `duplicateSelected()` | Duplicate the selection |
| `copy()` / `cut()` / `paste()` | Internal clipboard |
| `getElements()` | Current page elements |
| `getSelected()` | Current selection |
| `select(ids)` | Select specific element ids |
| `selectAll()` | Select everything on the page |
| `clearSelection()` | Deselect everything |

## Z-order & locking

| Method | Description |
| --- | --- |
| `bringToFront()` | Move selection to the top |
| `bringForward()` | Move selection one step up |
| `sendBackward()` | Move selection one step down |
| `sendToBack()` | Move selection to the bottom |
| `moveLayer(from, to)` | Reorder by element-array index (0 is backmost); supports undo/redo |
| `toggleLock()` | Lock/unlock selection |

## Pages

| Method | Description |
| --- | --- |
| `addPage()` | Add a page |
| `duplicatePage()` | Duplicate the current page |
| `deletePage(i?)` | Delete a page (current by default) |
| `goToPage(i)` | Switch pages |
| `movePage(from, to)` | Reorder pages |
| `setBackground(bg, commit?)` | Set the page background; pass `false` for a live preview, then call `commit()` |
| `resizeCanvas(width, height)` | Resize the current page to 1–10,000 whole pixels per side; undoable |

## View

| Method | Description |
| --- | --- |
| `setZoom(z, anchor?)` | Zoom (0.05–5) with optional anchor |
| `zoomFit()` | Fit the page to the screen |

## History

| Method | Description |
| --- | --- |
| `undo()` | Undo |
| `redo()` | Redo |
| `commit()` | Push a commit (for live-preview flows) |

A custom history strategy can be injected via the `history` option — anything implementing `push`/`undo`/`redo`/`reset`.

## Export

| Method | Description |
| --- | --- |
| `exportImage(format?, opts?)` | Download PNG/JPEG. `opts: { scale, transparent, pageIndex }` — resolves with a data URL |
| `exportAllPages(format?, opts?)` | Export and download every page; resolves after all downloads with the `Blob[]` |
| `downloadJSON()` | Save the design as `.json` |

## Other

| Method | Description |
| --- | --- |
| `setFileName(name)` | Rename the design |
| `setTheme(theme)` | Switch UI color scheme (`'light'`, `'dark'`, `'system'`, or a registered custom theme) |
| `toggleTheme()` | Toggle light/dark |
| `addUpload(file)` | Register an image file; returns a data URL promise |
| `openFilePicker()` | Open the image upload dialog |
| `destroy()` | Remove the editor and release listeners |
| `on(event, cb)` | Subscribe to an event; returns an unsubscribe function |
| `off(event, cb)` | Unsubscribe |

## Registration APIs

All registration methods are per-editor unless noted otherwise:

| Method | Description |
| --- | --- |
| `registerTemplates(tpl \| tpl[])` | Add templates to the Templates panel |
| `registerFont(name, opts?)` | Register a font family; `{ google: 'Fam:wght@400;700' }` loads it from Google Fonts |
| `registerIcons(icons)` | Register icons as 24×24 viewBox path data |
| `registerShapes(shapes)` | Register Elements-panel entries |
| `registerPalette(palette)` | Replace this editor's color swatches |
| `registerTheme(name, vars)` | Register a named theme (CSS variables) |
| `registerElementType(type, def?)` | Register a brand-new element type: `{ defaults, manifest, render }` |
| `registerElementRenderer(type, renderer)` | Override/add the canvas renderer for an element type |
| `registerElementManifest(type, manifest)` | Extend/override an element type's capability manifest |
| `registerChartRenderer(type, renderer)` | Override/add the painter for a chart type |
| `registerChartType(preset, painter?)` | Register a brand-new chart type |
| `registerBackgroundPainter(type, painter)` | Register a background type painter |
| `registerPanel(panel)` | Add a sidebar tab: `{ id, label, icon, render }` |
| `registerImage(image)` | Register an existing image into the uploads library |
| `registerImageSource(source)` | Add an image source provider to the Uploads panel |

::: warning
Element type/manifest and chart type registration are **page-global**; asset registries (templates, fonts, shapes, icons, palette) are per editor instance. See [Editor options](/guide/editor-options#global-vs-per-editor-options).
:::

## Events

```js
const off = editor.on('change', (doc) => console.log(doc))
off() // unsubscribe

editor.off('change', handler) // alternative
```

Full list: [`ready`](/api/events#ready), [`change`](/api/events#change), [`selection`](/api/events#selection), [`zoom`](/api/events#zoom), [`page`](/api/events#page), [`upload`](/api/events#upload), [`export`](/api/events#export), [`save`](/api/events#save), [`rename`](/api/events#rename), [`theme`](/api/events#theme).
