// Original artwork on shared, padded view boxes. The picker and canvas use
// these same paths so cutouts, proportions and outline weights stay in sync.
const polygon = (sides, inner = 1) => {
  const count = inner === 1 ? sides : sides * 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
    const radius = 48 * (i % 2 ? inner : 1);
    return `${i ? 'L' : 'M'}${(50 + Math.cos(angle) * radius).toFixed(3)} ${(50 + Math.sin(angle) * radius).toFixed(3)}`;
  }).join(' ') + 'Z';
};

export const GEAR_PATH = Array.from({ length: 32 }, (_, i) => {
  const angle = (i - .5) * Math.PI / 16;
  const radius = i % 4 < 2 ? 10 : 8;
  return `${i ? 'L' : 'M'}${(12 + Math.cos(angle) * radius).toFixed(3)} ${(12 + Math.sin(angle) * radius).toFixed(3)}`;
}).join(' ') + 'ZM16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12Z';

import { SS_SHAPE_PATHS } from './senangstart-shapes.js';

export const SHAPE_PATHS = {
  // Primitives live here too, so their geometry has a single home shared by
  // the canvas renderer, the Elements panel previews and custom registries.
  ellipse: 'M0 50A50 50 0 1 1 100 50A50 50 0 1 1 0 50Z',
  triangle: 'M50 0L100 100L0 100Z',
  star: 'M50 6L61 38L95 38L67 59L78 92L50 72L22 92L33 59L5 38L39 38Z',
  hexagon: 'M26 8L74 8L96 50L74 92L26 92L4 50Z',
  diamond: 'M50 0L100 50L50 100L0 50Z',
  heart: 'M50 86C22 64 8 47 8 31C8 17 19 9 30 9C39 9 46 15 50 23C54 15 61 9 70 9C81 9 92 17 92 31C92 47 78 64 50 86Z',
  pentagon: polygon(5),
  octagon: polygon(8),
  'star-six': polygon(6, .52),
  'star-eight': polygon(8, .55),
  burst: polygon(16, .8),
  sparkle: 'M50 2C55 34 66 45 98 50C66 55 55 66 50 98C45 66 34 55 2 50C34 45 45 34 50 2Z',
  arch: 'M0 100V50A50 50 0 0 1 100 50V100Z',
  semicircle: 'M0 100A50 100 0 0 1 100 100Z',
  'quarter-circle': 'M0 0A100 100 0 0 1 100 100H0Z',
  ring: 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0ZM50 22A28 28 0 1 0 50 78A28 28 0 1 0 50 22Z',
  crescent: 'M78 4A50 50 0 1 0 78 96A48 48 0 0 1 78 4Z',
  droplet: 'M50 0C42 15 10 48 10 65A40 35 0 0 0 90 65C90 48 58 15 50 0Z',
  leaf: 'M3 97C-9 26 26-9 97 3C109 74 74 109 3 97Z',
  blob: 'M51 2C76-5 101 17 98 43C95 66 83 97 57 99C28 102 0 84 2 58C4 33 24 9 51 2Z',
  pebble: 'M16 15C36-3 72-6 89 16C106 38 99 76 79 92C57 108 21 98 7 75C-6 52 0 30 16 15Z',
  'speech-bubble': 'M18 4H82Q98 4 98 20V63Q98 79 82 79H42L16 98V79Q2 79 2 63V20Q2 4 18 4Z',
  ribbon: 'M0 12H100L82 50L100 88H0L18 50Z',
  chevron: 'M0 0H52L100 50L52 100H0L48 50Z',
  cross: 'M34 0H66V34H100V66H66V100H34V66H0V34H34Z',
  'arrow-block': 'M0 32H58V0L100 50L58 100V68H0Z',

  // SenangStart Shapes pack (solid variants, 0-100 geometry), generated from
  // @bookklik/senangstart-shapes — see scripts/build-ss-shapes.js. Prefixed
  // ids keep them namespaced so they can never replace built-in geometry.
  ...SS_SHAPE_PATHS
};

// Primitives render through the native element types; only the remaining
// vector paths become generic 'shape' panel entries.
const PRIMITIVE_SHAPE_KEYS = ['ellipse', 'triangle', 'star', 'hexagon', 'diamond', 'heart'];

export const EXTRA_SHAPES = [
  { type: 'rect', label: 'Rectangle', props: { w: 280, h: 160 }, svg: '<rect x="8" y="26" width="84" height="48" />' },
  { type: 'rect', label: 'Pill', props: { w: 280, h: 140, radius: 70 }, svg: '<rect x="8" y="29" width="84" height="42" rx="21" />' },
  { type: 'ellipse', label: 'Oval', props: { w: 280, h: 160 }, svg: '<ellipse cx="50" cy="50" rx="42" ry="24" />' },
  // The SS pack ships its own panel entries; its geometry keys stay excluded
  // from this auto-derivation.
  ...Object.keys(SHAPE_PATHS)
    .filter(name => !PRIMITIVE_SHAPE_KEYS.includes(name) && !name.startsWith('ss-'))
    .map(name => ({
    type: 'shape',
    label: name.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()),
    props: { shape: name, ...(name === 'semicircle' ? { w: 240, h: 120 } : {}) },
    svg: `<path d="${SHAPE_PATHS[name]}" transform="${name === 'semicircle' ? 'translate(8 29) scale(.84 .42)' : 'translate(8 8) scale(.84)'}" fill-rule="evenodd" />`
  }))
];
