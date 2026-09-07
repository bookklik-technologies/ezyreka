import { el, uid } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';
import { showMenu, closeMenus } from './contextmenu.js';

const RESIZE_PRESETS = [
  { group: 'Social media', sizes: [
    { id: 'social-square', label: 'Square post', width: 1080, height: 1080 },
    { id: 'social-portrait', label: 'Portrait post (4:5)', width: 1080, height: 1350 },
    { id: 'social-story', label: 'Story / Reel (9:16)', width: 1080, height: 1920 },
    { id: 'social-landscape', label: 'Landscape post (16:9)', width: 1920, height: 1080 }
  ] },
  { group: 'Print', sizes: [
    { id: 'print-a5', label: 'A5', width: 1748, height: 2480 },
    { id: 'print-a4', label: 'A4', width: 2480, height: 3508 },
    { id: 'print-a3', label: 'A3', width: 3508, height: 4961 },
    { id: 'print-letter', label: 'US Letter', width: 2550, height: 3300 },
    { id: 'print-business-card', label: 'Business card (3.5 × 2 in)', width: 1050, height: 600 }
  ] },
  { group: 'Presentation', sizes: [
    { id: 'presentation-wide', label: 'Widescreen (16:9)', width: 1920, height: 1080 },
    { id: 'presentation-standard', label: 'Standard (4:3)', width: 1024, height: 768 },
    { id: 'presentation-wide-16-10', label: 'Widescreen (16:10)', width: 1920, height: 1200 }
  ] }
];

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
    this._unsubs = [
      ed.on('theme', () => this.updateThemeIcon()),
      ed.on('zoom', () => this.updateZoomLabel()),
      ed.on('rename', (name) => {
        const input = this.root.querySelector('.sk-filename');
        if (input && document.activeElement !== input) input.value = name;
      })
    ];
    this.updateThemeIcon();
    this.updateZoomLabel();
  }

  destroy() {
    this._unsubs?.forEach((off) => off());
    this._unsubs = [];
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
    const presetHelpId = uid('resize-preset-help');
    const dialog = el('dialog', 'sk-resize-dialog', ed.container);
    dialog.setAttribute('aria-labelledby', titleId);
    dialog.setAttribute('aria-describedby', helpId);
    dialog.innerHTML = `
      <form class="sk-resize-form">
        <h2 id="${titleId}">Resize canvas</h2>
        <p id="${helpId}">Resize the current page. Elements keep their size and position.</p>
        <fieldset class="sk-resize-presets" aria-describedby="${presetHelpId}">
          <legend>Size preset</legend>
          <div class="sk-resize-categories" aria-label="Preset categories"></div>
          <div class="sk-resize-gallery"></div>
          <label class="sk-resize-custom">
            <input type="radio" name="preset" value="custom" />
            <span>Custom size</span><span class="sk-resize-custom-hint">Set your own dimensions</span>
          </label>
        </fieldset>
        <p class="sk-resize-preset-help" id="${presetHelpId}" aria-live="polite"></p>
        <div class="sk-resize-fields">
          <label>Width (px)<input class="sk-input" name="width" type="number" min="1" max="10000" step="1" required /></label>
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
    const gallery = dialog.querySelector('.sk-resize-gallery');
    const categories = dialog.querySelector('.sk-resize-categories');
    const presetHelp = dialog.querySelector('.sk-resize-preset-help');
    const width = form.elements.namedItem('width');
    const height = form.elements.namedItem('height');
    width.value = page.width;
    height.value = page.height;
    const sizes = RESIZE_PRESETS.flatMap(group => group.sizes);
    const categoryButtons = [];
    const presetGroups = [];
    const showCategory = (index) => {
      categoryButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      presetGroups.forEach((group, i) => { group.hidden = i !== index; });
      gallery.scrollTop = 0;
    };
    for (const [index, group] of RESIZE_PRESETS.entries()) {
      const category = el('button', 'sk-resize-category', categories);
      category.type = 'button';
      category.textContent = group.group;
      category.onclick = () => showCategory(index);
      categoryButtons.push(category);
      const grid = el('div', 'sk-resize-grid', gallery);
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', group.group);
      presetGroups.push(grid);
      for (const size of group.sizes) {
        const card = el('label', 'sk-resize-card', grid);
        const scale = 72 / Math.max(size.width, size.height);
        card.innerHTML = `
          <input type="radio" name="preset" value="${size.id}" />
          <span class="sk-resize-thumbnail sk-resize-art-${index}" aria-hidden="true">
            <span class="sk-resize-paper" style="width:${size.width * scale}px;height:${size.height * scale}px">
              <span class="sk-resize-art-orb"></span><span class="sk-resize-art-block"></span>
              <span class="sk-resize-art-line"></span>
            </span>
            <span class="sk-resize-check">✓</span>
          </span>
          <span class="sk-resize-card-name">${size.label}</span>
          <span class="sk-resize-card-size">${size.width} × ${size.height} px</span>
        `;
      }
    }
    const preset = form.elements.namedItem('preset');
    const updatePresetHelp = () => {
      const selected = sizes.find(size => size.id === preset.value);
      presetHelp.textContent = preset.value.startsWith('print-')
        ? `${selected.label} selected. Print sizes use 300 pixels per inch, without bleed.`
        : selected ? `${selected.label} selected. You can also adjust the dimensions below.`
          : 'Custom size selected. Enter your own dimensions below.';
    };
    preset.value = sizes.find(size => size.width === page.width && size.height === page.height)?.id || 'custom';
    showCategory(Math.max(0, RESIZE_PRESETS.findIndex(group => group.sizes.some(size => size.id === preset.value))));
    dialog.querySelector('.sk-resize-presets').addEventListener('change', () => {
      const size = sizes.find(size => size.id === preset.value);
      if (size) {
        width.value = size.width;
        height.value = size.height;
      }
      updatePresetHelp();
      if (!size) width.focus();
    });
    const useCustomSize = () => {
      preset.value = 'custom';
      updatePresetHelp();
    };
    width.addEventListener('input', useCustomSize);
    height.addEventListener('input', useCustomSize);
    updatePresetHelp();
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
    form.querySelector('input[name="preset"]:checked').focus();
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
