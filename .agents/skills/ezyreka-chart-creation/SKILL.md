---
name: ezyreka-chart-creation
description: "Create or update editable Ezyreka charts, chart data, custom chart presets and canvas painters. Use for the editor's chart elements, not standalone plotting or dashboard libraries."
---

# Ezyreka Chart Creation

## Inputs and approach

Identify categories, numeric series, units, chart type, placement and display options. Prefer a built-in chart type before creating a new preset and painter.

Read [charts](../../../docs/guide/charts.md), [normalization and validation](../../../src/core/charts.js), [chart rendering](../../../src/core/chart-renderer.js) and [public types](../../../types/index.d.ts).

## Workflow and contracts

- Insert `editor.addElement({ type: 'chart', chart: { type, categories, series }, ...geometry })`. Series use `{ name, values: (number | null)[], color? }`. Select the returned id explicitly when needed.
- Supply numeric values, not numeric strings. Normalization aligns values to categories, fills missing/non-finite entries with null and discards excess entries.
- Use null for missing data, never silently turn it into zero. Built-in pie/donut reject negative first-series values; Cartesian charts support negatives.
- Preserve existing appearance and data when patching: replace `chart` with a spread of the current chart plus intended changes. Extra series survive single-series type changes.
- Do not store arbitrary custom properties inside `chart`: normalization rebuilds its supported fields. Use JSON-compatible outer element fields for metadata; the chart painter receives normalized chart data, not the entire element.
- For a plugin, use `ctx.registerChartType(preset, painter)`. Supply a namespaced type, label, relevant capability flags and a validator that throws on invalid data. Direct editor type registration writes the global preset table.
- Painter signature: `(canvas, chart, series, plotBox, font, bounds, registry)`. The outer renderer handles element transforms, clipping, title and legend. Draw within the available plot box; implement custom axes/grid/value labels if exposed.
- `kind` influences built-in Cartesian behavior; it is not a general renderer alias. Register an explicit painter for novel geometry.
- Unknown chart types retain their id and show a placeholder. A visible unresolved type blocks image export. Locked charts are read-only in the chart editor.

## Example

With an existing editor:

```js
const item = editor.addElement({
  type: 'chart', x: 80, y: 80, w: 640, h: 400,
  chart: {
    type: 'grouped-bar', categories: ['Jan', 'Feb', 'Mar'],
    series: [
      { name: 'Revenue', values: [24, 42, 35], color: '#477cf5' },
      { name: 'Costs', values: [16, null, 28], color: '#334155' }
    ],
    title: 'Monthly results', showLegend: true
  }
});
editor.select([item.id]);
editor.updateSelected({ chart: { ...item.chart, showValues: true } });
```

For a complete custom painter, see the percentage-bar example in the chart guide.

## Deliverables and verification

Deliver editable chart configuration or a registered preset/painter plus host usage. Review missing/zero/negative values, empty and single-category data, multiple series, custom validation, resize, style changes, JSON round-trip and export. Check registration isolation for plugin charts. Ask before running any unit tests; do not run `npm test` or `tests/*.test.mjs` without permission.
