export const GOOGLE_FONTS = [
  'Poppins:wght@400;600;700;800',
  'Inter:wght@400;600;700;800',
  'Montserrat:wght@400;600;700;800',
  'Playfair+Display:wght@400;700',
  'Lobster',
  'Bebas+Neue',
  'Rubik:wght@400;600;700'
].join('&family=');

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
  '#ffffff', '#f1f5f9', '#cbd5e1', '#64748b', '#1e293b', '#000000',
  '#fecaca', '#ef4444', '#b91c1c', '#fed7aa', '#f97316', '#c2410c',
  '#fde68a', '#f59e0b', '#b45309', '#fef08a', '#eab308', '#84cc16',
  '#a7f3d0', '#10b981', '#047857', '#99f6e4', '#14b8a6', '#0f766e',
  '#bae6fd', '#0ea5e9', '#0369a1', '#c7d2fe', '#6366f1', '#4338ca',
  '#e9d5ff', '#a855f7', '#7d2ae8', '#fbcfe8', '#ec4899', '#be185d'
];

export const GRADIENTS = [
  { from: '#7d2ae8', to: '#f857a6', angle: 135 },
  { from: '#0ea5e9', to: '#22d3ee', angle: 135 },
  { from: '#f59e0b', to: '#ef4444', angle: 135 },
  { from: '#10b981', to: '#84cc16', angle: 135 },
  { from: '#6366f1', to: '#ec4899', angle: 160 },
  { from: '#0f172a', to: '#475569', angle: 135 },
  { from: '#fda4af', to: '#fed7aa', angle: 135 },
  { from: '#111111', to: '#333333', angle: 90 }
];

export const SHAPES = [
  { type: 'rect', label: 'Square', svg: '<rect x="12" y="12" width="76" height="76" rx="4" />' },
  { type: 'rect', label: 'Rounded', props: { radius: 24 }, svg: '<rect x="12" y="12" width="76" height="76" rx="24" />' },
  { type: 'ellipse', label: 'Circle', svg: '<circle cx="50" cy="50" r="38" />' },
  { type: 'triangle', label: 'Triangle', svg: '<polygon points="50,12 90,86 10,86" />' },
  { type: 'star', label: 'Star', svg: '<polygon points="50,6 61,38 95,38 67,59 78,92 50,72 22,92 33,59 5,38 39,38" />' },
  { type: 'hexagon', label: 'Hexagon', svg: '<polygon points="26,8 74,8 96,50 74,92 26,92 4,50" />' },
  { type: 'diamond', label: 'Diamond', svg: '<polygon points="50,6 94,50 50,94 6,50" />' },
  { type: 'heart', label: 'Heart', svg: '<path d="M50 86 C22 64 8 47 8 31 C8 17 19 9 30 9 C39 9 46 15 50 23 C54 15 61 9 70 9 C81 9 92 17 92 31 C92 47 78 64 50 86 Z" />' },
  { type: 'line', label: 'Line', props: { w: 260, h: 0, strokeWidth: 6 }, svg: '<line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" stroke-width="6" fill="none" />' },
  { type: 'line', label: 'Arrow', props: { w: 260, h: 140, arrow: true }, svg: '<line x1="10" y1="88" x2="76" y2="88" stroke="currentColor" stroke-width="6" fill="none"/><polygon points="76,74 94,88 76,102" />' }
];

export const ICONS = {
  star: 'M12 1.8l3 6.4 7 .9-5.2 4.8 1.4 6.9L12 17.4 5.8 20.8l1.4-6.9L2 9.1l7-.9z',
  heart: 'M12 21.2S3.6 15.8 1.9 10.4C.7 6.6 3.2 3 6.8 3 9 3 10.9 4.2 12 6c1.1-1.8 3-3 5.2-3 3.6 0 6.1 3.6 4.9 7.4C20.4 15.8 12 21.2 12 21.2z',
  check: 'M9.5 17.6l-4.8-4.8 1.7-1.7 3.1 3.1 8.1-8.1 1.7 1.7z',
  'arrow-right': 'M4 10.5h11.2l-4.6-4.6L12 4.5l7.5 7.5-7.5 7.5-1.4-1.4 4.6-4.6H4z',
  sun: 'M12 6.5A5.5 5.5 0 1 1 6.5 12 5.5 5.5 0 0 1 12 6.5zm0-5.5l1.8 3.4h-3.6zM12 23l-1.8-3.4h3.6zM1 12l3.4-1.8v3.6zM23 12l-3.4 1.8v-3.6zM4.2 4.2l3.8 1.5-2.3 2.3zM19.8 19.8L16 18.3l2.3-2.3zM19.8 4.2l-1.5 3.8L16 5.7zM4.2 19.8l1.5-3.8 2.3 2.3z',
  moon: 'M20.4 14.2A8.8 8.8 0 0 1 9.8 3.6 9.2 9.2 0 1 0 20.4 14.2z',
  cloud: 'M6.5 19a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 17.8 8.6 4 4 0 0 1 17.5 19z',
  home: 'M12 3l9 8h-2.5v9.5H14V15h-4v5.5H5.5V11H3z',
  mail: 'M2 5h20v14H2zm2 2.4V17h16V7.4l-8 5.4zm14.6-.4H5.4l6.6 4.4z',
  phone: 'M6.6 3c.5 0 1 .3 1.2.8l1.7 3.6c.2.5.1 1.1-.3 1.5L7.8 10.3a13.4 13.4 0 0 0 5.9 5.9l1.4-1.4c.4-.4 1-.5 1.5-.3l3.6 1.7c.5.2.8.7.8 1.2v3.1c0 .8-.6 1.4-1.4 1.4C10.2 21.9 2.1 13.8 2.1 4.4 2.1 3.6 2.7 3 3.5 3z',
  camera: 'M9 4l-1.5 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4zm3 5.5A4.5 4.5 0 1 1 7.5 14 4.5 4.5 0 0 1 12 9.5zm0 2A2.5 2.5 0 1 0 14.5 14 2.5 2.5 0 0 0 12 11.5z',
  user: 'M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 9c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5z',
  calendar: 'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm14 8v10H5V10zM7 12v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2z',
  clock: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5v5.2l4 2.4-.8 1.4L11 13V7z',
  chat: 'M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2z',
  search: 'M10 3a7 7 0 1 1-4.4 12.4l-4 4L.2 18l4-4A7 7 0 0 1 10 3zm0 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5z',
  bell: 'M12 2a6 6 0 0 1 6 6v4l2 3v1H4v-1l2-3V8a6 6 0 0 1 6-6zm-2.5 16h5A2.5 2.5 0 0 1 12 21.5 2.5 2.5 0 0 1 9.5 18z',
  gear: 'M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm-2 -6h4l.6 2.6 2.2 1.3 2.5-.9 2 3.5-2 1.7v2.6l2 1.7-2 3.5-2.5-.9-2.2 1.3L13.9 22h-4l-.6-2.6-2.2-1.3-2.5.9-2-3.5 2-1.7v-2.6l-2-1.7 2-3.5 2.5.9 2.2-1.3z',
  trash: 'M9 3h6l1 2h4v2H4V5h4zM5 8h14l-1 13H6z',
  chart: 'M4 20V4h2v14h14v2zm3-3V9h3v8zm5 0V5h3v12zm5 0v-6h3v6z'
};

export const UI_ICONS = {
  undo: '<path d="M4 8h9a5 5 0 0 1 0 10H8v-2h5a3 3 0 0 0 0-6H4l3.5 3.5L6.1 14.9 1.2 10l4.9-4.9 1.4 1.4z"/>',
  redo: '<path d="M20 8h-9a5 5 0 0 0 0 10h5v-2h-5a3 3 0 0 1 0-6h9l-3.5 3.5 1.4 1.4L22.8 10l-4.9-4.9-1.4 1.4z"/>',
  'zoom-in': '<path d="M10 3a7 7 0 1 1-4.4 12.4l-4 4L.2 18l4-4A7 7 0 0 1 10 3zm0 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm1 2v2h2v2h-2v2H9v-2H7V9h2V7z"/>',
  'zoom-out': '<path d="M10 3a7 7 0 1 1-4.4 12.4l-4 4L.2 18l4-4A7 7 0 0 1 10 3zm0 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zM7 9h6v2H7z"/>',
  fit: '<path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z"/>',
  download: '<path d="M11 3h2v9l3-3 1.4 1.4L12 15.8 6.6 10.4 8 9l3 3zM4 18h16v3H4z"/>',
  trash: '<path d="M9 3h6l1 2h4v2H4V5h4zM5 8h14l-1 13H6z"/>',
  copy: '<path d="M8 2h12v14h-4V6H8zm-4 4h12v14H4z" fill-rule="evenodd"/>',
  lock: '<path d="M6 10V7a6 6 0 0 1 12 0v3h1.5v12h-15V10zm3 0h6V7a3 3 0 0 0-6 0z"/>',
  unlock: '<path d="M6 10V7a6 6 0 0 1 11.7-2l-1.9.6A4 4 0 0 0 8 7v3h11.5v12h-15V10z"/>',
  eye: '<path d="M12 5c5 0 9.3 3 11 7-1.7 4-6 7-11 7S2.7 16 1 12c1.7-4 6-7 11-7zm0 3a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z"/>',
  'eye-off': '<path d="M2 3.3 3.3 2l18.7 18.7-1.3 1.3-3.5-3.5A12.6 12.6 0 0 1 12 19C7 19 2.7 16 1 12a13 13 0 0 1 4.5-5.2zM12 5c5 0 9.3 3 11 7a13.4 13.4 0 0 1-3.4 4.4L16 12.8A4 4 0 0 0 11.2 8L9.5 6.3A12 12 0 0 1 12 5z"/>',
  front: '<path d="M4 4h10v10H4zm6 12h6v-6h2v8h-8zm-6 6v-2h2v2zm4 0v-2h2v2zm4 0v-2h2v2zm4 0v-2h2v2zm2-4h2v2h-2zm0-4h2v2h-2zm-2-2h-2v-2h2z" fill-rule="evenodd"/>',
  back: '<path d="M20 20H10V10h10zm-6-12H8v6H6V6h8zm-6 6H4v-4h2zm-2 4v-2h2v2zm4 4v-2h2v2z" fill-rule="evenodd"/>',
  plus: '<path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/>',
  close: '<path d="M5.7 4.3 12 10.6l6.3-6.3 1.4 1.4L13.4 12l6.3 6.3-1.4 1.4L12 13.4l-6.3 6.3-1.4-1.4L10.6 12 4.3 5.7z"/>',
  chevron: '<path d="M7 10l5 5 5-5z"/>',
  image: '<path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 12v2h14v-5l-4-4-6 6-2-2zm3-8.5A2.5 2.5 0 1 0 10.5 10 2.5 2.5 0 0 0 8 7.5z"/>',
  layers: '<path d="M12 2 2 8l10 6 10-6zm-8.5 9.7L12 17l8.5-5.3L22 12.7l-10 6.3-10-6.3z"/>',
  text: '<path d="M5 4h14v4h-2V6h-4v13h2.5v2h-7v-2H11V6H7v2H5z"/>',
  shapes: '<path d="M9 2a7 7 0 0 1 7 7c0 .3 0 .7-.1 1H17a6 6 0 1 1-6 6v-1.1A7 7 0 0 1 9 2zm0 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm7 9a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" fill-rule="evenodd"/>',
  templates: '<path d="M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z"/>',
  upload: '<path d="M12 3l5.4 5.4-1.4 1.4L13 6.8V16h-2V6.8L8 9.8 6.6 8.4zM4 18h16v3H4z"/>',
  palette: '<path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 1.8-4.2c-.4-.5-.5-.8-.5-1.3a2 2 0 0 1 2-2H18a4 4 0 0 0 4-4c0-4.7-4.5-8.5-10-8.5zM6.5 12a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 6.5 12zM10 7.5A1.5 1.5 0 1 1 11.5 6 1.5 1.5 0 0 1 10 7.5zm5.5.5A1.5 1.5 0 1 1 17 6.5 1.5 1.5 0 0 1 15.5 8z"/>',
  alignLeft: '<path d="M3 4h18v2H3zm0 5h12v2H3zm0 5h18v2H3zm0 5h12v2H3z"/>',
  alignCenter: '<path d="M3 4h18v2H3zm3 5h12v2H6zm-3 5h18v2H3zm3 5h12v2H6z"/>',
  alignRight: '<path d="M3 4h18v2H3zm6 5h12v2H9zm-6 5h18v2H3zm6 5h12v2H9z"/>',
  bold: '<path d="M6 3h7a4.5 4.5 0 0 1 3.2 7.7A5 5 0 0 1 14 20.5H6zm3 3v4h4a2 2 0 0 0 0-4zm0 7v4.5h4.5a2.25 2.25 0 0 0 0-4.5z"/>',
  italic: '<path d="M10 3h9v2.5h-3.2l-4 13H15V21H6v-2.5h3.2l4-13H10z"/>',
  underline: '<path d="M6 3h2.5v8a3.5 3.5 0 0 0 7 0V3H18v8a6 6 0 0 1-12 0zM4 19h16v2H4z"/>',
  grid: '<path d="M3 3h5v5H3zm6.5 0h5v5h-5zM16 3h5v5h-5zM3 9.5h5v5H3zm6.5 0h5v5h-5zm6.5 0h5v5h-5zM3 16h5v5H3zm6.5 0h5v5h-5zm6.5 0h5v5h-5z"/>',
  duplicate: '<path d="M8 2h12v14h-4V6H8zm-4 4h12v14H4zm2 2v10h8V8z" fill-rule="evenodd"/>'
};

function buildTemplates() {
  return [
    {
      name: 'Instagram Post',
      page: {
        width: 1080,
        height: 1080,
        background: { type: 'gradient', from: '#7d2ae8', to: '#f857a6', angle: 135 },
        elements: [
          { type: 'ellipse', x: 700, y: -220, w: 700, h: 700, fill: 'rgba(255,255,255,0.14)' },
          { type: 'ellipse', x: -260, y: 760, w: 640, h: 640, fill: 'rgba(255,255,255,0.10)' },
          { type: 'text', text: 'Summer Vibes', x: 90, y: 380, w: 900, h: 140, fontSize: 120, fontWeight: 800, fontFamily: 'Poppins', color: '#ffffff', align: 'center' },
          { type: 'text', text: 'Design your story with SenangDesign', x: 190, y: 560, w: 700, h: 60, fontSize: 38, fontWeight: 400, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.9)', align: 'center' },
          { type: 'rect', x: 400, y: 700, w: 280, h: 90, radius: 45, fill: '#ffffff' },
          { type: 'text', text: 'Get Started', x: 400, y: 726, w: 280, h: 44, fontSize: 32, fontWeight: 600, color: '#7d2ae8', align: 'center' }
        ]
      }
    },
    {
      name: 'Presentation',
      page: {
        width: 1920,
        height: 1080,
        background: { type: 'solid', color: '#ffffff' },
        elements: [
          { type: 'rect', x: 0, y: 0, w: 18, h: 1080, fill: '#7d2ae8' },
          { type: 'text', text: 'Quarterly Report', x: 140, y: 200, w: 1000, h: 120, fontSize: 96, fontWeight: 800, fontFamily: 'Inter', color: '#1e293b' },
          { type: 'rect', x: 146, y: 360, w: 140, h: 14, fill: '#7d2ae8' },
          { type: 'text', text: 'Highlights from this quarter:\n• Revenue grew 24% quarter over quarter\n• Shipped 3 major product releases\n• Customer satisfaction at an all-time high', x: 146, y: 440, w: 900, h: 260, fontSize: 34, fontWeight: 400, fontFamily: 'Inter', color: '#475569', lineHeight: 1.6 },
          { type: 'rect', x: 1250, y: 120, w: 520, h: 840, radius: 32, fill: '#f3ecff' },
          { type: 'icon', icon: 'chart', x: 1420, y: 420, w: 180, h: 180, fill: '#7d2ae8' }
        ]
      }
    },
    {
      name: 'Sale Poster',
      page: {
        width: 1080,
        height: 1350,
        background: { type: 'solid', color: '#101014' },
        elements: [
          { type: 'icon', icon: 'star', x: 480, y: 160, w: 120, h: 120, fill: '#ffd166' },
          { type: 'text', text: 'BIG SALE', x: 40, y: 380, w: 1000, h: 240, fontSize: 220, fontWeight: 400, fontFamily: 'Bebas Neue', color: '#ffffff', align: 'center', letterSpacing: 8 },
          { type: 'text', text: 'UP TO 50% OFF EVERYTHING', x: 140, y: 680, w: 800, h: 60, fontSize: 42, fontWeight: 600, fontFamily: 'Poppins', color: '#ffd166', align: 'center' },
          { type: 'rect', x: 340, y: 860, w: 400, h: 110, radius: 55, fill: '#ffd166' },
          { type: 'text', text: 'SHOP NOW', x: 340, y: 893, w: 400, h: 50, fontSize: 38, fontWeight: 700, fontFamily: 'Poppins', color: '#101014', align: 'center' }
        ]
      }
    },
    {
      name: 'Business Card',
      page: {
        width: 1050,
        height: 600,
        background: { type: 'solid', color: '#ffffff' },
        elements: [
          { type: 'rect', x: 0, y: 0, w: 26, h: 600, fill: '#7d2ae8' },
          { type: 'text', text: 'Aisyah Rahman', x: 90, y: 170, w: 600, h: 70, fontSize: 52, fontWeight: 700, fontFamily: 'Poppins', color: '#1e293b' },
          { type: 'text', text: 'Creative Director', x: 92, y: 250, w: 600, h: 40, fontSize: 26, fontWeight: 400, fontFamily: 'Poppins', color: '#64748b' },
          { type: 'rect', x: 92, y: 310, w: 90, h: 6, fill: '#7d2ae8' },
          { type: 'text', text: 'hello@senangdesign.com  ·  +60 12 345 6789\nwww.senangdesign.com', x: 92, y: 400, w: 620, h: 70, fontSize: 20, fontWeight: 400, fontFamily: 'Inter', color: '#475569', lineHeight: 1.6 }
        ]
      }
    }
  ];
}

export const TEMPLATES = buildTemplates();
