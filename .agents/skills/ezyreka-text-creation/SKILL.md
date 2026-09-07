---
name: ezyreka-text-creation
description: "Create or style editable text elements in Ezyreka, including fonts, wrapping, alignment and inline editing. Use for canvas text implementation, not general copywriting or raster text generation."
---

# Ezyreka Text Creation

## Inputs and approach

Determine copy, text hierarchy, available width, placement, font family/weights and alignment. Preserve supplied wording. Use the built-in text element so inline editing remains available.

Read [text](../../../docs/guide/text.md), [text defaults and manifest](../../../src/core/elements.js), [measurement and drawing](../../../src/core/renderer.js), [editing and height fitting](../../../src/core/editor.js) and [public types](../../../types/index.d.ts).

## Workflow and contracts

- Insert with `editor.addText(props)` or `addElement({ type: 'text', ...props })`. Use `text`, `color`, `fontFamily`, `fontSize`, `fontWeight`, `italic`, `underline`, `align`, `lineHeight` and `letterSpacing`.
- Text color is `color`, not shape `fill`. Line height is a multiplier; font size and letter spacing are pixels.
- Set `w` deliberately; newlines split paragraphs and wrapping uses available width. Long unbroken tokens may overflow rather than split into characters.
- The default content is `Your text here`. Without an explicit height the factory starts at one line plus padding. Height fitting during inline editing and interactive resize grows boxes; insertion and generic style updates do not automatically fit height. Set enough height for programmatic multiline content. Do not promise automatic shrinking or exact fixed-height clipping.
- `registerFont(name)` adds a picker entry only. Use `{ google: true }`, a Google CSS2 family specification or host-loaded CSS/font faces to provide actual fonts. Registration alone does not mean a font is ready.
- Use `ctx.registerFont` in a plugin. Check actual font availability before judging wrapping or export; do not substitute a font without describing the change.
- Select returned ids explicitly. Use `updateSelected` for styles and commit once at the end of a continuous custom control. Respect locked selections in that control.
- Text is plain text with element-level styling; do not promise HTML rendering or mixed rich-text spans.

## Example

With an existing editor:

```js
editor.registerFont('Arial');
const heading = editor.addText({
  x: 80, y: 80, w: 720, h: 80,
  text: 'Make room for ideas',
  fontFamily: 'Arial', fontSize: 56, fontWeight: 700,
  lineHeight: 1.15, color: '#0f172a'
});
editor.addText({
  x: 80, y: 260, w: 620, h: 180,
  text: 'An editable paragraph that wraps within its text box.\nA new line starts here.',
  fontFamily: 'Arial', fontSize: 28, fontWeight: 400,
  lineHeight: 1.4, color: '#334155'
});
editor.select([heading.id]);
editor.updateSelected({ align: 'left', letterSpacing: 1 });
```

Arial relies on a font installed on the host; use a supplied webfont for a consistently available brand family.

## Deliverables and verification

Deliver editable text elements or a reusable insertion function plus font requirements. Review actual fonts, multiline wrapping, long tokens, alignment, width changes, inline editing, undo/redo and export. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
