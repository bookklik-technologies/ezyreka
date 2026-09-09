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

`cssVars` supplies inline variables for radius, spacing and other overrides. If a named custom theme defines the same key, that theme's value wins:

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
  palette: [{ label: 'Brand', colors: ['#1e293b', '#FACC15', '#f1f5f9'] }]
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
  gradients: [{ from: '#FACC15', to: '#ffffff', angle: 135 }]
})
```

Every color picker in the UI pairs a hex text field (3-digit hex expands) with the native swatch. Multi-stop gradients work through the API:

```js
editor.updateSelected({
  fill: {
    type: 'gradient',
    stops: [
      { color: '#111827', offset: 0 },
      { color: '#FACC15', offset: 0.5 },
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
  chartColors: ['#FACC15', '#477cf5', '#1e293b']
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

## Themes registered by plugins

A theme registered during plugin setup is available after registration. Because the constructor resolves its initial theme before plugin setup, select a plugin-provided theme from a ready callback:

```js
// Inside a plugin's setup(ctx):
ctx.registerTheme('brand-ocean', { '--ez-accent': '#0284c7' });
ctx.once('ready', () => ctx.editor.setTheme('brand-ocean'));
```

There is no `ctx.registerPalette` wrapper; use `ctx.editor.registerPalette` for a plugin that intentionally replaces the editor's palette.

For AI-assisted customization, use [`$ezyreka-ui-customization`](/advanced/development-skills).
