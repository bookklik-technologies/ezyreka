import { el, clamp } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';
import { selectionBBox } from '../core/elements.js';

export class Toolbar {
  constructor(editor) {
    this.editor = editor;
    this.root = editor.toolbarEl;
    this.root.classList.add('sk-floating-toolbar');
    this.lastSig = null;
    editor.on('selection', () => (this.lastSig = null));
  }

  selectionSig() {
    const sel = this.editor.getSelected();
    return sel.map((s) => s.id + ':' + s.type).join('|');
  }

  update() {
    const ed = this.editor;
    const sel = ed.getSelected();
    if (!sel.length || ed._editing) {
      this.root.style.display = 'none';
      return;
    }
    const sig = this.selectionSig();
    if (sig !== this.lastSig) {
      this.lastSig = sig;
      this.buildControls(sel);
    }
    this.syncValues(sel);
    this.position(sel);
  }

  position(sel) {
    const ed = this.editor;
    const containerRect = ed.container.getBoundingClientRect();
    const canvasRect = ed.canvas.getBoundingClientRect();
    const bounds = selectionBBox(sel);
    const x = canvasRect.left - containerRect.left + bounds.x * ed.zoom;
    const y = canvasRect.top - containerRect.top + bounds.y * ed.zoom;
    this.root.style.display = 'flex';
    const tw = this.root.offsetWidth;
    const th = this.root.offsetHeight;
    const left = clamp(x, 8, containerRect.width - tw - 8);
    // The rotate handle extends 34 CSS pixels beyond the selection.
    const gap = 48;
    const above = y - th - gap;
    const below = y + bounds.h * ed.zoom + gap;
    const maxTop = Math.max(8, containerRect.height - th - 8);
    const top = clamp(above < 8 && below <= maxTop ? below : above, 8, maxTop);
    this.root.style.left = left + 'px';
    this.root.style.top = top + 'px';
  }

  buildControls(sel) {
    const ed = this.editor;
    this.root.innerHTML = '';
    const first = sel[0];
    const allText = sel.every((s) => s.type === 'text');
    const isLine = sel.every((s) => s.type === 'line');

    if (allText) {
      const fontSel = el('select', 'sk-input sk-font-select', this.root);
      for (const f of ['Poppins', 'Inter', 'Montserrat', 'Playfair Display', 'Lobster', 'Bebas Neue', 'Rubik', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact'])
        fontSel.innerHTML += `<option>${f}</option>`;
      fontSel.value = first.fontFamily;
      this.bind(fontSel, 'fontFamily', (n) => n.value);

      this.numInput('Size', first.fontSize, 4, 800, (v) => ({ fontSize: v }));

      const mkToggle = (icon, prop, title) => {
        const b = el('button', 'sk-tool-toggle', this.root);
        b.innerHTML = icon;
        b.title = title;
        b.dataset.prop = prop;
        b.onclick = () => ed.updateSelected({ [prop]: !first[prop] });
      };
      mkToggle(UI_ICONS.bold, 'fontWeight', 'Bold');
      mkToggle(UI_ICONS.italic, 'italic', 'Italic');
      mkToggle(UI_ICONS.underline, 'underline', 'Underline');

      const alignBtn = el('button', 'sk-tool-toggle', this.root);
      alignBtn.title = 'Alignment';
      alignBtn.dataset.prop = 'align';
      alignBtn.onclick = () => {
        const order = ['left', 'center', 'right'];
        const next = order[(order.indexOf(first.align) + 1) % 3];
        ed.updateSelected({ align: next });
      };

      this.colorInput('Text color', first.color, 'color');
    }

    if (!allText && !isLine && first.fill !== undefined) {
      this.colorInput('Fill', first.fill, 'fill');
      if (first.stroke !== undefined && first.type !== 'image') {
        this.colorInput('Stroke', first.stroke || '#000000', 'stroke');
        this.numInput('Stroke', first.strokeWidth || 0, 0, 100, (v) => ({ strokeWidth: v }));
      }
      if (first.type === 'rect') {
        this.numInput('Radius', first.radius || 0, 0, 400, (v) => ({ radius: v }));
      }
    }
    if (isLine) {
      this.colorInput('Color', first.stroke, 'stroke');
      this.numInput('Width', first.strokeWidth, 1, 100, (v) => ({ strokeWidth: v }));
      const arrowBtn = el('button', 'sk-tool-toggle', this.root);
      arrowBtn.textContent = '⟶';
      arrowBtn.title = 'Arrow head';
      arrowBtn.dataset.prop = 'arrow';
      arrowBtn.onclick = () => ed.updateSelected({ arrow: !first.arrow });
    }
    if (sel.every(s => s.type === 'icon')) {
      const style = el('select', 'sk-input', this.root);
      style.setAttribute('aria-label', 'Icon style');
      style.innerHTML = '<option value="solid">Solid</option><option value="outline">Outline</option>';
      style.value = first.iconStyle || 'solid';
      this.bind(style, 'iconStyle');
    }
    if (first.type !== 'line') {
      this.numInput('Opacity', Math.round((first.opacity ?? 1) * 100), 0, 100, (v) => ({ opacity: v / 100 }));
    }

    const actions = el('div', 'sk-toolbar-sep-actions', this.root);
    const mk = (icon, title, fn) => {
      const b = el('button', 'sk-icon-btn sk-sm', actions);
      b.innerHTML = icon;
      b.title = title;
      b.onclick = fn;
    };
    mk(UI_ICONS.duplicate, 'Duplicate (Ctrl+D)', () => ed.duplicateSelected());
    mk(UI_ICONS.front, 'Bring to front', () => ed.bringToFront());
    mk(UI_ICONS.back, 'Send to back', () => ed.sendToBack());
    mk(
      sel.some((s) => s.locked) ? UI_ICONS.unlock : UI_ICONS.lock,
      sel.some((s) => s.locked) ? 'Unlock' : 'Lock',
      () => ed.toggleLock()
    );
    mk(UI_ICONS.trash, 'Delete (Del)', () => ed.deleteSelected());
  }

  syncValues(sel) {
    const first = sel[0];
    this.root.querySelectorAll('[data-prop]').forEach((btn) => {
      const prop = btn.dataset.prop;
      let active = false;
      if (prop === 'fontWeight') active = first.fontWeight >= 600;
      else if (prop === 'align') {
        btn.innerHTML =
          first.align === 'center'
            ? UI_ICONS.alignCenter
            : first.align === 'right'
              ? UI_ICONS.alignRight
              : UI_ICONS.alignLeft;
      } else active = !!first[prop];
      btn.classList.toggle('sk-active', active);
    });
    this.root.querySelectorAll('input[data-bind], select[data-bind]').forEach((input) => {
      const prop = input.dataset.bind;
      let v = first[prop];
      if (prop === 'stroke') v = v || '#000000';
      if (prop === 'iconStyle') v = v || 'solid';
      if (prop === 'opacity') v = Math.round((v ?? 1) * 100);
      if (document.activeElement !== input) input.value = v ?? '';
    });
  }

  bind(input, prop, getter = (n) => n.value) {
    input.dataset.bind = prop;
    input.addEventListener('input', () => {
      const value = getter(input);
      if (value !== undefined && value !== null && !Number.isNaN(value)) {
        this.editor.updateSelected({ [prop]: value }, false);
      }
    });
    input.addEventListener('change', () => this.editor.commit());
  }

  colorInput(title, value, prop) {
    const ed = this.editor;
    const wrap = el('label', 'sk-color-wrap', this.root);
    wrap.title = title;
    const input = el('input', 'sk-color-input', wrap);
    input.type = 'color';
    input.value = /^#([0-9a-f]{6})$/i.test(value || '') ? value : '#000000';
    this.bind(input, prop, (n) => n.value);
  }

  numInput(label, value, min, max, mapper) {
    const ed = this.editor;
    const wrap = el('label', 'sk-num-wrap', this.root);
    const span = el('span', 'sk-num-label', wrap);
    span.textContent = label;
    const input = el('input', 'sk-input sk-num-input', wrap);
    input.type = 'number';
    input.min = min;
    input.max = max;
    input.value = value;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      if (!Number.isNaN(v)) {
        this.editor.updateSelected(mapper(v), false);
      }
    });
    input.addEventListener('change', () => this.editor.commit());
  }
}
