import { Emitter, uid, deepClone, clamp, el, readAsDataURL, downloadDataURL, downloadBlob } from './utils.js';
import { History } from './history.js';
import {
  createElement,
  hitTest,
  elementCenter,
  selectionBBox,
  elementName
} from './elements.js';
import { renderPage, whenImagesReady, measureTextElement } from './renderer.js';
import { Interactions } from '../interactions.js';
import { Topbar } from '../ui/topbar.js';
import { Sidepanel } from '../ui/sidepanel.js';
import { Toolbar } from '../ui/toolbar.js';
import { ContextMenu, closeMenus } from '../ui/contextmenu.js';
import { PagesBar } from '../ui/pagesbar.js';
import { injectStyles, injectFonts } from '../styles.js';

export class Editor extends Emitter {
  constructor(options = {}) {
    super();
    const target =
      typeof options.target === 'string'
        ? document.querySelector(options.target)
        : options.target;
    if (!target) throw new Error('SenangDesign: "target" element is required');
    if (target.__senangDesign) return target.__senangDesign;

    this.options = {
      width: 1080,
      height: 1080,
      name: 'Untitled design',
      ...options,
      target
    };
    this.fileName = this.options.name;
    this.zoom = 1;
    this.pageIndex = 0;
    this.selection = new Set();
    this.clipboard = [];
    this._pasteCount = 0;
    this.uploads = [];
    this._guides = [];
    this._editing = false;
    this._measureCtx = document.createElement('canvas').getContext('2d');

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

    injectStyles();
    injectFonts();
    this._buildDOM(target);
    this.history = new History();
    this.history.push(deepClone(this.doc));

    this.interactions = new Interactions(this);
    this.ui = {
      topbar: new Topbar(this),
      sidepanel: new Sidepanel(this),
      toolbar: new Toolbar(this),
      contextMenu: new ContextMenu(this),
      pagesBar: new PagesBar(this)
    };

    this.zoomFit();
    if (document.fonts?.ready) document.fonts.ready.then(() => this.markDirty());
    this._resizeObserver = new ResizeObserver(() => this.markDirty());
    this._resizeObserver.observe(this.viewport);
    target.__senangDesign = this;
    this.emit('ready', this);
  }

  _buildDOM(target) {
    target.classList.add('sk-editor');
    target.innerHTML = '';
    this.container = target;
    this.topbarEl = el('div', 'sk-topbar', target);
    const body = el('div', 'sk-body', target);
    this.sidepanelEl = el('div', 'sk-sidepanel', body);
    el('div', 'sk-sidepanel-tabs', this.sidepanelEl);
    el('div', 'sk-sidepanel-content', this.sidepanelEl);
    const canvasWrap = el('div', 'sk-canvas-wrap', body);
    this.viewport = el('div', 'sk-viewport', canvasWrap);
    const stageWrap = el('div', 'sk-stage-wrap', this.viewport);
    this.stage = el('div', 'sk-stage', stageWrap);
    this.canvas = document.createElement('canvas');
    this.stage.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.overlay = el('div', 'sk-overlay', this.stage);
    this.pagesBarEl = el('div', 'sk-pagesbar', canvasWrap);
    this.toolbarEl = el('div', 'sk-floating-toolbar', target);

    const fileInput = el('input', 'sk-hidden', target);
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
    renderPage(this.ctx, this.page);
    if (!this._editing && this.interactions?.drag?.mode !== 'band') this.updateOverlay();
    this.ui?.toolbar?.update();
  }

  updateOverlay() {
    const ov = this.overlay;
    ov.innerHTML = '';
    for (const g of this._guides) {
      const line = el('div', 'sk-guide ' + (g.axis === 'x' ? 'sk-guide-x' : 'sk-guide-y'), ov);
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
      const box = el('div', 'sk-sel-box', ov);
      Object.assign(box.style, {
        left: elx.x * z + 'px',
        top: elx.y * z + 'px',
        width: elx.w * z + 'px',
        height: elx.h * z + 'px',
        transform: `rotate(${elx.rotation || 0}deg)`,
        transformOrigin: '50% 50%'
      });
      const label = el('div', 'sk-sel-name', box);
      label.textContent = elementName(elx);
      for (const dir of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
        const h = el('div', 'sk-handle', box);
        h.dataset.dir = dir;
        h.addEventListener('pointerdown', (e) => this.interactions.startResize(e, dir));
      }
      const rot = el('div', 'sk-rotate-handle', box);
      rot.title = 'Rotate';
      rot.addEventListener('pointerdown', (e) => this.interactions.startRotate(e));
    } else {
      const bbox = selectionBBox(sel);
      const box = el('div', 'sk-sel-box sk-multi', ov);
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
    return hitTest(elx, wx, wy);
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
    const center = this.viewportCenter();
    const elx = createElement(props.type, props);
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
    this.getSelected().forEach((elx) => Object.assign(elx, props));
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
      const clone = createElement(elx.type, { ...deepClone(elx), x: elx.x + 24, y: elx.y + 24 });
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
      createElement(elx.type, { ...deepClone(elx), x: elx.x + offset, y: elx.y + offset })
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
      this.zoom = 1;
      this.render();
      this.emit('zoom', this.zoom);
      return;
    }
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
    const z = this.zoom;
    const ed = el('div', 'sk-text-editor', this.overlay);
    ed.contentEditable = 'true';
    ed.innerText = elx.text || '';
    Object.assign(ed.style, {
      left: elx.x * z + 'px',
      top: elx.y * z + 'px',
      width: elx.w * z + 'px',
      minHeight: elx.h * z + 'px',
      fontFamily: elx.fontFamily,
      fontSize: elx.fontSize * z + 'px',
      fontWeight: elx.fontWeight,
      fontStyle: elx.italic ? 'italic' : 'normal',
      textDecoration: elx.underline ? 'underline' : 'none',
      lineHeight: String(elx.lineHeight),
      letterSpacing: (elx.letterSpacing || 0) * z + 'px',
      color: elx.color,
      textAlign: elx.align,
      transform: `rotate(${elx.rotation || 0}deg)`,
      transformOrigin: '50% 50%'
    });
    this._textEditorEl = ed;
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
    this.ui.toolbar.update();
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

  commitTextEdit() {
    if (!this._editing) return;
    const ed = this._textEditorEl;
    const elx = this.getElements().find((e2) => e2.id === this.editingId);
    this._editing = false;
    this._textEditorEl = null;
    this.editingId = null;
    if (ed) ed.remove();
    if (elx) {
      elx.text = (elx.text || '').replace(/\n+$/, '');
      if (!elx.text.trim()) {
        this.page.elements = this.page.elements.filter((e2) => e2.id !== elx.id);
        this.select([]);
      } else {
        this.fitTextHeight(elx);
      }
    }
    this.markDirty();
    this.commit();
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
    return deepClone(this.doc);
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
          .map((e2) => {
            try {
              return createElement(e2.type, e2);
            } catch {
              return null;
            }
          })
          .filter(Boolean)
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
    if (this._editing) this.commitTextEdit();
    this.doc = {
      version: 1,
      pages: [
        {
          id: uid('page'),
          width: tpl.page.width,
          height: tpl.page.height,
          background: deepClone(tpl.page.background),
          elements: tpl.page.elements.map((e2) => createElement(e2.type, e2))
        }
      ]
    };
    this.pageIndex = 0;
    this.selection = new Set();
    this.emit('selection', []);
    this.commit();
    this.zoomFit();
  }

  setBackground(bg) {
    this.page.background = bg;
    this.markDirty();
    this.commit();
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
      elements: src.elements.map((e2) => createElement(e2.type, e2))
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
    for (const e2 of page.elements) if (e2.type === 'image' && e2.src) srcs.push(e2.src);
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
    renderPage(ctx, page, { transparent: transparent && page.background?.type !== 'image' });
    return canvas;
  }

  async exportImage(format = 'png', { scale = 2, transparent = false, pageIndex = null } = {}) {
    const page =
      pageIndex === null ? this.page : this.doc.pages[clamp(pageIndex, 0, this.doc.pages.length - 1)];
    const canvas = await this._renderPageToCanvas(page, scale, transparent && format === 'png');
    const dataURL = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92);
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    downloadDataURL(dataURL, `${this.fileName.replace(/[^\w\- ]+/g, '').trim() || 'design'}.${ext}`);
    this.emit('export', { format, scale });
    return dataURL;
  }

  async exportAllPages(format = 'png', { scale = 2 } = {}) {
    for (let i = 0; i < this.doc.pages.length; i++) {
      const page = this.doc.pages[i];
      const canvas = await this._renderPageToCanvas(page, scale, false);
      canvas.toBlob((blob) => {
        const name = `${this.fileName.replace(/[^\w\- ]+/g, '').trim() || 'design'}-page-${i + 1}.${
          format === 'jpeg' ? 'jpg' : 'png'
        }`;
        downloadBlob(blob, name);
      }, format === 'jpeg' ? 'image/jpeg' : 'image/png');
    }
  }

  downloadJSON() {
    const blob = new Blob([JSON.stringify({ name: this.fileName, ...this.getJSON() }, null, 2)], {
      type: 'application/json'
    });
    downloadBlob(blob, `${this.fileName.replace(/[^\w\- ]+/g, '').trim() || 'design'}.json`);
    this.emit('save', this.fileName);
  }

  destroy() {
    this.interactions?.destroy();
    closeMenus(this);
    if (this._editing) {
      this._editing = false;
      this._textEditorEl?.remove();
      this._textEditorEl = null;
    }
    this._resizeObserver?.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
    this.container.__senangDesign = null;
    this.container.classList.remove('sk-editor');
    this.container.innerHTML = '';
    this._listeners.clear();
  }
}
