import { Editor } from './core/editor.js';

export { Editor };
export const version = '1.0.0';

function autoInit() {
  document.querySelectorAll('[data-ez-editor]').forEach((node) => {
    if (node.__ezyreka) return;
    const editor = new Editor({
      target: node,
      width: parseInt(node.dataset.skWidth, 10) || 1080,
      height: parseInt(node.dataset.skHeight, 10) || 1080,
      name: node.dataset.skName || 'Untitled design'
    });
    node.__ezyreka = editor;
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export default { Editor, version, autoInit };
