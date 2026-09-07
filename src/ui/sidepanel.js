import { el, escapeHtml, readAsDataURL, clamp, uid, hexOr, isHexColor } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';
import { elementName, manifestFor } from '../core/elements.js';
import { renderPage } from '../core/renderer.js';
import { createElement } from '../core/elements.js';
import { ChartPanel } from './chartpanel.js';
import { colorField } from './colorfield.js';
import { GRADIENT_FALLBACKS } from '../core/constants.js';

// Accepts a flat color array or { label, colors } brand-kit groups.
function normalizePalette(palette) {
  if (!Array.isArray(palette)) return [];
  const flat = palette.filter((entry) => typeof entry === 'string');
  const groups = palette.filter((entry) => entry && Array.isArray(entry.colors));
  if (groups.length) return groups;
  return flat.length ? [{ colors: flat }] : [];
}

// Built-in tabs. Consumer panels register at runtime via
// editor.registerPanel({ id, label, icon, render }) and are appended here.
const BUILTIN_TABS = [
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
    this.tabsEl = editor.sidepanelEl.querySelector('.ez-sidepanel-tabs');
    this.contentEl = editor.sidepanelEl.querySelector('.ez-sidepanel-content');
    this.contentEl.id = uid('panel');
    this.contentEl.setAttribute('role', 'tabpanel');
    this.tabsEl.setAttribute('role', 'tablist');
    this.tabsEl.setAttribute('aria-label', 'Design tools');
    this.tabsEl.setAttribute('aria-orientation', 'vertical');
    this.collapsed = false;
    this.collapseBtn = el('button', 'ez-sidepanel-toggle', editor.sidepanelEl.querySelector('.ez-sidepanel-rail'));
    this.tabsEl.before(this.collapseBtn);
    this.collapseBtn.type = 'button';
    this.collapseBtn.innerHTML = UI_ICONS.chevron;
    this.collapseBtn.setAttribute('aria-controls', this.contentEl.id);
    this.collapseBtn.onclick = () => this.setCollapsed(!this.collapsed);
    this.collapseBtn.onkeydown = (e) => {
      if (e.key === ' ') e.stopPropagation();
    };
    this.activeTab = 'elements';
    this.tabs = [...BUILTIN_TABS];
    this._tabCleanup = null;
    this.renderTabs();
    this.setTab('elements');
    this.charts = new ChartPanel(this);
    // Mount the panel contributions plugins queued during initialization.
    // With the sidebar disabled this class is never constructed and the
    // contributions remain unmounted in the editor's queue.
    const pending = editor._pendingPanels || [];
    editor._pendingPanels = [];
    for (const panel of pending) this.registerPanel(panel);
    this._unsubs = [
      editor.on('selection', () => {
        if (this.activeTab === 'layers') this.renderLayers();
      }),
      editor.on('change', () => {
        if (this.activeTab === 'layers') this.renderLayers();
        if (this.activeTab === 'background') this.syncBackgroundControls?.();
      }),
      editor.on('upload', () => {
        if (this.activeTab === 'uploads') this.renderUploads();
      }),
      editor.on('page', () => {
        if (this.activeTab === 'background') this.renderBackground();
        if (this.activeTab === 'layers') this.renderLayers();
      })
    ];
  }

  destroy() {
    this._runTabCleanup();
    this._unsubs?.forEach((off) => off());
    this._unsubs = [];
  }

  // Custom panel renders may return a cleanup function; it runs before the
  // content is cleared on rerender, tab replacement and destruction.
  _runTabCleanup() {
    const cleanup = this._tabCleanup;
    this._tabCleanup = null;
    if (typeof cleanup === 'function') {
      try {
        cleanup();
      } catch (error) {
        console.warn('ezyreka: panel cleanup failed:', error);
      }
    }
  }

  renderTabs() {
    this.tabsEl.innerHTML = '';
    for (const tab of this.tabs) {
      const btn = el('button', 'ez-tab-btn' + (tab.id === this.activeTab ? ' ez-active' : ''), this.tabsEl);
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
        const index = this.tabs.indexOf(tab);
        const next = e.key === 'ArrowDown' ? (index + 1) % this.tabs.length
          : e.key === 'ArrowUp' ? (index + this.tabs.length - 1) % this.tabs.length
            : e.key === 'Home' ? 0 : e.key === 'End' ? this.tabs.length - 1 : null;
        if (next === null) return;
        e.preventDefault();
        e.stopPropagation();
        this.setTab(this.tabs[next].id);
        this.tabsEl.children[next].focus();
      };
    }
  }

  setTab(id) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab) return;
    const alreadyRendered = this.activeTab === id && this.contentEl.hasChildNodes();
    this.activeTab = id;
    this.setCollapsed(false);
    this.contentEl.setAttribute('aria-labelledby', `${this.contentEl.id}-${id}`);
    if (alreadyRendered) return;
    this._runTabCleanup();
    this.contentEl.innerHTML = '';
    this.contentEl.scrollTop = 0;
    if (typeof tab.render === 'function') {
      const cleanup = tab.render(this.contentEl, this.editor);
      if (typeof cleanup === 'function') this._tabCleanup = cleanup;
      return;
    }
    ({ templates: () => this.renderTemplates(),
       elements: () => this.renderElements(),
       text: () => this.renderText(),
       charts: () => this.charts.render(),
       uploads: () => this.renderUploads(),
       background: () => this.renderBackground(),
       layers: () => this.renderLayers() })[id]?.();
  }

  registerPanel(panel) {
    if (!panel || typeof panel.id !== 'string' || typeof panel.render !== 'function') {
      throw new Error('ezyreka: panels need { id, label, icon, render(contentEl, editor) }');
    }
    if (this.tabs.some((t) => t.id === panel.id)) {
      throw new Error(`ezyreka: panel "${panel.id}" already exists`);
    }
    this.tabs.push({
      id: panel.id,
      label: panel.label || panel.id,
      icon: panel.icon || UI_ICONS.shapes,
      render: panel.render
    });
    this.renderTabs();
    return panel;
  }

  // Rebuilds the active tab, e.g. after registering templates, fonts or icons.
  rerender() {
    this._runTabCleanup();
    this.contentEl.innerHTML = '';
    this.setTab(this.activeTab);
  }

  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    this.editor.sidepanelEl.classList.toggle('ez-collapsed', collapsed);
    if (collapsed && this.contentEl.contains(document.activeElement)) this.collapseBtn.focus();
    this.contentEl.hidden = collapsed;
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    this.collapseBtn.title = label;
    this.collapseBtn.setAttribute('aria-label', label);
    this.collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    for (const btn of this.tabsEl.children) {
      const active = btn.dataset.tab === this.activeTab;
      btn.classList.toggle('ez-active', active);
      btn.setAttribute('aria-selected', String(active));
      btn.setAttribute('aria-expanded', String(active && !collapsed));
      btn.tabIndex = active ? 0 : -1;
    }
    this.editor.markDirty();
  }

  panelHeader(title, description) {
    const header = el('header', 'ez-panel-header', this.contentEl);
    el('h2', 'ez-panel-heading', header).textContent = title;
    el('p', 'ez-panel-description', header).textContent = description;
    return header;
  }

  sectionTitle(text, parent = this.contentEl) {
    const t = el('h3', 'ez-panel-title', parent);
    t.textContent = text;
    return t;
  }

  renderTemplates() {
    this.panelHeader('Templates', 'Find your starting point. Make every detail yours.');
    const search = el('input', 'ez-input ez-panel-search ez-template-search', this.contentEl);
    search.type = 'search';
    search.placeholder = 'Search templates…';
    search.setAttribute('aria-label', 'Search templates');
    search.value = this.templateQuery || '';
    const filters = el('div', 'ez-panel-filters ez-template-filters', this.contentEl);
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Template categories');
    const categories = ['All', ...new Set(this.editor.registry.templates.map(tpl => tpl.category))];
    for (const category of categories) {
      const button = el('button', 'ez-panel-filter ez-template-filter', filters);
      button.type = 'button';
      button.textContent = category;
      button.onclick = () => {
        this.templateCategory = category;
        update();
      };
    }
    const count = el('div', 'ez-panel-count ez-template-count', this.contentEl);
    count.setAttribute('role', 'status');
    const grid = el('div', 'ez-template-grid', this.contentEl);
    const update = () => {
      const category = this.templateCategory || 'All';
      const query = (this.templateQuery || '').trim().toLowerCase();
      for (const button of filters.children) {
        const active = button.textContent === category;
        button.classList.toggle('ez-active', active);
        button.setAttribute('aria-pressed', String(active));
      }
      const matches = this.editor.registry.templates.filter(tpl =>
        (category === 'All' || tpl.category === category) &&
        `${tpl.name} ${tpl.category} ${tpl.format}`.toLowerCase().includes(query)
      );
      count.textContent = `${matches.length} editable ${matches.length === 1 ? 'template' : 'templates'}`;
      grid.innerHTML = '';
      if (!matches.length) {
        const empty = el('p', 'ez-empty ez-template-empty', grid);
        empty.textContent = 'No templates found. Try another search or category.';
      }
      for (const tpl of matches) {
        const card = el('button', 'ez-panel-card ez-template-card', grid);
        card.type = 'button';
        card.setAttribute('aria-label', `Use ${tpl.name}, ${tpl.format}, ${tpl.page.width} by ${tpl.page.height} pixels`);
        const preview = el('div', 'ez-template-preview', card);
        const canvas = document.createElement('canvas');
        const pw = tpl.page.width;
        const ph = tpl.page.height;
        const scale = 380 / Math.max(pw, ph);
        canvas.width = Math.round(pw * scale);
        canvas.height = Math.round(ph * scale);
        canvas.setAttribute('aria-hidden', 'true');
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        renderPage(ctx, { ...tpl.page, elements: tpl.page.elements.map((e) => createElement(e.type, e, this.editor.registry)) }, { registry: this.editor.registry });
        preview.appendChild(canvas);
        const label = el('div', 'ez-template-name', card);
        label.textContent = tpl.name;
        const meta = el('div', 'ez-template-meta', card);
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
    this.panelHeader('Elements', 'Add shapes and icons to make your design yours.');
    const search = el('input', 'ez-input ez-panel-search ez-elements-search', this.contentEl);
    search.type = 'search';
    search.placeholder = 'Search shapes & icons';
    search.setAttribute('aria-label', 'Search shapes and icons');
    search.value = this.elementQuery || '';
    const filters = el('div', 'ez-panel-filters ez-element-filters', this.contentEl);
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Element types');
    for (const category of ['All', 'Shapes', 'Icons']) {
      const button = el('button', 'ez-panel-filter ez-element-filter', filters);
      button.type = 'button';
      button.textContent = category;
      button.onclick = () => {
        this.elementCategory = category;
        update();
      };
    }
    const count = el('div', 'ez-panel-count ez-element-count', this.contentEl);
    count.setAttribute('role', 'status');
    const results = el('div', 'ez-element-results', this.contentEl);
    const addCard = (grid, label, svg, props) => {
      const button = el('button', 'ez-panel-card ez-element-btn', grid);
      button.type = 'button';
      button.title = label;
      button.setAttribute('aria-label', `Add ${label}`);
      button.innerHTML = svg;
      const caption = el('span', 'ez-element-label', button);
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
        button.classList.toggle('ez-active', active);
        button.setAttribute('aria-pressed', String(active));
      }
      const shapes = category === 'Icons' ? [] : this.editor.registry.shapes.filter(shape => shape.label.toLowerCase().includes(query));
      const icons = category === 'Shapes' ? [] : Object.keys(this.editor.registry.icons).filter(name => name.replace(/-/g, ' ').includes(query));
      const total = shapes.length + icons.length;
      count.textContent = `${total} ${total === 1 ? 'element' : 'elements'}`;
      results.innerHTML = '';
      if (!total) {
        const empty = el('p', 'ez-empty', results);
        empty.textContent = 'No elements found. Try another search or filter.';
      }
      if (shapes.length) {
        this.sectionTitle('Shapes', results);
        const grid = el('div', 'ez-element-grid', results);
        for (const shape of shapes) {
          addCard(grid, shape.label,
            `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" focusable="false">${shape.svg}</svg>`,
            { type: shape.type, ...(shape.props || {}) });
        }
      }
      if (icons.length) {
        const heading = el('div', 'ez-element-heading', results);
        this.sectionTitle('Icons', heading);
        const styles = el('div', 'ez-icon-styles', heading);
        styles.setAttribute('role', 'group');
        styles.setAttribute('aria-label', 'Icon style');
        for (const variant of ['solid', 'outline']) {
          const button = el('button', 'ez-icon-style' + (style === variant ? ' ez-active' : ''), styles);
          button.type = 'button';
          button.textContent = variant === 'solid' ? 'Solid' : 'Outline';
          button.setAttribute('aria-pressed', String(style === variant));
          button.onclick = () => {
            this.elementIconStyle = variant;
            update();
            results.querySelector(`.ez-icon-style.ez-active`).focus({ preventScroll: true });
          };
        }
        const grid = el('div', 'ez-element-grid', results);
        for (const name of icons) {
          const label = name.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
          const attrs = style === 'outline'
            ? 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"'
            : 'fill="currentColor" fill-rule="evenodd"';
          addCard(grid, label,
            `<svg viewBox="0 0 24 24" ${attrs} aria-hidden="true" focusable="false"><path d="${style === 'outline' ? this.editor.registry.iconOutlines[name] : this.editor.registry.icons[name]}" /></svg>`,
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
    this.panelHeader('Text', 'Add text, then choose a font for your selection.');
    this.sectionTitle('Default text styles');
    const presets = [
      { label: 'Add a heading', size: 72, weight: 700, h: 100 },
      { label: 'Add a subheading', size: 40, weight: 600, h: 60 },
      { label: 'Add body text', size: 24, weight: 400, h: 40 }
    ];
    const styles = el('div', 'ez-text-presets', this.contentEl);
    for (const p of presets) {
      const btn = el('button', 'ez-panel-card ez-text-preset', styles);
      btn.type = 'button';
      btn.style.fontSize = Math.max(14, p.size / 3) + 'px';
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
    const fontList = el('div', 'ez-font-list', this.contentEl);
    for (const font of this.editor.registry.fonts) {
      const btn = el('button', 'ez-panel-card ez-font-item', fontList);
      btn.type = 'button';
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
    const scrollTop = this.contentEl.scrollTop;
    this.contentEl.innerHTML = '';
    this.panelHeader('Uploads', 'Upload images or drag and drop them onto the canvas.');
    const btn = el('button', 'ez-upload-btn', this.contentEl);
    btn.type = 'button';
    btn.innerHTML = `${UI_ICONS.upload}<span>Upload an image</span>`;
    btn.onclick = () => ed.openFilePicker();
    this.sectionTitle('Recent uploads');
    const grid = el('div', 'ez-upload-grid', this.contentEl);
    if (!ed.uploads.length) {
      const empty = el('div', 'ez-empty', grid);
      empty.textContent = 'No uploads yet. Upload an image to get started.';
    }
    for (const up of ed.uploads) {
      const thumb = el('button', 'ez-panel-card ez-upload-thumb', grid);
      thumb.type = 'button';
      thumb.title = up.name;
      thumb.setAttribute('aria-label', `Add ${up.name} to canvas`);
      const img = document.createElement('img');
      img.src = up.src;
      img.alt = up.name;
      thumb.appendChild(img);
      thumb.onclick = () => {
        const el2 = ed.addElement({ type: 'image', src: up.src, name: up.name });
        ed.select([el2.id]);
      };
    }
    for (const source of ed.registry.imageSources || []) {
      this.renderImageSource(source);
    }
    this.contentEl.scrollTop = scrollTop;
  }

  // Renders one registered image source provider: an optional search box
  // plus its result thumbnails. Providers shape their own results.
  renderImageSource(source) {
    const ed = this.editor;
    this.sectionTitle(source.label || source.id);
    if (typeof source.search !== 'function') return;
    const search = el('input', 'ez-input ez-panel-search', this.contentEl);
    search.type = 'search';
    search.placeholder = `Search ${source.label || source.id}…`;
    search.setAttribute('aria-label', `Search ${source.label || source.id} images`);
    const results = el('div', 'ez-upload-grid', this.contentEl);
    const status = el('div', 'ez-empty', this.contentEl);
    status.hidden = true;
    const renderResults = (items) => {
      results.innerHTML = '';
      status.hidden = true;
      if (!items.length) {
        status.textContent = 'No images found.';
        status.hidden = false;
        return;
      }
      for (const item of items) {
        if (!item?.src) continue;
        const name = item.name || 'Image';
        const thumb = el('button', 'ez-panel-card ez-upload-thumb', results);
        thumb.type = 'button';
        thumb.title = name;
        thumb.setAttribute('aria-label', `Add ${name} to canvas`);
        const img = document.createElement('img');
        img.src = item.thumb || item.src;
        img.alt = name;
        img.loading = 'lazy';
        thumb.appendChild(img);
        thumb.onclick = () => {
          const el2 = ed.addElement({ type: 'image', src: item.src, name });
          ed.select([el2.id]);
          ed.registerImage({ src: item.src, name });
        };
      }
    };
    let timer = 0;
    let seq = 0;
    const runSearch = () => {
      const query = search.value.trim();
      const run = ++seq;
      Promise.resolve(source.search(query))
        .then((items) => {
          if (run === seq) renderResults(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          if (run !== seq) return;
          results.innerHTML = '';
          status.textContent = 'Image search failed. Try again.';
          status.hidden = false;
        });
    };
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(runSearch, 250);
    });
    runSearch();
  }

  renderBackground() {
    const ed = this.editor;
    const bg = ed.getPage().background || {};
    this.contentEl.innerHTML = '';
    this.panelHeader('Background', 'Set the mood with a color, gradient, or image.');
    this.sectionTitle('Solid colors');
    // Palette entries are hex strings, or { label, colors } groups for
    // brand kits registered via options.palette / registerPalette().
    for (const group of normalizePalette(ed.registry.palette)) {
      if (group.label) this.sectionTitle(group.label);
      const swatches = el('div', 'ez-swatch-grid', this.contentEl);
      for (const color of group.colors) {
        const sw = el('button', 'ez-swatch', swatches);
        sw.style.background = color;
        if (color === '#ffffff') sw.classList.add('ez-swatch-border');
        sw.title = color;
        sw.onclick = () => ed.setBackground({ type: 'solid', color });
      }
    }
    this.sectionTitle('Gradients');
    const grads = el('div', 'ez-swatch-grid', this.contentEl);
    const gradients = this.editor.registry.gradients;
    for (const g of gradients) {
      const sw = el('button', 'ez-swatch', grads);
      sw.style.background = `linear-gradient(${(g.angle ?? 135) + 90}deg, ${g.from}, ${g.to})`;
      sw.title = `${g.from} → ${g.to}`;
      sw.onclick = () => ed.setBackground({ ...g, type: 'gradient' });
    }
    this.sectionTitle('Custom gradient');
    const gradient = bg.type === 'gradient' ? bg
      : gradients[0] || { from: GRADIENT_FALLBACKS.from, to: GRADIENT_FALLBACKS.to, angle: 135 };
    const gradientRow = el('div', 'ez-bg-gradient-controls', this.contentEl);
    const fields = {};
    for (const [key, label] of [['from', 'Start color'], ['to', 'End color'], ['angle', 'Angle']]) {
      const wrap = el(key === 'angle' ? 'label' : 'div', 'ez-bg-gradient-field', gradientRow);
      el('span', 'ez-num-label', wrap).textContent = label;
      if (key === 'angle') {
        wrap.classList.add('ez-bg-gradient-angle');
        const field = el('input', 'ez-input', wrap);
        field.type = 'number';
        field.setAttribute('aria-label', 'Background gradient angle');
        field.min = 0;
        field.max = 360;
        field.step = 1;
        field.value = gradient.angle ?? 135;
        field.oninput = () => applyGradient(false);
        field.onchange = () => ed.commit();
        fields.angle = field;
      } else {
        fields[key] = colorField(wrap, {
          title: `Background gradient ${label.toLowerCase()}`,
          value: gradient[key] || GRADIENT_FALLBACKS[key],
          onInput: () => applyGradient(false),
          onCommit: () => ed.commit()
        });
      }
    }
    const preview = el('div', 'ez-bg-gradient-preview', this.contentEl);
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
    }
    const apply = el('button', 'ez-btn ez-btn-ghost ez-bg-gradient-apply', this.contentEl);
    apply.type = 'button';
    apply.textContent = 'Apply gradient';
    apply.onclick = () => applyGradient();

    this.sectionTitle('Solid color & image');
    const row = el('div', 'ez-bg-custom', this.contentEl);
    const solidField = colorField(row, {
      title: 'Background solid color',
      value: hexOr(bg.color, '#ffffff'),
      onInput: (value) => ed.setBackground({ type: 'solid', color: value }, false),
      onCommit: () => ed.commit()
    });
    const input = solidField.input;
    const imgBtn = el('button', 'ez-btn ez-btn-ghost ez-grow', row);
    imgBtn.textContent = 'Image background';
    imgBtn.onclick = async () => {
      const file = await ed.pickImageFile();
      if (!file) return;
      const src = await readAsDataURL(file);
      ed.setBackground({ type: 'image', src });
    };
    const rm = el('button', 'ez-btn ez-btn-ghost ez-grow ez-bg-remove', row);
    rm.textContent = 'Remove image';
    rm.onclick = () => ed.setBackground({ type: 'solid', color: '#ffffff' });
    this.syncBackgroundControls = () => {
      const current = ed.getPage().background || {};
      if (current.type === 'gradient') {
        fields.from.value = current.from || GRADIENT_FALLBACKS.from;
        fields.to.value = current.to || GRADIENT_FALLBACKS.to;
        fields.angle.value = current.angle ?? 135;
      }
      if (isHexColor(current.color || '')) solidField.value = current.color;
      rm.style.display = current.type === 'image' ? '' : 'none';
      updatePreview();
    };
    this.syncBackgroundControls();
  }

  renderLayers() {
    const ed = this.editor;
    const scrollTop = this.contentEl.scrollTop;
    this.contentEl.innerHTML = '';
    this.panelHeader('Layers', 'Drag layers to reorder. Top layers appear in front.');
    this.sectionTitle('Page layers');
    const list = el('div', 'ez-layer-list', this.contentEl);
    let draggedId = null;
    const clearDropMarks = () => {
      list.querySelectorAll('.ez-drop-before, .ez-drop-after')
        .forEach(row => row.classList.remove('ez-drop-before', 'ez-drop-after'));
    };
    const endDrag = () => {
      draggedId = null;
      clearDropMarks();
      list.querySelectorAll('.ez-dragging').forEach(row => row.classList.remove('ez-dragging'));
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
      const empty = el('div', 'ez-empty', this.contentEl);
      empty.textContent = 'This page is empty. Add elements from the panels.';
      return;
    }
    for (let i = els.length - 1; i >= 0; i--) {
      const item = els[i];
      const row = el('div', 'ez-layer-item' + (ed.selection.has(item.id) ? ' ez-active' : ''), list);
      row.dataset.id = item.id;
      const handle = el('button', 'ez-layer-drag-handle', row);
      handle.type = 'button';
      handle.textContent = '⠿';
      handle.title = 'Drag to reorder, or use Up/Down arrow keys';
      handle.setAttribute('aria-label', `Reorder ${elementName(item, ed.registry)}. Use Up or Down arrow keys.`);
      handle.draggable = true;
      handle.onkeydown = (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        e.stopPropagation();
        const from = ed.getElements().findIndex(layer => layer.id === item.id);
        ed.moveLayer(from, from + (e.key === 'ArrowUp' ? 1 : -1));
        const movedRow = [...this.contentEl.querySelectorAll('.ez-layer-item')]
          .find(layer => layer.dataset.id === item.id);
        movedRow?.querySelector('.ez-layer-drag-handle').focus({ preventScroll: true });
      };
      row.ondragstart = (e) => {
        draggedId = item.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setDragImage(row, 16, row.offsetHeight / 2);
        requestAnimationFrame(() => {
          if (draggedId === item.id) row.classList.add('ez-dragging');
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
        row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'ez-drop-before' : 'ez-drop-after');
      };
      row.ondragleave = (e) => {
        if (!row.contains(e.relatedTarget)) row.classList.remove('ez-drop-before', 'ez-drop-after');
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
      const icon = UI_ICONS[manifestFor(item.type, ed.registry).layerIcon || 'shapes'];
      const name = el('span', 'ez-layer-name', row);
      name.draggable = true;
      name.title = 'Click to select, or drag to reorder';
      name.innerHTML = `${icon}<span>${escapeHtml(elementName(item, ed.registry))}</span>`;
      name.onclick = () => ed.select([item.id]);
      const btns = el('span', 'ez-layer-actions', row);
      const mkBtn = (html, title, fn, cls = '') => {
        const b = el('button', 'ez-icon-btn ez-sm ' + cls, btns);
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
