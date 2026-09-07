# Images & uploads

Images are added through the Uploads panel, by drag & drop, or through the API.

## Uploading

- **File picker** — click *Upload* in the Uploads panel, or call `editor.openFilePicker()`
- **API** — `editor.addUpload(file)` registers an image file and returns a promise for the data URL
- **Drag & drop** — drop image files straight onto the canvas

Recent uploads appear in the Uploads panel; clicking one places it on the canvas.

```js
const input = document.querySelector('#fileInput')

input.addEventListener('change', async () => {
  const file = input.files[0]
  if (file) {
    const dataUrl = await editor.addUpload(file)
    editor.addElement({ type: 'image', src: dataUrl, w: 400, h: 300 })
  }
})
```

## Seeding the uploads library

Register existing assets (URLs or data URLs) so they appear in the panel and recents library without a file picker round-trip:

```js
editor.registerImage({ src: 'https://cdn.example.com/logo.png', name: 'Logo' })
editor.registerImage('data:image/png;base64,...')
```

## Image elements

```js
editor.addElement({
  type: 'image',
  src: 'https://cdn.example.com/photo.jpg',
  x: 100,
  y: 100,
  w: 480,
  h: 320
})
```

Image elements support the full transform system (move, resize, rotate, flip) as well as opacity, locking and layering.

## Stock photo providers

Extend the Uploads panel with stock/CDN/brand-asset providers. Each provider exposes a `search(query)` (debounced) returning `{ src, name?, thumb? }` items; clicking a result adds it to the canvas and the recents library.

```js
editor.registerImageSource({
  id: 'stock',
  label: 'Stock photos',
  search: async (query) => {
    const res = await fetch(`https://api.example.com/search?q=${encodeURIComponent(query)}`)
    return res.json()
  }
})
```

See [Image sources](/advanced/image-sources) for the full guide.
