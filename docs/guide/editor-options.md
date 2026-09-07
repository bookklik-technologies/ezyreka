# Editor options

The `Editor` is created with a single options object:

```js
const editor = new Editor(options)
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `string \| HTMLElement` | *required* | Container element |
| `width` | `number` | `1080` | Initial page width |
| `height` | `number` | `1080` | Initial page height |
| `name` | `string` | `'Untitled design'` | File name |
| `theme` | `'light' \| 'dark'` | `'light'` | UI color scheme |
| `templates` | `EditorTemplate[]` | — | Extra templates shown in the Templates panel (appended after the built-ins) |
| `fonts` | `string[]` | — | Extra font family names offered in the font pickers |
| `googleFonts` | `string[]` | — | Extra Google Fonts css2 family specs, e.g. `'Familia:wght@400;700'` |
| `palette` | `string[] \| { label, colors }[]` | built-in | Replaces the default color swatches for this editor |
| `gradients` | `{ from, to, angle? }[]` | built-in | Replaces the default gradient presets for this editor |
| `chartColors` | `string[]` | built-in | Replaces the default chart series colors (applies to every editor on the page) |
| `initialDoc` | `DesignDocument` | — | Design document loaded during initialization |
| `imageSources` | `ImageSource[]` | — | Image search providers shown in the Uploads panel |
| `history` | `HistoryLike` | built-in | Injects a custom history strategy implementing the snapshot interface |
| `themes` | `Record<string, Record<string, string>>` | — | Named custom themes (CSS variable sets) usable via `theme` and `setTheme()` |
| `cssVars` | `Record<string, string>` | — | CSS custom properties applied to the editor container on top of the theme |
| `ui` | `boolean \| object` | all enabled | `false` for headless; per-module `false` to disable or a constructor to replace (`topbar`, `sidepanel`, `toolbar`, `contextMenu`, `pagesBar`) |

## Examples

### Restore a saved design

```js
const doc = JSON.parse(localStorage.getItem('design'))

const editor = new Editor({
  target: '#app',
  initialDoc: doc
})
```

### Brand colors and fonts

```js
new Editor({
  target: '#app',
  palette: [{ label: 'Brand', colors: ['#1e293b', '#d97706', '#f1f5f9'] }],
  gradients: [{ from: '#d97706', to: '#ffffff', angle: 135 }],
  fonts: ['Brand Sans'],
  googleFonts: ['Poppins:wght@400;600;800']
})
```

### Custom themes and CSS variables

```js
const editor = new Editor({
  target: '#app',
  themes: {
    ocean: { '--ez-accent': '#0ea5e9', '--ez-bg': '#0f172a' }
  },
  cssVars: { '--ez-radius': '12px' }
})

editor.setTheme('ocean')
```

### Disable or replace a UI module

```js
new Editor({ target: '#app', ui: { contextMenu: false } }) // disable one module
new Editor({ target: '#app', ui: { toolbar: MyToolbar } }) // replace a module
```

See [UI modules](/guide/ui-modules) and [Headless mode](/guide/headless) for details.

## Global vs per-editor options

A few option values normalize into page-global state rather than per-editor state:

- `chartColors` normalizes into chart data and therefore applies globally to all editors on the page.
- Element type/manifest registration and chart type registration are likewise page-global.
- Asset registries (templates, fonts, shapes, icons, palette) are **per editor instance**.

## The auto-init attributes

With the UMD bundle, any element carrying `data-ez-editor` becomes an editor on page load:

| Attribute | Description |
| --- | --- |
| `data-ez-editor` | Marks the element as an editor container |
| `data-ez-width` | Initial page width |
| `data-ez-height` | Initial page height |
| `data-ez-name` | File name |

Size the container with CSS — the editor UI fills it.
