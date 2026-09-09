import { EXTRA_SHAPES, EXTRA_ICONS, GEAR_PATH, SHAPE_PATHS, ICON_OUTLINES } from './element-artwork.js';
export { SHAPE_PATHS, ICON_OUTLINES } from './element-artwork.js';

// Single source of truth for the built-in Google Fonts. styles.js builds the
// webfont <link> from this array; registry.js extends it with user fonts.
export const GOOGLE_FONT_FAMILIES = [
  'Poppins:wght@400;600;700;800',
  'Inter:wght@400;600;700;800',
  'Montserrat:wght@400;600;700;800',
  'Playfair+Display:wght@400;700',
  'Lobster',
  'Bebas+Neue',
  'Rubik:wght@400;600;700'
];

export const FONTS = [
  'Poppins',
  'Inter',
  'Montserrat',
  'Playfair Display',
  'Lobster',
  'Bebas Neue',
  'Rubik',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Impact'
];

export const PALETTE = [
  '#FACC15', '#EAB308', '#CA8A04', '#FFF3C4', '#FF6600', '#E65100',
  '#ffffff', '#f1f5f9', '#cbd5e1', '#64748b', '#1e293b', '#000000',
  '#fecaca', '#ef4444', '#b91c1c', '#fed7aa', '#f97316', '#c2410c',
  '#fde68a', '#a7f3d0', '#10b981', '#047857', '#99f6e4', '#14b8a6',
  '#bae6fd', '#0ea5e9', '#0369a1', '#c7d2fe', '#6366f1', '#4338ca',
  '#e9d5ff', '#a855f7', '#7d2ae8', '#fbcfe8', '#ec4899', '#be185d'
];

export const GRADIENTS = [
  { from: '#FACC15', to: '#FF6600', angle: 135 },
  { from: '#0ea5e9', to: '#22d3ee', angle: 135 },
  { from: '#FF6600', to: '#ef4444', angle: 135 },
  { from: '#10b981', to: '#84cc16', angle: 135 },
  { from: '#6366f1', to: '#ec4899', angle: 160 },
  { from: '#0f172a', to: '#475569', angle: 135 },
  { from: '#fda4af', to: '#fed7aa', angle: 135 },
  { from: '#111111', to: '#333333', angle: 90 }
];

// Primitive previews derive from the same SHAPE_PATHS geometry the canvas
// renders, so panel artwork can never drift from output.
const shapePreview = (name) => `<path d="${SHAPE_PATHS[name]}" />`;

export const SHAPES = [
  { type: 'rect', label: 'Square', svg: '<rect x="12" y="12" width="76" height="76" />' },
  { type: 'rect', label: 'Rounded', props: { radius: 40 }, svg: '<rect x="12" y="12" width="76" height="76" rx="15.2" />' },
  { type: 'ellipse', label: 'Circle', svg: shapePreview('ellipse') },
  { type: 'triangle', label: 'Triangle', svg: shapePreview('triangle') },
  { type: 'star', label: 'Star', svg: shapePreview('star') },
  { type: 'hexagon', label: 'Hexagon', svg: shapePreview('hexagon') },
  { type: 'diamond', label: 'Diamond', svg: shapePreview('diamond') },
  { type: 'heart', label: 'Heart', svg: shapePreview('heart') },
  { type: 'line', label: 'Line', props: { w: 260, h: 0, strokeWidth: 6 }, svg: '<line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" stroke-width="6" fill="none" />' },
  { type: 'line', label: 'Arrow', props: { w: 260, h: 0, arrow: true, strokeWidth: 6 }, svg: '<path d="M10 50H66" stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M88 50L66 40V60Z" />' },
  ...EXTRA_SHAPES
];

// Single source of icon geometry: one entry per glyph pairing its solid and
// outline paths, so the two styles can never drift apart. The renderer and
// registries consume the derived ICONS / ICON_OUTLINES views.
const BASE_ICONS = {
  star: 'M12 1.8l3 6.4 7 .9-5.2 4.8 1.4 6.9L12 17.4 5.8 20.8l1.4-6.9L2 9.1l7-.9z',
  heart: 'M12 21.2S3.6 15.8 1.9 10.4C.7 6.6 3.2 3 6.8 3 9 3 10.9 4.2 12 6c1.1-1.8 3-3 5.2-3 3.6 0 6.1 3.6 4.9 7.4C20.4 15.8 12 21.2 12 21.2z',
  check: 'M2.5 12.5L5.5 9.5L9 13L18.5 3.5L21.5 6.5L9 19Z',
  'arrow-right': 'M3 9.5H13V3L22 12L13 21V14.5H3Z',
  sun: 'M12 6.5A5.5 5.5 0 1 1 6.5 12 5.5 5.5 0 0 1 12 6.5zm0-5.5l1.8 3.4h-3.6zM12 23l-1.8-3.4h3.6zM1 12l3.4-1.8v3.6zM23 12l-3.4 1.8v-3.6zM4.2 4.2l3.8 1.5-2.3 2.3zM19.8 19.8L16 18.3l2.3-2.3zM19.8 4.2l-1.5 3.8L16 5.7zM4.2 19.8l1.5-3.8 2.3 2.3z',
  moon: 'M20.4 14.2A8.8 8.8 0 0 1 9.8 3.6 9.2 9.2 0 1 0 20.4 14.2z',
  cloud: 'M6.5 19a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.8 8.6 4 4 0 0 1 17.5 19z',
  home: 'M12 3l9 8h-2.5v9.5H14V15h-4v5.5H5.5V11H3z',
  mail: 'M4 4H20A2 2 0 0 1 22 6V18A2 2 0 0 1 20 20H4A2 2 0 0 1 2 18V6A2 2 0 0 1 4 4ZM4 6.5L12 12L20 6.5V8.7L12 14.2L4 8.7Z',
  phone: 'M6.6 3c.5 0 1 .3 1.2.8l1.7 3.6c.2.5.1 1.1-.3 1.5L7.8 10.3a13.4 13.4 0 0 0 5.9 5.9l1.4-1.4c.4-.4 1-.5 1.5-.3l3.6 1.7c.5.2.8.7.8 1.2v3.1c0 .8-.6 1.4-1.4 1.4C10.2 21.9 2.1 13.8 2.1 4.4 2.1 3.6 2.7 3 3.5 3z',
  camera: 'M9 4l-1.5 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4zm3 5.5A4.5 4.5 0 1 1 7.5 14 4.5 4.5 0 0 1 12 9.5zm0 2A2.5 2.5 0 1 0 14.5 14 2.5 2.5 0 0 0 12 11.5z',
  user: 'M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 9c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5z',
  calendar: 'M7 2H9V4H15V2H17V4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4H7ZM5 8V10H19V8ZM6 12V14H8V12ZM11 12V14H13V12ZM16 12V14H18V12ZM6 17V19H8V17ZM11 17V19H13V17ZM16 17V19H18V17Z',
  clock: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v5.2l4 2.4-.8 1.4L11 13V7z',
  chat: 'M5 3H19Q22 3 22 6V15Q22 18 19 18H8L3 22V6Q3 3 5 3ZM7 7H17A1 1 0 0 1 17 9H7A1 1 0 0 1 7 7ZM7 11H14A1 1 0 0 1 14 13H7A1 1 0 0 1 7 11Z',
  search: 'M10 2A8 8 0 1 0 14.2 16.8L19.9 22.5L22.5 19.9L16.8 14.2A8 8 0 0 0 10 2ZM10 5.5A4.5 4.5 0 1 1 10 14.5A4.5 4.5 0 1 1 10 5.5Z',
  bell: 'M12 2a6 6 0 0 1 6 6v4l2 3v1H4v-1l2-3V8a6 6 0 0 1 6-6zm-2.5 16h5A2.5 2.5 0 0 1 12 21.5 2.5 2.5 0 0 1 9.5 18z',
  gear: GEAR_PATH,
  trash: 'M9 3h6l1 2h4v2H4V5h4zM5 8h14l-1 13H6z',
  chart: 'M4 20V4h2v14h14v2zm3-3V9h3v8zm5 0V5h3v12zm5 0v-6h3v6z'
};

export const ICON_PATHS = Object.fromEntries(
  [...Object.entries(BASE_ICONS), ...Object.entries(EXTRA_ICONS)]
    .map(([name, solid]) => [name, { solid, outline: ICON_OUTLINES[name] || solid }])
);

export const ICONS = Object.fromEntries(
  Object.entries(ICON_PATHS).map(([name, pair]) => [name, pair.solid])
);

// UI icons: Lucide (https://lucide.dev) - ISC License
const UI_ICON_PATHS = {"undo": '<path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />',
  "redo": '<path d="m15 14 5-5-5-5" /><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />',
  "zoom-in": '<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="11" x2="11" y1="8" y2="14" /><line x1="8" x2="14" y1="11" y2="11" />',
  "zoom-out": '<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="8" x2="14" y1="11" y2="11" />',
  "fit": '<path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />',
  "download": '<path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" />',
  "trash": '<path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
  "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
  "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
  "unlock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />',
  "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />',
  "eye-off": '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />',
  "front": '<rect x="8" y="8" width="8" height="8" rx="2" /><path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" /><path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />',
  "back": '<rect x="14" y="14" width="8" height="8" rx="2" /><rect x="2" y="2" width="8" height="8" rx="2" /><path d="M7 14v1a2 2 0 0 0 2 2h1" /><path d="M14 7h1a2 2 0 0 1 2 2v1" />',
  "plus": '<path d="M5 12h14" /><path d="M12 5v14" />',
  "close": '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  "chevron": '<path d="m6 9 6 6 6-6" />',
  "chart": '<path d="M3 3v18h18" /><path d="M7 17v-5M12 17V7M17 17V4" />',
  "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />',
  "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />',
  "text": '<path d="M12 4v16" /><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" /><path d="M9 20h6" />',
  "shapes": '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" /><rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="3.5" />',
  "templates": '<rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" />',
  "upload": '<path d="M12 3v12" /><path d="m17 8-5-5-5 5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
  "palette": '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />',
  "alignLeft": '<path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" />',
  "alignCenter": '<path d="M21 5H3" /><path d="M17 12H7" /><path d="M19 19H5" />',
  "alignRight": '<path d="M21 5H3" /><path d="M21 12H9" /><path d="M21 19H7" />',
  "bold": '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />',
  "italic": '<line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" />',
  "underline": '<path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" x2="20" y1="20" y2="20" />',
  "grid": '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />',
  "duplicate": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
  "sun": '<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />',
  "moon": '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />'
};

// UI consumers insert these strings directly into HTML, so each needs an SVG root.
export const UI_ICONS = Object.fromEntries(
  Object.entries(UI_ICON_PATHS).map(([name, markup]) => [
    name,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${markup}</svg>`
  ])
);

export { TEMPLATES } from './templates.js';
