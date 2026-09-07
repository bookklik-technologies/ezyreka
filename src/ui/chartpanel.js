import { el, uid } from '../core/utils.js';
import { chartPresetList, sampleChart, normalizeChart, validateChart, parseChartValue, pasteChartData, chartColor, isCircularChart, isMultiSeriesChart } from '../core/charts.js';
import { drawChart } from '../core/chart-renderer.js';

export class ChartPanel {
  constructor(sidepanel) {
    this.sidepanel = sidepanel;
    this.editor = sidepanel.editor;
    this.bindings = [];
    this.gallery = false;
    this.key = null;
    this._unsubs = ['selection', 'change', 'page'].map(event => this.editor.on(event, () => {
      const target = this.target();
      if (event === 'page' || target?.id !== this.lastId) this.gallery = false;
      this.lastId = target?.id;
      this.refresh();
    }));
  }

  destroy() {
    this._unsubs?.forEach((off) => off());
    this._unsubs = [];
  }

  target(id) {
    const selection = this.editor.getSelected();
    return selection.length === 1 && selection[0].type === 'chart' && (!id || selection[0].id === id) ? selection[0] : null;
  }

  open() {
    if (!this.target()) return;
    this.gallery = false;
    this.key = null;
    this.sidepanel.setTab('charts');
    this.refresh();
  }

  refresh() {
    if (this.dialog) {
      const target = this.target(this.dialogId);
      if (!target || target.hidden) this.dialog.close();
      else {
        const key = `${target.id}:${target.locked}:${target.chart.categories.length}:${target.chart.series.length}`;
        if (key !== this.dialogKey) { this.dialogKey = key; this.renderModalTable(); }
      }
    }
    if (this.sidepanel.activeTab === 'charts') {
      const target = this.target();
      const key = this.gallery || !target ? 'gallery' : `${target.id}:${target.locked}:${target.chart.type}:${target.chart.categories.length}:${target.chart.series.length}`;
      if (key !== this.key) this.render();
    }
    this.bindings = this.bindings.filter(binding => binding.input.isConnected);
    for (const { input, id, read } of this.bindings) {
      const target = this.target(id);
      if (!target || input === document.activeElement) continue;
      if (input.type === 'checkbox') input.checked = !!read(target.chart);
      else input.value = read(target.chart) ?? '';
      input.removeAttribute('aria-invalid');
    }
  }

  button(parent, label, action, className = 'ez-btn ez-btn-ghost') {
    const button = el('button', className, parent);
    button.type = 'button'; button.textContent = label; button.onclick = action;
    return button;
  }

  error(message) {
    const root = this.dialog || this.sidepanel.contentEl;
    const error = root.querySelector('.ez-chart-error');
    if (error) { error.textContent = message; error.hidden = !message; }
  }

  apply(id, mutate, control) {
    const target = this.target(id);
    if (!target || target.locked) return;
    try {
      const registry = this.editor.registry;
      const next = normalizeChart(target.chart, registry);
      const result = normalizeChart(mutate(next) || next, registry);
      validateChart(result, registry);
      control?.removeAttribute('aria-invalid');
      const binding = this.bindings.find(b => b.input === control);
      if (binding) {
        if (control.type === 'checkbox') control.checked = !!binding.read(result);
        else control.value = binding.read(result) ?? '';
      }
      this.error('');
      if (JSON.stringify(result) !== JSON.stringify(target.chart)) this.editor.updateSelected({ chart: result });
    } catch (error) {
      if (control?.tagName === 'SELECT') {
        const binding = this.bindings.find(b => b.input === control);
        if (binding) control.value = binding.read(target.chart);
      }
      control?.setAttribute('aria-invalid', 'true');
      this.error(error.message);
    }
  }

  bind(input, target, read, write) {
    input.disabled = !!target.locked;
    if (input.type === 'checkbox') input.checked = !!read(target.chart);
    else input.value = read(target.chart) ?? '';
    input.onchange = () => this.apply(target.id, chart => write(chart, input), input);
    this.bindings.push({ input, id: target.id, read });
  }

  render() {
    const root = this.sidepanel.contentEl;
    root.innerHTML = '';
    this.bindings = this.bindings.filter(binding => binding.input.isConnected);
    const target = this.target();
    if (this.gallery || !target) {
      this.key = 'gallery';
      this.renderGallery(root);
      return;
    }
    this.key = `${target.id}:${target.locked}:${target.chart.type}:${target.chart.categories.length}:${target.chart.series.length}`;
    this.sidepanel.panelHeader('Charts', 'Edit your chart with data, labels, and colors.');
    this.button(root, 'Back to charts', () => { this.gallery = true; this.render(); }, 'ez-btn ez-btn-ghost ez-panel-action');
    if (target.locked) el('p', 'ez-chart-note', root).textContent = 'This chart is locked. Unlock it in Layers to edit.';
    const error = el('p', 'ez-chart-error', root);
    error.setAttribute('role', 'alert'); error.hidden = true;
    const tabs = el('div', 'ez-panel-filters ez-chart-editor-tabs', root);
    for (const tab of ['Data', 'Style']) {
      const active = (this.section || 'Data') === tab;
      const button = this.button(tabs, tab, () => { this.section = tab; this.render(); }, 'ez-panel-filter');
      button.classList.toggle('ez-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    if (this.section === 'Style') this.renderStyle(root, target);
    else {
      el('p', 'ez-chart-note', root).textContent = 'Edit cells or paste a table from a spreadsheet. Paste into the Category header to include column headers.';
      this.renderTable(root, target);
      this.button(root, 'Expand data table', () => this.expand(), 'ez-btn ez-btn-ghost ez-chart-expand');
    }
  }

  renderGallery(root) {
    this.sidepanel.panelHeader('Charts', 'Choose a chart, then make it yours with data and colors.');
    if (this.target()) this.button(root, 'Edit selected chart', () => this.open(), 'ez-btn ez-btn-ghost ez-panel-action');
    const presets = chartPresetList(this.editor.registry);
    for (const group of [...new Set(presets.map(p => p.group))]) {
      this.sidepanel.sectionTitle(group, root);
      const grid = el('div', 'ez-chart-gallery', root);
      for (const preset of presets.filter(p => p.group === group)) {
        const button = this.button(grid, '', () => {
          const item = this.editor.addElement({ type: 'chart', chart: sampleChart(preset.type, this.editor.registry) });
          this.editor.select([item.id]);
          this.section = 'Data'; this.open();
        }, 'ez-panel-card ez-chart-card');
        button.setAttribute('aria-label', `Add ${preset.label} chart`);
        const canvas = el('canvas', '', button);
        canvas.width = 240; canvas.height = 170; canvas.setAttribute('aria-hidden', 'true');
        const chart = sampleChart(preset.type, this.editor.registry);
        Object.assign(chart, { showAxes: false, showGrid: false, showLegend: false });
        drawChart(canvas.getContext('2d'), { chart, w: canvas.width, h: canvas.height }, this.editor.registry);
        el('span', '', button).textContent = preset.label;
      }
    }
  }

  renderTable(root, target) {
    const wrap = el('div', 'ez-chart-table-wrap', root);
    const table = el('table', 'ez-chart-table', wrap);
    table.setAttribute('aria-label', 'Chart data');
    const head = el('thead', '', table), header = el('tr', '', head);
    const cell = (parent, row, column, read, write) => {
      const container = el(row === 0 ? 'th' : 'td', '', parent);
      if (row === 0) container.scope = 'col';
      const input = el('input', 'ez-input', container);
      input.type = 'text';
      if (row > 0 && column > 0) input.inputMode = 'decimal';
      input.dataset.row = row; input.dataset.column = column;
      input.setAttribute('aria-label', row === 0 ? column === 0 ? 'Category header, paste table here' : `Series ${column} name`
        : column === 0 ? `Category ${row}` : `Row ${row}, series ${column} value`);
      this.bind(input, target, read, write);
      if (row === 0 && column === 0) input.readOnly = true;
      input.onpaste = (e) => {
        if (this.target(target.id)?.locked) return;
        const text = e.clipboardData?.getData('text/plain');
        if (text === undefined) return;
        e.preventDefault();
        this.apply(target.id, chart => pasteChartData(chart, text, row, column, this.editor.registry), input);
      };
      return container;
    };
    cell(header, 0, 0, () => 'Category', () => {});
    target.chart.series.forEach((s, i) => {
      const th = cell(header, 0, i + 1, c => c.series[i]?.name, (c, input) => { c.series[i].name = input.value; });
      const remove = this.button(th, 'Remove', () => this.apply(target.id, c => { c.series.splice(i, 1); }), 'ez-chart-remove');
      remove.setAttribute('aria-label', `Remove series ${i + 1}`); remove.disabled = !!target.locked;
    });
    el('th', '', header).textContent = '';
    const body = el('tbody', '', table);
    target.chart.categories.forEach((label, i) => {
      const row = el('tr', '', body);
      cell(row, i + 1, 0, c => c.categories[i], (c, input) => { c.categories[i] = input.value; });
      target.chart.series.forEach((s, j) => cell(row, i + 1, j + 1, c => c.series[j]?.values[i], (c, input) => { c.series[j].values[i] = parseChartValue(input.value); }));
      const remove = this.button(el('td', '', row), 'Remove', () => this.apply(target.id, c => {
        c.categories.splice(i, 1); c.categoryColors.splice(i, 1); c.series.forEach(s => s.values.splice(i, 1));
      }), 'ez-chart-remove');
      remove.setAttribute('aria-label', `Remove category ${i + 1}`); remove.disabled = !!target.locked;
    });
    const actions = el('div', 'ez-chart-data-actions', root);
    this.button(actions, 'Add row', () => this.apply(target.id, c => {
      c.categoryColors.push(chartColor(c.categories.length)); c.categories.push(`Item ${c.categories.length + 1}`); c.series.forEach(s => s.values.push(null));
    })).disabled = !!target.locked;
    this.button(actions, 'Add series', () => this.apply(target.id, c => {
      c.series.push({ name: `Series ${c.series.length + 1}`, color: chartColor(c.series.length), values: c.categories.map(() => null) });
    })).disabled = !!target.locked;
  }

  renderStyle(root, target) {
    const chart = target.chart;
    const field = (label, type, read, write) => {
      const wrap = el('label', 'ez-chart-style-field', root);
      el('span', '', wrap).textContent = label;
      const input = el(type === 'select' ? 'select' : 'input', 'ez-input', wrap);
      if (type !== 'select') input.type = type;
      input.setAttribute('aria-label', label);
      this.bind(input, target, read, write);
      return input;
    };
    const type = field('Chart type', 'select', c => c.type, (c, input) => { c.type = input.value; });
    chartPresetList(this.editor.registry).forEach(p => { const option = el('option', '', type); option.value = p.type; option.textContent = p.label; });
    type.value = chart.type;
    if (!isMultiSeriesChart(chart.type, this.editor.registry) && chart.series.length > 1) {
      el('p', 'ez-chart-note', root).textContent = 'This chart displays the first series. Additional series are kept when switching chart types.';
    }
    field('Title', 'text', c => c.title, (c, input) => { c.title = input.value; });
    for (const [key, label] of [['showLegend', 'Legend'], ['showValues', 'Value labels'], ...(!isCircularChart(chart.type, this.editor.registry) ? [['showAxes', 'Axes'], ['showGrid', 'Gridlines']] : [])]) {
      field(label, 'checkbox', c => c[key], (c, input) => { c[key] = input.checked; });
    }
    const size = field('Text size', 'number', c => c.fontSize, (c, input) => {
      if (!Number.isFinite(input.valueAsNumber) || input.valueAsNumber < 8 || input.valueAsNumber > 72) throw new Error('Text size must be from 8 to 72 pixels.');
      c.fontSize = input.valueAsNumber;
    });
    size.min = 8; size.max = 72;
    field('Text color', 'color', c => c.textColor, (c, input) => { c.textColor = input.value; });
    if (isCircularChart(chart.type, this.editor.registry)) chart.categories.forEach((name, i) => {
      field(`${name || `Category ${i + 1}`} color`, 'color', c => c.categoryColors[i], (c, input) => { c.categoryColors[i] = input.value; });
    });
    else (isMultiSeriesChart(chart.type, this.editor.registry) ? chart.series : chart.series.slice(0, 1)).forEach((s, i) => {
      field(`${s.name || `Series ${i + 1}`} color`, 'color', c => c.series[i]?.color, (c, input) => { c.series[i].color = input.value; });
    });
  }

  expand() {
    const target = this.target();
    if (!target || this.dialog) return;
    const dialog = el('dialog', 'ez-chart-dialog', this.editor.container);
    this.dialog = dialog; this.dialogId = target.id;
    const title = el('h2', '', dialog); title.id = uid('chart-data'); title.textContent = 'Chart data';
    dialog.setAttribute('aria-labelledby', title.id);
    const error = el('p', 'ez-chart-error', dialog); error.setAttribute('role', 'alert'); error.hidden = true;
    this.modalTable = el('div', '', dialog);
    this.button(dialog, 'Done', () => dialog.close(), 'ez-btn ez-btn-primary ez-chart-done');
    dialog.addEventListener('keydown', e => e.stopPropagation());
    dialog.addEventListener('close', () => {
      dialog.remove(); this.dialog = null; this.dialogKey = null;
      this.refresh();
      this.sidepanel.contentEl.querySelector('.ez-chart-expand')?.focus();
    });
    this.renderModalTable();
    dialog.showModal();
  }

  renderModalTable() {
    const target = this.target(this.dialogId);
    if (!target) return;
    this.dialogKey = `${target.id}:${target.locked}:${target.chart.categories.length}:${target.chart.series.length}`;
    this.modalTable.innerHTML = '';
    this.bindings = this.bindings.filter(binding => binding.input.isConnected);
    this.renderTable(this.modalTable, target);
  }
}
