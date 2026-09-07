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
}, (ctx, chart, series, plotBox, font, bounds, registry) => {
  // custom draw
})
```

You can also override the painter of an existing type:

```js
editor.registerChartRenderer('bar', (ctx, chart, series, plotBox, font, bounds, registry) => {
  // custom draw
})
```

See [Extensibility](/advanced/extensibility#charts) for the painter signature and more details.

## Complete example: percentage bars

This custom type displays one series with values from 0 to 100. The plugin registers both a preset and an explicit painter. The outer chart renderer handles clipping, title and legend; the painter handles bars, category labels, gridlines and optional values.

With the UMD bundle loaded and a sized `#app`:

```js
const progressPlugin = {
  id: 'progress',
  version: '1.0.0',
  apiVersion: 1,
  setup(ctx) {
    ctx.registerChartType({
      type: 'progress-percent',
      label: 'Percentage bars',
      group: 'Progress',
      kind: 'bar',
      horizontal: true,
      validate(chart) {
        if (chart.series[0]?.values.some(value =>
          value !== null && (value < 0 || value > 100))) {
          throw new Error('Percentage values must be between 0 and 100.');
        }
      }
    }, (canvas, chart, series, box, font, bounds, registry) => {
      const first = series[0];
      const rowHeight = box.h / chart.categories.length;
      const labelWidth = chart.showAxes ? Math.min(box.w * 0.35, font * 7) : 0;
      const x = box.x + labelWidth;
      const width = Math.max(1, box.w - labelWidth);
      canvas.save();
      if (chart.showGrid) {
        canvas.save();
        canvas.strokeStyle = chart.textColor;
        canvas.globalAlpha *= 0.15;
        for (const percent of [0, 50, 100]) {
          const gx = x + width * percent / 100;
          canvas.beginPath();
          canvas.moveTo(gx, box.y);
          canvas.lineTo(gx, box.y + box.h);
          canvas.stroke();
        }
        canvas.restore();
      }
      chart.categories.forEach((category, index) => {
        const y = box.y + rowHeight * (index + 0.5);
        canvas.fillStyle = chart.textColor;
        canvas.textAlign = 'left';
        if (chart.showAxes) {
          canvas.fillText(category, box.x, y, Math.max(1, labelWidth - 8));
        }
        const value = first.values[index];
        if (value === null) return;
        canvas.fillStyle = first.color;
        canvas.fillRect(x, y - rowHeight * 0.22, width * value / 100, rowHeight * 0.44);
        if (chart.showValues) {
          canvas.fillStyle = chart.textColor;
          canvas.textAlign = 'right';
          canvas.fillText(value + '%', x + width - 4, y, Math.max(1, width - 8));
        }
      });
      canvas.restore();
    });
  }
};
const editor = new Ezyreka.Editor({ target: '#app', plugins: [progressPlugin] });
editor.on('ready', () => {
  const item = editor.addElement({
    type: 'chart', x: 80, y: 80, w: 640, h: 400,
    chart: {
      type: 'progress-percent',
      categories: ['Design', 'Content', 'Review'],
      series: [{ name: 'Complete', values: [80, null, 35], color: '#477cf5' }],
      title: 'Project progress',
      showLegend: false, showValues: true
    }
  });
  editor.select([item.id]);
});
```

The painter receives normalized data. A missing value skips its bar, while zero remains a valid value. With no categories or no non-missing values, the outer renderer shows its no-data message before calling the painter. Resize and preview the chart with your expected category count to check label spacing.

`kind` controls built-in Cartesian behavior; it is not a general renderer lookup alias. Custom geometry should provide a painter as above. Arbitrary fields inside `chart` are discarded during normalization; keep metadata on the outer element and do not expect it in the painter's chart argument.

Before shipping a custom type, review boundary values, rejected inputs, the gallery/type dropdown, editor isolation, JSON round-trip and export. Reopening without the plugin preserves the type and data as a placeholder.

For AI-assisted authoring, use [`$ezyreka-chart-creation`](/advanced/development-skills).
