import { Emitter, uid, deepClone, clamp, el, readAsDataURL, downloadDataURL, downloadBlob, fileBase } from './utils.js';
import { History } from './history.js';
import { setChartColors, chartPreset, registerChartPreset } from './charts.js';
import { createRegistry } from './registry.js';
import { PluginManager, normalizePluginEntries } from './plugins.js';
import {
  createElement,
  hitTest,
  elementCenter,
  selectionBBox,
  elementName,
  manifestFor,
  allManifests,
  hasElementType,
  registerElementType as registerElementDefaults,
  registerElementManifest
} from './elements.js';
import { renderPage, whenImagesReady, measureTextElement, registerElementRenderer } from './renderer.js';
import { registerChartRenderer } from './chart-renderer.js';
import { registerBackgroundPainter } from './renderer.js';
import { SHAPE_PATHS, ICONS, ICON_OUTLINES } from './assets.js';
import { Interactions } from '../interactions.js';
import { Topbar } from '../ui/topbar.js';
import { Sidepanel } from '../ui/sidepanel.js';
import { Toolbar } from '../ui/toolbar.js';
import { ContextMenu, closeMenus } from '../ui/contextmenu.js';
import { PagesBar } from '../ui/pagesbar.js';
import { injectStyles, injectFonts, releaseChrome } from '../styles.js';

export class Editor extends Emitter {
  constructor(options = {}) {
    super();
    const target =
      typeof options.target === 'string'
        ? document.querySelector(options.target)
        : options.target;
    if (!target) throw new Error('ezyreka: "target" element is required');
    // Claim the target immediately so a second synchronous construction
    // returns this instance instead of rebuilding over it.
    if (target.__ezyreka) return target.__ezyreka;
    target.__ezyreka = this;

    this.options = {
      width: 1080,
      height: 1080,
      name: 'Untitled design',
      ...options,
      target
    };
    this.fileName = this.options.name;
    this.zoom = 1;
    this._themes = { ...(options.themes || {}) };
    this._appliedVars = [];
    const themeOption = typeof options.theme === 'string' ? options.theme : 'light';
    this._themeChoice = themeOption === 'dark' || themeOption === 'light' || themeOption === 'system' || this._themes[themeOption]
      ? themeOption
      : 'light';
    // `theme` stays the resolved value ('light'/'dark'/custom name); the raw
    // user selection (including 'system') is tracked in `_themeChoice`.
    this.theme = this._themeChoice === 'system' ? 'light' : this._themeChoice;
    this.pageIndex = 0;
    this.selection = new Set();
    this.clipboard = [];
    this._pasteCount = 0;
    this.uploads = [];
    this._guides = [];
    this._editing = false;
    this._measureCtx = document.createElement('canvas').getContext('2d');

    // Per-editor asset registries: built-ins merged with injected options.
    this.registry = createRegistry(options);
    if (Array.isArray(options.chartColors)) setChartColors(options.chartColors);
    // Plugin entries are validated before any setup runs; a malformed
    // configuration fails fast without partial initialization.
    this._pluginEntries = normalizePluginEntries(options.plugins);
    // Panel contributions from plugins queue here until the sidepanel UI is
    // constructed; they stay unmounted when the sidebar is disabled.
    this._pendingPanels = [];

    this.doc = {
      version: 1,
      pages: [
        {
          id: uid('page'),
          width: this.options.width,
          height: this.options.height,
          background: { type: 'solid', color: '#ffffff' },
          elements: []
        }
      ]
    };

    this._ownsChrome = true;
    this._chrome = injectStyles();
    this._fontStylesheet = injectFonts(this.registry.googleFonts);
    this._buildDOM(target);
    this.setTheme(this._themeChoice);
    // Custom history strategies (e.g. server-backed or memory-pruned) can be
    // injected as long as they implement the same snapshot interface.
    this.history = options.history || new History(options.historyLimit ?? 100);
    for (const method of ['push', 'undo', 'redo', 'reset']) {
      if (typeof this.history[method] !== 'function') {
        throw new Error(`ezyreka: custom history must implement ${method}()`);
      }
    }
    this.history.push(deepClone(this.doc));

    this.interactions = new Interactions(this);
    // Plugins initialize after core infrastructure (registry, DOM, history,
    // interactions) exists, but before UI construction and initialDoc loading,
    // so panel contributions queue for the sidepanel and the document can
    // resolve plugin-registered element/chart types. The `ready` event still
    // fires after initialization completes.
    this.plugins = new PluginManager(this, this._pluginEntries);
    try {
      this.plugins.initialize();
    } catch (error) {
      // Release the target (and window-level listeners) so the host can
      // retry with a fresh editor.
      this.interactions?.destroy();
      target.__ezyreka = null;
      throw error;
    }
    // UI modules are configurable per instance: `ui: false` runs headless,
    // `{ sidepanel: false }` disables one module, and a constructor replaces it.
    const uiDefaults = {
      topbar: Topbar,
      sidepanel: Sidepanel,
      toolbar: Toolbar,
      contextMenu: ContextMenu,
      pagesBar: PagesBar
    };
    const uiSpec = options.ui === false ? {} : { ...uiDefaults, ...(options.ui || {}) };
    this.ui = {};
    for (const [key, Impl] of Object.entries(uiSpec)) {
      if (typeof Impl === 'function') this.ui[key] = new Impl(this);
    }
    if (!this.ui.topbar) this.topbarEl.style.display = 'none';
    if (!this.ui.sidepanel) this.sidepanelEl.style.display = 'none';
    if (!this.ui.toolbar) this.toolbarEl.style.display = 'none';
    if (!this.ui.pagesBar) this.pagesBarEl.style.display = 'none';

    this.zoomFit();
    if (options.initialDoc) this.loadJSON(options.initialDoc);
    this._resizeObserver = new ResizeObserver(() => {
      if (this._needsFit) this.zoomFit();
      else this.markDirty();
    });
    this._resizeObserver.observe(this.viewport);
    target.__ezyreka = this;
    // The initial fonts.ready promise can settle before the stylesheet arrives.
    // Redraw when its faces become available, then again when they finish loading.
    this._fontSet = document.fonts;
    this._onFontsChanged = () => {
      if (target.__ezyreka === this) this.markDirty();
    };
    this._fontStylesheet.addEventListener('load', this._onFontsChanged);
    this._fontSet?.addEventListener('loadingdone', this._onFontsChanged);
    this._fontSet?.addEventListener('loadingerror', this._onFontsChanged);
    this._fontSet?.ready?.then(this._onFontsChanged);
    // Let callers subscribe immediately after `new Editor(...)` returns.
    queueMicrotask(() => {
      if (target.__ezyreka === this) this.emit('ready', this);
    });
  }

  _buildDOM(target) {
    target.classList.add('ez-editor');
    target.innerHTML = '';
    this.container = target;
    this.topbarEl = el('div', 'ez-topbar', target);
    const body = el('div', 'ez-body', target);
    this.sidepanelEl = el('div', 'ez-sidepanel', body);
    const sidepanelRail = el('div', 'ez-sidepanel-rail', this.sidepanelEl);
    el('div', 'ez-sidepanel-tabs', sidepanelRail);
    el('div', 'ez-sidepanel-content', this.sidepanelEl);
    const canvasWrap = el('div', 'ez-canvas-wrap', body);
    this.viewport = el('div', 'ez-viewport', canvasWrap);
    const stageWrap = el('div', 'ez-stage-wrap', this.viewport);
    this.stage = el('div', 'ez-stage', stageWrap);
    this.canvas = document.createElement('canvas');
    this.stage.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.overlay = el('div', 'ez-overlay', this.stage);
    this.pagesBarEl = el('div', 'ez-pagesbar', canvasWrap);
    this.toolbarEl = el('div', 'ez-floating-toolbar', target);

    const fileInput = el('input', 'ez-hidden', target);
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    this._fileInput = fileInput;
    fileInput.addEventListener('change', async () => {
      for (const file of [...fileInput.files]) await this.addUpload(file);
      fileInput.value = '';
    });
  }

  get page() {
    return this.doc.pages[clamp(this.pageIndex, 0, this.doc.pages.length - 1)];
  }

  getPage() {
    return this.page;
  }

  getElements() {
    return this.page.elements;
  }

  markDirty() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      this.render();
    });
  }

  render() {
    const pw = this.page.width;
    const ph = this.page.height;
    const dpr = window.devicePixelRatio || 1;
    const cssW = pw * this.zoom;
    const cssH = ph * this.zoom;
    this.stage.style.width = cssW + 'px';
    this.stage.style.height = cssH + 'px';
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
      this.canvas.style.width = cssW + 'px';
      this.canvas.style.height = cssH + 'px';
    }
    this.ctx.setTransform(this.zoom * dpr, 0, 0, this.zoom * dpr, 0, 0);
    renderPage(this.ctx, this.page, { registry: this.registry });
    if (!this._editing && this.interactions?.drag?.mode !== 'band') this.updateOverlay();
    this.ui?.toolbar?.update();
  }

  updateOverlay() {
    const ov = this.overlay;
    ov.innerHTML = '';
    for (const g of this._guides) {
      const line = el('div', 'ez-guide ' + (g.axis === 'x' ? 'ez-guide-x' : 'ez-guide-y'), ov);
      if (g.axis === 'x') {
        line.style.left = g.v * this.zoom - 0.75 + 'px';
        line.style.top = g.from * this.zoom + 'px';
        line.style.height = (g.to - g.from) * this.zoom + 'px';
      } else {
        line.style.top = g.v * this.zoom - 0.75 + 'px';
        line.style.left = g.from * this.zoom + 'px';
        line.style.width = (g.to - g.from) * this.zoom + 'px';
      }
    }
    const sel = this.getSelected();
    if (!sel.length) return;
    const z = this.zoom;
    if (sel.length === 1) {
      const elx = sel[0];
      const box = el('div', 'ez-sel-box', ov);
      Object.assign(box.style, {
        left: elx.x * z + 'px',
        top: elx.y * z + 'px',
        width: elx.w * z + 'px',
        height: elx.h * z + 'px',
        transform: `rotate(${elx.rotation || 0}deg)`,
        transformOrigin: '50% 50%'
      });
      const label = el('div', 'ez-sel-name', box);
      label.textContent = elementName(elx, this.registry);
      for (const dir of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
        const h = el('div', 'ez-handle', box);
        h.dataset.dir = dir;
        h.addEventListener('pointerdown', (e) => this.interactions.startResize(e, dir));
      }
      const rot = el('div', 'ez-rotate-handle', box);
      rot.title = 'Rotate';
      rot.addEventListener('pointerdown', (e) => this.interactions.startRotate(e));
    } else {
      const bbox = selectionBBox(sel);
      const box = el('div', 'ez-sel-box ez-multi', ov);
      Object.assign(box.style, {
        left: bbox.x * z + 'px',
        top: bbox.y * z + 'px',
        width: bbox.w * z + 'px',
        height: bbox.h * z + 'px'
      });
    }
  }

  setGuides(guides) {
    this._guides = guides || [];
    if (!this._editing) this.updateOverlay();
  }

  select(ids, { silent = false } = {}) {
    this.selection = new Set(ids);
    if (!silent) {
      this.emit('selection', this.getSelected());
      this.markDirty();
    }
  }

  toggleSelect(id) {
    const next = new Set(this.selection);
    next.has(id) ? next.delete(id) : next.add(id);
    this.select([...next]);
  }

  selectAll() {
    this.select(
      this.getElements()
        .filter((e2) => !e2.locked && !e2.hidden)
        .map((e2) => e2.id)
    );
  }

  clearSelection() {
    if (this._editing) this.commitTextEdit();
    if (this.selection.size) this.select([]);
  }

  getSelected() {
    return this.getElements().filter((e2) => this.selection.has(e2.id));
  }

  hitTestElement(elx, wx, wy) {
    return hitTest(elx, wx, wy, 4, this.registry);
  }

  viewportCenter() {
    const canvasRect = this.canvas.getBoundingClientRect();
    const vRect = this.viewport.getBoundingClientRect();
    return {
      x: (vRect.left + vRect.width / 2 - canvasRect.left) / this.zoom,
      y: (vRect.top + vRect.height / 2 - canvasRect.top) / this.zoom
    };
  }

  addElement(props = {}) {
    if (!hasElementType(props.type, this.registry)) {
      throw new Error(`ezyreka: unknown element type "${props.type}"`);
    }
    const center = this.viewportCenter();
    const elx = createElement(props.type, props, this.registry);
    if (props.x === undefined) elx.x = Math.round(center.x - elx.w / 2);
    if (props.y === undefined) elx.y = Math.round(center.y - elx.h / 2);
    this.page.elements.push(elx);
    this.markDirty();
    this.commit();
    return elx;
  }

  addText(props = {}) {
    const elx = this.addElement({ type: 'text', ...props });
    elx.__fresh = true;
    return elx;
  }

  updateSelected(props, commit = true) {
    const selected = this.getSelected();
    // Nothing selected: no-op without pushing a duplicate history snapshot.
    if (!selected.length) return;
    // Props listed in a type manifest's exclusiveProps target only the types
    // that declare them (and run their normalizer), instead of hitting all.
    const manifests = allManifests(this.registry);
    const exclusiveKey = Object.keys(props).find((key) =>
      Object.values(manifests).some((m) => m.exclusiveProps && key in m.exclusiveProps));
    if (exclusiveKey !== undefined) {
      const entry = Object.values(manifests)
        .find((m) => m.exclusiveProps && exclusiveKey in m.exclusiveProps);
      const types = new Set(Object.entries(manifests)
        .filter(([, m]) => m.exclusiveProps && exclusiveKey in m.exclusiveProps)
        .map(([type]) => type));
      const targets = selected.filter(item => types.has(item.type) && !item.locked);
      if (!targets.length) return;
      const value = entry.exclusiveProps[exclusiveKey](props[exclusiveKey], this.registry);
      targets.forEach(item => Object.assign(item, props, { [exclusiveKey]: value }));
    } else selected.forEach((elx) => Object.assign(elx, props));
    this.markDirty();
    if (commit) this.commit();
  }

  commit() {
    this.history.push(deepClone(this.doc));
    this.emit('change', { doc: this.doc, selection: this.getSelected() });
  }

  deleteSelected() {
    const ids = this.selection;
    if (!ids.size) return;
    this.page.elements = this.page.elements.filter((e2) => !ids.has(e2.id));
    this.clearSelection();
    this.markDirty();
    this.commit();
  }

  duplicateSelected() {
    const sel = this.getSelected();
    if (!sel.length) return;
    const clones = sel.map((elx) => {
      const clone = createElement(elx.type, { ...deepClone(elx), id: undefined, x: elx.x + 24, y: elx.y + 24 }, this.registry);
      return clone;
    });
    this.page.elements.push(...clones);
    this.select(clones.map((c) => c.id));
    this.markDirty();
    this.commit();
  }

  copy() {
    const sel = this.getSelected();
    if (sel.length) {
      this.clipboard = deepClone(sel);
      this._pasteCount = 0;
    }
  }

  cut() {
    this.copy();
    this.deleteSelected();
  }

  paste() {
    if (!this.clipboard.length) return;
    const offset = 24 * (++this._pasteCount || 1);
    const clones = this.clipboard.map((elx) =>
      createElement(elx.type, { ...deepClone(elx), id: undefined, x: elx.x + offset, y: elx.y + offset }, this.registry)
    );
    this.page.elements.push(...clones);
    this.select(clones.map((c) => c.id));
    this.markDirty();
    this.commit();
  }

  _reorder(fn) {
    const els = this.page.elements;
    const indices = this.getSelected()
      .map((elx) => els.indexOf(elx))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    if (!indices.length) return;
    fn(els, indices);
    this.markDirty();
    this.commit();
  }

  bringToFront() {
    this._reorder((els, idx) => {
      const picked = idx.map((i) => els[i]);
      this.page.elements = els.filter((e2) => !picked.includes(e2)).concat(picked);
    });
  }

  bringForward() {
    this._reorder((els, idx) => {
      for (let i = idx.length - 1; i >= 0; i--) {
        const j = idx[i];
        if (j < els.length - 1 && !idx.includes(j + 1)) {
          [els[j], els[j + 1]] = [els[j + 1], els[j]];
        }
      }
    });
  }

  sendBackward() {
    this._reorder((els, idx) => {
      for (const i of idx) {
        if (i > 0 && !idx.includes(i - 1)) {
          [els[i], els[i - 1]] = [els[i - 1], els[i]];
        }
      }
    });
  }

  sendToBack() {
    this._reorder((els, idx) => {
      const picked = idx.map((i) => els[i]);
      this.page.elements = picked.concat(els.filter((e2) => !picked.includes(e2)));
    });
  }

  moveLayer(from, to) {
    const els = this.getElements();
    if (!Number.isInteger(from) || !Number.isInteger(to) ||
        from === to || from < 0 || to < 0 || from >= els.length || to >= els.length) return;
    const [item] = els.splice(from, 1);
    els.splice(to, 0, item);
    this.markDirty();
    this.commit();
  }

  toggleLock() {
    const sel = this.getSelected();
    if (!sel.length) return;
    const lock = !sel.every((s) => s.locked);
    sel.forEach((s) => (s.locked = lock));
    this.commit();
    this.markDirty();
  }

  setZoom(zoom, anchor) {
    const z = clamp(zoom, 0.05, 5);
    if (z === this.zoom) return;
    const vRect = this.viewport.getBoundingClientRect();
    const a = anchor || { x: vRect.left + vRect.width / 2, y: vRect.top + vRect.height / 2 };
    const canvasRect = this.canvas.getBoundingClientRect();
    const wx = (a.x - canvasRect.left) / this.zoom;
    const wy = (a.y - canvasRect.top) / this.zoom;
    this.zoom = z;
    this.render();
    const rect2 = this.canvas.getBoundingClientRect();
    this.viewport.scrollLeft += rect2.left + wx * z - a.x;
    this.viewport.scrollTop += rect2.top + wy * z - a.y;
    this.emit('zoom', z);
  }

  zoomFit() {
    const pw = this.page.width;
    const ph = this.page.height;
    const vRect = this.viewport.getBoundingClientRect();
    if (!vRect.width || !vRect.height) {
      // Hidden container (e.g. mounted in an inactive tab): retry the fit once
      // the viewport gains real dimensions (see the ResizeObserver).
      this._needsFit = true;
      this.zoom = 1;
      this.render();
      this.emit('zoom', this.zoom);
      return;
    }
    this._needsFit = false;
    const z = clamp(Math.min((vRect.width - 96) / pw, (vRect.height - 96) / ph), 0.05, 2);
    this.zoom = z;
    this.render();
    this.viewport.scrollLeft = (this.viewport.scrollWidth - this.viewport.clientWidth) / 2;
    this.viewport.scrollTop = (this.viewport.scrollHeight - this.viewport.clientHeight) / 2;
    this.emit('zoom', z);
  }

  fitTextHeight(elx) {
    if (elx.type !== 'text') return;
    const lines = measureTextElement(this._measureCtx, elx);
    const needed = lines.length * elx.fontSize * elx.lineHeight + 6;
    if (needed > elx.h) elx.h = Math.round(needed);
  }

  startTextEdit(elx) {
    if (this._editing) this.commitTextEdit();
    this._editing = true;
    this.editingId = elx.id;
    const ed = el('div', 'ez-text-editor', this.overlay);
    ed.contentEditable = 'true';
    ed.innerText = elx.text || '';
    Object.assign(ed.style, {
      fontFamily: elx.fontFamily,
      fontWeight: elx.fontWeight,
      fontStyle: elx.italic ? 'italic' : 'normal',
      textDecoration: elx.underline ? 'underline' : 'none',
      lineHeight: String(elx.lineHeight),
      color: elx.color,
      textAlign: elx.align,
      transformOrigin: '50% 50%'
    });
    this._textEditorEl = ed;
    // Track the pre-edit state so an unchanged edit session doesn't push a
    // duplicate history snapshot (see commitTextEdit).
    this._textEditState = { text: elx.text || '', h: elx.h };
    // Keep the overlay glued to the element when the zoom changes mid-edit.
    this._layoutTextEditor();
    this._textEditorZoomOff = this.on('zoom', () => this._layoutTextEditor());
    ed.addEventListener('input', () => {
      elx.text = ed.innerText.replace(/\n$/, '');
      this.markDirty();
    });
    ed.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.commitTextEdit();
      }
      e.stopPropagation();
    });
    ed.addEventListener('blur', () => this.commitTextEdit());
    this.ui.toolbar?.update();
    ed.focus();
    if (elx.__fresh) {
      const range = document.createRange();
      range.selectNodeContents(ed);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
      delete elx.__fresh;
    } else {
      const range = document.createRange();
      range.selectNodeContents(ed);
      range.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
    }
  }

  // Re-positions and re-scales the contenteditable overlay to the element's
  // current geometry at the current zoom; called on construction and zoom.
  _layoutTextEditor() {
    if (!this._editing) return;
    const ed = this._textEditorEl;
    const elx = this.getElements().find((e2) => e2.id === this.editingId);
    if (!ed || !elx) return;
    const z = this.zoom;
    Object.assign(ed.style, {
      left: elx.x * z + 'px',
      top: elx.y * z + 'px',
      width: elx.w * z + 'px',
      minHeight: elx.h * z + 'px',
      fontSize: elx.fontSize * z + 'px',
      letterSpacing: (elx.letterSpacing || 0) * z + 'px',
      transform: `rotate(${elx.rotation || 0}deg)`
    });
  }

  commitTextEdit() {
    if (!this._editing) return;
    const ed = this._textEditorEl;
    const elx = this.getElements().find((e2) => e2.id === this.editingId);
    const before = this._textEditState;
    this._editing = false;
    this._textEditorEl = null;
    this.editingId = null;
    this._textEditState = null;
    this._textEditorZoomOff?.();
    this._textEditorZoomOff = null;
    if (ed) ed.remove();
    let changed = false;
    if (elx) {
      elx.text = (elx.text || '').replace(/\n+$/, '');
      if (!elx.text.trim()) {
        this.page.elements = this.page.elements.filter((e2) => e2.id !== elx.id);
        this.select([]);
        changed = true;
      } else {
        this.fitTextHeight(elx);
        changed = !!before && (elx.text !== before.text || elx.h !== before.h);
      }
    }
    this.markDirty();
    if (changed) this.commit();
  }

  undo() {
    const snap = this.history.undo(deepClone(this.doc));
    if (!snap) return;
    this._applySnapshot(snap);
  }

  redo() {
    const snap = this.history.redo(deepClone(this.doc));
    if (!snap) return;
    this._applySnapshot(snap);
  }

  _applySnapshot(snap) {
    if (this._editing) this.commitTextEdit();
    this.doc = snap;
    this.pageIndex = clamp(this.pageIndex, 0, this.doc.pages.length - 1);
    this.selection = new Set();
    this.emit('selection', []);
    this.markDirty();
    this.emit('change', { doc: this.doc, selection: [] });
  }

  getJSON() {
    const doc = deepClone(this.doc);
    // Transient UI flags (e.g. "__fresh" on newly added text) never belong in
    // saved documents.
    for (const page of doc.pages) {
      for (const elx of page.elements) delete elx.__fresh;
    }
    return doc;
  }

  loadJSON(doc) {
    if (!doc || !Array.isArray(doc.pages) || !doc.pages.length) {
      throw new Error('Invalid design document');
    }
    this.doc = {
      version: 1,
      pages: doc.pages.map((p) => ({
        id: uid('page'),
        width: p.width || this.options.width,
        height: p.height || this.options.height,
        background: p.background || { type: 'solid', color: '#ffffff' },
        elements: (p.elements || [])
          .map((e2) => createElement(e2.type, e2, this.registry))
      }))
    };
    if (typeof doc.name === 'string' && doc.name) this.setFileName(doc.name);
    this.pageIndex = 0;
    this.selection = new Set();
    this.history.reset();
    this.history.push(deepClone(this.doc));
    this.emit('selection', []);
    this.zoomFit();
    this.emit('change', { doc: this.doc, selection: [] });
  }

  applyTemplate(tpl) {
    if (!tpl || typeof tpl !== 'object' || !tpl.page ||
        !Number.isFinite(tpl.page.width) || !Number.isFinite(tpl.page.height) ||
        !Array.isArray(tpl.page.elements)) {
      throw new Error('ezyreka: templates need { name, page: { width, height, elements } }');
    }
    if (this._editing) this.commitTextEdit();
    this.doc = {
      version: 1,
      pages: [
        {
          id: uid('page'),
          width: tpl.page.width,
          height: tpl.page.height,
          background: deepClone(tpl.page.background),
          elements: tpl.page.elements.map((e2) => createElement(e2.type, e2, this.registry))
        }
      ]
    };
    this.pageIndex = 0;
    this.selection = new Set();
    this.emit('selection', []);
    this.commit();
    this.zoomFit();
  }

  resizeCanvas(width, height) {
    if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= 10000)) {
      throw new RangeError('Canvas dimensions must be whole numbers from 1 to 10000 pixels.');
    }
    if (this.page.width === width && this.page.height === height) return;
    if (this._editing) this.commitTextEdit();
    this.page.width = width;
    this.page.height = height;
    this.zoomFit();
    this.commit();
  }

  setBackground(bg, commit = true) {
    this.page.background = bg;
    this.markDirty();
    if (commit) this.commit();
  }

  addUpload(file) {
    return readAsDataURL(file).then((src) => {
      this.uploads.push({ id: uid('up'), src, name: file.name });
      this.emit('upload', this.uploads);
      return src;
    });
  }

  openFilePicker() {
    this._fileInput.click();
  }

  pickImageFile() {
    return new Promise((resolve) => {
      const input = el('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = () => {
        resolve(input.files[0] || null);
        input.remove();
      };
      input.click();
    });
  }

  // ---- Customization: register assets on this editor's registry ----

  registerTemplates(templates) {
    const list = Array.isArray(templates) ? templates : [templates];
    for (const tpl of list) {
      if (!tpl || typeof tpl !== 'object' || !tpl.page ||
          !Number.isFinite(tpl.page.width) || !Number.isFinite(tpl.page.height) ||
          !Array.isArray(tpl.page.elements)) {
        throw new Error('ezyreka: templates need { name, page: { width, height, elements } }');
      }
    }
    this.registry.templates.push(...list.map((tpl) => deepClone(tpl)));
    this._refreshPanels('templates');
  }

  registerFont(name, { google } = {}) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('ezyreka: registerFont needs a font family name');
    }
    name = name.trim();
    if (!this.registry.fonts.includes(name)) this.registry.fonts.push(name);
    if (google) {
      const family = typeof google === 'string' && google.trim()
        ? google.trim()
        : name.replace(/ /g, '+');
      // Accept either a full css2 spec ("Familia:wght@400;700") or a family
      // name, to which a default weight range is applied.
      const spec = /[:@]/.test(family) ? family : `${family}:wght@400;600;700`;
      if (!this.registry.googleFonts.includes(spec)) this.registry.googleFonts.push(spec);
      injectFonts(this.registry.googleFonts);
    }
    this._refreshPanels('text');
    return name;
  }

  registerIcons(icons) {
    if (!icons || typeof icons !== 'object') {
      throw new Error('ezyreka: registerIcons needs { name: pathOrPathPair }');
    }
    for (const [name, def] of Object.entries(icons)) {
      const solid = typeof def === 'string' ? def : def?.solid;
      const outline = typeof def === 'string' ? def : def?.outline;
      if (typeof solid !== 'string') {
        throw new Error(`ezyreka: icon "${name}" needs an SVG path string`);
      }
      this.registry.icons[name] = solid;
      this.registry.iconOutlines[name] = typeof outline === 'string' ? outline : solid;
    }
    this._refreshPanels('elements');
  }

  registerShapes(shapes) {
    const list = Array.isArray(shapes) ? shapes : [shapes];
    const entries = list.map((item) => {
      if (!item || typeof item.label !== 'string') {
        throw new Error('ezyreka: shapes need at least { label }');
      }
      const entry = { type: item.type || 'shape', label: item.label, props: item.props };
      if (typeof item.path === 'string') {
        const name = item.shape || item.label.toLowerCase().replace(/\s+/g, '-');
        this.registry.shapePaths[name] = item.path;
        entry.svg = item.svg ||
          `<path d="${item.path}" transform="translate(8 8) scale(.84)" fill-rule="evenodd" />`;
        entry.props = item.props || { shape: name };
      } else {
        if (typeof item.svg !== 'string') {
          throw new Error(`ezyreka: shape "${item.label}" needs "path" or "svg"`);
        }
        entry.svg = item.svg;
      }
      return entry;
    });
    this.registry.shapes.push(...entries);
    this._refreshPanels('elements');
  }

  // ---- Customization: extend rendering, panels and image sources ----

  /** Overrides or adds the canvas renderer for an element type: fn(ctx, el, registry). */
  registerElementRenderer(type, renderer) {
    registerElementRenderer(type, renderer);
    this.registry.elementRenderers[type] = renderer;
    this.markDirty();
  }

  /** Registers a brand-new element type: { defaults, manifest, render }. */
  registerElementType(type, def = {}) {
    registerElementDefaults(type, { defaults: def.defaults, manifest: def.manifest });
    if (typeof def.render === 'function') {
      registerElementRenderer(type, def.render);
      this.registry.elementRenderers[type] = def.render;
    }
    this._refreshPanels('layers');
  }

  /** Overrides or adds the painter for a chart type: fn(ctx, chart, series, plotBox, font, bounds). */
  registerChartRenderer(type, renderer) {
    registerChartRenderer(type, renderer);
    this.registry.chartRenderers[type] = renderer;
    this.markDirty();
  }

  /**
   * Registers a brand-new chart type: a preset ({ type, label, group, kind,
   * circular, multiSeries, validate }) plus an optional painter. It becomes
   * available in the gallery, type dropdown, normalization and validation.
   */
  registerChartType(preset, renderFn) {
    registerChartPreset(preset);
    if (typeof renderFn === 'function') this.registerChartRenderer(preset.type, renderFn);
    this._refreshPanels('charts');
    return preset;
  }

  /** Replaces this editor's color swatches; entries are hex strings or { label, colors } groups. */
  registerPalette(palette) {
    if (!Array.isArray(palette) || !palette.length) {
      throw new Error('ezyreka: registerPalette needs a non-empty array');
    }
    this.registry.palette = palette;
    this._refreshPanels('background');
  }

  /** Registers a background type painter: fn(ctx, bg, pageWidth, pageHeight). */
  registerBackgroundPainter(type, painter) {
    registerBackgroundPainter(type, painter);
    this.registry.backgroundPainters[type] = painter;
    this.markDirty();
  }

  /** Extends or overrides an element type's capability manifest. */
  registerElementManifest(type, manifest) {
    registerElementManifest(type, manifest);
    this._refreshPanels('layers');
  }

  /** Adds a sidebar tab: { id, label, icon, render(contentEl, editor) }. */
  registerPanel(panel) {
    if (!this.ui.sidepanel) {
      throw new Error('ezyreka: registerPanel requires the sidepanel UI module');
    }
    this.ui.sidepanel.registerPanel(panel);
  }

  /** Registers an existing image (URL or data URL) into the uploads library. */
  registerImage(image) {
    const src = typeof image === 'string' ? image : image?.src;
    const name = (typeof image === 'object' && image?.name) || 'Image';
    if (typeof src !== 'string' || !src) {
      throw new Error('ezyreka: registerImage needs a src string or { src, name }');
    }
    const entry = { id: uid('up'), src, name };
    this.uploads.push(entry);
    this.emit('upload', this.uploads);
    return entry;
  }

  /** Adds an image source provider: { id, label?, search(query) => [{ src, name, thumb? }] }. */
  registerImageSource(source) {
    if (!source || typeof source.id !== 'string' || typeof source.search !== 'function') {
      throw new Error('ezyreka: image sources need { id, search(query) }');
    }
    this.registry.imageSources.push(source);
    this._refreshPanels('uploads');
    return source;
  }

  _refreshPanels(...tabs) {
    if (this.ui?.sidepanel && tabs.includes(this.ui.sidepanel.activeTab)) {
      this.ui.sidepanel.rerender();
    }
    if (this.ui?.toolbar) this.ui.toolbar.lastSig = null;
  }

  /** Registers a named theme from CSS custom properties, usable via setTheme(). */
  registerTheme(name, vars) {
    if (typeof name !== 'string' || !name || typeof vars !== 'object' || !vars) {
      throw new Error('ezyreka: registerTheme needs a name and a CSS variables object');
    }
    this._themes[name] = vars;
    return name;
  }

  setTheme(theme) {
    const custom = this._themes[theme];
    if (theme !== 'dark' && theme !== 'light' && theme !== 'system' && !custom) return;
    this._themeChoice = theme;
    const resolved = theme === 'system' ? this._resolveSystemTheme() : theme;
    this.theme = resolved;
    this.container.classList.toggle('ez-dark', resolved === 'dark');
    // Custom themes and the cssVars option are applied as inline variables;
    // previously applied ones are removed first so switching is reversible.
    for (const name of this._appliedVars) this.container.style.removeProperty(name);
    this._appliedVars = [];
    const vars = { ...(this.options.cssVars || {}), ...(custom || {}) };
    for (const [name, value] of Object.entries(vars)) {
      this.container.style.setProperty(name, String(value));
      this._appliedVars.push(name);
    }
    this._syncSystemMedia();
    this.emit('theme', theme);
  }

  /** The raw theme selection ('light', 'dark', 'system' or a custom name). */
  get themeChoice() {
    return this._themeChoice ?? this.theme;
  }

  _resolveSystemTheme() {
    try {
      return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  }

  // Attaches or releases the prefers-color-scheme listener so 'system' mode
  // keeps following the OS setting after the initial resolution.
  _syncSystemMedia() {
    if (this._themeChoice === 'system') {
      if (this._themeMedia || typeof matchMedia !== 'function') return;
      this._themeMedia = matchMedia('(prefers-color-scheme: dark)');
      this._onSystemThemeChange = () => {
        if (this._themeChoice === 'system') this.setTheme('system');
      };
      this._themeMedia.addEventListener?.('change', this._onSystemThemeChange);
    } else if (this._themeMedia) {
      this._themeMedia.removeEventListener?.('change', this._onSystemThemeChange);
      this._themeMedia = null;
      this._onSystemThemeChange = null;
    }
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  setFileName(name) {
    this.fileName = name;
    this.emit('rename', name);
  }

  addPage() {
    const page = {
      id: uid('page'),
      width: this.page.width,
      height: this.page.height,
      background: { type: 'solid', color: '#ffffff' },
      elements: []
    };
    this.doc.pages.splice(this.pageIndex + 1, 0, page);
    this.pageIndex += 1;
    this.clearSelection();
    this.markDirty();
    this.commit();
    this.emit('page', this.pageIndex);
  }

  duplicatePage() {
    const src = this.page;
    const page = {
      id: uid('page'),
      width: src.width,
      height: src.height,
      background: deepClone(src.background),
      elements: src.elements.map((e2) => createElement(e2.type, e2, this.registry))
    };
    this.doc.pages.splice(this.pageIndex + 1, 0, page);
    this.pageIndex += 1;
    this.clearSelection();
    this.markDirty();
    this.commit();
    this.emit('page', this.pageIndex);
  }

  deletePage(index = this.pageIndex) {
    if (this.doc.pages.length <= 1) return;
    this.doc.pages.splice(index, 1);
    this.pageIndex = clamp(this.pageIndex, 0, this.doc.pages.length - 1);
    this.clearSelection();
    this.markDirty();
    this.commit();
    this.emit('page', this.pageIndex);
  }

  movePage(from, to) {
    const n = this.doc.pages.length;
    if (from === to || from < 0 || from >= n || to < 0 || to >= n) return;
    if (this._editing) this.commitTextEdit();
    const [page] = this.doc.pages.splice(from, 1);
    this.doc.pages.splice(to, 0, page);
    if (this.pageIndex === from) this.pageIndex = to;
    else if (from < this.pageIndex && to >= this.pageIndex) this.pageIndex -= 1;
    else if (from > this.pageIndex && to <= this.pageIndex) this.pageIndex += 1;
    this.clearSelection();
    this.markDirty();
    this.commit();
    this.emit('page', this.pageIndex);
  }

  goToPage(index) {
    if (index < 0 || index >= this.doc.pages.length || index === this.pageIndex) return;
    if (this._editing) this.commitTextEdit();
    const sizeChanged =
      this.page.width !== this.doc.pages[index].width ||
      this.page.height !== this.doc.pages[index].height;
    this.pageIndex = index;
    this.clearSelection();
    this.markDirty();
    if (sizeChanged) this.zoomFit();
    this.emit('page', index);
  }

  async _renderPageToCanvas(page, scale, transparent) {
    const srcs = [];
    if (page.background?.type === 'image' && page.background.src) srcs.push(page.background.src);
    for (const e2 of page.elements) {
      for (const prop of manifestFor(e2.type, this.registry).preloadProps || []) {
        if (e2[prop]) srcs.push(e2[prop]);
      }
    }
    await whenImagesReady(srcs);
    await (document.fonts?.ready || Promise.resolve());
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(page.width * scale);
    canvas.height = Math.round(page.height * scale);
    const ctx = canvas.getContext('2d');
    if (!transparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);
    renderPage(ctx, page, {
      transparent: transparent && page.background?.type !== 'image',
      registry: this.registry
    });
    return canvas;
  }

  // Collects the capabilities a page needs that this editor cannot resolve:
  // unknown element/chart/background types and unregistered shapes or icons.
  // Only visible content blocks an export.
  _missingCapabilities(page) {
    const registry = this.registry;
    const issues = [];
    const bgType = (page.background && page.background.type) || 'solid';
    if (!['solid', 'gradient', 'image'].includes(bgType) && !registry.backgroundPainters[bgType]) {
      issues.push(`background type "${bgType}"`);
    }
    for (const el of page.elements) {
      if (el.hidden) continue;
      if (el.__unresolved || !hasElementType(el.type, registry)) {
        issues.push(`element type "${el.__missingType || el.type}"`);
        continue;
      }
      if (el.type === 'shape' && el.shape &&
          registry.shapePaths[el.shape] === undefined && SHAPE_PATHS[el.shape] === undefined) {
        issues.push(`shape "${el.shape}"`);
      }
      if (el.type === 'icon' && el.icon) {
        const paths = el.iconStyle === 'outline'
          ? (registry.iconOutlines || ICON_OUTLINES)
          : (registry.icons || ICONS);
        if (paths[el.icon] === undefined) issues.push(`icon "${el.icon}"`);
      }
      if (el.type === 'chart' && el.chart?.type && !chartPreset(el.chart.type, registry)) {
        issues.push(`chart type "${el.chart.type}"`);
      }
    }
    return [...new Set(issues)];
  }

  _assertExportable(pages) {
    const problems = pages
      .map((page, index) => ({ index, issues: this._missingCapabilities(page) }))
      .filter((p) => p.issues.length);
    if (!problems.length) return;
    const detail = problems
      .map((p) => `page ${p.index + 1}: ${p.issues.join(', ')}`)
      .join('; ');
    throw new Error(
      `ezyreka: image export blocked by unresolved content (load the providing plugins or remove it): ${detail}`
    );
  }

  async exportImage(format = 'png', { scale = 2, transparent = false, pageIndex = null } = {}) {
    const page =
      pageIndex === null ? this.page : this.doc.pages[clamp(pageIndex, 0, this.doc.pages.length - 1)];
    this._assertExportable([page]);
    const canvas = await this._renderPageToCanvas(page, scale, transparent && format === 'png');
    const dataURL = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92);
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    downloadDataURL(dataURL, `${fileBase(this.fileName)}.${ext}`);
    this.emit('export', { format, scale });
    return dataURL;
  }

  /**
   * Renders and downloads every page. The returned promise settles only after
   * every download has been handed to the browser (and it emits 'export');
   * throws if any page cannot be encoded.
   */
  async exportAllPages(format = 'png', { scale = 2 } = {}) {
    this._assertExportable(this.doc.pages);
    const type = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const blobs = [];
    for (let i = 0; i < this.doc.pages.length; i++) {
      const canvas = await this._renderPageToCanvas(this.doc.pages[i], scale, false);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (!b) {
            reject(new Error(`ezyreka: export failed — the encoder returned no data for page ${i + 1}`));
            return;
          }
          resolve(b);
        }, type);
      });
      downloadBlob(blob, `${fileBase(this.fileName)}-page-${i + 1}.${ext}`);
      blobs.push(blob);
    }
    this.emit('export', { format, scale, pages: blobs.length, blobs });
    return blobs;
  }

  downloadJSON() {
    const blob = new Blob([JSON.stringify({ name: this.fileName, ...this.getJSON() }, null, 2)], {
      type: 'application/json'
    });
    downloadBlob(blob, `${fileBase(this.fileName)}.json`);
    this.emit('save', this.fileName);
  }

  destroy() {
    if (this._themeMedia) {
      this._themeMedia.removeEventListener?.('change', this._onSystemThemeChange);
      this._themeMedia = null;
      this._onSystemThemeChange = null;
    }
    this._fontStylesheet?.removeEventListener('load', this._onFontsChanged);
    this._fontSet?.removeEventListener('loadingdone', this._onFontsChanged);
    this._fontSet?.removeEventListener('loadingerror', this._onFontsChanged);
    // Plugins tear down first (reverse setup order), aborting pending work
    // and releasing tracked listeners before editor infrastructure goes away.
    this.plugins?.dispose();
    this.interactions?.destroy();
    closeMenus(this);
    // UI modules unsubscribe their editor listeners and release references.
    for (const module of Object.values(this.ui || {})) module?.destroy?.();
    if (this._editing) {
      this._editing = false;
      this._textEditorEl?.remove();
      this._textEditorEl = null;
    }
    this._textEditorZoomOff?.();
    this._textEditorZoomOff = null;
    this._resizeObserver?.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._textEditorZoomOff?.();
    this._textEditorZoomOff = null;
    // Shared chrome styles/fonts go away with the last destroyed editor.
    if (this._ownsChrome) {
      this._ownsChrome = false;
      releaseChrome();
    }
    this.container.__ezyreka = null;
    this.container.classList.remove('ez-editor');
    this.container.innerHTML = '';
    this._listeners.clear();
  }
}
