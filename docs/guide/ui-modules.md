# UI modules

The Ezyreka UI is built from five modules. Each can be disabled or replaced independently.

| Module | Responsibility |
| --- | --- |
| `topbar` | File name, undo/redo, zoom, theme, rename, open/save/download |
| `sidepanel` | Templates, elements, text, uploads, charts, background, layers |
| `toolbar` | Floating contextual toolbar for the selection |
| `contextMenu` | Right-click menu for z-order, flip, lock, duplicate and more |
| `pagesBar` | Page chips with add/duplicate/delete |

## Disabling modules

Pass `false` for any module key:

```js
new Editor({ target: '#app', ui: { contextMenu: false } })
```

Pass `false` for `ui` itself to run [headless](/guide/headless).

## Replacing modules

Pass a constructor instead — each module is instantiated with the editor:

```js
class MyToolbar {
  constructor(editor) {
    this.editor = editor
    // build your DOM, subscribe via editor.on(...)
  }
}

new Editor({ target: '#app', ui: { toolbar: MyToolbar } })
```

The built-in modules live in `src/ui/` — use them as references for the DOM shell and event wiring:

```
src/ui/
├── topbar.js       # file name, undo/redo, zoom, open/save/download
├── sidepanel.js    # templates, elements, text, uploads, background, layers
├── toolbar.js      # floating contextual toolbar
├── contextmenu.js  # right-click menu + shared dropdown
└── pagesbar.js     # page chips + add/duplicate/delete
```

## Adding a sidebar panel

Custom panels integrate through the tool rail like any built-in tool:

```js
editor.registerPanel({
  id: 'brand',
  label: 'Brand kit',
  icon: '<svg …>…</svg>', // tool-rail icon
  render(contentEl, ed) {
    // Build your panel DOM into contentEl; subscribe via ed.on(...) as needed.
  }
})
```

See [Extensibility](/advanced/extensibility#sidebar-panels) for details.

## Styling

The UI is styled with injected CSS custom properties. Theme colors, radii and accent colors are controlled via [themes & CSS variables](/guide/themes).
