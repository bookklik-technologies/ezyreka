# Themes & colors

## Light and dark

The built-in themes are `light` and `dark`:

```js
const editor = new Editor({ target: '#app', theme: 'dark' })
editor.toggleTheme() // switch at runtime
editor.setTheme('light')
```

The topbar also exposes a theme toggle.

## Custom themes

Custom themes are **named CSS-variable sets**. Register them at init or at runtime, then switch with `setTheme()`:

```js
const editor = new Editor({
  target: '#app',
  themes: {
    ocean: { '--ez-accent': '#0ea5e9', '--ez-bg': '#0f172a' }
  }
})

editor.setTheme('ocean')
```

```js
editor.registerTheme('forest', { '--ez-accent': '#16a34a' })
editor.setTheme('forest')
```

## CSS variables on top

`cssVars` applies on top of any theme — good for radius, spacing and one-off overrides:

```js
new Editor({
  target: '#app',
  cssVars: { '--ez-radius': '12px' }
})
```

## Palettes

Every color picker shows a swatch palette. Replace it at init or at runtime, with a flat hex list or labeled groups:

```js
new Editor({
  target: '#app',
  palette: [{ label: 'Brand', colors: ['#1e293b', '#d97706', '#f1f5f9'] }]
})
```

```js
editor.registerPalette(['#101010', '#202020'])
```

## Gradients

Replace the default gradient presets:

```js
new Editor({
  target: '#app',
  gradients: [{ from: '#d97706', to: '#ffffff', angle: 135 }]
})
```

Every color picker in the UI pairs a hex text field (3-digit hex expands) with the native swatch. Multi-stop gradients work through the API:

```js
editor.updateSelected({
  fill: {
    type: 'gradient',
    stops: [
      { color: '#111827', offset: 0 },
      { color: '#f59e0b', offset: 0.5 },
      { color: '#f97316', offset: 1 }
    ],
    angle: 135
  }
})
```

## Chart colors

```js
new Editor({
  target: '#app',
  chartColors: ['#d97706', '#477cf5', '#1e293b']
})
```

::: warning
`chartColors` normalizes into chart data and therefore applies **globally** to all editors on the page.
:::

## Themed events

The `theme` event fires whenever the theme changes, so host apps can stay in sync:

```js
editor.on('theme', (theme) => {
  console.log('UI theme is now', theme)
})
```
