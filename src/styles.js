import { GOOGLE_FONT_FAMILIES } from './core/assets.js';
import { suiteTopbarStyles } from './ui/suite-topbar-styles.js';

// Shared chrome (`#ez-styles`, `#ez-fonts`) is reference-counted across editor
// instances and removed when the last editor is destroyed or released. The
// nodes are always looked up by id, so a host that deletes them gets fresh
// injection on the next editor.
let chromeRefs = 0;

export function injectStyles() {
  chromeRefs++;
  let style = document.getElementById('ez-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'ez-styles';
    style.textContent = CSS + suiteTopbarStyles + "\n.ez-editor[data-ezyreka-root] > .ezy-suite-topbar { --suite-export-bg:#facc15; --suite-export-text:#1e2130; }";
    document.head.appendChild(style);
  }
  return style;
}

/** Drops one chrome reference; removes shared style/font nodes at zero. */
export function releaseChrome() {
  if (chromeRefs > 0) chromeRefs--;
  if (chromeRefs > 0) return;
  document.getElementById('ez-styles')?.remove();
  document.getElementById('ez-fonts')?.remove();
}

// Outfit is the editor chrome font and is always loaded alongside the
// document font families.
const UI_FONT_FAMILY = 'Outfit:wght@400;500;600;700;800';

export function buildGoogleFontsUrl(families = GOOGLE_FONT_FAMILIES) {
  const all = [UI_FONT_FAMILY, ...families.filter((f) => f && f !== UI_FONT_FAMILY)];
  return `https://fonts.googleapis.com/css2?family=${all.join('&family=')}&display=swap`;
}

// Creates the webfont <link> on first use and rewrites it whenever custom
// families are registered, so a single link tracks the active font set.
export function injectFonts(families = GOOGLE_FONT_FAMILIES) {
  const href = buildGoogleFontsUrl(families);
  let link = document.getElementById('ez-fonts');
  if (!link) {
    link = document.createElement('link');
    link.id = 'ez-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  return link;
}

const CSS = `
.ez-editor[data-ezyreka-root] {
  --ez-accent: #ff6600;
  --ez-accent-soft: #fff0e3;
  --ez-bg: #f5f5f7;
  --ez-panel: #ffffff;
  --ez-border: #e4e4ea;
  --ez-text: #1e2130;
  --ez-text-dim: #7a7d8c;
  --ez-danger: #e11d48;
  --ez-surface: #ffffff;
  --ez-surface-2: #fafafc;
  --ez-surface-3: #f0f0f3;
  --ez-hover: #ececf2;
  --ez-border-strong: #c9c9d4;
  --ez-canvas-bg: #e9eaf1;
  --ez-canvas-dot: #dcdde6;
  --ez-scrollbar: #d6d6e0;
  --ez-danger-soft: #fdeef2;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 480px;
  min-width: 720px;
  overflow: hidden;
  background: var(--ez-bg);
  color: var(--ez-text);
  font-family: Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif;
  font-size: 14px;
  user-select: none;
  box-sizing: border-box;
}
.ez-editor[data-ezyreka-root] *, .ez-editor[data-ezyreka-root] *::before, .ez-editor[data-ezyreka-root] *::after { box-sizing: border-box; }
.ez-editor[data-ezyreka-root] button, .ez-editor[data-ezyreka-root] input, .ez-editor[data-ezyreka-root] select, .ez-editor[data-ezyreka-root] textarea { font-family: inherit; }
.ez-editor[data-ezyreka-root] button { cursor: pointer; }

[data-ezyreka-root] .ez-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 14px;
  background: var(--ez-panel);
  border-bottom: 1px solid var(--ez-border);
  flex-shrink: 0;
  z-index: 30;
}
[data-ezyreka-root] .ez-brand { display: flex; align-items: center; gap: 8px; }
[data-ezyreka-root] .ez-logo {
  width: 28px; height: 28px; border-radius: 6px; overflow: hidden;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
[data-ezyreka-root] .ez-logo svg { width: 28px; height: 28px; display: block; }
[data-ezyreka-root] .ez-brand-name { font-weight: 700; font-size: 15px; }
[data-ezyreka-root] .ez-filename {
  border: 1px solid transparent; border-radius: 6px;
  background: transparent; padding: 6px 10px;
  font-size: 14px; font-weight: 600; color: var(--ez-text);
  width: 190px; font-family: inherit;
}
[data-ezyreka-root] .ez-filename:hover { border-color: var(--ez-border); }
[data-ezyreka-root] .ez-filename:focus { outline: none; border-color: var(--ez-accent); background: var(--ez-surface); }
[data-ezyreka-root] .ez-topbar-group { display: flex; align-items: center; gap: 2px; padding: 0 6px; }
[data-ezyreka-root] .ez-topbar-spacer { flex: 1; }
[data-ezyreka-root] .ez-topbar > .ez-btn, [data-ezyreka-root] .ez-topbar > .ez-icon-btn, [data-ezyreka-root] .ez-topbar-group, [data-ezyreka-root] .ez-brand { flex-shrink: 0; }
[data-ezyreka-root] .ez-resize-dialog {
  width: 560px; max-width: calc(100% - 32px); max-height: calc(100% - 32px); padding: 24px;
  border: 1px solid var(--ez-border); border-radius: 14px;
  background: var(--ez-panel); color: var(--ez-text); font: inherit;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.25);
}
[data-ezyreka-root] .ez-resize-dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
[data-ezyreka-root] .ez-resize-form h2 { margin: 0 0 8px; font-size: 18px; }
[data-ezyreka-root] .ez-resize-form p { margin: 0 0 20px; color: var(--ez-text-dim); font-size: 12px; line-height: 1.5; }
[data-ezyreka-root] .ez-resize-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
[data-ezyreka-root] .ez-resize-fields label { display: flex; flex-direction: column; gap: 8px; font-size: 12px; font-weight: 600; }
[data-ezyreka-root] .ez-resize-presets { min-width: 0; padding: 0; margin: 0; border: 0; }
[data-ezyreka-root] .ez-resize-presets legend { padding: 0; margin-bottom: 12px; font-size: 12px; font-weight: 600; }
[data-ezyreka-root] .ez-resize-categories { display: flex; gap: 4px; padding: 4px; background: var(--ez-surface-3); border-radius: 10px; margin-bottom: 14px; }
[data-ezyreka-root] .ez-resize-category { flex: 1; border: 0; border-radius: 6px; padding: 8px 4px; background: transparent; color: var(--ez-text-dim); font-size: 12px; font-weight: 600; }
[data-ezyreka-root] .ez-resize-category[aria-pressed="true"] { background: var(--ez-panel); color: var(--ez-text); box-shadow: 0 1px 4px #00000012; }
[data-ezyreka-root] .ez-resize-gallery { max-height: 310px; overflow-y: auto; padding: 3px; margin: -3px; scrollbar-width: thin; }
[data-ezyreka-root] .ez-resize-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
[data-ezyreka-root] .ez-resize-grid[hidden] { display: none; }
[data-ezyreka-root] .ez-resize-card { position: relative; display: flex; flex-direction: column; gap: 5px; min-width: 0; padding: 6px; border: 1px solid transparent; border-radius: 12px; cursor: pointer; }
[data-ezyreka-root] .ez-resize-card:hover { background: var(--ez-surface-3); }
[data-ezyreka-root] .ez-resize-card:has(input:checked) { background: var(--ez-accent-soft); border-color: var(--ez-accent); }
[data-ezyreka-root] .ez-resize-card > input { position: absolute; width: 1px; height: 1px; opacity: 0; }
[data-ezyreka-root] .ez-resize-card:has(input:focus-visible), [data-ezyreka-root] .ez-resize-category:focus-visible, [data-ezyreka-root] .ez-resize-custom:has(input:focus-visible) { outline: 2px solid var(--ez-accent); outline-offset: 1px; }
[data-ezyreka-root] .ez-resize-thumbnail { position: relative; display: flex; justify-content: center; align-items: center; height: 100px; border-radius: 8px; background: var(--ez-surface-3); overflow: hidden; }
[data-ezyreka-root] .ez-resize-paper { position: relative; display: block; flex-shrink: 0; overflow: hidden; border: 2px solid #fff; border-radius: 3px; background: #e6f7ed; box-shadow: 4px 4px 0 #00000020; }
[data-ezyreka-root] .ez-resize-art-orb { position: absolute; width: 60%; aspect-ratio: 1; border-radius: 50%; right: -8%; top: 10%; background: linear-gradient(135deg, #86efac, #22c55e); }
[data-ezyreka-root] .ez-resize-art-block { position: absolute; width: 65%; height: 36%; left: -8%; bottom: 14%; background: #16a34a; transform: rotate(-18deg); border-radius: 3px; }
[data-ezyreka-root] .ez-resize-art-line { position: absolute; width: 45%; height: 3px; top: 17%; left: 12%; background: #fff; box-shadow: 0 6px 0 #ffffffb3; }
[data-ezyreka-root] .ez-resize-art-1 .ez-resize-paper { background: #fff; }
[data-ezyreka-root] .ez-resize-art-1 .ez-resize-art-orb { border-radius: 0; width: 76%; height: 28%; top: 10%; right: 12%; background: #86efac; }
[data-ezyreka-root] .ez-resize-art-1 .ez-resize-art-block { transform: none; width: 76%; height: 25%; left: 12%; bottom: 12%; border-radius: 0; }
[data-ezyreka-root] .ez-resize-art-1 .ez-resize-art-line { top: 46%; background: #dedde5; box-shadow: 0 6px 0 #dedde5; }
[data-ezyreka-root] .ez-resize-art-2 .ez-resize-paper { background: #14532d; }
[data-ezyreka-root] .ez-resize-art-2 .ez-resize-art-block { width: 30%; left: 12%; background: #86efac; }
[data-ezyreka-root] .ez-resize-check { position: absolute; top: 6px; right: 6px; display: none; align-items: center; justify-content: center; width: 19px; height: 19px; border-radius: 50%; background: var(--ez-accent); color: #fff; font-size: 12px; font-weight: 700; }
[data-ezyreka-root] .ez-resize-card:has(input:checked) .ez-resize-check { display: flex; }
[data-ezyreka-root] .ez-resize-card-name { font-size: 12px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
[data-ezyreka-root] .ez-resize-card-size { font-size: 11px; color: var(--ez-text-dim); line-height: 1.4; }
[data-ezyreka-root] .ez-resize-custom { display: flex; align-items: center; gap: 8px; padding: 11px 12px; margin-top: 14px; border: 1px solid var(--ez-border); border-radius: 9px; font-size: 12px; cursor: pointer; }
[data-ezyreka-root] .ez-resize-custom:has(input:checked) { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-resize-custom input { margin: 0; accent-color: var(--ez-accent); }
[data-ezyreka-root] .ez-resize-custom-hint { margin-left: auto; font-size: 11px; color: var(--ez-text-dim); }
@media (max-width: 480px) {
  [data-ezyreka-root] .ez-resize-dialog { padding: 18px; }
  [data-ezyreka-root] .ez-resize-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  [data-ezyreka-root] .ez-resize-custom-hint { display: none; }
}
[data-ezyreka-root] .ez-resize-form .ez-resize-preset-help { margin: 8px 0 16px; font-size: 11px; }
[data-ezyreka-root] .ez-resize-fields input { width: 100%; min-width: 0; height: 38px; }
[data-ezyreka-root] .ez-resize-form .ez-resize-limit { margin: 10px 0 20px; font-size: 11px; }
[data-ezyreka-root] .ez-resize-actions { display: flex; justify-content: flex-end; gap: 8px; }
[data-ezyreka-root] .ez-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; border-radius: 6px;
  background: transparent; color: var(--ez-text); padding: 0;
}
[data-ezyreka-root] .ez-icon-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; }
[data-ezyreka-root] .ez-icon-btn:hover { background: var(--ez-hover); }
[data-ezyreka-root] .ez-icon-btn.ez-sm { width: 26px; height: 26px; border-radius: 6px; }
[data-ezyreka-root] .ez-icon-btn.ez-sm svg { width: 14px; height: 14px; }
[data-ezyreka-root] .ez-zoom-btn {
  min-width: 54px; height: 32px; border: none; border-radius: 6px;
  background: transparent; font-weight: 600; font-size: 13px; color: var(--ez-text);
}
[data-ezyreka-root] .ez-zoom-btn:hover { background: var(--ez-hover); }
[data-ezyreka-root] .ez-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 14px; border-radius: 6px;
  border: 1px solid transparent; font-size: 13px; font-weight: 600;
}
[data-ezyreka-root] .ez-btn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; }
[data-ezyreka-root] .ez-btn-ghost { background: var(--ez-surface); border-color: var(--ez-border); color: var(--ez-text); }
[data-ezyreka-root] .ez-btn-ghost:hover { border-color: var(--ez-border-strong); background: var(--ez-surface-2); }
[data-ezyreka-root] .ez-btn-primary { background: #FACC15; color: #1e2130; }
[data-ezyreka-root] .ez-btn-primary:hover { background: #EAB308; }
[data-ezyreka-root] .ez-hidden { display: none !important; }
[data-ezyreka-root] .ez-grow { flex: 1; justify-content: center; }

[data-ezyreka-root] .ez-body { display: flex; flex: 1; min-height: 0; }

[data-ezyreka-root] .ez-sidepanel {
  width: 368px; min-width: 368px;
  background: var(--ez-panel);
  border-right: 1px solid var(--ez-border);
  display: flex; min-height: 0; z-index: 20;
}
[data-ezyreka-root] .ez-sidepanel-rail {
  width: 80px; flex-shrink: 0; display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden; border-right: 1px solid var(--ez-border);
  background: var(--ez-surface-2); padding: 8px 6px; gap: 8px;
}
[data-ezyreka-root] .ez-sidepanel-tabs {
  display: flex; flex-direction: column; gap: 6px;
}
[data-ezyreka-root] .ez-tab-btn {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
  min-height: 66px; padding: 10px 2px; border: none; border-radius: 10px; background: transparent;
  font-size: 10px; font-weight: 600; color: var(--ez-text-dim);
}
[data-ezyreka-root] .ez-tab-btn svg { width: 24px; height: 24px; flex-shrink: 0; fill: none; stroke: currentColor; }
[data-ezyreka-root] .ez-tab-btn:hover { color: var(--ez-text); background: var(--ez-hover); }
[data-ezyreka-root] .ez-tab-btn.ez-active { color: var(--ez-accent); background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-tab-btn:focus-visible, [data-ezyreka-root] .ez-sidepanel-toggle:focus-visible { outline: 2px solid var(--ez-accent); outline-offset: -2px; }
[data-ezyreka-root] .ez-sidepanel-toggle {
  display: flex; align-items: center; justify-content: center; align-self: center;
  width: 36px; height: 32px; flex-shrink: 0; padding: 0; border: none; border-radius: 6px;
  background: transparent; color: var(--ez-text-dim);
}
[data-ezyreka-root] .ez-sidepanel-toggle:hover { background: var(--ez-hover); color: var(--ez-text); }
[data-ezyreka-root] .ez-sidepanel-toggle svg { width: 20px; height: 20px; transform: rotate(90deg); }
[data-ezyreka-root] .ez-sidepanel-content {
  --ez-panel-gap: 12px;
  --ez-panel-section-gap: 24px;
  --ez-panel-radius: 10px;
  flex: 1; min-width: 0; overflow-y: auto; padding: 16px;
  scrollbar-gutter: stable;
}
[data-ezyreka-root] .ez-sidepanel-content[hidden] { display: none; }
[data-ezyreka-root] .ez-sidepanel.ez-collapsed { width: 56px; min-width: 56px; }
[data-ezyreka-root] .ez-collapsed .ez-sidepanel-rail { width: 55px; border-right: none; }
[data-ezyreka-root] .ez-collapsed .ez-tab-btn { min-height: 46px; padding: 10px 0; }
[data-ezyreka-root] .ez-collapsed .ez-tab-btn span { display: none; }
[data-ezyreka-root] .ez-collapsed .ez-sidepanel-toggle svg { transform: rotate(-90deg); }
[data-ezyreka-root] .ez-sidepanel-content::-webkit-scrollbar { width: 8px; }
[data-ezyreka-root] .ez-sidepanel-content::-webkit-scrollbar-thumb { background: var(--ez-scrollbar); border-radius: 4px; }
[data-ezyreka-root] .ez-panel-header { margin-bottom: 20px; }
[data-ezyreka-root] .ez-panel-heading { margin: 0 0 8px; font-size: 16px; font-weight: 700; line-height: 1.4; color: var(--ez-text); }
[data-ezyreka-root] .ez-panel-description { margin: 0; font-size: 12px; line-height: 1.6; color: var(--ez-text-dim); }
[data-ezyreka-root] .ez-panel-title {
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; line-height: 1.5; color: var(--ez-text-dim);
  margin: var(--ez-panel-section-gap) 0 var(--ez-panel-gap);
}
[data-ezyreka-root] .ez-panel-title:first-child, [data-ezyreka-root] .ez-panel-header + .ez-panel-title { margin-top: 0; }
[data-ezyreka-root] .ez-sidepanel-content .ez-input { height: 36px; border-radius: 8px; font-size: 12px; }
[data-ezyreka-root] .ez-panel-search { width: 100%; }
[data-ezyreka-root] .ez-panel-filters { display: flex; flex-wrap: wrap; gap: 6px; margin: var(--ez-panel-gap) 0; }
[data-ezyreka-root] .ez-panel-filter {
  padding: 6px 10px; min-height: 30px; border: 1px solid var(--ez-border); border-radius: 20px;
  background: var(--ez-surface); color: var(--ez-text-dim); font-size: 11px; font-weight: 600; line-height: 1.4;
}
[data-ezyreka-root] .ez-panel-filter:hover { border-color: var(--ez-accent); color: var(--ez-accent); }
[data-ezyreka-root] .ez-panel-filter.ez-active { color: var(--ez-accent); background: var(--ez-accent-soft); border-color: var(--ez-accent); }
[data-ezyreka-root] .ez-panel-count { color: var(--ez-text-dim); font-size: 11px; line-height: 1.5; margin: 0 0 var(--ez-panel-gap); }
[data-ezyreka-root] .ez-panel-card {
  min-width: 0; border: 1px solid var(--ez-border); border-radius: var(--ez-panel-radius);
  background: var(--ez-surface); color: var(--ez-text);
  transition: background .15s, border-color .15s;
}
[data-ezyreka-root] .ez-panel-card:hover { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-sidepanel-content :is(button, input, select):focus-visible { outline: 2px solid var(--ez-accent); outline-offset: 1px; }
[data-ezyreka-root] .ez-sidepanel-content .ez-btn { min-height: 36px; height: auto; padding: 8px 12px; font-size: 12px; justify-content: center; }
[data-ezyreka-root] .ez-panel-action { width: 100%; }
[data-ezyreka-root] .ez-empty {
  grid-column: 1 / -1; margin: 0; padding: 16px; border: 1px dashed var(--ez-border-strong);
  border-radius: var(--ez-panel-radius, 10px); background: var(--ez-surface-2);
  color: var(--ez-text-dim); font-size: 12px; line-height: 1.6;
}

[data-ezyreka-root] .ez-chart-note { color: var(--ez-text-dim); font-size: 12px; line-height: 1.6; margin: 8px 0 14px; }
[data-ezyreka-root] .ez-chart-gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ez-panel-gap); }
[data-ezyreka-root] .ez-chart-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 8px 8px 12px; font-size: 11px; font-weight: 600; line-height: 1.4;
}
[data-ezyreka-root] .ez-chart-card canvas { width: 100%; height: auto; display: block; border-radius: 6px; background: var(--ez-surface-2); }
[data-ezyreka-root] .ez-chart-editor-tabs .ez-panel-filter { flex: 1; }
[data-ezyreka-root] .ez-chart-error { color: var(--ez-danger); background: var(--ez-danger-soft); border-radius: 8px; padding: 10px; font-size: 12px; line-height: 1.5; }
[data-ezyreka-root] .ez-chart-error[hidden] { display: none; }
[data-ezyreka-root] .ez-chart-table-wrap { overflow: auto; max-height: 420px; border: 1px solid var(--ez-border); border-radius: 8px; }
[data-ezyreka-root] .ez-chart-table { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 12px; }
[data-ezyreka-root] .ez-chart-table th, [data-ezyreka-root] .ez-chart-table td { padding: 4px; border-bottom: 1px solid var(--ez-border); text-align: left; }
[data-ezyreka-root] .ez-chart-table th { position: sticky; top: 0; z-index: 1; background: var(--ez-surface-2); }
[data-ezyreka-root] .ez-chart-table .ez-input { width: 100px; min-width: 80px; }
[data-ezyreka-root] .ez-chart-table td:first-child .ez-input, [data-ezyreka-root] .ez-chart-table th:first-child .ez-input { width: 110px; }
[data-ezyreka-root] .ez-chart-table [aria-invalid='true'], [data-ezyreka-root] .ez-chart-style-field [aria-invalid='true'] { border-color: var(--ez-danger); }
[data-ezyreka-root] .ez-chart-remove { padding: 4px; border: none; background: transparent; color: var(--ez-text-dim); font-size: 10px; }
[data-ezyreka-root] .ez-chart-remove:hover { color: var(--ez-danger); }
[data-ezyreka-root] .ez-chart-data-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
[data-ezyreka-root] .ez-chart-expand { margin-top: 12px; width: 100%; justify-content: center; }
[data-ezyreka-root] .ez-chart-style-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0; font-size: 12px; }
[data-ezyreka-root] .ez-chart-style-field > span { min-width: 0; overflow-wrap: anywhere; }
[data-ezyreka-root] .ez-chart-style-field .ez-input { width: 140px; min-width: 0; flex-shrink: 0; }
[data-ezyreka-root] .ez-chart-style-field input[type='checkbox'] { width: 18px; height: 18px; accent-color: var(--ez-accent); }
[data-ezyreka-root] .ez-chart-style-field input[type='color'] { width: 48px; padding: 2px; }
[data-ezyreka-root] .ez-chart-dialog { width: 900px; max-width: calc(100vw - 40px); max-height: calc(100vh - 40px); overflow: auto;
  border: 1px solid var(--ez-border); border-radius: 14px; padding: 24px; background: var(--ez-panel); color: var(--ez-text); font: inherit;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.25); }
[data-ezyreka-root] .ez-chart-dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
[data-ezyreka-root] .ez-chart-dialog h2 { margin: 0 0 20px; font-size: 20px; }
[data-ezyreka-root] .ez-chart-dialog .ez-chart-table-wrap { max-height: 55vh; }
[data-ezyreka-root] .ez-chart-dialog .ez-chart-table .ez-input { width: 100%; min-width: 110px; }
[data-ezyreka-root] .ez-chart-done { margin-top: 20px; float: right; }
[data-ezyreka-root] .ez-chart-dialog button:disabled, [data-ezyreka-root] .ez-chart-table button:disabled, [data-ezyreka-root] .ez-chart-data-actions button:disabled { opacity: 0.45; cursor: default; }
[data-ezyreka-root] .ez-chart-table input:disabled, [data-ezyreka-root] .ez-chart-style-field input:disabled, [data-ezyreka-root] .ez-chart-style-field select:disabled { opacity: 0.65; }

[data-ezyreka-root] .ez-template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ez-panel-gap); align-items: start; }
[data-ezyreka-root] .ez-template-card {
  overflow: hidden; padding: 0; text-align: left;
}
[data-ezyreka-root] .ez-template-preview { aspect-ratio: 1; padding: 8px; background: var(--ez-surface-3); }
[data-ezyreka-root] .ez-template-card canvas { display: block; width: 100%; height: 100%; object-fit: contain; }
[data-ezyreka-root] .ez-template-name { padding: 9px 8px 4px; font-size: 11.5px; font-weight: 600; line-height: 1.35; }
[data-ezyreka-root] .ez-template-meta { padding: 0 8px 10px; color: var(--ez-text-dim); font-size: 10px; line-height: 1.5; }
[data-ezyreka-root] .ez-template-empty { grid-column: 1 / -1; }

[data-ezyreka-root] .ez-element-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--ez-panel-gap); gap: 8px; }
[data-ezyreka-root] .ez-element-heading .ez-panel-title { margin: 0; }
[data-ezyreka-root] .ez-icon-styles { display: flex; padding: 3px; border-radius: 8px; background: var(--ez-surface-3); }
[data-ezyreka-root] .ez-icon-style { border: 0; border-radius: 6px; padding: 5px 8px; font-size: 10px; font-weight: 600; color: var(--ez-text-dim); background: transparent; }
[data-ezyreka-root] .ez-icon-style.ez-active { background: var(--ez-surface); color: var(--ez-accent); box-shadow: 0 1px 3px #17132b14; }
[data-ezyreka-root] .ez-element-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: var(--ez-panel-section-gap); }
[data-ezyreka-root] .ez-element-btn {
  padding: 10px 3px 7px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
}
[data-ezyreka-root] .ez-element-btn:hover { color: var(--ez-accent); }
[data-ezyreka-root] .ez-element-btn svg { width: 34px; height: 34px; max-width: 100%; flex-shrink: 0; }
[data-ezyreka-root] .ez-element-label { display: block; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; line-height: 1.3; text-align: center; }

[data-ezyreka-root] .ez-text-presets, [data-ezyreka-root] .ez-font-list { display: flex; flex-direction: column; gap: 8px; }
[data-ezyreka-root] .ez-text-preset {
  display: block; width: 100%; text-align: left; min-height: 44px;
  padding: 12px; line-height: 1.4; overflow-wrap: anywhere;
}
[data-ezyreka-root] .ez-text-preset:hover, [data-ezyreka-root] .ez-font-item:hover { color: var(--ez-accent); }
[data-ezyreka-root] .ez-font-item {
  text-align: left; min-height: 40px; padding: 10px 12px; font-size: 14px; line-height: 1.4;
}

[data-ezyreka-root] .ez-upload-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 40px; padding: 10px 12px; border: 1px dashed var(--ez-border-strong); border-radius: var(--ez-panel-radius);
  background: var(--ez-surface-2); font-weight: 600; font-size: 12px; color: var(--ez-text);
}
[data-ezyreka-root] .ez-upload-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; }
[data-ezyreka-root] .ez-upload-btn:hover { border-color: var(--ez-accent); color: var(--ez-accent); }
[data-ezyreka-root] .ez-upload-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
[data-ezyreka-root] .ez-upload-thumb {
  aspect-ratio: 1; overflow: hidden; padding: 0;
}
[data-ezyreka-root] .ez-upload-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

[data-ezyreka-root] .ez-swatch-grid { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 6px; }
[data-ezyreka-root] .ez-swatch {
  aspect-ratio: 1; border-radius: 7px; border: 1px solid rgba(0,0,0,0.08); padding: 0;
}
[data-ezyreka-root] .ez-swatch:hover { transform: scale(1.12); }
[data-ezyreka-root] .ez-swatch-border { border-color: #c9c9d4; }
[data-ezyreka-root] .ez-bg-custom { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
[data-ezyreka-root] .ez-bg-custom .ez-btn { min-width: 0; }
[data-ezyreka-root] .ez-bg-gradient-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 8px; }
[data-ezyreka-root] .ez-bg-gradient-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
[data-ezyreka-root] .ez-bg-gradient-angle { grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: space-between; }
[data-ezyreka-root] .ez-bg-gradient-angle > .ez-input { width: 80px; height: 36px; }
[data-ezyreka-root] .ez-bg-gradient-field .ez-color-field, [data-ezyreka-root] .ez-bg-custom .ez-color-field {
  display: flex; min-width: 0; height: 36px; gap: 6px; padding: 4px;
  border: 1px solid var(--ez-border); border-radius: 8px; background: var(--ez-surface);
}
[data-ezyreka-root] .ez-bg-gradient-field .ez-color-field:focus-within, [data-ezyreka-root] .ez-bg-custom .ez-color-field:focus-within { border-color: var(--ez-accent); }
[data-ezyreka-root] .ez-bg-gradient-field .ez-color-wrap, [data-ezyreka-root] .ez-bg-custom .ez-color-wrap { width: 26px; height: 26px; border-radius: 5px; }
[data-ezyreka-root] .ez-bg-gradient-field .ez-hex-input, [data-ezyreka-root] .ez-bg-custom .ez-hex-input {
  flex: 1; min-width: 0; width: 0; height: 26px; padding: 0; border: 0; border-radius: 0; background: transparent;
}
[data-ezyreka-root] .ez-bg-gradient-preview { height: 42px; border: 1px solid var(--ez-border); border-radius: var(--ez-panel-radius); margin: var(--ez-panel-gap) 0; }
[data-ezyreka-root] .ez-bg-gradient-apply { width: 100%; }

[data-ezyreka-root] .ez-layer-list { display: flex; flex-direction: column; gap: 8px; }
[data-ezyreka-root] .ez-layer-drag-handle {
  border: none; background: transparent; color: var(--ez-text-dim);
  padding: 0; width: 18px; height: 24px; flex-shrink: 0; font-size: 20px; cursor: grab;
}
[data-ezyreka-root] .ez-layer-drag-handle:active { cursor: grabbing; }
[data-ezyreka-root] .ez-layer-drag-handle:focus-visible { outline: 2px solid var(--ez-accent); border-radius: 4px; }
[data-ezyreka-root] .ez-layer-item.ez-dragging { opacity: 0.45; }
[data-ezyreka-root] .ez-layer-item.ez-drop-before { box-shadow: 0 -3px 0 -1px var(--ez-accent); }
[data-ezyreka-root] .ez-layer-item.ez-drop-after { box-shadow: 0 3px 0 -1px var(--ez-accent); }
[data-ezyreka-root] .ez-layer-item {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  min-height: 40px; padding: 8px; border-radius: var(--ez-panel-radius); border: 1px solid var(--ez-border); background: var(--ez-surface);
}
[data-ezyreka-root] .ez-layer-item:hover { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-layer-item.ez-active { border-color: var(--ez-accent); background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-layer-name {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  font-size: 12px; font-weight: 500; cursor: pointer;
}
[data-ezyreka-root] .ez-layer-name svg { width: 14px; height: 14px; fill: none; stroke: var(--ez-text-dim); flex-shrink: 0; }
[data-ezyreka-root] .ez-layer-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
[data-ezyreka-root] .ez-layer-actions { display: flex; flex-shrink: 0; gap: 2px; }
[data-ezyreka-root] .ez-layer-actions .ez-icon-btn { width: 24px; height: 24px; color: var(--ez-text-dim); }
[data-ezyreka-root] .ez-layer-actions .ez-icon-btn:hover { color: var(--ez-text); }

[data-ezyreka-root] .ez-canvas-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
[data-ezyreka-root] .ez-viewport {
  flex: 1; overflow: auto; display: flex; position: relative;
  background: var(--ez-canvas-bg);
  background-image: radial-gradient(var(--ez-canvas-dot) 1px, transparent 1px);
  background-size: 22px 22px;
}
[data-ezyreka-root] .ez-viewport.ez-panning { cursor: grabbing !important; }
[data-ezyreka-root] .ez-stage-wrap {
  margin: auto;
  padding: 48px;
  min-width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
[data-ezyreka-root] .ez-stage {
  position: relative; margin: 0; padding: 0;
  box-shadow: 0 2px 18px rgba(20, 20, 50, 0.14);
  flex-shrink: 0;
  touch-action: none;
}
[data-ezyreka-root] .ez-stage canvas, [data-ezyreka-root] .ez-overlay { touch-action: none; }
[data-ezyreka-root] .ez-stage canvas { display: block; background: #fff; }
.ez-editor[data-ezyreka-root] input, .ez-editor[data-ezyreka-root] [contenteditable] { user-select: text; }
[data-ezyreka-root] .ez-overlay { position: absolute; inset: 0; overflow: visible; pointer-events: none; }

[data-ezyreka-root] .ez-sel-box {
  position: absolute; border: 1.6px solid var(--ez-accent);
  pointer-events: none;
}
[data-ezyreka-root] .ez-sel-box.ez-multi { border-style: dashed; }
[data-ezyreka-root] .ez-sel-name {
  position: absolute; transform: translate(0, -130%);
  background: var(--ez-accent); color: #fff; font-size: 11px; font-weight: 600;
  padding: 2px 7px; border-radius: 5px; white-space: nowrap;
}
[data-ezyreka-root] .ez-handle {
  position: absolute; width: 11px; height: 11px; border-radius: 50%;
  background: #fff; border: 1.6px solid var(--ez-accent);
  pointer-events: auto; z-index: 5;
}
[data-ezyreka-root] .ez-handle[data-dir='n'], [data-ezyreka-root] .ez-handle[data-dir='s'] { cursor: ns-resize; left: 50%; margin-left: -5.5px; }
[data-ezyreka-root] .ez-handle[data-dir='e'], [data-ezyreka-root] .ez-handle[data-dir='w'] { cursor: ew-resize; top: 50%; margin-top: -5.5px; }
[data-ezyreka-root] .ez-handle[data-dir='nw'], [data-ezyreka-root] .ez-handle[data-dir='se'] { cursor: nwse-resize; }
[data-ezyreka-root] .ez-handle[data-dir='ne'], [data-ezyreka-root] .ez-handle[data-dir='sw'] { cursor: nesw-resize; }
[data-ezyreka-root] .ez-handle[data-dir='nw'] { left: -6px; top: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='ne'] { right: -6px; top: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='se'] { right: -6px; bottom: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='sw'] { left: -6px; bottom: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='n'] { top: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='s'] { bottom: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='e'] { right: -6px; }
[data-ezyreka-root] .ez-handle[data-dir='w'] { left: -6px; }
[data-ezyreka-root] .ez-rotate-handle {
  position: absolute; left: 50%; top: -34px; width: 22px; height: 22px;
  margin-left: -11px; border-radius: 50%; background: #fff;
  border: 1.6px solid var(--ez-accent); pointer-events: auto; cursor: grab; z-index: 5;
  display: flex; align-items: center; justify-content: center;
}
[data-ezyreka-root] .ez-rotate-handle::after {
  content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--ez-accent);
}
[data-ezyreka-root] .ez-guide { position: absolute; background: #FF6600; pointer-events: none; z-index: 8; }
[data-ezyreka-root] .ez-guide.ez-guide-x { width: 1.5px; }
[data-ezyreka-root] .ez-guide.ez-guide-y { height: 1.5px; }
[data-ezyreka-root] .ez-band {
  position: absolute; display: none; border: 1px solid var(--ez-accent);
  background: rgba(255, 102, 0, 0.12); pointer-events: none; z-index: 4;
}
[data-ezyreka-root] .ez-text-editor {
  position: absolute; outline: 1.6px solid var(--ez-accent);
  background: transparent; cursor: text; pointer-events: auto;
  white-space: pre-wrap; word-break: break-word; overflow: hidden;
  user-select: text; z-index: 10; caret-color: #000;
}

[data-ezyreka-root] .ez-pagesbar {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 12px; background: var(--ez-panel);
  border-top: 1px solid var(--ez-border); flex-shrink: 0; flex-wrap: wrap; z-index: 20;
}
[data-ezyreka-root] .ez-page-chip {
  display: flex; align-items: center; gap: 7px;
  border: 1.5px solid var(--ez-border); background: var(--ez-surface); border-radius: 6px;
  padding: 5px 10px; font-size: 12px; font-weight: 600; color: var(--ez-text-dim);
}
[data-ezyreka-root] .ez-page-chip:hover { border-color: var(--ez-border-strong); }
[data-ezyreka-root] .ez-page-chip.ez-active { border-color: var(--ez-accent); color: var(--ez-text); background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-page-num {
  width: 18px; height: 18px; border-radius: 6px; background: var(--ez-hover);
  display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
}
[data-ezyreka-root] .ez-page-chip.ez-active .ez-page-num { background: var(--ez-accent); color: #fff; }
[data-ezyreka-root] .ez-page-chip.ez-dragging { opacity: 0.45; }
[data-ezyreka-root] .ez-page-chip.ez-drop-before { box-shadow: -3px 0 0 -1px var(--ez-accent); }
[data-ezyreka-root] .ez-page-chip.ez-drop-after { box-shadow: 3px 0 0 -1px var(--ez-accent); }
[data-ezyreka-root] .ez-page-actions { display: flex; align-items: center; gap: 2px; margin-left: 6px; }

[data-ezyreka-root] .ez-floating-toolbar {
  position: absolute; display: none; align-items: center; gap: 2px;
  background: var(--ez-panel); border: 1px solid var(--ez-border);
  border-radius: 10px; padding: 4px; z-index: 40;
  box-shadow: 0 8px 28px rgba(15, 15, 20, 0.13), 0 2px 6px rgba(15, 15, 20, 0.05);
  max-width: calc(100% - 16px); flex-wrap: wrap;
}
[data-ezyreka-root] .ez-tool-toggle {
  min-width: 32px; height: 32px; border: none; border-radius: 6px;
  background: transparent; color: var(--ez-text); font-size: 13px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 6px;
}
[data-ezyreka-root] .ez-tool-toggle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; }
[data-ezyreka-root] .ez-tool-toggle:hover { background: var(--ez-hover); }
[data-ezyreka-root] .ez-tool-toggle.ez-active { background: var(--ez-accent-soft); color: var(--ez-accent); }
[data-ezyreka-root] .ez-floating-toolbar .ez-btn { height: 32px; }
[data-ezyreka-root] .ez-toolbar-sep-actions { display: flex; align-items: center; gap: 2px; position: relative; padding-left: 10px; margin-left: 2px; }
[data-ezyreka-root] .ez-toolbar-sep-actions::before {
  content: ''; position: absolute; inset-inline-start: 0; top: 25%; height: 50%; width: 1px;
  background: var(--ez-border);
}
[data-ezyreka-root] .ez-input {
  height: 32px; border: 1px solid var(--ez-border); border-radius: 6px;
  padding: 0 7px; font-size: 12.5px; background: var(--ez-surface); color: var(--ez-text); font-family: inherit;
}
[data-ezyreka-root] .ez-input:focus { outline: none; border-color: var(--ez-accent); }
[data-ezyreka-root] .ez-font-select { width: 132px; }
[data-ezyreka-root] .ez-num-wrap { display: inline-flex; align-items: center; gap: 4px; }
[data-ezyreka-root] .ez-num-label { font-size: 12px; font-weight: 600; color: var(--ez-text-dim); }
[data-ezyreka-root] .ez-num-input { width: 56px; }
[data-ezyreka-root] .ez-color-wrap {
  display: block; position: relative; width: 32px; height: 32px; border-radius: 6px;
  border: 1px solid var(--ez-border); overflow: hidden; cursor: pointer; flex-shrink: 0;
}
[data-ezyreka-root] .ez-color-wrap:focus-within { outline: 2px solid var(--ez-accent); outline-offset: 1px; }
[data-ezyreka-root] .ez-color-input {
  position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
  border: none; padding: 0; opacity: 0; cursor: pointer;
}
[data-ezyreka-root] .ez-color-field { display: inline-flex; align-items: center; gap: 4px; }
[data-ezyreka-root] .ez-hex-input {
  width: 62px; padding: 2px 6px; font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

[data-ezyreka-root] .ez-menu {
  position: absolute; z-index: 100; min-width: 190px;
  background: var(--ez-panel); border: 1px solid var(--ez-border); border-radius: 10px;
  box-shadow: 0 8px 28px rgba(15, 15, 20, 0.13), 0 2px 6px rgba(15, 15, 20, 0.05); padding: 5px;
}
[data-ezyreka-root] .ez-menu-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 6px; font-size: 13px; font-weight: 500;
  cursor: pointer; color: var(--ez-text);
}
[data-ezyreka-root] .ez-menu-item svg { width: 14px; height: 14px; fill: none; stroke: currentColor; opacity: 0.75; }
[data-ezyreka-root] .ez-menu-item:hover { background: var(--ez-accent-soft); }
[data-ezyreka-root] .ez-menu-item.ez-danger { color: var(--ez-danger); }
[data-ezyreka-root] .ez-menu-item.ez-danger:hover { background: var(--ez-danger-soft); }
[data-ezyreka-root] .ez-menu-item.ez-disabled { opacity: 0.45; pointer-events: none; }
[data-ezyreka-root] .ez-menu-shortcut { margin-left: auto; font-size: 11px; color: var(--ez-text-dim); }
[data-ezyreka-root] .ez-menu-sep { height: 1px; background: var(--ez-border); margin: 5px 8px; }

.ez-editor[data-ezyreka-root].ez-dark {
  --ez-accent: #ff8533;
  --ez-accent-soft: #3d2110;
  --ez-bg: #17181d;
  --ez-panel: #23252b;
  --ez-border: #383a41;
  --ez-text: #e8e9ee;
  --ez-text-dim: #9a9da8;
  --ez-danger: #fb7185;
  --ez-surface: #2b2d34;
  --ez-surface-2: #26282e;
  --ez-surface-3: #303239;
  --ez-hover: #34363d;
  --ez-border-strong: #4a4c55;
  --ez-canvas-bg: #1d1e23;
  --ez-canvas-dot: #2c2d33;
  --ez-scrollbar: #43454d;
  --ez-danger-soft: #401f27;
}
.ez-editor[data-ezyreka-root].ez-dark .ez-stage { box-shadow: 0 2px 24px rgba(0, 0, 0, 0.5); }
.ez-editor[data-ezyreka-root].ez-dark .ez-floating-toolbar { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); }
.ez-editor[data-ezyreka-root].ez-dark .ez-menu { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55); }
.ez-editor[data-ezyreka-root].ez-dark .ez-swatch { border-color: rgba(255, 255, 255, 0.15); }
`;
