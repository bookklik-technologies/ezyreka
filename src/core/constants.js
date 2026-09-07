// Single source for the magic defaults previously duplicated across
// elements.js, toolbar.js, sidepanel.js and renderer.js.
export const ACCENT = '#d97706';
export const DEFAULT_FONT = 'Arial';
export const GRADIENT_FALLBACKS = { from: '#ffffff', to: '#eeeeee' };
export const CHART_FONT_STACK = 'Inter, Arial, sans-serif';
// Sidebar tab ids owned by the built-in sidepanel; plugin panels must not
// shadow them, and duplicate plugin panel ids are rejected within an editor.
export const BUILTIN_PANEL_IDS = ['templates', 'elements', 'text', 'charts', 'uploads', 'background', 'layers'];
