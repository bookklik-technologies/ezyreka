# Templates

The Templates panel ships **32 fully editable templates** across six categories — Social, Business, Events, Lifestyle, Education, and Community — with search, category filters and live previews.

## Built-in templates

Included template types cover announcements, invitations, pricing sheets, invoices, planners, worksheets, and community notices.

- Search by name and filter by category
- Previews are generated from the actual template content
- Clicking a template replaces the entire document with its single page, including any other pages (every element stays editable; application can be undone)

## Applying templates programmatically

```js
editor.applyTemplate({
  name: 'Ad banner',
  page: {
    width: 1200,
    height: 628,
    background: { type: 'solid', color: '#1e293b' },
    elements: []
  }
})
```

## Adding custom templates

### At initialization

```js
new Editor({
  target: '#app',
  templates: [
    {
      name: 'Ad banner',
      category: 'Business',
      page: {
        width: 1200,
        height: 628,
        background: { type: 'solid', color: '#1e293b' },
        elements: []
      }
    }
  ]
})
```

Custom templates appear in the Templates panel **after** the built-ins.

### At runtime

More templates can be registered later — they appear in the panel immediately:

```js
editor.registerTemplates([
  {
    name: 'Footer',
    category: 'Business',
    page: {
      width: 1080,
      height: 200,
      background: { type: 'solid', color: '#fff' },
      elements: []
    }
  }
])
```

## Template shape

`EditorTemplate` accepts the same page shape as `applyTemplate()`:

```ts
interface EditorTemplate {
  name: string
  category?: string
  format?: string
  page: DesignPage // { width, height, background, elements }
}
```

See [Document & element schema](/api/document) for `DesignPage` and element details.

## Creating an editable announcement

This complete template uses native text and a rectangle. Elements appear in drawing order: later entries are above earlier entries. The example assumes an existing `editor`.

```js
const announcement = {
  name: 'Community workshop',
  category: 'Community',
  format: 'Landscape',
  page: {
    width: 1200,
    height: 628,
    background: { type: 'solid', color: '#f8fafc' },
    elements: [
      { type: 'rect', x: 64, y: 64, w: 12, h: 500, fill: '#477cf5' },
      {
        type: 'text', x: 112, y: 100, w: 960, h: 160,
        text: 'Create something\ntogether',
        fontFamily: 'Arial', fontSize: 64, fontWeight: 700,
        lineHeight: 1.15, color: '#0f172a'
      },
      {
        type: 'text', x: 112, y: 340, w: 920, h: 120,
        text: 'Saturday, 10 AM\nCommunity Hall',
        fontFamily: 'Arial', fontSize: 32, fontWeight: 400,
        lineHeight: 1.4, color: '#334155'
      }
    ]
  }
};

editor.registerTemplates([announcement]);
// Only apply when replacing the current document is intended.
editor.applyTemplate(announcement);
```

Registration adds the template to the gallery without applying it. Applying creates a single-page document, clears selection, commits an undo step and fits the view. Omit element ids in reusable definitions so application generates them.

Use explicit element geometry and leave room for actual font metrics. Arial uses the host's installed font; register and load your brand font before judging layout. Custom element types, shapes, icons and backgrounds must be available before previews or application. Template JSON does not contain their executable registrations.

In a plugin, use `ctx.registerTemplates([announcement])` during setup. Check gallery preview, editable text, repeated application, multi-page replacement, undo and export.

For AI-assisted authoring, use [`$ezyreka-template-creation`](/advanced/development-skills).
