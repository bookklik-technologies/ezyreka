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
      const chip = el('button', 'ez-page-chip' + (i === ed.pageIndex ? ' ez-active' : ''), this.root);
      chip.innerHTML = `<span class="ez-page-num">${i + 1}</span><span class="ez-page-dim">${page.width}×${page.height}</span>`;
      chip.title = 'Page ' + (i + 1) + ' — drag to reorder';
      chip.draggable = true;
      chip.dataset.index = i;
      chip.onclick = () => ed.goToPage(i);
      chip.ondragstart = (e) => {
        this.dragIndex = i;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i));
        requestAnimationFrame(() => chip.classList.add('ez-dragging'));
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
        chip.classList.toggle('ez-drop-before', before);
        chip.classList.toggle('ez-drop-after', !before);
      };
      chip.ondragleave = () => chip.classList.remove('ez-drop-before', 'ez-drop-after');
      chip.ondrop = (e) => {
        e.preventDefault();
        const raw = this.dragIndex !== null ? String(this.dragIndex) : e.dataTransfer.getData('text/plain');
        const from = Number(raw);
        if (raw === '' || Number.isNaN(from) || from === i) return;
        const before = this._dropBefore(e, chip);
        ed.movePage(from, from < i ? (before ? i - 1 : i) : (before ? i : i + 1));
      };
    });
    const actions = el('div', 'ez-page-actions', this.root);
    const mk = (icon, title, fn) => {
      const b = el('button', 'ez-icon-btn ez-sm', actions);
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
    this.root.querySelectorAll('.ez-drop-before, .ez-drop-after, .ez-dragging')
      .forEach((c) => c.classList.remove('ez-drop-before', 'ez-drop-after', 'ez-dragging'));
  }
}
