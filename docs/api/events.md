# Events

The editor emits events for every meaningful state change. Subscribe with `editor.on(event, cb)`; both `off(event, cb)` and the returned unsubscribe function remove handlers.

```js
const off = editor.on('ready', () => console.log('ready'))
off() // stop listening
```

## `ready`

Fires once in a microtask after the editor finishes initializing. Subscribe immediately after `new Editor(...)` returns. Safe to call the API from here. If the editor is destroyed before the microtask runs, the event is skipped.

```js
editor.on('ready', () => {
  editor.addText({ text: 'Hello', fontSize: 96 })
})
```

## `change`

Fires on every design mutation — element edits, pages, backgrounds, history operations.

```js
editor.on('change', (doc) => {
  localStorage.setItem('design', JSON.stringify(editor.getJSON()))
})
```

## `selection`

Fires whenever the selection changes (add/remove/clear/selection contents change).

```js
editor.on('selection', (selected) => {
  // selected: DesignElement[]
  toggleToolbar(selected.length > 0)
})
```

## `zoom`

Fires on zoom changes.

```js
editor.on('zoom', (zoom) => {
  zoomLabel.textContent = Math.round(zoom * 100) + '%'
})
```

## `page`

Fires on page changes (switch, add, duplicate, delete).

```js
editor.on('page', (index) => {
  pageIndicator.textContent = `Page ${index + 1}`
})
```

## `upload`

Fires when a new image is added to the uploads library.

```js
editor.on('upload', (item) => {
  // item: { id, src, name }
})
```

## `export`

Fires on image exports. `exportImage()` emits `{ format, scale }`; `exportAllPages()` emits `{ format, scale, pages, blobs }` after every page has been downloaded.

```js
editor.on('export', (detail) => {
  analytics.track('exported', detail.format)
})
```

## `save`

Fires when the design is saved (`Ctrl/⌘ + S` or the Save button).

```js
editor.on('save', (doc) => {
  // doc: DesignDocument — persist it somewhere
})
```

## `rename`

Fires when the design is renamed.

```js
editor.on('rename', (name) => {
  document.title = `${name} — Ezyreka`
})
```

## `theme`

Fires when the UI theme changes.

```js
editor.on('theme', (theme) => {
  syncHostAppTheme(theme)
})
```
