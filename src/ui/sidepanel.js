import { el, escapeHtml, readAsDataURL } from '../core/utils.js';
import { SHAPES, ICONS, FONTS, PALETTE, GRADIENTS, TEMPLATES, UI_ICONS } from '../core/assets.js';
import { elementName } from '../core/elements.js';
import { renderPage } from '../core/renderer.js';
import { createElement } from '../core/elements.js';

const TABS = [
  { id: 'templates', label: 'Templates', icon: UI_ICONS.templates },
  { id: 'elements', label: 'Elements', icon: UI_ICONS.shapes },
  { id: 'text', label: 'Text', icon: UI_ICONS.text },
  { id: 'uploads', label: 'Uploads', icon: UI_ICONS.upload },
  { id: 'background', label: 'Background', icon: UI_ICONS.palette },
  { id: 'layers', label: 'Layers', icon: UI_ICONS.layers }
];

export class Sidepanel {
  constructor(editor) {
    this.editor = editor;
    this.tabsEl = editor.sidepanelEl.querySelector('.sk-sidepanel-tabs');
    this.contentEl = editor.sidepanelEl.querySelector('.sk-sidepanel-content');
    this.activeTab = 'elements';
    this.renderTabs();
    this.setTab('elements');
    editor.on('selection', () => {
      if (this.activeTab === 'layers') this.renderLayers();
    });
    editor.on('change', () => {
      if (this.activeTab === 'layers') this.renderLayers();
    });
    editor.on('upload', () => {
      if (this.activeTab === 'uploads') this.renderUploads();
    });
    editor.on('page', () => {
      if (this.activeTab === 'background') this.renderBackground();
      if (this.activeTab === 'layers') this.renderLayers();
    });
  }

  renderTabs() {
    this.tabsEl.innerHTML = '';
    for (const tab of TABS) {
      const btn = el('button', 'sk-tab-btn' + (tab.id === this.activeTab ? ' sk-active' : ''), this.tabsEl);
      btn.innerHTML = `${tab.icon}<span>${tab.label}</span>`;
      btn.onclick = () => this.setTab(tab.id);
    }
  }

  setTab(id) {
    this.activeTab = id;
    [...this.tabsEl.children].forEach((c, i) => c.classList.toggle('sk-active', TABS[i].id === id));
    this.contentEl.innerHTML = '';
    ({ templates: () => this.renderTemplates(),
       elements: () => this.renderElements(),
       text: () => this.renderText(),
       uploads: () => this.renderUploads(),
       background: () => this.renderBackground(),
       layers: () => this.renderLayers() })[id]();
  }

  sectionTitle(text) {
    const t = el('div', 'sk-panel-title', this.contentEl);
    t.textContent = text;
    return t;
  }

  renderTemplates() {
    this.sectionTitle('Start with a template');
    const grid = el('div', 'sk-template-grid', this.contentEl);
    document.fonts?.ready.then(() => {
      for (const tpl of TEMPLATES) {
        const card = el('div', 'sk-template-card', grid);
        const canvas = document.createElement('canvas');
        const pw = tpl.page.width;
        const ph = tpl.page.height;
        const scale = 190 / pw;
        canvas.width = 190 * 2;
        canvas.height = Math.round(ph * scale) * 2;
        canvas.style.width = '190px';
        canvas.style.height = Math.round(ph * scale) + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(2 * scale, 2 * scale);
        renderPage(ctx, { ...tpl.page, elements: tpl.page.elements.map((e) => createElement(e.type, e)) });
        card.appendChild(canvas);
        const label = el('div', 'sk-template-name', card);
        label.textContent = tpl.name;
        card.onclick = () => this.editor.applyTemplate(tpl);
      }
    });
  }

  renderElements() {
    this.sectionTitle('Shapes');
    const shapeGrid = el('div', 'sk-element-grid', this.contentEl);
    for (const shape of SHAPES) {
      const btn = el('button', 'sk-element-btn', shapeGrid);
      btn.title = shape.label;
      btn.innerHTML = `<svg viewBox="0 0 100 100">${shape.svg}</svg>`;
      btn.onclick = () => {
        const el2 = this.editor.addElement({ type: shape.type, ...(shape.props || {}) });
        this.editor.select([el2.id]);
      };
    }
    this.sectionTitle('Icons');
    const iconGrid = el('div', 'sk-element-grid', this.contentEl);
    for (const name of Object.keys(ICONS)) {
      const btn = el('button', 'sk-element-btn', iconGrid);
      btn.title = name;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICONS[name]}" /></svg>`;
      btn.onclick = () => {
        const el2 = this.editor.addElement({ type: 'icon', icon: name, w: 160, h: 160 });
        this.editor.select([el2.id]);
      };
    }
  }

  renderText() {
    this.sectionTitle('Default text styles');
    const presets = [
      { label: 'Add a heading', size: 72, weight: 700, h: 100 },
      { label: 'Add a subheading', size: 40, weight: 600, h: 60 },
      { label: 'Add body text', size: 24, weight: 400, h: 40 }
    ];
    for (const p of presets) {
      const btn = el('button', 'sk-text-preset', this.contentEl);
      btn.style.fontSize = Math.max(16, p.size / 2.4) + 'px';
      btn.style.fontWeight = p.weight;
      btn.textContent = p.label;
      btn.onclick = () => {
        const el2 = this.editor.addText({
          text: p.label.replace('Add a ', '').replace('Add ', ''),
          fontSize: p.size,
          fontWeight: p.weight,
          h: p.h
        });
        this.editor.select([el2.id]);
      };
    }
    this.sectionTitle('Fonts (apply to selection)');
    const fontList = el('div', 'sk-font-list', this.contentEl);
    for (const font of FONTS) {
      const btn = el('button', 'sk-font-item', fontList);
      btn.style.fontFamily = font;
      btn.textContent = font;
      btn.onclick = () => {
        const sel = this.editor.getSelected().filter((s) => s.type === 'text');
        if (sel.length) this.editor.updateSelected({ fontFamily: font });
      };
    }
  }

  renderUploads() {
    const ed = this.editor;
    const btn = el('button', 'sk-upload-btn', this.contentEl);
    btn.innerHTML = `${UI_ICONS.upload}<span>Upload an image</span>`;
    btn.onclick = () => ed.openFilePicker();
    this.sectionTitle('Recent uploads');
    const grid = el('div', 'sk-upload-grid', this.contentEl);
    if (!ed.uploads.length) {
      const empty = el('div', 'sk-empty', this.contentEl);
      empty.textContent = 'Your uploads will appear here. Drag & drop images onto the canvas too.';
    }
    for (const up of ed.uploads) {
      const thumb = el('button', 'sk-upload-thumb', grid);
      const img = document.createElement('img');
      img.src = up.src;
      img.alt = up.name;
      thumb.appendChild(img);
      thumb.onclick = () => {
        const el2 = ed.addElement({ type: 'image', src: up.src, name: up.name });
        ed.select([el2.id]);
      };
    }
  }

  renderBackground() {
    const ed = this.editor;
    const bg = ed.getPage().background || {};
    this.sectionTitle('Solid colors');
    const swatches = el('div', 'sk-swatch-grid', this.contentEl);
    for (const color of PALETTE) {
      const sw = el('button', 'sk-swatch', swatches);
      sw.style.background = color;
      if (color === '#ffffff') sw.classList.add('sk-swatch-border');
      sw.title = color;
      sw.onclick = () => ed.setBackground({ type: 'solid', color });
    }
    this.sectionTitle('Gradients');
    const grads = el('div', 'sk-swatch-grid', this.contentEl);
    for (const g of GRADIENTS) {
      const sw = el('button', 'sk-swatch', grads);
      sw.style.background = `linear-gradient(135deg, ${g.from}, ${g.to})`;
      sw.title = `${g.from} → ${g.to}`;
      sw.onclick = () => ed.setBackground({ ...g, type: 'gradient' });
    }
    this.sectionTitle('Custom');
    const row = el('div', 'sk-bg-custom', this.contentEl);
    const input = el('input', '', row);
    input.type = 'color';
    input.value = /^#([0-9a-f]{6})$/i.test(bg.color || '') ? bg.color : '#ffffff';
    input.oninput = () => ed.setBackground({ type: 'solid', color: input.value });
    const imgBtn = el('button', 'sk-btn sk-btn-ghost sk-grow', row);
    imgBtn.textContent = 'Image background';
    imgBtn.onclick = async () => {
      const file = await ed.pickImageFile();
      if (!file) return;
      const src = await readAsDataURL(file);
      ed.setBackground({ type: 'image', src });
    };
    if (bg.type === 'image') {
      const rm = el('button', 'sk-btn sk-btn-ghost sk-grow', row);
      rm.textContent = 'Remove image';
      rm.onclick = () => ed.setBackground({ type: 'solid', color: '#ffffff' });
    }
  }

  renderLayers() {
    const ed = this.editor;
    this.contentEl.innerHTML = '';
    this.sectionTitle('Layers');
    const list = el('div', 'sk-layer-list', this.contentEl);
    const els = ed.getElements();
    if (!els.length) {
      const empty = el('div', 'sk-empty', this.contentEl);
      empty.textContent = 'This page is empty. Add elements from the panels.';
      return;
    }
    for (let i = els.length - 1; i >= 0; i--) {
      const item = els[i];
      const row = el('div', 'sk-layer-item' + (ed.selection.has(item.id) ? ' sk-active' : ''), list);
      const icon = item.type === 'text' ? UI_ICONS.text : item.type === 'image' ? UI_ICONS.image : UI_ICONS.shapes;
      const name = el('span', 'sk-layer-name', row);
      name.innerHTML = `${icon}<span>${escapeHtml(elementName(item))}</span>`;
      name.onclick = () => ed.select([item.id]);
      const btns = el('span', 'sk-layer-actions', row);
      const mkBtn = (html, title, fn, cls = '') => {
        const b = el('button', 'sk-icon-btn sk-sm ' + cls, btns);
        b.innerHTML = html;
        b.title = title;
        b.onclick = (e) => {
          e.stopPropagation();
          fn();
        };
      };
      mkBtn(item.hidden ? UI_ICONS['eye-off'] : UI_ICONS.eye, item.hidden ? 'Show' : 'Hide', () => {
        item.hidden = !item.hidden;
        ed.markDirty();
        ed.commit();
        this.renderLayers();
      });
      mkBtn(item.locked ? UI_ICONS.lock : UI_ICONS.unlock, item.locked ? 'Unlock' : 'Lock', () => {
        item.locked = !item.locked;
        ed.commit();
        this.renderLayers();
      });
      mkBtn(UI_ICONS.trash, 'Delete', () => {
        ed.select([item.id]);
        ed.deleteSelected();
      });
    }
  }
}
