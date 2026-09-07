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
| `text` | `string` | `'Your text here'` | Plain text; newlines start new lines |
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

## Creating a heading and paragraph

With an existing editor, set explicit widths and use `color` for text:

```js
editor.registerFont('Arial');
const heading = editor.addText({
  x: 80, y: 80, w: 720, h: 80,
  text: 'Make room for ideas',
  fontFamily: 'Arial', fontSize: 56, fontWeight: 700,
  lineHeight: 1.15, color: '#0f172a'
});
editor.addText({
  x: 80, y: 260, w: 620, h: 180,
  text: 'An editable paragraph that wraps within its text box.\nA new line starts here.',
  fontFamily: 'Arial', fontSize: 28, fontWeight: 400,
  lineHeight: 1.4, color: '#334155'
});
editor.select([heading.id]);
editor.updateSelected({ letterSpacing: 1 });
```

`registerFont('Arial')` adds a picker entry; this example relies on an installed Arial font. A custom webfont needs an actual font source in addition to registration. Check the font has loaded before assessing wrapping or exporting.

When height is omitted, a text element starts with a single-line height plus padding. Height fitting during inline editing and interactive resizing can grow the box; insertion and generic style updates do not automatically fit its height. Set enough height for programmatic multiline content. It does not shrink to tightly fit shorter text. Long tokens without spaces can overflow. Test the intended width and wording in the target browser.

Text is plain content with one typography style per element. Double-click to edit, then use Escape to finish. For a custom live style control, select the text, call `updateSelected(patch, false)` while changing it, and `commit()` once at the end; disable that control for locked selections.

For AI-assisted authoring, use [`$ezyreka-text-creation`](/advanced/development-skills).
