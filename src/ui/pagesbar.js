import { el } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';

export class PagesBar {
  constructor(editor) {
    this.editor = editor;
    this.root = editor.pagesBarEl;
    this.dragIndex = null;
    this._unsubs = [
      editor.on('page', () => this.render()),
      editor.on('change', () => this.render())
    ];
    this.render();
  }

  destroy() {
    this._unsubs?.forEach((off) => off());
    this._unsubs = [];
  }

  render() {
    const ed = this.editor;
    this.root.innerHTML = '';
    ed.doc.pages.forEach((page, i) => {
      const chip = el('button', 'sk-page-chip' + (i === ed.pageIndex ? ' sk-active' : ''), this.root);
      chip.innerHTML = `<span class="sk-page-num">${i + 1}</span><span class="sk-page-dim">${page.width}×${page.height}</span>`;
      chip.title = 'Page ' + (i + 1) + ' — drag to reorder';
      chip.draggable = true;
      chip.dataset.index = i;
      chip.onclick = () => ed.goToPage(i);
      chip.ondragstart = (e) => {
        this.dragIndex = i;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i));
        requestAnimationFrame(() => chip.classList.add('sk-dragging'));
      };
      chip.ondragend = () => {
        this.dragIndex = null;
        this._clearDropMarks();
      };
      chip.ondragover = (e) => {
        if (this.dragIndex === null || this.dragIndex === i) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const before = this._dropBefore(e, chip);
        chip.classList.toggle('sk-drop-before', before);
        chip.classList.toggle('sk-drop-after', !before);
      };
      chip.ondragleave = () => chip.classList.remove('sk-drop-before', 'sk-drop-after');
      chip.ondrop = (e) => {
        e.preventDefault();
        const raw = this.dragIndex !== null ? String(this.dragIndex) : e.dataTransfer.getData('text/plain');
        const from = Number(raw);
        if (raw === '' || Number.isNaN(from) || from === i) return;
        const before = this._dropBefore(e, chip);
        ed.movePage(from, from < i ? (before ? i - 1 : i) : (before ? i : i + 1));
      };
    });
    const actions = el('div', 'sk-page-actions', this.root);
    const mk = (icon, title, fn) => {
      const b = el('button', 'sk-icon-btn sk-sm', actions);
      b.innerHTML = icon;
      b.title = title;
      b.onclick = fn;
    };
    mk(UI_ICONS.plus, 'Add page', () => ed.addPage());
    mk(UI_ICONS.duplicate, 'Duplicate page', () => ed.duplicatePage());
    if (ed.doc.pages.length > 1) mk(UI_ICONS.trash, 'Delete page', () => ed.deletePage());
  }

  _dropBefore(e, chip) {
    const rect = chip.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2;
  }

  _clearDropMarks() {
    this.root.querySelectorAll('.sk-drop-before, .sk-drop-after, .sk-dragging')
      .forEach((c) => c.classList.remove('sk-drop-before', 'sk-drop-after', 'sk-dragging'));
  }
}
