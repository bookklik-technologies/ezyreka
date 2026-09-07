# Image sources

The Uploads panel can be extended with **stock, CDN or brand-asset providers**. Each provider is a search function returning image items; results appear as a searchable tab in the panel.

## The contract

```ts
interface ImageSource {
  id: string
  label?: string
  /**
   * Returns image items for a search query; called debounced and on panel open.
   */
  search(query: string): Promise<{ src: string, name?: string, thumb?: string }[]>
    | { src: string, name?: string, thumb?: string }[]
}
```

Clicking a result adds it to the canvas and the recents library.

## Registering

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

Providers can also be seeded at init with the `imageSources` option.

## Sync providers

`search` may return a plain array for local/synchronous sources:

```js
editor.registerImageSource({
  id: 'brand',
  label: 'Brand assets',
  search(query) {
    return brandAssets.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
  }
})
```

## Seeding the uploads library

Register existing assets (URLs or data URLs) so they appear in the panel without searching:

```js
editor.registerImage({ src: 'https://cdn.example.com/logo.png', name: 'Logo' })
editor.registerImage('data:image/png;base64,...')
```

## Example: Unsplash-style provider

```js
editor.registerImageSource({
  id: 'unsplash',
  label: 'Unsplash',
  search: async (query) => {
    const res = await fetch(
      `https://your-proxy.dev/unsplash?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: 'Bearer <token>' } } // keep secrets on your proxy
    )
    const photos = await res.json()
    return photos.map(p => ({ src: p.urls.regular, name: p.alt_description, thumb: p.urls.thumb }))
  }
})
```

::: tip
`search()` is debounced and also called once when the panel opens — return your defaults/featured items for an empty query.
:::

## Security notes

- Route provider API calls through your own server proxy; never embed API keys in the browser bundle.
- Only return image URLs you trust — the editor loads them into the canvas as `Image` sources.
