// Per-editor registries: built-in libraries merged with consumer options.
// UI and rendering read from these instead of the module constants, so
// injection is instance-scoped rather than a shared mutable global.
import {
  FONTS,
  PALETTE,
  GRADIENTS,
  SHAPES,
  ICONS,
  ICON_OUTLINES,
  SHAPE_PATHS,
  GOOGLE_FONT_FAMILIES,
  TEMPLATES
} from './assets.js';

const asArray = (value, fallback) => (Array.isArray(value) ? value : fallback);

export function createRegistry(options = {}) {
  return {
    templates: [...TEMPLATES, ...deepList(options.templates)],
    fonts: [...new Set([...FONTS, ...asArray(options.fonts, [])])],
    googleFonts: [...GOOGLE_FONT_FAMILIES, ...asArray(options.googleFonts, [])],
    palette: asArray(options.palette, [...PALETTE]),
    gradients: asArray(options.gradients, [...GRADIENTS]),
    shapes: [...SHAPES],
    icons: { ...ICONS },
    iconOutlines: { ...ICON_OUTLINES },
    shapePaths: { ...SHAPE_PATHS },
    // Per-instance renderer overrides, consulted by renderer.js before the
    // module-level registries.
    elementRenderers: {},
    chartRenderers: {},
    backgroundPainters: {},
    // Image source providers for the Uploads panel (stock/CDN/brand assets).
    imageSources: asArray(options.imageSources, []),
    // Instance-scoped element type definitions and chart presets, used by
    // plugins (via the plugin context) so registrations never touch the
    // module-global tables. Instance entries resolve before global defaults.
    elementDefaults: {},
    elementManifests: {},
    chartPresets: {}
  };
}

function deepList(list) {
  if (!Array.isArray(list)) return [];
  // Own the registered data so later consumer mutations cannot leak in.
  return list.map((item) => JSON.parse(JSON.stringify(item)));
}
