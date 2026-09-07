# Exporting

Ezyreka exports raster images and portable design files.

## Methods

| Method | Description |
| --- | --- |
| `exportImage(format?, opts?)` | Download PNG/JPEG. `opts: { scale, transparent, pageIndex }` |
| `exportAllPages(format?, opts?)` | Export every page |
| `downloadJSON()` | Save the design as `.json` |
| `getJSON()` | Deep clone of the design document |
| `loadJSON(doc)` | Replace the design (normalizes & assigns fresh ids) |

## PNG and JPEG

```js
// PNG at 1x (default)
await editor.exportImage('png')

// PNG at 4x scale with transparent background
await editor.exportImage('png', { scale: 4, transparent: true })

// JPEG of a specific page at 2x
await editor.exportImage('jpeg', { scale: 2, pageIndex: 0 })

// Export every page
await editor.exportAllPages('png')
```

Options:

| Option | Description |
| --- | --- |
| `scale` | Export scale, `1`–`4` |
| `transparent` | PNG only — omit the page background |
| `pageIndex` | Which page to render (defaults to current) |

`exportImage()` resolves with a data URL, so you can also embed it instead of downloading:

```js
const dataUrl = await editor.exportImage('png', { scale: 2 })
document.querySelector('#preview').src = dataUrl
```

Gradients, charts and custom renderers are included in exports because they all draw through the same canvas renderer.

## Design files

`Ctrl/⌘ + S` (or **Save** in the top bar) downloads a `.json` design file. Reopen it from **Open** in the top bar, or load it at init:

```js
const doc = JSON.parse(savedText)

const editor = new Editor({
  target: '#app',
  initialDoc: doc
})
```

Documents carrying charts require a version of the editor with chart support.

## Persistence with events

The `save` and `change` events make autosave easy:

```js
editor.on('change', () => {
  localStorage.setItem('design', JSON.stringify(editor.getJSON()))
})
```

See [Events](/api/events) for the full list.
