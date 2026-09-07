# Templates

The Templates panel ships **32 fully editable templates** across six categories — Social, Business, Events, Lifestyle, Education, and Community — with search, category filters and live previews.

## Built-in templates

Included template types cover announcements, invitations, pricing sheets, invoices, planners, worksheets, and community notices.

- Search by name and filter by category
- Previews are generated from the actual template content
- Clicking a template replaces the current design with it (fully editable — every element stays editable)

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
