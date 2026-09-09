# Recipes

Practical patterns for integrating Ezyreka into real applications.

## Autosave to localStorage

```js
const editor = new Editor({ target: '#app' })

editor.on('change', () => {
  localStorage.setItem('design', JSON.stringify(editor.getJSON()))
})
```

## Save/load through a backend

```js
editor.on('save', async (doc) => {
  await fetch('/api/designs/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: editor.fileName, doc })
  })
})

// Load it back at init
const doc = await fetch('/api/designs/1').then(r => r.json())
new Editor({ target: '#app', initialDoc: doc })
```

## Custom branded editor

```js
new Editor({
  target: '#app',
  name: 'Campaign banner',
  width: 1200,
  height: 628,
  palette: [{ label: 'Brand', colors: ['#1e293b', '#FACC15', '#f1f5f9'] }],
  gradients: [{ from: '#FACC15', to: '#ffffff', angle: 135 }],
  fonts: ['Brand Sans'],
  googleFonts: ['Poppins:wght@400;600;800'],
  templates: [/* brand templates */],
  chartColors: ['#FACC15', '#1e293b', '#477cf5']
})
```

## Thumbnail generation

Export a small page preview without downloading:

```js
const thumb = await editor.exportImage('png', { scale: 0.25, pageIndex: 0 })
```

::: tip
Combine `exportImage()` with `pageIndex` to render every page in a loop for a page-picker UI.
:::

## Lock the layout, let users fill it

```js
const layout = await fetch('/templates/brand-layout.json').then(r => r.json())

editor.on('ready', () => {
  editor.loadJSON(layout)
  // Lock structural elements so users can only edit content
  const structural = editor.getElements().filter(el => el.type === 'shape')
  editor.select(structural.map(el => el.id))
  // locked elements are not hit-testable on canvas
})
```

## Multi-editor page

```js
const a = new Editor({ target: '#editor-a', width: 1080, height: 1080, name: 'Square' })
const b = new Editor({ target: '#editor-b', width: 1920, height: 1080, name: 'Slide' })

// Page-global settings (chart colors) apply to both editors
// Asset registries (templates, fonts, palette) are independent per editor
```

## Custom export button with page picker

```js
async function exportPage(index) {
  const dataUrl = await editor.exportImage('png', { scale: 2, pageIndex: index })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `page-${index + 1}.png`
  a.click()
}
```

## Controlled theme sync

```js
editor.on('theme', (theme) => {
  document.documentElement.dataset.mode = theme
})
```

## Cleanup on route change (SPA)

```js
let editor

onMounted(() => {
  editor = new Editor({ target: '#app' })
})

onUnmounted(() => {
  editor.destroy() // removes the editor and releases listeners
})
```
