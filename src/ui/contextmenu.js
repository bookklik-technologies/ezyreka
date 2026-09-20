import { el, setSvg } from '../core/utils.js';

export function showMenu(editor, clientX, clientY, items) {
  closeMenus(editor);
  const container = editor.container;
  const rect = container.getBoundingClientRect();
  const menu = el('div', 'ez-menu', container);
  for (const item of items) {
    if (item === '-') {
      el('div', 'ez-menu-sep', menu);
      continue;
    }
    const row = el('div', 'ez-menu-item' + (item.danger ? ' ez-danger' : ''), menu);
    if (item.icon) setSvg(row, item.icon);
    const labelSpan = el('span', '', row);
    labelSpan.textContent = item.label;
    if (item.shortcut) {
      const sc = el('span', 'ez-menu-shortcut', row);
      sc.textContent = item.shortcut;
    }
    if (item.disabled) {
      row.classList.add('ez-disabled');
    } else {
      row.addEventListener('click', () => {
        closeMenus(editor);
        item.action?.();
      });
    }
  }
  menu.style.left = '0px';
  menu.style.top = '0px';
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  menu.style.left = clampNum(clientX - rect.left, 4, rect.width - mw - 4) + 'px';
  menu.style.top = clampNum(clientY - rect.top, 4, rect.height - mh - 4) + 'px';
  editor._openMenu = menu;
  const closer = (ev) => {
    if (!menu.contains(ev.target)) {
      closeMenus(editor);
    }
  };
  setTimeout(() => {
    if (editor._openMenu === menu) {
      editor._menuCloser = closer;
      window.addEventListener('pointerdown', closer, true);
    }
  }, 0);
  return menu;
}

export function closeMenus(editor) {
  if (editor._menuCloser) {
    window.removeEventListener('pointerdown', editor._menuCloser, true);
    editor._menuCloser = null;
  }
  if (editor._openMenu) {
    editor._openMenu.remove();
    editor._openMenu = null;
  }
}

function clampNum(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class ContextMenu {
  constructor(editor) {
    this.editor = editor;
    editor.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const p = editor.interactions.clientToWorld(e);
      const els = editor.getElements();
      let hit = null;
      for (let i = els.length - 1; i >= 0; i--) {
        if (editor.hitTestElement(els[i], p.x, p.y)) {
          hit = els[i];
          break;
        }
      }
      if (hit && !editor.selection.has(hit.id)) editor.select([hit.id]);
      const has = editor.selection.size > 0;
      const items = [];
      if (has) {
        items.push(
          { label: 'Copy', shortcut: 'Ctrl+C', action: () => editor.copy() },
          { label: 'Paste', shortcut: 'Ctrl+V', action: () => editor.paste() },
          { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => editor.duplicateSelected() },
          { label: 'Delete', shortcut: 'Del', danger: true, action: () => editor.deleteSelected() },
          '-',
          { label: 'Bring to front', action: () => editor.bringToFront() },
          { label: 'Bring forward', action: () => editor.bringForward() },
          { label: 'Send backward', action: () => editor.sendBackward() },
          { label: 'Send to back', action: () => editor.sendToBack() },
          '-',
          { label: 'Flip horizontal', action: () => editor.updateSelected({ flipX: !editor.getSelected()[0].flipX }) },
          { label: 'Flip vertical', action: () => editor.updateSelected({ flipY: !editor.getSelected()[0].flipY }) },
          {
            label: editor.getSelected().some((s) => s.locked) ? 'Unlock' : 'Lock',
            action: () => editor.toggleLock()
          }
        );
      } else {
        items.push(
          { label: 'Paste', shortcut: 'Ctrl+V', disabled: !editor.clipboard.length, action: () => editor.paste() },
          '-',
          { label: 'Select all', shortcut: 'Ctrl+A', action: () => editor.selectAll() }
        );
      }
      showMenu(editor, e.clientX, e.clientY, items);
    });
  }
}
