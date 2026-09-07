---
name: ezyreka-plugin-development
description: "Create or update trusted JavaScript plugins for the Ezyreka editor, including startup registration, options, lifecycle and compatibility. Use for Ezyreka extensions, not Codex plugin packaging."
---

# Ezyreka Plugin Development

## Inputs and approach

Determine the requested capabilities, stable plugin id, options and host integration from the task and existing code. Use a plain JavaScript plugin object and the existing public API; do not add runtime plugin installation or modify core dispatch tables.

Read the [plugin guide](../../../docs/advanced/plugins.md), [implementation](../../../src/core/plugins.js) and [public types](../../../types/index.d.ts) before changing lifecycle or registration behavior.

## Workflow and contracts

- Export `{ id, version, apiVersion: 1, setup(ctx, options) }`. Use `@bookklik/ezyreka` in imports and npm peer dependencies when package metadata is requested.
- Register capabilities synchronously in `setup`, before UI construction and `initialDoc` loading. Return a cleanup function or nothing; a Promise is rejected. Start content insertion after `ready` when needed.
- Use `ctx.register*` for isolated registrations. Direct `ctx.editor.registerElementType`, manifest, chart-type, renderer and background-painter methods can write shared module registries.
- Prefix capability ids with the plugin id. Plugin ids are unique within an editor's configured list; the same plugin may run in multiple editors. New element/chart/panel/provider ids reject duplicates in that editor.
- Use `ctx.on`/`ctx.once` for tracked editor events, `ctx.onDispose` for extra resources and `ctx.signal` for asynchronous work; the signal can be null. Panel-mounted resources need the panel's own cleanup.
- Setup failures dispose partial registrations' owning plugin instances and stop startup. Teardown runs plugins in reverse order, aborts work, removes tracked listeners and runs cleanup. Do not depend on global rollback.
- Store JSON-compatible custom element/background data. Saved documents contain data, not plugin code. Missing capabilities retain placeholders and block image export of visible unresolved content; JSON saving remains available.
- Do not assume the context exposes every editor method: palette replacement, for example, is `ctx.editor.registerPalette`, not `ctx.registerPalette`.

## Example

For a programmatically initialized host:

```js
const badgePlugin = {
  id: 'brand-badges',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx, { color = '#477cf5' } = {}) {
    ctx.registerElementType('brand-badges-badge', {
      defaults: { w: 160, h: 64, fill: color },
      manifest: { name: 'Brand badge', toolbar: ['opacity'] },
      render(canvas, element) {
        canvas.fillStyle = element.fill;
        canvas.fillRect(0, 0, element.w, element.h);
      }
    });
  }
};
const editor = new Ezyreka.Editor({ target: '#app', plugins: [badgePlugin] });
editor.on('ready', () => {
  const badge = editor.addElement({ type: 'brand-badges-badge', x: 80, y: 80 });
  editor.select([badge.id]);
});
```

The host must provide a sized `#app` and load the UMD bundle. This renderer accepts solid colors; do not expose a gradient fill control without implementing gradient rendering.

## Deliverables and verification

Deliver the plugin, requested host wiring and a short explanation of options, dependencies and teardown. Reuse the element, chart or UI skill only for those contributed capabilities.

Review two editors using different options, initial document loading, duplicate ids, setup failure, destroy and reopening without the plugin. Check save/load and export behavior for contributed content. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
