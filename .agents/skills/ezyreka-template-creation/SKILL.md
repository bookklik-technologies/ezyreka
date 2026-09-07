---
name: ezyreka-template-creation
description: "Create or update editable Ezyreka design templates and template packs, including page layout, registration and previews. Applies to Ezyreka EditorTemplate data, not document or AI skill templates."
---

# Ezyreka Template Creation

## Inputs and approach

Establish page dimensions, intended audience, copy, category, brand colors and required assets. Follow the user's supplied design; keep text, charts and shapes editable.

Read [templates](../../../docs/guide/templates.md), [built-in compositions](../../../src/core/templates.js), [document schema](../../../docs/api/document.md), [editor operations](../../../src/core/editor.js) and [public types](../../../types/index.d.ts).

## Workflow and contracts

- Produce `{ name, category?, format?, page: { width, height, background, elements } }`. Use explicit positive dimensions, a background and an ordered element list; later elements draw above earlier ones.
- Set element positions and dimensions explicitly in template data. Omit reusable element ids so factories assign them. Do not flatten a composition into an image.
- Use `templates` at initialization, `editor.registerTemplates(list)` for host registration or `ctx.registerTemplates(list)` inside a plugin. Registration adds gallery entries without applying them.
- `editor.applyTemplate(template)` replaces the entire document with one page, clears selection, commits history and fits the view. Do not describe it as insertion into the current page or as preserving other pages.
- Ensure plugin types, shapes, icons, painters and fonts are registered before preview or application. Asset registrations are not embedded into saved JSON.
- Templates are cloned during registration and application. Updating the original object after registration is not a gallery update API.
- Use the text and chart skills for detailed typography or data rules; reserve space for text wrapping and actual font metrics.

## Example

With an existing editor:

```js
const announcement = {
  name: 'Community workshop',
  category: 'Community',
  page: {
    width: 1200, height: 628,
    background: { type: 'solid', color: '#f8fafc' },
    elements: [
      { type: 'rect', x: 64, y: 64, w: 12, h: 500, fill: '#477cf5' },
      { type: 'text', x: 112, y: 100, w: 960, h: 160,
        text: 'Create something\ntogether', fontFamily: 'Arial',
        fontSize: 64, fontWeight: 700, lineHeight: 1.15, color: '#0f172a' },
      { type: 'text', x: 112, y: 340, w: 920, h: 120,
        text: 'Saturday, 10 AM\nCommunity Hall', fontFamily: 'Arial',
        fontSize: 32, fontWeight: 400, lineHeight: 1.4, color: '#334155' }
    ]
  }
};
editor.registerTemplates([announcement]);
// Apply only when replacing the current document is intended.
editor.applyTemplate(announcement);
```

## Deliverables and verification

Deliver reusable template objects and registration instructions, with required assets identified. Review gallery search/category, preview fidelity, editable layers, text fit, template reuse, undo of application, save/load and image export. Explicitly inspect replacement of a multi-page document. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
