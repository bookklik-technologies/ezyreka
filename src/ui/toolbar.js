import { el, clamp, hexOr } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';
import { selectionBBox, manifestFor } from '../core/elements.js';
import { colorField } from './colorfield.js';
import { ACCENT, GRADIENT_FALLBACKS } from '../core/constants.js';

export class Toolbar {
  constructor(editor) {
    this.editor = editor;
    this.root = editor.toolbarEl;
    this.root.classList.add('ez-floating-toolbar');
    this.lastSig = null;
    this._unsubs = [editor.on('selection', () => (this.lastSig = null))];
  }

  destroy() {
    this._unsubs?.forEach((off) => off());
    this._unsubs = [];
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
    this.fillControls = null;
    const first = sel[0];
    // Control groups come from each type's capability manifest; a group shows
    // only when every selected element's type supports it.
    const groups = ['chartEdit', 'text', 'fill', 'line', 'iconStyle', 'opacity'];
    const common = groups.filter((group) =>
      sel.every((s) => manifestFor(s.type).toolbar?.includes(group)));
    if (common.includes('chartEdit') && sel.length === 1) {
      const edit = el('button', 'ez-btn ez-btn-ghost', this.root);
      edit.textContent = 'Edit chart';
      edit.onclick = () => ed.ui.sidepanel?.charts?.open();
    }

    if (common.includes('text')) {
      const fontSel = el('select', 'ez-input ez-font-select', this.root);
      for (const f of ed.registry.fonts)
        fontSel.innerHTML += `<option>${f}</option>`;
      fontSel.value = first.fontFamily;
      this.bind(fontSel, 'fontFamily', (n) => n.value);

      this.numInput('Size', first.fontSize, 4, 800, (v) => ({ fontSize: v }));

      const mkToggle = (icon, prop, title) => {
        const b = el('button', 'ez-tool-toggle', this.root);
        b.innerHTML = icon;
        b.title = title;
        b.dataset.prop = prop;
        b.onclick = () => ed.updateSelected({ [prop]: !first[prop] });
      };
      mkToggle(UI_ICONS.bold, 'fontWeight', 'Bold');
      mkToggle(UI_ICONS.italic, 'italic', 'Italic');
      mkToggle(UI_ICONS.underline, 'underline', 'Underline');

      const alignBtn = el('button', 'ez-tool-toggle', this.root);
      alignBtn.title = 'Alignment';
      alignBtn.dataset.prop = 'align';
      alignBtn.onclick = () => {
        const order = ['left', 'center', 'right'];
        const next = order[(order.indexOf(first.align) + 1) % 3];
        ed.updateSelected({ align: next });
      };

      this.colorInput('Text color', first.color, 'color');
    }

    if (common.includes('fill')) {
      this.fillInput();
      if (first.stroke !== undefined && first.type !== 'image') {
        this.colorInput('Stroke', first.stroke || '#000000', 'stroke');
        this.numInput('Stroke', first.strokeWidth || 0, 0, 100, (v) => ({ strokeWidth: v }));
      }
      if (manifestFor(first.type).radius) {
        this.numInput('Radius', first.radius || 0, 0, 400, (v) => ({ radius: v }));
      }
    }
    if (common.includes('line')) {
      this.colorInput('Color', first.stroke, 'stroke');
      this.numInput('Width', first.strokeWidth, 1, 100, (v) => ({ strokeWidth: v }));
      const arrowBtn = el('button', 'ez-tool-toggle', this.root);
      arrowBtn.textContent = '⟶';
      arrowBtn.title = 'Arrow head';
      arrowBtn.dataset.prop = 'arrow';
      arrowBtn.onclick = () => ed.updateSelected({ arrow: !first.arrow });
    }
    if (common.includes('iconStyle')) {
      const style = el('select', 'ez-input', this.root);
      style.setAttribute('aria-label', 'Icon style');
      style.innerHTML = '<option value="solid">Solid</option><option value="outline">Outline</option>';
      style.value = first.iconStyle || 'solid';
      this.bind(style, 'iconStyle');
    }
    if (common.includes('opacity')) {
      this.numInput('Opacity', Math.round((first.opacity ?? 1) * 100), 0, 100, (v) => ({ opacity: v / 100 }));
    }

    const actions = el('div', 'ez-toolbar-sep-actions', this.root);
    const mk = (icon, title, fn) => {
      const b = el('button', 'ez-icon-btn ez-sm', actions);
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
    this.syncFill(first.fill);
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
      btn.classList.toggle('ez-active', active);
    });
    this.root.querySelectorAll('input[data-bind], select[data-bind]').forEach((input) => {
      const prop = input.dataset.bind;
      let v = first[prop];
      if (prop === 'stroke') v = v || '#000000';
      if (prop === 'iconStyle') v = v || 'solid';
      if (prop === 'opacity') v = Math.round((v ?? 1) * 100);
      if (document.activeElement !== input) input.value = v ?? '';
    });
    // Keep hex companions of bound color inputs in sync with the same values.
    this.root.querySelectorAll('input[data-hex-for]').forEach((hex) => {
      if (document.activeElement === hex) return;
      const target = this.root.querySelector(`[data-bind="${hex.dataset.hexFor}"]`);
      if (target) hex.value = target.value;
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

  fillInput() {
    const ed = this.editor;
    const wrap = el('label', 'ez-num-wrap', this.root);
    el('span', 'ez-num-label', wrap).textContent = 'Fill';
    const mode = el('select', 'ez-input', wrap);
    mode.setAttribute('aria-label', 'Fill type');
    mode.innerHTML = '<option value="solid">Solid</option><option value="gradient">Gradient</option><option value="none">None</option>';
    mode.onchange = () => {
      const fill = ed.getSelected()[0]?.fill;
      const color = fill?.type === 'gradient' ? fill.from : fill;
      const from = color && color !== 'none' ? color : ACCENT;
      ed.updateSelected({ fill: mode.value === 'gradient'
        ? { type: 'gradient', from, to: '#ffffff', angle: 135 }
        : mode.value === 'none' ? 'none' : from });
    };

    const colors = {};
    for (const [key, title] of [['solid', 'Fill color'], ['from', 'Gradient start color'], ['to', 'Gradient end color']]) {
      const field = colorField(this.root, {
        title,
        value: '#000000',
        onInput: (value) => {
          const fill = ed.getSelected()[0]?.fill;
          if (key === 'solid') ed.updateSelected({ fill: value }, false);
          else if (fill?.type === 'gradient') ed.updateSelected({ fill: { ...fill, [key]: value } }, false);
        },
        onCommit: () => ed.commit()
      });
      colors[key] = { label: field.group, input: field.input, field };
    }
    const angleWrap = el('label', 'ez-num-wrap', this.root);
    el('span', 'ez-num-label', angleWrap).textContent = 'Angle';
    const angle = el('input', 'ez-input ez-num-input', angleWrap);
    angle.type = 'number';
    angle.min = 0;
    angle.max = 360;
    angle.step = 1;
    angle.setAttribute('aria-label', 'Gradient angle');
    angle.oninput = () => {
      const fill = ed.getSelected()[0]?.fill;
      const value = angle.valueAsNumber;
      if (fill?.type === 'gradient' && Number.isFinite(value)) {
        ed.updateSelected({ fill: { ...fill, angle: clamp(value, 0, 360) } }, false);
      }
    };
    angle.onchange = () => ed.commit();
    this.fillControls = { mode, colors, angleWrap, angle };
  }

  syncFill(fill) {
    if (!this.fillControls) return;
    const { mode, colors, angleWrap, angle } = this.fillControls;
    const gradient = fill?.type === 'gradient';
    mode.value = gradient ? 'gradient' : fill === 'none' ? 'none' : 'solid';
    for (const [key, { label, input, field }] of Object.entries(colors)) {
      label.style.display = (key === 'solid' ? !gradient && fill !== 'none' : gradient) ? '' : 'none';
      const color = key === 'solid' ? fill : fill?.[key] || GRADIENT_FALLBACKS[key];
      if (document.activeElement !== input) input.value = hexOr(color, '#000000');
      if (document.activeElement !== field.hex) field.hex.value = hexOr(color, '#000000');
    }
    angleWrap.style.display = gradient ? '' : 'none';
    if (document.activeElement !== angle) angle.value = gradient ? fill.angle ?? 135 : 135;
  }

  colorInput(title, value, prop) {
    const ed = this.editor;
    const field = colorField(this.root, {
      title,
      value: hexOr(value, '#000000'),
      onInput: (next) => ed.updateSelected({ [prop]: next }, false),
      onCommit: () => ed.commit()
    });
    field.input.dataset.bind = prop;
    field.hex.dataset.hexFor = prop;
  }

  numInput(label, value, min, max, mapper) {
    const ed = this.editor;
    const wrap = el('label', 'ez-num-wrap', this.root);
    const span = el('span', 'ez-num-label', wrap);
    span.textContent = label;
    const input = el('input', 'ez-input ez-num-input', wrap);
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
