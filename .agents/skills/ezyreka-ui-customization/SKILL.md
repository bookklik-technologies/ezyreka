---
name: ezyreka-ui-customization
description: "Customize Ezyreka sidebar panels, UI modules, themes, palettes and editor controls, including event and DOM cleanup. Use for the editor UI, not unrelated website design."
---

# Ezyreka UI Customization

## Inputs and approach

Identify the requested controls, host/plugin context, enabled UI modules and theme requirements. Prefer a panel or configuration option before replacing an entire UI module.

Read [UI modules](../../../docs/guide/ui-modules.md), [themes](../../../docs/guide/themes.md), [sidepanel lifecycle](../../../src/ui/sidepanel.js), [editor implementation](../../../src/core/editor.js) and [public types](../../../types/index.d.ts).

## Workflow and contracts

- UI module keys are `topbar`, `sidepanel`, `toolbar`, `contextMenu`, `pagesBar`; false disables a module and a constructor replaces it. `ui: false` disables all built-in UI.
- In plugins use `ctx.registerPanel({ id, label, icon?, render })`. Panels queue before UI construction and remain unmounted with a disabled sidepanel. Direct `editor.registerPanel` requires a sidepanel already present.
- Panel `render(contentEl, editor)` runs on activation and may return cleanup. Release editor subscriptions, DOM listeners and mounted resources on each cleanup, not only on editor destruction.
- Prefer DOM creation and `textContent` for content. Use labeled native buttons/inputs, preserve keyboard access and keep a control's current state synchronized through editor events.
- Theme registration uses `ctx.registerTheme` or `editor.registerTheme`; palette replacement uses `editor.registerPalette` (no context wrapper). Use existing `--ez-*` variables.
- Select a theme registered during plugin setup in `ctx.once('ready', ...)`: constructor theme resolution happens before plugin setup. On conflicting keys, named custom-theme variables override `cssVars` in the current implementation.
- Prefer `ctx.on` for plugin-lifetime listeners and call returned unsubscribe functions for shorter panel lifetimes.
- A replacement sidebar must implement the interfaces used by the editor, including pending plugin panel consumption; inspect the built-in module before replacing it. Private DOM/editor hooks are implementation details, not stable public APIs.
- Use `updateSelected(patch, false)` and one final `commit()` for live controls; disable edits for locked selections.

## Example

Inside a plugin with id `brand`:

```js
ctx.registerPanel({
  id: 'brand-panel', label: 'Brand',
  render(contentEl, editor) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Add heading';
    const insert = () => {
      const item = editor.addText({ text: 'Our brand', fontSize: 56, color: '#477cf5' });
      editor.select([item.id]);
    };
    button.addEventListener('click', insert);
    contentEl.append(button);
    return () => button.removeEventListener('click', insert);
  }
});
ctx.registerTheme('brand-ocean', { '--ez-accent': '#0284c7' });
ctx.once('ready', () => ctx.editor.setTheme('brand-ocean'));
```

For panel state synchronized with editor events, use the complete example in the UI modules guide.

## Deliverables and verification

Deliver the panel/module/configuration and host wiring. Review keyboard access, repeated tab activation, rerender cleanup, editor destruction, theme switching and disabled-sidebar behavior. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
