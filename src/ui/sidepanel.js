import { el, escapeHtml, readAsDataURL, clamp, uid } from '../core/utils.js';
import { SHAPES, ICONS, ICON_OUTLINES, FONTS, PALETTE, GRADIENTS, TEMPLATES, UI_ICONS } from '../core/assets.js';
import { elementName } from '../core/elements.js';
import { renderPage } from '../core/renderer.js';
import { createElement } from '../core/elements.js';
import { ChartPanel } from './chartpanel.js';

const TABS = [
  { id: 'templates', label: 'Templates', icon: UI_ICONS.templates },
  { id: 'elements', label: 'Elements', icon: UI_ICONS.shapes },
  { id: 'text', label: 'Text', icon: UI_ICONS.text },
  { id: 'charts', label: 'Charts', icon: UI_ICONS.chart },
  { id: 'uploads', label: 'Uploads', icon: UI_ICONS.upload },
  { id: 'background', label: 'Background', icon: UI_ICONS.palette },
  { id: 'layers', label: 'Layers', icon: UI_ICONS.layers }
];

export class Sidepanel {
  constructor(editor) {
    this.editor = editor;
    this.tabsEl = editor.sidepanelEl.querySelector('.sk-sidepanel-tabs');
    this.contentEl = editor.sidepanelEl.querySelector('.sk-sidepanel-content');
    this.contentEl.id = uid('panel');
    this.contentEl.setAttribute('role', 'tabpanel');
    this.tabsEl.setAttribute('role', 'tablist');
    this.tabsEl.setAttribute('aria-label', 'Design tools');
    this.tabsEl.setAttribute('aria-orientation', 'vertical');
    this.collapsed = false;
    this.collapseBtn = el('button', 'sk-sidepanel-toggle', editor.sidepanelEl.querySelector('.sk-sidepanel-rail'));
    this.tabsEl.before(this.collapseBtn);
    this.collapseBtn.type = 'button';
    this.collapseBtn.innerHTML = UI_ICONS.chevron;
    this.collapseBtn.setAttribute('aria-controls', this.contentEl.id);
    this.collapseBtn.onclick = () => this.setCollapsed(!this.collapsed);
    this.collapseBtn.onkeydown = (e) => {
      if (e.key === ' ') e.stopPropagation();
    };
    this.activeTab = 'elements';
    this.renderTabs();
    this.setTab('elements');
    this.charts = new ChartPanel(this);
    editor.on('selection', () => {
      if (this.activeTab === 'layers') this.renderLayers();
    });
    editor.on('change', () => {
      if (this.activeTab === 'layers') this.renderLayers();
      if (this.activeTab === 'background') this.syncBackgroundControls?.();
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
      btn.type = 'button';
      btn.id = `${this.contentEl.id}-${tab.id}`;
      btn.dataset.tab = tab.id;
      btn.title = tab.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', tab.label);
      btn.setAttribute('aria-controls', this.contentEl.id);
      btn.innerHTML = `${tab.icon}<span>${tab.label}</span>`;
      btn.onclick = () => {
        if (tab.id === this.activeTab && !this.collapsed) this.setCollapsed(true);
        else this.setTab(tab.id);
      };
      btn.onkeydown = (e) => {
        if (e.key === ' ') e.stopPropagation();
        const index = TABS.indexOf(tab);
        const next = e.key === 'ArrowDown' ? (index + 1) % TABS.length
          : e.key === 'ArrowUp' ? (index + TABS.length - 1) % TABS.length
            : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null;
        if (next === null) return;
        e.preventDefault();
        e.stopPropagation();
        this.setTab(TABS[next].id);
        this.tabsEl.children[next].focus();
      };
    }
  }

  setTab(id) {
    const alreadyRendered = this.activeTab === id && this.contentEl.hasChildNodes();
    this.activeTab = id;
    this.setCollapsed(false);
    this.contentEl.setAttribute('aria-labelledby', `${this.contentEl.id}-${id}`);
    if (alreadyRendered) return;
    this.contentEl.innerHTML = '';
    this.contentEl.scrollTop = 0;
    ({ templates: () => this.renderTemplates(),
       elements: () => this.renderElements(),
       text: () => this.renderText(),
       charts: () => this.charts.render(),
       uploads: () => this.renderUploads(),
       background: () => this.renderBackground(),
       layers: () => this.renderLayers() })[id]();
  }

  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    this.editor.sidepanelEl.classList.toggle('sk-collapsed', collapsed);
    if (collapsed && this.contentEl.contains(document.activeElement)) this.collapseBtn.focus();
    this.contentEl.hidden = collapsed;
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    this.collapseBtn.title = label;
    this.collapseBtn.setAttribute('aria-label', label);
    this.collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    for (const btn of this.tabsEl.children) {
      const active = btn.dataset.tab === this.activeTab;
      btn.classList.toggle('sk-active', active);
      btn.setAttribute('aria-selected', String(active));
      btn.setAttribute('aria-expanded', String(active && !collapsed));
      btn.tabIndex = active ? 0 : -1;
    }
    this.editor.markDirty();
  }

  sectionTitle(text) {
    const t = el('div', 'sk-panel-title', this.contentEl);
    t.textContent = text;
    return t;
  }

  renderTemplates() {
    this.sectionTitle('Find your starting point');
    const intro = el('p', 'sk-template-intro', this.contentEl);
    intro.textContent = 'Fresh layouts. Make every detail yours.';
    const search = el('input', 'sk-input sk-template-search', this.contentEl);
    search.type = 'search';
    search.placeholder = 'Search templates…';
    search.setAttribute('aria-label', 'Search templates');
    search.value = this.templateQuery || '';
    const filters = el('div', 'sk-template-filters', this.contentEl);
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Template categories');
    const categories = ['All', ...new Set(TEMPLATES.map(tpl => tpl.category))];
    for (const category of categories) {
      const button = el('button', 'sk-template-filter', filters);
      button.type = 'button';
      button.textContent = category;
      button.onclick = () => {
        this.templateCategory = category;
        update();
      };
    }
    const count = el('div', 'sk-template-count', this.contentEl);
    count.setAttribute('role', 'status');
    const grid = el('div', 'sk-template-grid', this.contentEl);
    const update = () => {
      const category = this.templateCategory || 'All';
      const query = (this.templateQuery || '').trim().toLowerCase();
      for (const button of filters.children) {
        const active = button.textContent === category;
        button.classList.toggle('sk-active', active);
        button.setAttribute('aria-pressed', String(active));
      }
      const matches = TEMPLATES.filter(tpl =>
        (category === 'All' || tpl.category === category) &&
        `${tpl.name} ${tpl.category} ${tpl.format}`.toLowerCase().includes(query)
      );
      count.textContent = `${matches.length} editable ${matches.length === 1 ? 'template' : 'templates'}`;
      grid.innerHTML = '';
      if (!matches.length) {
        const empty = el('p', 'sk-empty sk-template-empty', grid);
        empty.textContent = 'No templates found. Try another search or category.';
      }
      for (const tpl of matches) {
        const card = el('button', 'sk-template-card', grid);
        card.type = 'button';
        card.setAttribute('aria-label', `Use ${tpl.name}, ${tpl.format}, ${tpl.page.width} by ${tpl.page.height} pixels`);
        const preview = el('div', 'sk-template-preview', card);
        const canvas = document.createElement('canvas');
        const pw = tpl.page.width;
        const ph = tpl.page.height;
        const scale = 380 / Math.max(pw, ph);
        canvas.width = Math.round(pw * scale);
        canvas.height = Math.round(ph * scale);
        canvas.setAttribute('aria-hidden', 'true');
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        renderPage(ctx, { ...tpl.page, elements: tpl.page.elements.map((e) => createElement(e.type, e)) });
        preview.appendChild(canvas);
        const label = el('div', 'sk-template-name', card);
        label.textContent = tpl.name;
        const meta = el('div', 'sk-template-meta', card);
        meta.textContent = `${tpl.format} · ${pw} × ${ph}`;
        card.onclick = () => this.editor.applyTemplate(tpl);
      }
    };
    search.addEventListener('input', () => {
      this.templateQuery = search.value;
      update();
    });
    update();
  }

  renderElements() {
    this.sectionTitle('Make it yours');
    const intro = el('p', 'sk-elements-intro', this.contentEl);
    intro.textContent = 'Simple shapes. A little extra character.';
    const search = el('input', 'sk-input sk-elements-search', this.contentEl);
    search.type = 'search';
    search.placeholder = 'Search shapes & icons';
    search.setAttribute('aria-label', 'Search shapes and icons');
    search.value = this.elementQuery || '';
    const filters = el('div', 'sk-element-filters', this.contentEl);
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Element types');
    for (const category of ['All', 'Shapes', 'Icons']) {
      const button = el('button', 'sk-element-filter', filters);
      button.type = 'button';
      button.textContent = category;
      button.onclick = () => {
        this.elementCategory = category;
        update();
      };
    }
    const count = el('div', 'sk-element-count', this.contentEl);
    count.setAttribute('role', 'status');
    const results = el('div', 'sk-element-results', this.contentEl);
    const addCard = (grid, label, svg, props) => {
      const button = el('button', 'sk-element-btn', grid);
      button.type = 'button';
      button.title = label;
      button.setAttribute('aria-label', `Add ${label}`);
      button.innerHTML = svg;
      const caption = el('span', 'sk-element-label', button);
      caption.textContent = label;
      button.onclick = () => {
        const added = this.editor.addElement(props);
        this.editor.select([added.id]);
      };
    };
    const update = () => {
      const category = this.elementCategory || 'All';
      const query = (this.elementQuery || '').trim().toLowerCase();
      const style = this.elementIconStyle || 'solid';
      for (const button of filters.children) {
        const active = button.textContent === category;
        button.classList.toggle('sk-active', active);
        button.setAttribute('aria-pressed', String(active));
      }
      const shapes = category === 'Icons' ? [] : SHAPES.filter(shape => shape.label.toLowerCase().includes(query));
      const icons = category === 'Shapes' ? [] : Object.keys(ICONS).filter(name => name.replace(/-/g, ' ').includes(query));
      const total = shapes.length + icons.length;
      count.textContent = `${total} ${total === 1 ? 'element' : 'elements'}`;
      results.innerHTML = '';
      if (!total) {
        const empty = el('p', 'sk-empty', results);
        empty.textContent = 'No elements found. Try another search or filter.';
      }
      if (shapes.length) {
        el('div', 'sk-panel-title', results).textContent = 'Shapes';
        const grid = el('div', 'sk-element-grid', results);
        for (const shape of shapes) {
          addCard(grid, shape.label,
            `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" focusable="false">${shape.svg}</svg>`,
            { type: shape.type, ...(shape.props || {}) });
        }
      }
      if (icons.length) {
        const heading = el('div', 'sk-element-heading', results);
        el('div', 'sk-panel-title', heading).textContent = 'Icons';
        const styles = el('div', 'sk-icon-styles', heading);
        styles.setAttribute('role', 'group');
        styles.setAttribute('aria-label', 'Icon style');
        for (const variant of ['solid', 'outline']) {
          const button = el('button', 'sk-icon-style' + (style === variant ? ' sk-active' : ''), styles);
          button.type = 'button';
          button.textContent = variant === 'solid' ? 'Solid' : 'Outline';
          button.setAttribute('aria-pressed', String(style === variant));
          button.onclick = () => {
            this.elementIconStyle = variant;
            update();
            results.querySelector(`.sk-icon-style.sk-active`).focus({ preventScroll: true });
          };
        }
        const grid = el('div', 'sk-element-grid', results);
        for (const name of icons) {
          const label = name.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
          const attrs = style === 'outline'
            ? 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
            : 'fill="currentColor" fill-rule="evenodd"';
          addCard(grid, label,
            `<svg viewBox="0 0 24 24" ${attrs} aria-hidden="true" focusable="false"><path d="${style === 'outline' ? ICON_OUTLINES[name] : ICONS[name]}" /></svg>`,
            { type: 'icon', icon: name, iconStyle: style, w: 160, h: 160 });
        }
      }
    };
    search.addEventListener('input', () => {
      this.elementQuery = search.value;
      update();
    });
    update();
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
    this.contentEl.innerHTML = '';
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
      sw.style.background = `linear-gradient(${(g.angle ?? 135) + 90}deg, ${g.from}, ${g.to})`;
      sw.title = `${g.from} → ${g.to}`;
      sw.onclick = () => ed.setBackground({ ...g, type: 'gradient' });
    }
    this.sectionTitle('Custom gradient');
    const gradient = bg.type === 'gradient' ? bg : GRADIENTS[0];
    const gradientRow = el('div', 'sk-bg-gradient-controls', this.contentEl);
    const fields = {};
    for (const [key, label] of [['from', 'Start color'], ['to', 'End color'], ['angle', 'Angle']]) {
      const wrap = el('label', 'sk-bg-gradient-field', gradientRow);
      el('span', 'sk-num-label', wrap).textContent = label;
      const field = el('input', 'sk-input', wrap);
      field.type = key === 'angle' ? 'number' : 'color';
      field.setAttribute('aria-label', `Background gradient ${label.toLowerCase()}`);
      if (key === 'angle') {
        field.min = 0;
        field.max = 360;
        field.step = 1;
        field.value = gradient.angle ?? 135;
      } else {
        field.value = gradient[key] || (key === 'from' ? '#ffffff' : '#eeeeee');
      }
      fields[key] = field;
    }
    const preview = el('div', 'sk-bg-gradient-preview', this.contentEl);
    preview.setAttribute('aria-hidden', 'true');
    const updatePreview = () => {
      const angle = Number.isFinite(fields.angle.valueAsNumber) ? clamp(fields.angle.valueAsNumber, 0, 360) : 135;
      preview.style.background = `linear-gradient(${angle + 90}deg, ${fields.from.value}, ${fields.to.value})`;
    };
    const applyGradient = (commit = true) => {
      if (!Number.isFinite(fields.angle.valueAsNumber)) return;
      const angle = clamp(fields.angle.valueAsNumber, 0, 360);
      ed.setBackground({ type: 'gradient', from: fields.from.value, to: fields.to.value, angle }, commit);
      updatePreview();
    };
    for (const field of Object.values(fields)) {
      field.oninput = () => applyGradient(false);
      field.onchange = () => ed.commit();
    }
    const apply = el('button', 'sk-btn sk-btn-ghost sk-bg-gradient-apply', this.contentEl);
    apply.type = 'button';
    apply.textContent = 'Apply gradient';
    apply.onclick = () => applyGradient();

    this.sectionTitle('Solid color & image');
    const row = el('div', 'sk-bg-custom', this.contentEl);
    const input = el('input', '', row);
    input.type = 'color';
    input.value = /^#([0-9a-f]{6})$/i.test(bg.color || '') ? bg.color : '#ffffff';
    input.setAttribute('aria-label', 'Background solid color');
    input.oninput = () => ed.setBackground({ type: 'solid', color: input.value }, false);
    input.onchange = () => ed.commit();
    const imgBtn = el('button', 'sk-btn sk-btn-ghost sk-grow', row);
    imgBtn.textContent = 'Image background';
    imgBtn.onclick = async () => {
      const file = await ed.pickImageFile();
      if (!file) return;
      const src = await readAsDataURL(file);
      ed.setBackground({ type: 'image', src });
    };
    const rm = el('button', 'sk-btn sk-btn-ghost sk-grow', row);
    rm.textContent = 'Remove image';
    rm.onclick = () => ed.setBackground({ type: 'solid', color: '#ffffff' });
    this.syncBackgroundControls = () => {
      const current = ed.getPage().background || {};
      if (current.type === 'gradient') {
        fields.from.value = current.from || '#ffffff';
        fields.to.value = current.to || '#eeeeee';
        fields.angle.value = current.angle ?? 135;
      }
      if (/^#[0-9a-f]{6}$/i.test(current.color || '')) input.value = current.color;
      rm.style.display = current.type === 'image' ? '' : 'none';
      updatePreview();
    };
    this.syncBackgroundControls();
  }

  renderLayers() {
    const ed = this.editor;
    const scrollTop = this.contentEl.scrollTop;
    this.contentEl.innerHTML = '';
    this.sectionTitle('Layers');
    const hint = el('p', 'sk-layer-hint', this.contentEl);
    hint.textContent = 'Drag layers to reorder. Top layers appear in front.';
    const list = el('div', 'sk-layer-list', this.contentEl);
    let draggedId = null;
    const clearDropMarks = () => {
      list.querySelectorAll('.sk-drop-before, .sk-drop-after')
        .forEach(row => row.classList.remove('sk-drop-before', 'sk-drop-after'));
    };
    const endDrag = () => {
      draggedId = null;
      clearDropMarks();
      list.querySelectorAll('.sk-dragging').forEach(row => row.classList.remove('sk-dragging'));
    };
    // Accept drops in the gaps where the insertion lines are drawn, too.
    const forwardGapEvent = (e, handler) => {
      if (e.target !== list || draggedId === null) return;
      const row = [...list.children].find(child => e.clientY < child.getBoundingClientRect().bottom)
        || list.lastElementChild;
      row?.[handler]?.(e);
    };
    list.ondragover = (e) => forwardGapEvent(e, 'ondragover');
    list.ondrop = (e) => forwardGapEvent(e, 'ondrop');
    const els = ed.getElements();
    if (!els.length) {
      const empty = el('div', 'sk-empty', this.contentEl);
      empty.textContent = 'This page is empty. Add elements from the panels.';
      return;
    }
    for (let i = els.length - 1; i >= 0; i--) {
      const item = els[i];
      const row = el('div', 'sk-layer-item' + (ed.selection.has(item.id) ? ' sk-active' : ''), list);
      row.dataset.id = item.id;
      const handle = el('button', 'sk-layer-drag-handle', row);
      handle.type = 'button';
      handle.textContent = '⠿';
      handle.title = 'Drag to reorder, or use Up/Down arrow keys';
      handle.setAttribute('aria-label', `Reorder ${elementName(item)}. Use Up or Down arrow keys.`);
      handle.draggable = true;
      handle.onkeydown = (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        e.stopPropagation();
        const from = ed.getElements().findIndex(layer => layer.id === item.id);
        ed.moveLayer(from, from + (e.key === 'ArrowUp' ? 1 : -1));
        const movedRow = [...this.contentEl.querySelectorAll('.sk-layer-item')]
          .find(layer => layer.dataset.id === item.id);
        movedRow?.querySelector('.sk-layer-drag-handle').focus({ preventScroll: true });
      };
      row.ondragstart = (e) => {
        draggedId = item.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setDragImage(row, 16, row.offsetHeight / 2);
        requestAnimationFrame(() => {
          if (draggedId === item.id) row.classList.add('sk-dragging');
        });
      };
      row.ondragend = endDrag;
      row.ondragover = (e) => {
        if (draggedId === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        clearDropMarks();
        if (draggedId === item.id) return;
        const rect = row.getBoundingClientRect();
        row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'sk-drop-before' : 'sk-drop-after');
      };
      row.ondragleave = (e) => {
        if (!row.contains(e.relatedTarget)) row.classList.remove('sk-drop-before', 'sk-drop-after');
      };
      row.ondrop = (e) => {
        if (draggedId === null) return;
        e.preventDefault();
        const layers = ed.getElements();
        const from = layers.findIndex(layer => layer.id === draggedId);
        const target = layers.findIndex(layer => layer.id === item.id);
        const rect = row.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        endDrag();
        if (from < 0 || target < 0 || from === target) return;
        // The panel lists front to back, opposite the canvas element array.
        const insertion = target + (before ? 1 : 0);
        ed.moveLayer(from, insertion - (from < insertion ? 1 : 0));
      };
      const icon = item.type === 'chart' ? UI_ICONS.chart : item.type === 'text' ? UI_ICONS.text : item.type === 'image' ? UI_ICONS.image : UI_ICONS.shapes;
      const name = el('span', 'sk-layer-name', row);
      name.draggable = true;
      name.title = 'Click to select, or drag to reorder';
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
    this.contentEl.scrollTop = scrollTop;
  }
}
