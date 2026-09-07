# Charts

Open **Charts** in the sidebar to add a Bar, Row, Grouped bar, Line, Multi-line, Pie, Donut, Area, or Stacked area chart. Each chart is a **canvas element with editable data**, rather than an image.

## Built-in chart types

| Type | Description |
| --- | --- |
| `bar` | Vertical bars |
| `row` | Horizontal bars |
| `grouped-bar` | Grouped vertical bars |
| `line` | Single-series line |
| `multi-line` | Multiple series |
| `pie` | Pie chart |
| `donut` | Donut chart |
| `area` | Filled area |
| `stacked-area` | Stacked filled areas |

## Adding a chart

Use **Edit chart** in its toolbar or double-click the chart to reopen the editor at any time.

```js
const chart = editor.addElement({
  type: 'chart',
  w: 600,
  h: 400,
  chart: {
    type: 'grouped-bar',
    categories: ['Jan', 'Feb', 'Mar'],
    series: [
      { name: 'Sales', values: [24, 42, 35], color: '#477cf5' },
      { name: 'Costs', values: [16, null, 28], color: '#1e293b' }
    ],
    title: 'Monthly results',
    showLegend: true
  }
})

editor.select([chart.id])
```

## Updating a chart

Replace the chart configuration; omitted appearance options use defaults:

```js
editor.updateSelected({ chart: { ...chart.chart, title: 'Updated results' } })
```

## The chart editor

The **Data** tab supports:

- editable categories and series
- adding/removing rows and columns
- **spreadsheet paste** — paste into a value cell to replace a numeric block, into a category cell to include labels, or into the Category header to include series names. Pasted tables expand the grid and apply as one undo step. Blank values represent missing data; invalid numeric cells reject the entire paste.
- **Expand data table** — a larger live editor

The **Style** tab controls:

- chart type, title, legend, value labels, axes/gridlines
- text size and color
- series colors (or pie-slice colors)

## Behavior and rules

- Single-series charts display the first series while keeping additional series for later type changes.
- Pie and donut values must be **non-negative**; Cartesian charts accept negative values.
- Invalid non-finite API/imported values normalize to missing values; negative pie/donut data is rejected.
- Charts retain their data through copy/paste, layers, transforms, undo/redo, JSON save/load, and image export.
- Locked charts are read-only.

Charts use the existing dependency-free canvas renderer. Documents containing charts require a version of the editor with chart support.

## Custom chart types

Register brand-new chart types — the gallery, type dropdown, normalization, validation and rendering all pick them up:

```js
editor.registerChartType({
  type: 'radar',
  label: 'Radar',
  group: 'Radar charts',
  kind: 'radar',
  multiSeries: true,
  validate: (chart) => {
    if (!chart.categories?.length) throw new Error('Categories required')
  }
}, (ctx, chart, series, plotBox, font, bounds) => {
  // custom draw
})
```

You can also override the painter of an existing type:

```js
editor.registerChartRenderer('bar', (ctx, chart, series, plotBox, font, bounds) => {
  // custom draw
})
```

See [Extensibility](/advanced/extensibility#charts) for the painter signature and more details.
