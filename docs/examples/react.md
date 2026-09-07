# React integration

Ezyreka is framework-agnostic — in React you mount it into a container and drive it through the API.

## Mounting the editor

```tsx
import { useEffect, useRef } from 'react'
import { Editor } from 'ezyreka'

export function DesignEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    const editor = new Editor({ target: containerRef.current! })
    editorRef.current = editor

    editor.on('ready', () => {
      console.log('Ezyreka ready')
    })

    return () => {
      editor.destroy() // release listeners
      editorRef.current = null
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}
```

::: warning
In React 18 Strict Mode (dev) effects run twice — always call `destroy()` in cleanup so the double-invocation doesn't leave two editors.
:::

## Custom toolbar state

```tsx
export function Toolbar() {
  const [selected, setSelected] = useState<DesignElement[]>([])

  useEffect(() => {
    const off = editorRef.current!.on('selection', setSelected)
    return off
  }, [])

  const setBold = () => editorRef.current!.updateSelected({ fontWeight: 800 })
  const setColor = (color: string) => editorRef.current!.updateSelected({ color })

  return (
    <div>
      <button disabled={!selected.length} onClick={setBold}>Bold</button>
      <button disabled={!selected.length} onClick={() => setColor('#d97706')}>Amber</button>
    </div>
  )
}
```

## Autosave

```tsx
useEffect(() => {
  const editor = editorRef.current
  if (!editor) return
  return editor.on('change', () => {
    localStorage.setItem('design', JSON.stringify(editor.getJSON()))
  })
}, [])
```

## React 19 / build setup

```bash
npm install ezyreka
```

```ts
import { Editor } from 'ezyreka' // resolves dist/ezyreka.esm.js + types
```

Next.js note: Ezyreka manipulates the DOM directly, so only mount it client-side (in a `"use client"` component, or inside `useEffect` as above).
