# TypeScript definitions

Ezyreka ships with TypeScript definitions at `types/index.d.ts` (the `types` field in `package.json`), so everything is typed out of the box.

```ts
import { Editor, DesignDocument, EditorOptions } from 'ezyreka'

const options: EditorOptions = {
  target: '#app',
  width: 1080,
  height: 1080,
  name: 'Typed design'
}

const editor = new Editor(options)

editor.on('ready', () => {
  const el = editor.addElement({ type: 'rect', w: 200, h: 100 })
  editor.select([el.id])
})
```

## Key exports

| Export | Description |
| --- | --- |
| `Editor` | The editor class |
| `EditorOptions` | Constructor options |
| `DesignDocument` / `DesignPage` / `DesignElement` | Document schema |
| `PageBackground` | Background union type |
| `ChartConfig` / `ChartData` / `ChartSeries` / `ChartType` | Chart types |
| `GradientFill` / `GradientStop` | Gradient fills |
| `PaletteEntry` | `string \| { label, colors }` |
| `EditorTemplate` | Template shape |
| `ImageSource` | Image provider contract |
| `PanelDefinition` | Sidebar panel contract |
| `HistoryLike` | Custom history strategy contract |
| `autoInit` | Programmatic auto-init of `data-ezr-editor` elements |
| `version` | Library version |

## Typing a custom history

```ts
import type { HistoryLike } from 'ezyreka'

const serverHistory: HistoryLike = {
  push(snapshot) { /* send to server */ },
  undo(current) { return previousSnapshot(current) },
  redo(current) { return nextSnapshot(current) },
  reset() { /* clear */ },
  canUndo() { return hasPrevious() },
  canRedo() { return hasNext() }
}

new Editor({ target: '#app', history: serverHistory })
```

## Typing an image source

```ts
import type { ImageSource } from 'ezyreka'

const provider: ImageSource = {
  id: 'brand',
  label: 'Brand assets',
  async search(query) {
    return [{ src: '/assets/logo.png', name: 'Logo', thumb: '/thumbs/logo.png' }]
  }
}
```

## Typing a custom panel

```ts
import type { PanelDefinition } from 'ezyreka'

const brandPanel: PanelDefinition = {
  id: 'brand',
  label: 'Brand kit',
  icon: '<svg viewBox="0 0 24 24">…</svg>',
  render(contentEl, editor) {
    const button = document.createElement('button')
    button.textContent = 'Add logo'
    button.onclick = () => editor.addElement({ type: 'image', src: '/assets/logo.png', w: 200, h: 60 })
    contentEl.append(button)
  }
}

editor.registerPanel(brandPanel)
```
