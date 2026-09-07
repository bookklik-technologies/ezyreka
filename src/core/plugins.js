// Trusted, developer-installed plugins. Plugins are configured at startup,
// register capabilities synchronously through an isolated context, and clean
// up when the editor is destroyed. Registrations are scoped to the editor's
// per-instance registry and never write to the module-global tables, so two
// editors can configure the same plugin independently.
import { deepClone } from './utils.js';
import { BUILTIN_PANEL_IDS } from './constants.js';
import { hasElementType } from './elements.js';
import { chartPreset } from './charts.js';

// Bumped for breaking changes to the plugin context contract. Plugins declare
// the version they target; mismatches fail initialization with the cause.
export const PLUGIN_API_VERSION = 1;

function fail(pluginId, cause) {
  return new Error(`ezyreka: plugin "${pluginId}" failed to initialize: ${cause}`);
}

// Accepts bare plugin objects (shorthand for entries without options) or
// { plugin, options } entries. Validates everything up front so setup only
// runs once every entry is well-formed.
export function normalizePluginEntries(entries) {
  const list = Array.isArray(entries) ? entries : entries ? [entries] : [];
  const normalized = [];
  const seen = new Set();
  for (const entry of list) {
    // A { plugin, options } wrapper is detected by its `plugin` object;
    // everything else is treated as a bare plugin (shorthand without options).
    const plugin = entry?.plugin && typeof entry.plugin === 'object' ? entry.plugin : entry;
    const options = plugin !== entry && entry && typeof entry === 'object' ? entry.options : undefined;
    const id = plugin?.id;
    if (typeof id !== 'string' || !id.trim()) {
      throw new Error('ezyreka: plugins need a non-empty string "id"');
    }
    if (seen.has(id)) {
      throw new Error(`ezyreka: plugin "${id}" is configured more than once`);
    }
    seen.add(id);
    if (typeof plugin.version !== 'string' || !plugin.version.trim()) {
      throw new Error(`ezyreka: plugin "${id}" needs a "version" string`);
    }
    if (!Number.isInteger(plugin.apiVersion)) {
      throw new Error(`ezyreka: plugin "${id}" needs an integer "apiVersion"`);
    }
    if (plugin.apiVersion !== PLUGIN_API_VERSION) {
      throw new Error(
        `ezyreka: plugin "${id}" targets API version ${plugin.apiVersion}, but this editor supports ${PLUGIN_API_VERSION}`
      );
    }
    if (typeof plugin.setup !== 'function') {
      throw new Error(`ezyreka: plugin "${id}" needs a synchronous setup(ctx, options) function`);
    }
    normalized.push({ plugin, options: options ?? {} });
  }
  return normalized;
}

function requireName(id, kind, value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`ezyreka: plugin "${id}" register${kind} needs a ${kind.toLowerCase()} name`);
  }
  return value.trim();
}

export class PluginManager {
  constructor(editor, entries) {
    this.editor = editor;
    this.entries = entries;
    this.instances = [];
    this.disposed = false;
  }

  // Runs setup for every configured entry in order. A failure disposes the
  // plugins that already initialized and rethrows with the plugin id and
  // cause, so the host can inspect and retry on a released target.
  initialize() {
    for (const { plugin, options } of this.entries) {
      const instance = this._createContext(plugin);
      let cleanup;
      try {
        cleanup = plugin.setup(instance.context, options);
      } catch (error) {
        this.dispose();
        throw fail(plugin.id, error?.message || String(error));
      }
      if (cleanup && typeof cleanup.then === 'function') {
        this.dispose();
        throw fail(plugin.id, 'setup() must be synchronous (returned a promise)');
      }
      if (cleanup !== undefined && cleanup !== null && typeof cleanup !== 'function') {
        this.dispose();
        throw fail(plugin.id, 'setup() must return a cleanup function, nothing, undefined or null');
      }
      instance.cleanup = typeof cleanup === 'function' ? cleanup : null;
    }
  }

  _createContext(plugin) {
    const editor = this.editor;
    const id = plugin.id;
    const unsubs = [];
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const instance = { plugin, unsubs, controller, cleanup: null, disposers: [] };
    // Registered immediately so a throwing setup is still disposed.
    this.instances.push(instance);

    const ctx = {
      pluginId: id,
      apiVersion: PLUGIN_API_VERSION,
      editor,
      signal: controller?.signal ?? null,
      on(event, handler) {
        const off = editor.on(event, handler);
        unsubs.push(off);
        return () => {
          const index = unsubs.indexOf(off);
          if (index >= 0) unsubs.splice(index, 1);
          off();
        };
      },
      once(event, handler) {
        const off = editor.once(event, handler);
        unsubs.push(off);
        return () => {
          const index = unsubs.indexOf(off);
          if (index >= 0) unsubs.splice(index, 1);
          off();
        };
      },
      onDispose(fn) {
        if (typeof fn !== 'function') {
          throw new Error(`ezyreka: plugin "${id}" onDispose needs a function`);
        }
        instance.disposers.push(fn);
      },

      // ---- Isolated registration methods. Every "new capability" method
      // rejects duplicates within this editor; override-style hooks
      // (renderers, painters) may replace existing entries locally. ----

      registerElementType(type, def = {}) {
        const name = requireName(id, 'ElementType', type);
        if (!name || !/^[a-z][a-z0-9-]*$/i.test(name)) {
          throw new Error(`ezyreka: plugin "${id}" element type names must be simple identifiers`);
        }
        if (editor.registry.elementDefaults[name] || editor.registry.elementManifests[name] || hasElementType(name)) {
          throw new Error(`ezyreka: plugin "${id}" element type "${name}" already exists in this editor`);
        }
        const { defaults, manifest, render } = def || {};
        if (defaults !== undefined && (typeof defaults !== 'object' || !defaults)) {
          throw new Error(`ezyreka: plugin "${id}" element type defaults must be an object`);
        }
        editor.registry.elementDefaults[name] = deepClone(defaults || {});
        editor.registry.elementManifests[name] = { name, ...(manifest || {}) };
        if (typeof render === 'function') editor.registry.elementRenderers[name] = render;
        editor._refreshPanels('layers');
        return name;
      },
      registerElementRenderer(type, renderer) {
        const name = requireName(id, 'ElementRenderer', type);
        if (typeof renderer !== 'function') {
          throw new Error(`ezyreka: plugin "${id}" element renderer must be a function`);
        }
        editor.registry.elementRenderers[name] = renderer;
        editor.markDirty();
      },
      registerChartType(preset, renderFn) {
        if (!preset || typeof preset.type !== 'string' || !preset.label) {
          throw new Error(`ezyreka: plugin "${id}" chart presets need { type, label }`);
        }
        const name = preset.type.trim();
        if (editor.registry.chartPresets[name] || chartPreset(name)) {
          throw new Error(`ezyreka: plugin "${id}" chart type "${name}" already exists in this editor`);
        }
        editor.registry.chartPresets[name] = { group: 'Other charts', ...preset, type: name };
        if (typeof renderFn === 'function') editor.registry.chartRenderers[name] = renderFn;
        editor._refreshPanels('charts');
        return preset;
      },
      registerChartRenderer(type, renderer) {
        const name = requireName(id, 'ChartRenderer', type);
        if (typeof renderer !== 'function') {
          throw new Error(`ezyreka: plugin "${id}" chart renderer must be a function`);
        }
        editor.registry.chartRenderers[name] = renderer;
        editor.markDirty();
      },
      registerBackgroundPainter(type, painter) {
        const name = requireName(id, 'BackgroundPainter', type);
        if (typeof painter !== 'function') {
          throw new Error(`ezyreka: plugin "${id}" background painter must be a function`);
        }
        editor.registry.backgroundPainters[name] = painter;
        editor.markDirty();
      },
      registerPanel(panel) {
        if (!panel || typeof panel.id !== 'string' || typeof panel.render !== 'function') {
          throw new Error(`ezyreka: plugin "${id}" panels need { id, label, icon, render(contentEl, editor) }`);
        }
        const taken = BUILTIN_PANEL_IDS.includes(panel.id) ||
          editor._pendingPanels.some((p) => p.id === panel.id) ||
          editor.ui?.sidepanel?.tabs.some((t) => t.id === panel.id);
        if (taken) {
          throw new Error(`ezyreka: plugin "${id}" panel "${panel.id}" already exists in this editor`);
        }
        if (editor.ui?.sidepanel) {
          editor.ui.sidepanel.registerPanel(panel);
        } else {
          // Contributions queue when the UI is not built yet (plugins run
          // before UI construction) and stay unmounted when the sidebar is
          // disabled; the sidepanel consumes them at construction time.
          editor._pendingPanels.push({ ...panel, pluginId: id });
        }
        return panel;
      },
      registerImageSource(source) {
        if (!source || typeof source.id !== 'string' || typeof source.search !== 'function') {
          throw new Error(`ezyreka: plugin "${id}" image sources need { id, search(query) }`);
        }
        if (editor.registry.imageSources.some((s) => s.id === source.id)) {
          throw new Error(`ezyreka: plugin "${id}" image source "${source.id}" already exists in this editor`);
        }
        editor.registry.imageSources.push(source);
        editor._refreshPanels('uploads');
        return source;
      },
      registerTemplates(templates) {
        editor.registerTemplates(templates);
      },
      registerFont(name, opts) {
        return editor.registerFont(name, opts);
      },
      registerIcons(icons) {
        editor.registerIcons(icons);
      },
      registerShapes(shapes) {
        editor.registerShapes(shapes);
      },
      registerImage(image) {
        return editor.registerImage(image);
      },
      registerTheme(name, vars) {
        return editor.registerTheme(name, vars);
      }
    };

    instance.context = ctx;
    return instance;
  }

  // Disposes in reverse initialization order: aborts pending async work,
  // unsubscribes tracked listeners, runs cleanup and onDispose callbacks
  // exactly once (cleanup first), and keeps going when a disposer throws.
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const instance = this.instances[i];
      try {
        instance.controller?.abort();
      } catch {}
      for (const off of instance.unsubs) {
        try {
          off();
        } catch {}
      }
      instance.unsubs = [];
      if (typeof instance.cleanup === 'function') {
        try {
          instance.cleanup();
        } catch (error) {
          console.warn(`ezyreka: plugin "${instance.plugin.id}" cleanup failed:`, error);
        }
      }
      instance.cleanup = null;
      for (let j = instance.disposers.length - 1; j >= 0; j--) {
        try {
          instance.disposers[j]();
        } catch (error) {
          console.warn(`ezyreka: plugin "${instance.plugin.id}" onDispose callback failed:`, error);
        }
      }
      instance.disposers = [];
    }
    this.instances = [];
  }
}
