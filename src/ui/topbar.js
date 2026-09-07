import { el, uid } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';
import { showMenu, closeMenus } from './contextmenu.js';

export class Topbar {
  constructor(editor) {
    this.editor = editor;
    this.root = editor.topbarEl;
    this.render();
  }

  render() {
    const ed = this.editor;
    this.root.innerHTML = `
      <div class="sk-brand"><span class="sk-logo">S</span><span class="sk-brand-name">SenangDesign</span></div>
      <input class="sk-filename" value="${ed.fileName.replace(/"/g, '&quot;')}" spellcheck="false" />
      <button class="sk-btn sk-btn-ghost" data-act="resize" title="Resize current canvas" aria-haspopup="dialog">Resize</button>
      <div class="sk-topbar-group">
        <button class="sk-icon-btn" data-act="undo" title="Undo (Ctrl+Z)">${UI_ICONS.undo}</button>
        <button class="sk-icon-btn" data-act="redo" title="Redo (Ctrl+Shift+Z)">${UI_ICONS.redo}</button>
      </div>
      <div class="sk-topbar-group">
        <button class="sk-icon-btn" data-act="zoom-out" title="Zoom out (Ctrl+-)">${UI_ICONS['zoom-out']}</button>
        <button class="sk-zoom-btn" data-act="zoom-menu">100%</button>
        <button class="sk-icon-btn" data-act="zoom-in" title="Zoom in (Ctrl++)">${UI_ICONS['zoom-in']}</button>
        <button class="sk-icon-btn" data-act="zoom-fit" title="Fit to screen (Ctrl+0)">${UI_ICONS.fit}</button>
      </div>
      <div class="sk-topbar-spacer"></div>
      <button class="sk-icon-btn" data-act="theme" title="Switch theme (Ctrl+Shift+L)"></button>
      <button class="sk-btn sk-btn-ghost" data-act="open">Open</button>
      <button class="sk-btn sk-btn-ghost" data-act="save-json">Save</button>
      <button class="sk-btn sk-btn-primary" data-act="download">${UI_ICONS.download}<span>Download</span></button>
      <input type="file" class="sk-hidden" accept="application/json" data-role="open-input" />
    `;

    this.root.querySelector('[data-act="undo"]').onclick = () => ed.undo();
    this.root.querySelector('[data-act="resize"]').onclick = () => this.resizeDialog();
    this.root.querySelector('[data-act="redo"]').onclick = () => ed.redo();
    this.root.querySelector('[data-act="zoom-out"]').onclick = () => ed.setZoom(ed.zoom / 1.2);
    this.root.querySelector('[data-act="zoom-in"]').onclick = () => ed.setZoom(ed.zoom * 1.2);
    this.root.querySelector('[data-act="zoom-fit"]').onclick = () => ed.zoomFit();
    this.root.querySelector('[data-act="zoom-menu"]').onclick = (e) => this.zoomMenu(e);
    this.root.querySelector('[data-act="download"]').onclick = (e) => this.downloadMenu(e);
    this.root.querySelector('[data-act="save-json"]').onclick = () => ed.downloadJSON();
    const nameInput = this.root.querySelector('.sk-filename');
    nameInput.onchange = () => ed.setFileName(nameInput.value.trim() || 'Untitled design');
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') nameInput.blur();
    };
    const openBtn = this.root.querySelector('[data-act="open"]');
    const openInput = this.root.querySelector('[data-role="open-input"]');
    openBtn.onclick = () => openInput.click();
    openInput.onchange = async () => {
      const file = openInput.files[0];
      if (!file) return;
      try {
        const json = JSON.parse(await file.text());
        ed.loadJSON(json);
      } catch (err) {
        alert('Invalid design file: ' + err.message);
      }
      openInput.value = '';
    };
    this.root.querySelector('[data-act="theme"]').onclick = () => ed.toggleTheme();
    ed.on('theme', () => this.updateThemeIcon());
    this.updateThemeIcon();
    ed.on('zoom', () => this.updateZoomLabel());
    ed.on('rename', (name) => {
      const input = this.root.querySelector('.sk-filename');
      if (input && document.activeElement !== input) input.value = name;
    });
    this.updateZoomLabel();
  }

  updateZoomLabel() {
    const btn = this.root.querySelector('[data-act="zoom-menu"]');
    if (btn) btn.textContent = Math.round(this.editor.zoom * 100) + '%';
  }

  resizeDialog() {
    const ed = this.editor;
    closeMenus(ed);
    const page = ed.getPage();
    const titleId = uid('resize-title');
    const helpId = uid('resize-help');
    const dialog = el('dialog', 'sk-resize-dialog', ed.container);
    dialog.setAttribute('aria-labelledby', titleId);
    dialog.setAttribute('aria-describedby', helpId);
    dialog.innerHTML = `
      <form class="sk-resize-form">
        <h2 id="${titleId}">Resize canvas</h2>
        <p id="${helpId}">Resize the current page. Elements keep their size and position.</p>
        <div class="sk-resize-fields">
          <label>Width (px)<input class="sk-input" name="width" type="number" min="1" max="10000" step="1" required autofocus /></label>
          <label>Height (px)<input class="sk-input" name="height" type="number" min="1" max="10000" step="1" required /></label>
        </div>
        <p class="sk-resize-limit">Enter whole numbers from 1 to 10,000 pixels.</p>
        <div class="sk-resize-actions">
          <button class="sk-btn sk-btn-ghost" type="button" data-act="cancel">Cancel</button>
          <button class="sk-btn sk-btn-primary" type="submit">Resize canvas</button>
        </div>
      </form>
    `;
    const form = dialog.querySelector('form');
    const width = form.elements.namedItem('width');
    const height = form.elements.namedItem('height');
    width.value = page.width;
    height.value = page.height;
    dialog.querySelector('[data-act="cancel"]').onclick = () => dialog.close();
    // Keep dialog shortcuts from moving or deleting selected canvas elements.
    dialog.addEventListener('keydown', (e) => e.stopPropagation());
    dialog.addEventListener('close', () => {
      dialog.remove();
      this.root.querySelector('[data-act="resize"]').focus();
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      // A programmatic page switch must not resize a different page with stale values.
      if (ed.getPage() !== page) {
        dialog.close();
        return;
      }
      ed.resizeCanvas(width.valueAsNumber, height.valueAsNumber);
      dialog.close();
    };
    dialog.showModal();
    width.select();
  }

  updateThemeIcon() {
    const btn = this.root.querySelector('[data-act="theme"]');
    if (!btn) return;
    const dark = this.editor.theme === 'dark';
    btn.innerHTML = dark ? UI_ICONS.sun : UI_ICONS.moon;
    btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  zoomMenu(e) {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    showMenu(this.editor, r.left, r.bottom + 4, [
      { label: 'Fit to screen', action: () => this.editor.zoomFit() },
      { label: '100%', action: () => this.editor.setZoom(1) },
      '-',
      { label: '50%', action: () => this.editor.setZoom(0.5) },
      { label: '75%', action: () => this.editor.setZoom(0.75) },
      { label: '150%', action: () => this.editor.setZoom(1.5) },
      { label: '200%', action: () => this.editor.setZoom(2) }
    ]);
  }

  downloadMenu(e) {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    showMenu(this.editor, r.right - 190, r.bottom + 4, [
      { label: 'PNG image', action: () => this.editor.exportImage('png', { scale: 2 }) },
      { label: 'JPG image', action: () => this.editor.exportImage('jpeg', { scale: 2 }) },
      { label: 'PNG (transparent)', action: () => this.editor.exportImage('png', { scale: 2, transparent: true }) },
      { label: 'PNG at 4x', action: () => this.editor.exportImage('png', { scale: 4 }) },
      '-',
      { label: 'Design file (.json)', action: () => this.editor.downloadJSON() }
    ]);
  }
}
