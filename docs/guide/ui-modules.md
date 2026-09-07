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

## Complete example: brand panel

With the UMD bundle loaded and a sized `#app`, this plugin adds a panel with an insertion button and a live selection count:

```js
const brandUiPlugin = {
  id: 'brand-ui',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx) {
    ctx.registerTheme('brand-ui-ocean', { '--ez-accent': '#0284c7' });
    ctx.once('ready', () => ctx.editor.setTheme('brand-ui-ocean'));
    ctx.registerPanel({
      id: 'brand-ui-panel',
      label: 'Brand',
      render(contentEl, editor) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Add heading';
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        const updateStatus = () => {
          status.textContent = editor.getSelected().length + ' selected';
        };
        const insert = () => {
          const item = editor.addText({
            text: 'Our brand', fontSize: 56, color: '#0284c7'
          });
          editor.select([item.id]);
        };
        button.addEventListener('click', insert);
        const off = ctx.on('selection', updateStatus);
        contentEl.append(button, status);
        updateStatus();
        return () => {
          off();
          button.removeEventListener('click', insert);
        };
      }
    });
  }
};
const editor = new Ezyreka.Editor({ target: '#app', plugins: [brandUiPlugin] });
// Call editor.destroy() when the host unmounts.
```

The panel cleanup runs before its content is cleared on tab changes, rerenders and destruction. Calling the tracked subscription's `off()` prevents duplicate listeners after reopening the panel.

Plugin panel registration queues before the UI exists. With `ui: false` or `ui: { sidepanel: false }`, it remains unmounted. Direct `editor.registerPanel()` requires the sidepanel to be present.

For a custom sidebar replacement, inspect the built-in sidepanel and editor call sites: it must consume pending plugin panels and implement the methods the editor calls. Internal fields such as `editor._pendingPanels` are implementation details, not stable public APIs.

Check keyboard activation, repeated tab visits, state updates and destruction. Prefer a panel over replacing a whole module when a panel meets the task.

For AI-assisted authoring, use [`$ezyreka-ui-customization`](/advanced/development-skills).
