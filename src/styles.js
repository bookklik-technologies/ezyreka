let injected = false;

export function injectStyles() {
  if (injected || document.getElementById('sk-styles')) return;
  injected = true;
  const style = document.createElement('style');
  style.id = 'sk-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function injectFonts() {
  if (document.getElementById('sk-fonts')) return;
  const link = document.createElement('link');
  link.id = 'sk-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;600;700;800&family=Montserrat:wght@400;600;700;800&family=Playfair+Display:wght@400;700&family=Lobster&family=Bebas+Neue&family=Rubik:wght@400;600;700&display=swap';
  document.head.appendChild(link);
}

const CSS = `
.sk-editor {
  --sk-accent: #7d2ae8;
  --sk-accent-soft: #f3ecff;
  --sk-bg: #f5f5f7;
  --sk-panel: #ffffff;
  --sk-border: #e4e4ea;
  --sk-text: #1e2130;
  --sk-text-dim: #7a7d8c;
  --sk-danger: #e11d48;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 480px;
  min-width: 720px;
  overflow: hidden;
  background: var(--sk-bg);
  color: var(--sk-text);
  font-family: Inter, 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  user-select: none;
  box-sizing: border-box;
}
.sk-editor *, .sk-editor *::before, .sk-editor *::after { box-sizing: border-box; }
.sk-editor button { font-family: inherit; cursor: pointer; }

.sk-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 14px;
  background: var(--sk-panel);
  border-bottom: 1px solid var(--sk-border);
  flex-shrink: 0;
  z-index: 30;
}
.sk-brand { display: flex; align-items: center; gap: 8px; }
.sk-logo {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, #7d2ae8, #f857a6);
  color: #fff; font-weight: 800; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
}
.sk-brand-name { font-weight: 700; font-size: 15px; }
.sk-filename {
  border: 1px solid transparent; border-radius: 8px;
  background: transparent; padding: 6px 10px;
  font-size: 14px; font-weight: 600; color: var(--sk-text);
  width: 190px; font-family: inherit;
}
.sk-filename:hover { border-color: var(--sk-border); }
.sk-filename:focus { outline: none; border-color: var(--sk-accent); background: #fff; }
.sk-topbar-group { display: flex; align-items: center; gap: 2px; padding: 0 6px; }
.sk-topbar-spacer { flex: 1; }
.sk-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: transparent; color: var(--sk-text); padding: 0;
}
.sk-icon-btn svg { width: 18px; height: 18px; fill: currentColor; }
.sk-icon-btn:hover { background: #ececf2; }
.sk-icon-btn.sk-sm { width: 26px; height: 26px; border-radius: 6px; }
.sk-icon-btn.sk-sm svg { width: 14px; height: 14px; }
.sk-zoom-btn {
  min-width: 54px; height: 30px; border: none; border-radius: 8px;
  background: transparent; font-weight: 600; font-size: 13px; color: var(--sk-text);
}
.sk-zoom-btn:hover { background: #ececf2; }
.sk-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; border-radius: 8px;
  border: 1px solid transparent; font-size: 13px; font-weight: 600;
}
.sk-btn svg { width: 15px; height: 15px; fill: currentColor; }
.sk-btn-ghost { background: #fff; border-color: var(--sk-border); color: var(--sk-text); }
.sk-btn-ghost:hover { border-color: #c9c9d4; background: #fafafc; }
.sk-btn-primary { background: var(--sk-accent); color: #fff; }
.sk-btn-primary:hover { background: #6c1fd1; }
.sk-hidden { display: none !important; }
.sk-grow { flex: 1; justify-content: center; }

.sk-body { display: flex; flex: 1; min-height: 0; }

.sk-sidepanel {
  width: 320px; min-width: 320px;
  background: var(--sk-panel);
  border-right: 1px solid var(--sk-border);
  display: flex; flex-direction: column; z-index: 20;
}
.sk-sidepanel-tabs {
  display: flex; border-bottom: 1px solid var(--sk-border);
}
.sk-tab-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 9px 2px 8px; border: none; background: transparent;
  font-size: 10.5px; font-weight: 600; color: var(--sk-text-dim);
}
.sk-tab-btn svg { width: 19px; height: 19px; fill: currentColor; }
.sk-tab-btn:hover { color: var(--sk-text); }
.sk-tab-btn.sk-active { color: var(--sk-accent); }
.sk-sidepanel-content { flex: 1; overflow-y: auto; padding: 14px; }
.sk-sidepanel-content::-webkit-scrollbar { width: 8px; }
.sk-sidepanel-content::-webkit-scrollbar-thumb { background: #d6d6e0; border-radius: 4px; }
.sk-panel-title {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--sk-text-dim); margin: 6px 0 10px;
}
.sk-empty { color: var(--sk-text-dim); font-size: 12.5px; line-height: 1.5; }

.sk-template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sk-template-card {
  border: 1px solid var(--sk-border); border-radius: 10px; overflow: hidden;
  background: #fff; padding: 0; transition: box-shadow 0.15s, border-color 0.15s;
}
.sk-template-card:hover { border-color: var(--sk-accent); box-shadow: 0 4px 14px rgba(60, 20, 120, 0.12); }
.sk-template-card canvas { display: block; width: 100% !important; height: auto !important; }
.sk-template-name { padding: 7px 9px; font-size: 12px; font-weight: 600; text-align: left; }

.sk-element-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
.sk-element-btn {
  aspect-ratio: 1; border: 1px solid var(--sk-border); border-radius: 10px;
  background: #fff; color: var(--sk-text); padding: 9px;
  display: flex; align-items: center; justify-content: center;
}
.sk-element-btn:hover { border-color: var(--sk-accent); color: var(--sk-accent); background: var(--sk-accent-soft); }
.sk-element-btn svg { width: 100%; height: 100%; fill: currentColor; }

.sk-text-preset {
  display: block; width: 100%; text-align: left; margin-bottom: 8px;
  border: none; background: transparent; color: var(--sk-text);
  padding: 7px 4px; border-radius: 8px;
}
.sk-text-preset:hover { background: var(--sk-accent-soft); color: var(--sk-accent); }
.sk-font-list { display: flex; flex-direction: column; gap: 2px; }
.sk-font-item {
  text-align: left; border: none; background: transparent;
  padding: 8px 10px; border-radius: 8px; font-size: 15px; color: var(--sk-text);
}
.sk-font-item:hover { background: var(--sk-accent-soft); color: var(--sk-accent); }

.sk-upload-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 12px; border: 1.5px dashed #c9c9d4; border-radius: 10px;
  background: #fafafc; font-weight: 600; font-size: 13px; color: var(--sk-text);
  margin-bottom: 16px;
}
.sk-upload-btn svg { width: 17px; height: 17px; fill: currentColor; }
.sk-upload-btn:hover { border-color: var(--sk-accent); color: var(--sk-accent); }
.sk-upload-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sk-upload-thumb {
  aspect-ratio: 1; border: 1px solid var(--sk-border); border-radius: 8px;
  overflow: hidden; padding: 0; background: #fff;
}
.sk-upload-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sk-upload-thumb:hover { border-color: var(--sk-accent); }

.sk-swatch-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 6px; margin-bottom: 20px; }
.sk-swatch {
  aspect-ratio: 1; border-radius: 7px; border: 1px solid rgba(0,0,0,0.08); padding: 0;
}
.sk-swatch:hover { transform: scale(1.12); }
.sk-swatch-border { border-color: #c9c9d4; }
.sk-bg-custom { display: flex; gap: 8px; align-items: center; }
.sk-bg-custom input[type='color'] {
  width: 42px; height: 34px; padding: 2px; border: 1px solid var(--sk-border);
  border-radius: 8px; background: #fff; cursor: pointer;
}

.sk-layer-list { display: flex; flex-direction: column; gap: 4px; }
.sk-layer-item {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  padding: 6px 8px; border-radius: 8px; border: 1px solid transparent; background: #fafafc;
}
.sk-layer-item:hover { background: #f0f0f5; }
.sk-layer-item.sk-active { border-color: var(--sk-accent); background: var(--sk-accent-soft); }
.sk-layer-name {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  font-size: 12.5px; font-weight: 500; cursor: pointer;
}
.sk-layer-name svg { width: 14px; height: 14px; fill: var(--sk-text-dim); flex-shrink: 0; }
.sk-layer-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sk-layer-actions { display: flex; gap: 2px; }
.sk-layer-actions .sk-icon-btn { width: 24px; height: 24px; color: var(--sk-text-dim); }
.sk-layer-actions .sk-icon-btn:hover { color: var(--sk-text); }

.sk-canvas-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.sk-viewport {
  flex: 1; overflow: auto; display: flex; position: relative;
  background: #e9eaf1;
  background-image: radial-gradient(#dcdde6 1px, transparent 1px);
  background-size: 22px 22px;
}
.sk-viewport.sk-panning { cursor: grabbing !important; }
.sk-stage-wrap {
  margin: auto;
  padding: 48px;
  min-width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sk-stage {
  position: relative; margin: 0; padding: 0;
  box-shadow: 0 2px 18px rgba(20, 20, 50, 0.14);
  flex-shrink: 0;
  touch-action: none;
}
.sk-stage canvas, .sk-overlay { touch-action: none; }
.sk-stage canvas { display: block; background: #fff; }
.sk-editor input, .sk-editor [contenteditable] { user-select: text; }
.sk-overlay { position: absolute; inset: 0; overflow: visible; pointer-events: none; }

.sk-sel-box {
  position: absolute; border: 1.6px solid var(--sk-accent);
  pointer-events: none;
}
.sk-sel-box.sk-multi { border-style: dashed; }
.sk-sel-name {
  position: absolute; transform: translate(0, -130%);
  background: var(--sk-accent); color: #fff; font-size: 11px; font-weight: 600;
  padding: 2px 7px; border-radius: 5px; white-space: nowrap;
}
.sk-handle {
  position: absolute; width: 11px; height: 11px; border-radius: 50%;
  background: #fff; border: 1.6px solid var(--sk-accent);
  pointer-events: auto; z-index: 5;
}
.sk-handle[data-dir='n'], .sk-handle[data-dir='s'] { cursor: ns-resize; left: 50%; margin-left: -5.5px; }
.sk-handle[data-dir='e'], .sk-handle[data-dir='w'] { cursor: ew-resize; top: 50%; margin-top: -5.5px; }
.sk-handle[data-dir='nw'], .sk-handle[data-dir='se'] { cursor: nwse-resize; }
.sk-handle[data-dir='ne'], .sk-handle[data-dir='sw'] { cursor: nesw-resize; }
.sk-handle[data-dir='nw'] { left: -6px; top: -6px; }
.sk-handle[data-dir='ne'] { right: -6px; top: -6px; }
.sk-handle[data-dir='se'] { right: -6px; bottom: -6px; }
.sk-handle[data-dir='sw'] { left: -6px; bottom: -6px; }
.sk-handle[data-dir='n'] { top: -6px; }
.sk-handle[data-dir='s'] { bottom: -6px; }
.sk-handle[data-dir='e'] { right: -6px; }
.sk-handle[data-dir='w'] { left: -6px; }
.sk-rotate-handle {
  position: absolute; left: 50%; top: -34px; width: 22px; height: 22px;
  margin-left: -11px; border-radius: 50%; background: #fff;
  border: 1.6px solid var(--sk-accent); pointer-events: auto; cursor: grab; z-index: 5;
  display: flex; align-items: center; justify-content: center;
}
.sk-rotate-handle::after {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--sk-accent);
}
.sk-guide { position: absolute; background: #f43f8e; pointer-events: none; z-index: 8; }
.sk-guide.sk-guide-x { width: 1.5px; }
.sk-guide.sk-guide-y { height: 1.5px; }
.sk-band {
  position: absolute; display: none; border: 1px solid var(--sk-accent);
  background: rgba(125, 42, 232, 0.08); pointer-events: none; z-index: 4;
}
.sk-text-editor {
  position: absolute; outline: 1.6px solid var(--sk-accent);
  background: transparent; cursor: text; pointer-events: auto;
  white-space: pre-wrap; word-break: break-word; overflow: hidden;
  user-select: text; z-index: 10; caret-color: #000;
}

.sk-pagesbar {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 12px; background: var(--sk-panel);
  border-top: 1px solid var(--sk-border); flex-shrink: 0; flex-wrap: wrap; z-index: 20;
}
.sk-page-chip {
  display: flex; align-items: center; gap: 7px;
  border: 1.5px solid var(--sk-border); background: #fff; border-radius: 8px;
  padding: 5px 10px; font-size: 12px; font-weight: 600; color: var(--sk-text-dim);
}
.sk-page-chip:hover { border-color: #c9c9d4; }
.sk-page-chip.sk-active { border-color: var(--sk-accent); color: var(--sk-text); background: var(--sk-accent-soft); }
.sk-page-num {
  width: 18px; height: 18px; border-radius: 5px; background: #ececf2;
  display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
}
.sk-page-chip.sk-active .sk-page-num { background: var(--sk-accent); color: #fff; }
.sk-page-actions { display: flex; align-items: center; gap: 2px; margin-left: 6px; }

.sk-floating-toolbar {
  position: absolute; display: none; align-items: center; gap: 6px;
  background: var(--sk-panel); border: 1px solid var(--sk-border);
  border-radius: 10px; padding: 6px 8px; z-index: 40;
  box-shadow: 0 6px 24px rgba(20, 20, 50, 0.16);
  max-width: calc(100% - 16px); flex-wrap: wrap;
}
.sk-tool-toggle {
  min-width: 30px; height: 30px; border: none; border-radius: 7px;
  background: transparent; color: var(--sk-text); font-size: 13px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 6px;
}
.sk-tool-toggle svg { width: 16px; height: 16px; fill: currentColor; }
.sk-tool-toggle:hover { background: #ececf2; }
.sk-tool-toggle.sk-active { background: var(--sk-accent-soft); color: var(--sk-accent); }
.sk-toolbar-sep-actions { display: flex; align-items: center; gap: 2px; border-left: 1px solid var(--sk-border); padding-left: 6px; }
.sk-input {
  height: 30px; border: 1px solid var(--sk-border); border-radius: 7px;
  padding: 0 7px; font-size: 12.5px; background: #fff; color: var(--sk-text); font-family: inherit;
}
.sk-input:focus { outline: none; border-color: var(--sk-accent); }
.sk-font-select { width: 132px; }
.sk-num-wrap { display: inline-flex; align-items: center; gap: 4px; }
.sk-num-label { font-size: 11px; font-weight: 600; color: var(--sk-text-dim); }
.sk-num-input { width: 56px; }
.sk-color-wrap {
  position: relative; width: 30px; height: 30px; border-radius: 7px;
  border: 1px solid var(--sk-border); overflow: hidden; cursor: pointer; flex-shrink: 0;
}
.sk-color-input {
  position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px);
  border: none; padding: 0; cursor: pointer; background: none;
}

.sk-menu {
  position: absolute; z-index: 100; min-width: 190px;
  background: var(--sk-panel); border: 1px solid var(--sk-border); border-radius: 10px;
  box-shadow: 0 8px 30px rgba(20, 20, 50, 0.18); padding: 5px;
}
.sk-menu-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 7px; font-size: 13px; font-weight: 500;
  cursor: pointer; color: var(--sk-text);
}
.sk-menu-item svg { width: 15px; height: 15px; fill: currentColor; opacity: 0.75; }
.sk-menu-item:hover { background: var(--sk-accent-soft); }
.sk-menu-item.sk-danger { color: var(--sk-danger); }
.sk-menu-item.sk-danger:hover { background: #fdeef2; }
.sk-menu-item.sk-disabled { opacity: 0.45; pointer-events: none; }
.sk-menu-shortcut { margin-left: auto; font-size: 11px; color: var(--sk-text-dim); }
.sk-menu-sep { height: 1px; background: var(--sk-border); margin: 5px 8px; }
`;
