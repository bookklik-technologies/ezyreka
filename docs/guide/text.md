# Text

Text in Ezyreka is a first-class element type with inline editing, auto-growing boxes, wrapping, alignment and full typography controls.

## Adding text

```js
const t = editor.addText({
  text: 'Hello Ezyreka',
  fontSize: 96,
  fontWeight: 800,
  fontFamily: 'Poppins',
  align: 'center'
})
```

## Inline editing

Double-click any text element to edit it **in place** on the canvas. The box auto-grows as you type. Press <kbd>Escape</kbd> to finish editing and deselect.

## Text properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `'Text'` | Content (newlines wrap) |
| `fontFamily` | `string` | `'Poppins'` | Font family |
| `fontSize` | `number` | `48` | Font size in px |
| `fontWeight` | `number` | `600` | Numeric weight (100–900) |
| `italic` | `boolean` | `false` | Italic style |
| `underline` | `boolean` | `false` | Underline |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Horizontal alignment |
| `color` | `string` | `'#111827'` | Text color |
| `lineHeight` | `number` | `1.3` | Line height multiplier |
| `letterSpacing` | `number` | `0` | Extra spacing in px |

Patch selected text programmatically:

```js
editor.updateSelected({
  fontFamily: 'Poppins',
  fontWeight: 800,
  letterSpacing: 2,
  lineHeight: 1.4
})
```

## Fonts

The editor ships with default fonts and can load any Google Font on demand.

### Extra fonts at init

```js
new Editor({
  target: '#app',
  fonts: ['Brand Sans'], // picker-only families
  googleFonts: ['Cabinet+Grotesk:wght@400;700'] // also loads the webfont
})
```

### Registering fonts at runtime

```js
editor.registerFont('Cabinet Grotesk') // picker only
editor.registerFont('Cabinet Grotesk', { google: true }) // + webfont link (default weights)
editor.registerFont('Cabinet Grotesk', { google: 'Cabinet+Grotesk:wght@400;700' })
```

Registered fonts appear in both font pickers (text toolbar and default text panel).

See [Customization & registries](/advanced/customization#fonts) for more.
