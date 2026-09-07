# Vue integration

Ezyreka is framework-agnostic — in Vue you mount it into a container and drive it through the API.

## Mounting the editor

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Editor } from 'ezyreka'

const container = ref(null)
let editor = null

onMounted(() => {
  editor = new Editor({ target: container.value })

  editor.on('ready', () => {
    console.log('Ezyreka ready')
  })
})

onBeforeUnmount(() => {
  editor?.destroy() // release listeners
  editor = null
})
</script>

<template>
  <div ref="container" style="width: 100vw; height: 100vh" />
</template>
```

## Reactive selection state

```vue
<script setup>
import { ref, onMounted } from 'vue'

const selected = ref([])
let offSelection = () => {}

onMounted(() => {
  editor = new Editor({ target: container.value })
  offSelection = editor.on('selection', (els) => {
    selected.value = els
  })
})
</script>

<template>
  <div ref="container" />
  <button :disabled="!selected.length" @click="editor?.updateSelected({ fontWeight: 800 })">
    Bold
  </button>
</template>
```

## Composable

```js
// useEzyreka.js
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Editor } from 'ezyreka'

export function useEzyreka(options = {}) {
  const container = ref(null)
  const editor = ref(null)
  const ready = ref(false)

  onMounted(() => {
    editor.value = new Editor({ target: container.value, ...options })
    editor.value.on('ready', () => { ready.value = true })
  })

  onBeforeUnmount(() => {
    editor.value?.destroy()
    editor.value = null
  })

  return { container, editor, ready }
}
```

```vue
<script setup>
import { useEzyreka } from './useEzyreka'

const { container, editor, ready } = useEzyreka({ width: 1080, height: 1080 })
</script>

<template>
  <div ref="container" style="width: 100vw; height: 100vh" />
</template>
```

## Saving designs

```js
editor.value.on('save', async (doc) => {
  await fetch('/api/designs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc)
  })
})
```

## Nuxt note

Ezyreka manipulates the DOM directly — only mount it client-side (e.g. inside `<ClientOnly>` or in a `.client` component).
