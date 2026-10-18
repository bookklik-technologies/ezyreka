# Templates

The Templates panel ships **36 fully editable templates** across six categories — Social, Business, Events, Lifestyle, Education, and Community — with search, category filters and live previews. Four business collections each contain six coordinated pages.

## Built-in templates

Included template types cover announcements, invitations, pricing sheets, invoices, planners, worksheets, and community notices.

- Search by name and filter by category
- Previews are generated from the actual template content
- Multipage cards preview the cover and show a page-count badge
- Selecting a gallery card asks for confirmation and warns that all current pages and content will be overwritten. Choose **Cancel** or press Escape to keep the current design, or **Replace design** to apply the template. Save first if you want a separate copy.
- Confirming a template replaces the entire document with all of its pages, opens the first page, and fits the view (every element stays editable; application can be undone)

| Multipage template | Format | Pages |
| --- | --- | --- |
| Business presentation | 1920 × 1080 landscape | Cover, overview, problem, solution, results, next steps |
| Business proposal | 1240 × 1754 portrait | Cover, executive summary, scope, timeline, investment, next steps |
| Quarterly report | 1240 × 1754 portrait | Cover, highlights, financial results, performance, priorities, outlook |
| Company profile | 1240 × 1754 portrait | Cover, company story, services, team, case study, contact |

All four use native editable artwork and Arial, with no remote assets. The presentation and report include editable charts with clearly labeled example data. Use the [page controls](/guide/pages#pages) to navigate, duplicate, delete, or reorder pages.

## Applying templates programmatically

The gallery handles confirmation. When building a custom UI, confirm with the user before calling `applyTemplate()`, which applies the template directly.

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

`EditorTemplate` accepts either one `page` or a non-empty `pages` array. Use exactly one form:

```ts
type EditorTemplate = {
  name: string
  category?: string
  format?: string
} & (
  | { page: DesignPage; pages?: never }
  | { pages: DesignPage[]; page?: never }
)
```

See [Document & element schema](/api/document) for `DesignPage` and element details.

Dimensions must be whole numbers from 1 to 10,000 pixels. Every page must have an element array; an omitted background defaults to solid white. Invalid templates are rejected before replacing the document. Constructor options, runtime registration, and plugin registration use the same validation.

## Registering a multipage template

```js
const deck = {
  name: 'Team update',
  category: 'Business',
  format: 'Presentation',
  pages: ['Team update', 'Next steps'].map((title) => ({
    width: 1920,
    height: 1080,
    background: { type: 'solid', color: '#f5f7fc' },
    elements: [{
      type: 'text', x: 96, y: 120, w: 1728, h: 140,
      text: title, fontFamily: 'Arial', fontSize: 80,
      fontWeight: 700, lineHeight: 1.25, color: '#13233f'
    }]
  }))
}

editor.registerTemplates([deck])
editor.applyTemplate(deck)
editor.goToPage(1)
```

The same object can be supplied through `templates: [deck]` at initialization or `ctx.registerTemplates([deck])` in a plugin. Registration adds a gallery entry without applying it. Applying clones every page and gives pages and elements fresh ids; edits do not change the registered template. Saving and image export use the existing multipage document APIs.

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

Registration adds the template to the gallery without applying it. This announcement creates a single-page document; a `pages` template creates a multipage document. Application clears selection, commits an undo step and fits the view. Omit element ids in reusable definitions; application generates fresh ids.

Use explicit element geometry and leave room for actual font metrics. Arial uses the host's installed font; register and load your brand font before judging layout. Custom element types, shapes, icons and backgrounds must be available before previews or application. Template JSON does not contain their executable registrations.

In a plugin, use `ctx.registerTemplates([announcement])` during setup. Check gallery preview, editable text, repeated application, multi-page replacement, undo and export.

For AI-assisted authoring, use [`$ezyreka-template-creation`](/advanced/development-skills).
