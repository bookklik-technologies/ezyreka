# Headless mode

Headless mode runs the full canvas engine and public API **without any UI** — the canvas, selection, transforms, history, export and events all work.

## Enabling headless

```js
new Editor({ target: '#app', ui: false })
```

## Why headless?

- Build a completely custom editing UI on top of the engine
- Server-side design generation flows (render → export)
- Embed the editor in environments where you control every pixel of chrome

## Building your own UI

The public API is everything the built-in UI uses, so any custom UI is possible:

```js
const editor = new Editor({ target: '#app', ui: false })

editor.on('ready', () => {
  editor.addText({ text: 'Headless design', fontSize: 64 })
})

// Your own controls:
document.querySelector('#addRect').onclick = () => {
  editor.addElement({ type: 'rect', w: 300, h: 160, fill: '#477cf5' })
}
document.querySelector('#bold').onclick = () => {
  editor.updateSelected({ fontWeight: 800 })
}
document.querySelector('#undo').onclick = () => editor.undo()
document.querySelector('#export').onclick = async () => {
  const dataUrl = await editor.exportImage('png', { scale: 2 })
  download(dataUrl)
}
```

## Selection-driven UI

`selection` events keep custom controls in sync:

```js
editor.on('selection', (selected) => {
  updateToolbarState(selected)
})
```

## Custom history

Headless flows can also swap the history strategy (anything implementing `push`/`undo`/`redo`/`reset`):

```js
new Editor({
  target: '#app',
  ui: false,
  history: myServerBackedHistory
})
```

## Mixed setups

You don't have to go fully headless — disable individual modules instead:

```js
new Editor({
  target: '#app',
  ui: { topbar: false, pagesBar: false } // keep the canvas + panels
})
```

See [UI modules](/guide/ui-modules) for per-module control.
