import { Editor } from './core/editor.js';

export { Editor };
export const version = '0.1.1';

function autoInit() {
  document.querySelectorAll('[data-ezr-editor]').forEach((node) => {
    if (node.__ezyreka) return;
    const editor = new Editor({
      target: node,
      width: parseInt(node.dataset.ezrWidth, 10) || 1080,
      height: parseInt(node.dataset.ezrHeight, 10) || 1080,
      name: node.dataset.ezrName || 'Untitled design'
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
