# Layers

The Layers panel shows every element on the current page with visibility, lock and reorder controls.

## Reordering

- **Drag** a layer name or its grip above or below another layer — the insertion line shows where it will land
- The **top layer appears in front** on the canvas
- Focus a grip and use **Up/Down arrow keys** to reorder via keyboard

Reordering preserves selection and supports undo/redo.

## Layer actions

Each layer row offers:

- **Show / hide** — toggle visibility
- **Lock / unlock** — locked elements are not hit-testable
- **Delete** — remove the element
- **Select** — click to select on canvas

## Z-order from code

| Method | Description |
| --- | --- |
| `bringToFront()` | Move selection to the top |
| `bringForward()` | Move selection one step up |
| `sendBackward()` | Move selection one step down |
| `sendToBack()` | Move selection to the bottom |
| `moveLayer(from, to)` | Reorder by element-array index (0 is backmost); supports undo/redo |

```js
editor.select([rect.id])
editor.bringToFront()
```

## Element flags

| Flag | Effect |
| --- | --- |
| `hidden: true` | Not rendered on canvas or in exports |
| `locked: true` | Not selectable on canvas; read-only |
| `opacity: 0…1` | Opacity, supported across all element types |

```js
editor.updateSelected({ hidden: true })
```

## Sidebar layout

The sidebar uses a vertical **tool rail** with icons and labels:

- Click its top chevron (or the active tool) to collapse it to icons only
- Click a tool icon to reopen its panel
- Use Up/Down arrow keys to navigate focused tool tabs
