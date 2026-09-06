import { el } from '../core/utils.js';
import { UI_ICONS } from '../core/assets.js';

export class PagesBar {
  constructor(editor) {
    this.editor = editor;
    this.root = editor.pagesBarEl;
    editor.on('page', () => this.render());
    editor.on('change', () => this.render());
    this.render();
  }

  render() {
    const ed = this.editor;
    this.root.innerHTML = '';
    ed.doc.pages.forEach((page, i) => {
      const chip = el('button', 'sk-page-chip' + (i === ed.pageIndex ? ' sk-active' : ''), this.root);
      chip.innerHTML = `<span class="sk-page-num">${i + 1}</span><span class="sk-page-dim">${page.width}×${page.height}</span>`;
      chip.onclick = () => ed.goToPage(i);
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
}
