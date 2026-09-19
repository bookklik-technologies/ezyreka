import { el, uid } from '../core/utils.js';
import { UI_ICONS, BRAND_LOGO } from '../core/assets.js';
import { closeMenus } from './contextmenu.js';
import { installSuiteTopbar, openSuiteMenu, bindSuiteMenu } from './suite-topbar.js';

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
      <div class="ez-brand"><span class="ez-logo">${BRAND_LOGO}</span><span class="ez-brand-name">Ezyreka</span></div>
      <input aria-label="Design filename" class="ez-filename" value="${ed.fileName.replace(/"/g, '&quot;')}" spellcheck="false" />
      <button class="ez-btn ez-btn-ghost" data-act="resize" title="Resize current canvas" aria-haspopup="dialog">Resize</button>
      <div class="ez-topbar-group">
        <button class="ez-icon-btn" data-act="undo" aria-label="Undo" title="Undo (Ctrl+Z)">${UI_ICONS.undo}</button>
        <button class="ez-icon-btn" data-act="redo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)">${UI_ICONS.redo}</button>
      </div>
      <div class="ez-topbar-group">
        <button class="ez-icon-btn" data-act="zoom-out" title="Zoom out (Ctrl+-)">${UI_ICONS['zoom-out']}</button>
        <button class="ez-zoom-btn" data-act="zoom-menu" aria-label="Zoom level" aria-haspopup="menu" aria-expanded="false">100%</button>
        <button class="ez-icon-btn" data-act="zoom-in" title="Zoom in (Ctrl++)">${UI_ICONS['zoom-in']}</button>
        <button class="ez-icon-btn" data-act="zoom-fit" title="Fit to screen (Ctrl+0)">${UI_ICONS.fit}</button>
      </div>
      <div class="ez-topbar-spacer"></div>
      <details class="ez-theme-menu" data-act="theme">
        <summary class="ez-icon-btn" aria-label="Theme" title="Theme (Ctrl+Shift+L)"></summary>
        <div class="ez-theme-panel" aria-label="Color scheme">
          <button type="button" class="ez-theme-item" data-ez-theme-choice="light" aria-pressed="false">Light</button>
          <button type="button" class="ez-theme-item" data-ez-theme-choice="dark" aria-pressed="false">Dark</button>
          <button type="button" class="ez-theme-item" data-ez-theme-choice="system" aria-pressed="false">System</button>
        </div>
      </details>
      <button class="ez-icon-btn" data-act="fullscreen" title="Enter fullscreen"></button>
      <button class="ez-icon-btn" data-act="open" aria-label="Open design" title="Open design">${UI_ICONS.open}</button>
      <button class="ez-icon-btn" data-act="save-json" aria-label="Save design JSON" title="Save design JSON">${UI_ICONS.save}</button>
      <button class="ez-btn ez-btn-primary" data-act="download" aria-label="Export design" aria-haspopup="menu" aria-expanded="false">${UI_ICONS.download}<span>Export</span>${UI_ICONS.chevron}</button>
      <input type="file" class="ez-hidden" accept="application/json" data-role="open-input" />
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
    const nameInput = this.root.querySelector('.ez-filename');
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
    const themeMenu = this.root.querySelector('[data-act="theme"]');
    for (const item of themeMenu.querySelectorAll('.ez-theme-item')) {
      item.onclick = () => {
        if (themeMenu.contains(document.activeElement)) themeMenu.querySelector('summary').focus();
        ed.setTheme(item.getAttribute('data-ez-theme-choice'));
        themeMenu.open = false;
      };
    }
    this._themeMenuCleanup = bindSuiteMenu(themeMenu, themeMenu.querySelector('.ez-theme-panel'));
    this.root.querySelector('[data-act="fullscreen"]').onclick = () => this.toggleFullscreen();
    this._onFullscreenChange = () => this.updateFullscreenIcon();
    document.addEventListener('fullscreenchange', this._onFullscreenChange);
    this._unsubs = [
      ed.on('theme', () => this.updateThemeIcon()),
      ed.on('change', () => this.updateHistory()),
      ed.on('zoom', () => this.updateZoomLabel()),
      ed.on('rename', (name) => {
        const input = this.root.querySelector('.ez-filename');
        if (input && document.activeElement !== input) input.value = name;
      })
    ];
    this.updateThemeIcon();
    this.updateFullscreenIcon();
    this.updateZoomLabel();
    this.updateHistory();
    const group = (label, ...controls) => {
      const node = document.createElement('div');
      node.setAttribute('aria-label', label);
      node.append(...controls);
      return node;
    };
    const action = name => this.root.querySelector('[data-act="' + name + '"]');
    const history = group('Edit history', action('undo'), action('redo'));
    const specialist = group('Canvas tools', action('resize'), action('zoom-out'), action('zoom-menu'), action('zoom-in'), action('zoom-fit'));
    const view = group('View', action('theme'), action('fullscreen'));
    const files = group('Files', action('open'), action('save-json'));
    this._topbarCleanup = installSuiteTopbar(ed.container, this.root, {
      brand: this.root.querySelector('.ez-brand'), title: nameInput,
      history, specialist, view, files, exportControl: action('download'),
    });
    this.root.append(openInput);
  }

  updateHistory() {
    for (const [action, method] of [['undo', 'canUndo'], ['redo', 'canRedo']]) {
      const button = this.root.querySelector('[data-act="' + action + '"]');
      // Custom history implementations are not required to expose capability queries.
      if (button) button.disabled = typeof this.editor.history[method] === 'function' && !this.editor.history[method]();
    }
  }

  destroy() {
    this._menuCleanup?.();
    this._themeMenuCleanup?.();
    this._topbarCleanup?.();
    document.removeEventListener('fullscreenchange', this._onFullscreenChange);
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
    const dialog = el('dialog', 'ez-resize-dialog', ed.container);
    dialog.setAttribute('aria-labelledby', titleId);
    dialog.setAttribute('aria-describedby', helpId);
    dialog.innerHTML = `
      <form class="ez-resize-form">
        <h2 id="${titleId}">Resize canvas</h2>
        <p id="${helpId}">Resize the current page. Elements keep their size and position.</p>
        <fieldset class="ez-resize-presets" aria-describedby="${presetHelpId}">
          <legend>Size preset</legend>
          <div class="ez-resize-categories" aria-label="Preset categories"></div>
          <div class="ez-resize-gallery"></div>
          <label class="ez-resize-custom">
            <input type="radio" name="preset" value="custom" />
            <span>Custom size</span><span class="ez-resize-custom-hint">Set your own dimensions</span>
          </label>
        </fieldset>
        <p class="ez-resize-preset-help" id="${presetHelpId}" aria-live="polite"></p>
        <div class="ez-resize-fields">
          <label>Width (px)<input class="ez-input" name="width" type="number" min="1" max="10000" step="1" required /></label>
          <label>Height (px)<input class="ez-input" name="height" type="number" min="1" max="10000" step="1" required /></label>
        </div>
        <p class="ez-resize-limit">Enter whole numbers from 1 to 10,000 pixels.</p>
        <div class="ez-resize-actions">
          <button class="ez-btn ez-btn-ghost" type="button" data-act="cancel">Cancel</button>
          <button class="ez-btn ez-btn-primary" type="submit">Resize canvas</button>
        </div>
      </form>
    `;
    const form = dialog.querySelector('form');
    const gallery = dialog.querySelector('.ez-resize-gallery');
    const categories = dialog.querySelector('.ez-resize-categories');
    const presetHelp = dialog.querySelector('.ez-resize-preset-help');
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
      const category = el('button', 'ez-resize-category', categories);
      category.type = 'button';
      category.textContent = group.group;
      category.onclick = () => showCategory(index);
      categoryButtons.push(category);
      const grid = el('div', 'ez-resize-grid', gallery);
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', group.group);
      presetGroups.push(grid);
      for (const size of group.sizes) {
        const card = el('label', 'ez-resize-card', grid);
        const scale = 72 / Math.max(size.width, size.height);
        card.innerHTML = `
          <input type="radio" name="preset" value="${size.id}" />
          <span class="ez-resize-thumbnail ez-resize-art-${index}" aria-hidden="true">
            <span class="ez-resize-paper" style="width:${size.width * scale}px;height:${size.height * scale}px">
              <span class="ez-resize-art-orb"></span><span class="ez-resize-art-block"></span>
              <span class="ez-resize-art-line"></span>
            </span>
            <span class="ez-resize-check">✓</span>
          </span>
          <span class="ez-resize-card-name">${size.label}</span>
          <span class="ez-resize-card-size">${size.width} × ${size.height} px</span>
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
    dialog.querySelector('.ez-resize-presets').addEventListener('change', () => {
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
    const menu = this.root.querySelector('[data-act="theme"]');
    if (!menu) return;
    const choice = this.editor.themeChoice;
    const summary = menu.querySelector('summary');
    summary.innerHTML = choice === 'dark' ? UI_ICONS.moon : choice === 'light' ? UI_ICONS.sun : UI_ICONS.monitor;
    for (const item of menu.querySelectorAll('.ez-theme-item')) {
      item.setAttribute('aria-pressed', String(item.getAttribute('data-ez-theme-choice') === choice));
    }
  }

  toggleFullscreen() {
    const root = this.editor.container;
    const promise = document.fullscreenElement === root
      ? document.exitFullscreen()
      : root.requestFullscreen?.();
    if (promise) promise.catch(() => {});
  }

  updateFullscreenIcon() {
    const btn = this.root.querySelector('[data-act="fullscreen"]');
    if (!btn) return;
    const on = document.fullscreenElement === this.editor.container;
    btn.innerHTML = on ? UI_ICONS.minimize : UI_ICONS.maximize;
    btn.title = on ? 'Exit fullscreen' : 'Enter fullscreen';
    btn.setAttribute('aria-label', btn.title);
  }

  zoomMenu(e) {
    const btn = e.currentTarget;
    this._menuCleanup?.();
    this._menuCleanup = openSuiteMenu(btn, [
      { label: 'Fit to screen', action: () => this.editor.zoomFit() },
      { label: '100%', action: () => this.editor.setZoom(1) },
      { label: '50%', action: () => this.editor.setZoom(0.5) },
      { label: '75%', action: () => this.editor.setZoom(0.75) },
      { label: '150%', action: () => this.editor.setZoom(1.5) },
      { label: '200%', action: () => this.editor.setZoom(2) }
    ]);
  }

  downloadMenu(e) {
    const btn = e.currentTarget;
    const wasOpen = btn.getAttribute('aria-expanded') === 'true';
    this._menuCleanup?.();
    if (wasOpen) return;
    this._menuCleanup = openSuiteMenu(btn, [
      { label: 'PNG image', action: () => this.editor.exportImage('png', { scale: 2 }) },
      { label: 'JPG image', action: () => this.editor.exportImage('jpeg', { scale: 2 }) },
      { label: 'PNG (transparent)', action: () => this.editor.exportImage('png', { scale: 2, transparent: true }) },
      { label: 'PNG at 4x', action: () => this.editor.exportImage('png', { scale: 4 }) },
      { label: 'Design file (.json)', action: () => this.editor.downloadJSON() }
    ]);
  }
}
