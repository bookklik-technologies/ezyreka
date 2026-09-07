# Document & element schema

Ezyreka designs are plain JSON documents — portable, diffable and safe to persist anywhere.

## Document

```ts
interface DesignDocument {
  version: number
  pages: DesignPage[]
}

interface DesignPage {
  width: number   // px
  height: number  // px
  background: PageBackground
  elements: DesignElement[]
}

interface PageBackground {
  type: 'solid' | 'gradient' | 'image'
  color?: string
  from?: string
  to?: string
  angle?: number
  src?: string
}
```

```js
{
  version: 1,
  pages: [
    {
      width: 1080,
      height: 1080,
      background: { type: 'solid', color: '#ffffff' },
      elements: [/* … */]
    }
  ]
}
```

## Element

```ts
interface DesignElement {
  id?: string
  type: 'text' | 'rect' | 'ellipse' | 'triangle' | 'star' | 'hexagon'
      | 'diamond' | 'heart' | 'line' | 'image' | 'icon' | 'shape' | 'chart'
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  opacity?: number
  locked?: boolean
  hidden?: boolean
  flipX?: boolean
  flipY?: boolean
}
```

| Field | Description |
| --- | --- |
| `x`, `y` | Top-left position (unrotated) |
| `w`, `h` | Width and height |
| `rotation` | Degrees, rotates around center |
| `opacity` | 0–1 |
| `locked` / `hidden` | Read-only / invisible (also excluded from exports) |
| `flipX` / `flipY` | Flips around the center |

## Text fields

| Field | Type | Notes |
| --- | --- | --- |
| `text` | `string` | Content, wraps at box width |
| `fontSize` | `number` | px |
| `fontFamily` | `string` | Any registered family |
| `fontWeight` | `number` | 100–900 |
| `italic` / `underline` | `boolean` | — |
| `align` | `'left' \| 'center' \| 'right'` | — |
| `color` | `string` | Text color |
| `lineHeight` | `number` | Multiplier |
| `letterSpacing` | `number` | px |

## Shape fields

| Field | Type | Notes |
| --- | --- | --- |
| `fill` | `string \| GradientFill` | solid hex, `'none'`, or gradient object |
| `stroke` | `string` | hex, empty = none |
| `strokeWidth` | `number` | px |
| `radius` | `number` | rect only |

```ts
interface GradientFill {
  type: 'gradient'
  from?: string
  to?: string
  /** Multi-stop gradient; when present it overrides from/to. */
  stops?: { color: string, offset: number }[]
  /** Degrees clockwise from left-to-right (0); defaults to 135. */
  angle?: number
}
```

Angles run clockwise: `0` is left to right, `90` is top to bottom.

## Line / arrow fields

| Field | Type | Notes |
| --- | --- | --- |
| `stroke` / `strokeWidth` | — | Line color and thickness |
| `arrow` | `boolean` | Renders an arrow head |

## Image fields

| Field | Type |
| --- | --- |
| `src` | `string` — data URL or remote URL |

## Icon fields

| Field | Type | Notes |
| --- | --- | --- |
| `icon` | `string` | Icon registry name |
| `iconStyle` | `'solid' \| 'outline'` | Outline falls back to solid when missing |
| `fill` | `string` | Icon color in both styles |

Documents without `iconStyle` keep their solid appearance.

## Vector shape fields

| Field | Type | Notes |
| --- | --- | --- |
| `shape` | `string` | e.g. `pentagon`, `burst`, `ring`, `blob`, `speech-bubble` |

Rendered through the shapes registry; custom entries are added with `registerShapes()`.

## Chart fields

| Field | Type | Notes |
| --- | --- | --- |
| `chart` | `ChartConfig` | Full chart configuration |

```ts
interface ChartConfig {
  type: 'bar' | 'row' | 'grouped-bar' | 'line' | 'multi-line'
      | 'pie' | 'donut' | 'area' | 'stacked-area'
  categories: string[]
  series: { name: string, values: (number | null)[], color?: string }[]
  categoryColors?: string[]
  title?: string
  showLegend?: boolean
  showValues?: boolean
  showAxes?: boolean
  showGrid?: boolean
  fontSize?: number
  textColor?: string
}
```

- `null` values represent missing data
- Pie/donut values must be non-negative
- Invalid non-finite values normalize to missing values

## Round-tripping

- `getJSON()` deep-clones the document
- `loadJSON(doc)` normalizes the input and assigns fresh ids
- `downloadJSON()` saves the document as a file
- PNG/JPEG exports render gradients, charts and custom renderers
