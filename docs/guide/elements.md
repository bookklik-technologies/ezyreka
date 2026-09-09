# Elements & shapes

Everything on the canvas is an element. Ezyreka supports text, basic shapes, vector shapes, lines/arrows, images, icons and editable charts.

## Element types

| Type | Description |
| --- | --- |
| `text` | Editable in-place text boxes with wrapping, alignment and letter spacing |
| `rect` | Rectangles with optional corner radius |
| `ellipse` | Ellipses and circles |
| `triangle` | Triangles |
| `star` | Five-pointed stars |
| `hexagon` | Hexagons |
| `diamond` | Diamonds |
| `heart` | Hearts |
| `line` | Lines and arrows |
| `image` | Raster images (uploads, data URLs, remote sources) |
| `icon` | SVG icons from the built-in icon library (41 icons, solid & outline) |
| `shape` | Vector shapes (33 presets — pentagon, burst, ring, blob, speech-bubble…) |
| `chart` | Editable data charts — see [Charts](/guide/charts) |

## Adding elements

Use `addElement()` for any registered type. Each omitted coordinate is centered in the viewport; explicit coordinates are preserved. It returns the element and commits history but does not select it:

```js
const rect = editor.addElement({
  type: 'rect',
  x: 100,
  y: 100,
  w: 400,
  h: 110,
  radius: 55,
  fill: '#FACC15'
})
```

`addText()` is a shortcut for text elements:

```js
const title = editor.addText({
  text: 'Hello Ezyreka',
  fontSize: 96,
  fontWeight: 800
})
```

Elements added through the API are returned with their generated `id`, so you can select them later:

```js
editor.select([rect.id])
```

## Fills, strokes and gradients

Shape and icon fills support:

- solid colors — `fill: '#FACC15'`
- no fill — `fill: 'none'`
- two-color linear gradients — `fill: { type: 'gradient', from, to, angle }`
- multi-stop gradients — `fill: { type: 'gradient', stops: [{ color, offset }…], angle }`

```js
// Two-color gradient
editor.updateSelected({
  fill: { type: 'gradient', from: '#FACC15', to: '#ffffff', angle: 135 }
})

// Multi-stop gradient
editor.updateSelected({
  fill: {
    type: 'gradient',
    stops: [
      { color: '#111827', offset: 0 },
      { color: '#FACC15', offset: 0.5 },
      { color: '#f97316', offset: 1 }
    ],
    angle: 135
  }
})
```

Angles run **clockwise**: `0` is left to right, `90` is top to bottom. Gradient fills are preserved in design JSON and PNG/JPEG exports.

In the UI, select **Fill → Gradient** in the floating toolbar to edit both colors and the angle.

Shapes also support `stroke`, `strokeWidth` and (for `rect`) `radius`.

## The element schema

A minimal reference — see [Document & element schema](/api/document) for the full field list:

```js
{
  id: 'rect_ab12cd3',
  type: 'rect',
  x: 100, y: 100, // top-left (unrotated)
  w: 200, h: 200,
  rotation: 0,    // degrees, rotates around center
  opacity: 1,
  locked: false, hidden: false,
  flipX: false, flipY: false,
  fill: '#FACC15',
  stroke: '', strokeWidth: 0,
  radius: 0 // rect only
}
```

## Transforming elements

The interactive transform system includes:

- **Move** — drag any element; arrow keys nudge by 1px (10px with <kbd>Shift</kbd>)
- **Resize** — 8 handles
- **Rotate** — corner handle with 15° snapping
- **Flip** — horizontal/vertical, in the toolbar or context menu
- **Multi-select** — shift-click or rubber-band selection; group move
- **Smart snapping** — edge/center guides against other elements and the page edges/center, shown as pink guide lines

You can also patch selected elements from code:

```js
editor.select([rect.id])
editor.updateSelected({ rotation: 45, opacity: 0.8 })
```

`updateSelected(props, commit?)` supports live previews: call it with `commit = false` while dragging a custom control, then call `editor.commit()` once to push a single undo step.

## Lines and arrows

```js
editor.addElement({ type: 'line', x: 100, y: 300, w: 300, h: 0, arrow: true })
```

Lines and arrows use `stroke` and `strokeWidth`.

## Icons

The Elements panel ships 41 icons in solid and outline styles. Switch styles in the panel before insertion, or in the toolbar for selected icons. Icons use `fill` as their color in both styles.

```js
editor.addElement({
  type: 'icon',
  icon: 'star',
  iconStyle: 'outline', // solid | outline
  fill: '#FACC15',
  x: 200, y: 200, w: 64, h: 64
})
```

Documents created before `iconStyle` existed keep their solid appearance.

## Vector shapes

`type: 'shape'` elements reference the built-in vector library (33 presets):

```js
editor.addElement({ type: 'shape', shape: 'speech-bubble', x: 100, y: 400, w: 260, h: 160 })
```

Vector shapes support fill, stroke, resizing and the same transforms as the basic shapes. Add your own via [`registerShapes()`](/advanced/customization#shapes).

## Creating a custom element

Use a plugin for an element type that should stay isolated to one editor. This example draws a diamond using the element's local width and height. The outer renderer already applies position, rotation, flips and opacity.

With the Ezyreka UMD bundle loaded and a sized `#app` container:

```js
const diamondPlugin = {
  id: 'brand',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx) {
    ctx.registerElementType('brand-diamond', {
      defaults: { w: 160, h: 100, badgeColor: '#477cf5' },
      manifest: { name: 'Diamond badge', toolbar: ['opacity'] },
      render(canvas, element) {
        canvas.beginPath();
        canvas.moveTo(element.w / 2, 0);
        canvas.lineTo(element.w, element.h / 2);
        canvas.lineTo(element.w / 2, element.h);
        canvas.lineTo(0, element.h / 2);
        canvas.closePath();
        canvas.fillStyle = element.badgeColor;
        canvas.fill();
      }
    });
  }
};
const editor = new Ezyreka.Editor({ target: '#app', plugins: [diamondPlugin] });
editor.on('ready', () => {
  const item = editor.addElement({ type: 'brand-diamond', x: 80, y: 80 });
  editor.select([item.id]);
  editor.updateSelected({ badgeColor: '#FACC15', rotation: 15 });
});
```

This example uses a solid custom `badgeColor`; it does not offer the standard fill control, which can produce gradient objects. Custom types need a host button or [panel](/guide/ui-modules#complete-example-brand-panel) if users should insert them interactively.

Check resize, rotate, duplicate, undo/redo and JSON save/load with the plugin registered. Reopening without it retains the payload as a placeholder; visible unresolved content prevents image export.

For AI-assisted authoring, use [`$ezyreka-element-creation`](/advanced/development-skills).
