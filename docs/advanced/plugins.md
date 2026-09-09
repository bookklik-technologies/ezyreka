# Community plugins

Ezyreka supports **developer-installed, trusted JavaScript plugins** that extend the editor with new panels, element types, charts, renderers, backgrounds, assets, themes and image sources. Plugins are configured at startup, register capabilities synchronously, and clean up when the editor is destroyed.

> Plugins run **inside your page with full privileges** — there is no sandboxing. Only install plugins you trust, exactly like any other npm dependency or script you ship. Marketplace installation, runtime installation/removal and dependency resolution are out of scope for this release.

## Installation

```bash
npm install @bookklik/ezyreka my-ezyreka-plugin
```

Declare package compatibility through **npm peer dependencies**: a plugin package lists `@bookklik/ezyreka` under `peerDependencies` with the package version range it supports, for example `"@bookklik/ezyreka": "^1.0.0"`. The plugin's separate integer `apiVersion` is checked at runtime.

### ESM

```js
import { Editor } from '@bookklik/ezyreka';
import badgePlugin from 'my-ezyreka-plugin';

const editor = new Editor({
  target: '#app',
  plugins: [{ plugin: badgePlugin, options: { color: '#477cf5' } }]
});
```

A bare plugin object is shorthand for an entry without options:

```js
const editor = new Editor({ target: '#app', plugins: [badgePlugin] });
```

### Script tag + programmatic initialization

The UMD bundle exposes `Ezyreka` globally. Auto-initialization (`<div data-ez-editor>`) does not support plugins; when you need plugins with a script tag, initialize programmatically:

```html
<script src="https://unpkg.com/@bookklik/ezyreka/dist/ezyreka.umd.js"></script>
<script src="https://unpkg.com/my-ezyreka-plugin/dist/my-plugin.umd.js"></script>
<script>
  const editor = new Ezyreka.Editor({
    target: '#app',
    plugins: [{ plugin: MyPlugin.default, options: { color: '#477cf5' } }]
  });
</script>
```

See the runnable [`examples/plugin.html`](https://github.com/bookklik-technologies/ezyreka/blob/main/examples/plugin.html) demo.

## Authoring a plugin

A plugin is an object with a unique `id`, a `version`, the `apiVersion` it targets, and a synchronous `setup(ctx, options)` that registers capabilities and may return a cleanup function:

```js
const badgePlugin = {
  id: 'community-badges',
  version: '1.0.0',
  apiVersion: 1,

  setup(ctx, { color = '#477cf5' } = {}) {
    ctx.registerElementType('community-badges-badge', {
      defaults: { w: 120, h: 40, fill: color },
      manifest: { name: 'Badge', toolbar: ['opacity'] },
      render(canvas, element) {
        canvas.fillStyle = element.fill;
        canvas.fillRect(0, 0, element.w, element.h);
      }
    });

    // Optional synchronous cleanup function.
    return () => {};
  }
};
```

### Lifecycle

- Entries are **validated before any setup runs**: every entry needs an id unique within that editor's plugin list, a version string, an integer `apiVersion` matching the editor's supported version, and a synchronous `setup`. The same plugin can be configured in multiple editors. Setup may return a cleanup function, nothing, `undefined` or `null`; a Promise or another return value fails startup with the plugin id and cause.
- Plugins run in **configuration order** during editor initialization — after core infrastructure (registries, DOM, history, interactions) exists, but **before UI construction and `initialDoc` loading**. Panel contributions therefore queue for the sidepanel, and plugin content in `initialDoc` resolves correctly.
- The `ready` event still fires after initialization completes, so plugins can `ctx.once('ready', …)` during setup.
- On **destroy**, plugins are torn down in reverse order before editor infrastructure: pending async work is aborted via `ctx.signal`, tracked listeners are removed, and the cleanup function runs exactly once. A throwing disposer never stops the remaining teardown.
- If `setup` throws, the editor fails to start, partially initialized plugins are disposed, and the target element is released so the host can retry.

### The plugin context

| Member | Description |
| --- | --- |
| `ctx.pluginId` | The current plugin's stable id. |
| `ctx.editor` | The editor instance (trusted, untracked access). |
| `ctx.apiVersion` | The supported plugin API version (currently `1`). |
| `ctx.signal` | `AbortSignal` aborted at destroy; use it for async work started in setup. May be `null` when `AbortController` is unavailable. |
| `ctx.on(event, handler)` / `ctx.once(event, handler)` | Tracked subscriptions — removed automatically at destroy. |
| `ctx.onDispose(fn)` | Extra teardown callback, run at destroy after cleanup. |
| `ctx.registerPanel(panel)` | Adds a sidebar tab. Contributions queue until the UI is built; they stay unmounted when the sidebar is disabled. `render` may return a cleanup function, invoked before rerender, tab replacement and destruction. |
| `ctx.registerElementType(type, { defaults, manifest, render })` | Brand-new element type, scoped to this editor. Duplicate type ids are rejected. |
| `ctx.registerElementRenderer(type, renderer)` | Overrides/adds an element renderer for this editor. |
| `ctx.registerChartType(preset, renderFn)` | Brand-new chart type (gallery, type dropdown, normalization, validation). Duplicate ids rejected. |
| `ctx.registerChartRenderer(type, renderer)` | Overrides/adds a chart painter: `fn(ctx, chart, series, plotBox, font, bounds, registry)`. |
| `ctx.registerBackgroundPainter(type, painter)` | Background painter: `fn(ctx, bg, pageWidth, pageHeight)`. |
| `ctx.registerTemplates(list)` / `ctx.registerFont(name, opts)` / `ctx.registerIcons(map)` / `ctx.registerShapes(list)` / `ctx.registerImage(image)` | Asset registrations (instance-scoped). |
| `ctx.registerTheme(name, vars)` | Named CSS-variable theme, usable via `theme`/`setTheme()`. |
| `ctx.registerImageSource(source)` | Image source provider for the Uploads panel. Duplicate provider ids rejected. |

### Identifier conventions

**Prefix every capability id with your plugin id**: an element type, chart type, panel, background or image source from `community-badges` should be named `community-badges-badge`, `community-badges-panel`, and so on. New type/panel/provider ids must be unique within an editor — duplicates are rejected at registration, and built-in tab ids cannot be shadowed.

### Isolation guarantees

Registrations made through the context write to the **per-editor registry**, never to module-global tables. Two editors can configure the same plugin with different options without leaking registrations, including chart editing, previews and export. The existing editor methods (`editor.registerElementType`, `editor.registerChartType`, …) keep their current global behavior — they remain available for trusted host code but are not automatically tracked or scoped.

### Saving, loading and missing capabilities

Plugin content is ordinary document data: **JSON-compatible custom element and background fields survive `getJSON`/`loadJSON`, copy/paste, duplication and undo/redo**, and plugin registrations are never embedded as executable code in saved documents.

When a document is reopened without the providing plugin:

- Unknown element types keep their payload and render as **labeled placeholders** that still support selection, transforms, duplication, deletion and history. Reopening with the plugin restores normal behavior.
- Missing chart types are **not normalized into bar charts** — the data is kept and a placeholder is shown.
- Unknown background types and unregistered shapes/icons keep their data and display labels.
- **Image export is rejected** for pages with visible unresolved content, listing the missing capabilities. Every requested page is preflighted before an all-pages export starts downloading. JSON saving remains available.

### Sidebar notes

With `ui: false` or `{ sidepanel: false }`, plugin panel contributions remain unmounted (no error). If you ship a **custom sidebar implementation**, it must consume `editor._pendingPanels` and support `registerPanel` the same way the built-in sidepanel does, or plugin panels will not appear.

## API compatibility

`apiVersion` is an integer contract. The current version is `1`; plugins targeting another version fail initialization with a clear message. Bump your plugin's `apiVersion` requirement only after reviewing the changelog for the matching Ezyreka release. Keep the plugin `id` stable — it is how hosts pin and audit trusted code.

## Complete example: two isolated editors

This script-tag example uses the same plugin in two editors with different colors. Each panel inserts its own registered element. The renderer uses a solid color, so its manifest exposes opacity only; a gradient-capable fill control requires a renderer that implements gradients.

```html
<div id="blue-editor" style="height: 600px"></div>
<div id="orange-editor" style="height: 600px"></div>
<script src="https://unpkg.com/@bookklik/ezyreka@1.0.0/dist/ezyreka.umd.js"></script>
<script>
  const badgePlugin = {
    id: 'brand-badges',
    version: '1.0.0',
    apiVersion: 1,
    setup(ctx, { color = '#477cf5' } = {}) {
      const type = 'brand-badges-badge';
      ctx.registerElementType(type, {
        defaults: { w: 160, h: 64, fill: color },
        manifest: { name: 'Brand badge', toolbar: ['opacity'] },
        render(canvas, element) {
          canvas.fillStyle = element.fill;
          canvas.fillRect(0, 0, element.w, element.h);
        }
      });
      ctx.registerPanel({
        id: 'brand-badges-panel', label: 'Badges',
        render(contentEl, editor) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = 'Add badge';
          const insert = () => {
            const badge = editor.addElement({ type });
            editor.select([badge.id]);
          };
          button.addEventListener('click', insert);
          contentEl.append(button);
          return () => button.removeEventListener('click', insert);
        }
      });
    }
  };
  const blueEditor = new Ezyreka.Editor({
    target: '#blue-editor',
    plugins: [{ plugin: badgePlugin, options: { color: '#477cf5' } }]
  });
  const orangeEditor = new Ezyreka.Editor({
    target: '#orange-editor',
    plugins: [{ plugin: badgePlugin, options: { color: '#FACC15' } }]
  });
  // On host unmount, call blueEditor.destroy() and orangeEditor.destroy().
</script>
```

Registering a custom type does not automatically add an Elements-gallery item; this example supplies an insertion panel. For packaged ESM distribution, export the plugin object and use the import pattern above.

Chart configuration is normalized to its supported fields; store custom metadata on the outer element, not as arbitrary properties inside `element.chart`.

For AI-assisted authoring, use [`$ezyreka-plugin-development`](/advanced/development-skills).
