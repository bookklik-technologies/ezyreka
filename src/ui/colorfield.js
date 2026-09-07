import { el, normalizeHexColor } from '../core/utils.js';

// Native color picker paired with a hex text field. Both stay in sync;
// 3-digit hex is expanded. `bare` skips the outer group container (for
// layouts that already provide one) and uses a span swatch so labels
// are never nested.
export function colorField(parent, { title = 'Color', value = '#000000', onInput, onCommit, bare = false } = {}) {
  const group = bare ? parent : el('span', 'sk-color-field', parent);
  const wrap = el(bare ? 'span' : 'label', 'sk-color-wrap', group);
  wrap.title = title;
  const input = el('input', 'sk-color-input', wrap);
  input.type = 'color';
  input.setAttribute('aria-label', title);
  const hex = el('input', 'sk-input sk-hex-input', group);
  hex.type = 'text';
  hex.spellcheck = false;
  hex.maxLength = 7;
  hex.placeholder = '#hex';
  hex.setAttribute('aria-label', `${title} hex value`);
  let current = normalizeHexColor(value) || '#000000';
  const apply = (next) => {
    current = normalizeHexColor(next) || current;
    wrap.style.backgroundColor = current;
    if (document.activeElement !== input) input.value = current;
    if (document.activeElement !== hex) hex.value = current;
  };
  input.addEventListener('input', () => {
    current = input.value;
    wrap.style.backgroundColor = current;
    if (document.activeElement !== hex) hex.value = current;
    onInput?.(current);
  });
  input.addEventListener('change', () => onCommit?.());
  hex.addEventListener('input', () => {
    const normalized = normalizeHexColor(hex.value.trim());
    if (normalized) {
      current = normalized;
      wrap.style.backgroundColor = current;
      if (document.activeElement !== input) input.value = normalized;
      onInput?.(normalized);
    }
  });
  hex.addEventListener('change', () => {
    hex.value = current;
    onCommit?.();
  });
  apply(value);
  return {
    group,
    wrap,
    input,
    hex,
    set: apply,
    get value() {
      return current;
    },
    set value(next) {
      apply(next);
    }
  };
}
