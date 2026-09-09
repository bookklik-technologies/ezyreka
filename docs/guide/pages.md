# Pages, view & backgrounds

## Pages

Ezyreka documents are multi-page. The pages bar shows page chips with add/duplicate/delete controls.

| Method | Description |
| --- | --- |
| `addPage()` | Add a new page |
| `duplicatePage()` | Duplicate the current page |
| `deletePage(i?)` | Delete a page (current by default) |
| `goToPage(i)` | Switch to a page |
| `movePage(from, to)` | Reorder pages |

```js
editor.addPage()
editor.goToPage(1)
```

## Backgrounds

The Background panel supports three background types plus a Custom gradient section:

```ts
{ type: 'solid', color: '#1e293b' }
{ type: 'gradient', from: '#FACC15', to: '#ffffff', angle: 135 }
{ type: 'image', src: 'https://example.com/bg.jpg' }
```

From code:

```js
editor.setBackground({ type: 'solid', color: '#0f172a' })

// Live preview: pass commit = false, then commit once to push a single undo step
editor.setBackground({ type: 'gradient', from: '#111827', to: '#FACC15', angle: 135 }, false)
editor.commit()
```

The Background panel includes:

- solid color palette
- **gradient presets** and a **Custom gradient** section with start/end colors, an angle and a preview
- image backgrounds

Editing a gradient control updates the canvas immediately; **Apply gradient** also lets you reuse the displayed colors after switching to a solid or image background. Gradients support undo/redo and are saved with the design.

## Zoom & pan

| Interaction | Description |
| --- | --- |
| `Ctrl` + wheel | Zoom to cursor |
| `Ctrl/⌘` + `+` / `-` / `0` | Zoom in / out / fit |
| `Space` + drag | Pan canvas |
| Middle-mouse drag | Pan canvas |

| Method | Description |
| --- | --- |
| `setZoom(z, anchor?)` | Zoom (0.05–5) with optional anchor point |
| `zoomFit()` | Fit the page to the screen |

```js
editor.setZoom(2, { x: 540, y: 540 })
editor.zoomFit()
```

## Resizing the canvas

Use **Resize** in the top bar to browse visual preset cards under **Social media**, **Print**, or **Presentation**, or choose **Custom size** and enter width and height in pixels.

- Each card previews the format's proportions and shows its name and dimensions; the selected card is highlighted with a checkmark
- Presets include square posts, stories/reels, A5/A4/A3, US Letter, business cards, and 16:9, 4:3, and 16:10 slides
- Print dimensions are calculated at **300 pixels per inch** without bleed
- Choosing a preset fills the dimensions; click **Resize canvas** to apply

From code:

```js
editor.resizeCanvas(1080, 1920)
```

- Resizing preserves element sizes and positions and supports undo/redo
- Dimensions are whole pixels from 1 to 10,000 per side
- Saved designs and image exports use the updated dimensions
