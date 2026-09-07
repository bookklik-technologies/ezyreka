# Embed in plain HTML

The fastest way to use Ezyreka: one container, one script tag.

## Automatic initialization

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    #app { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div
    id="app"
    data-ez-editor
    data-ez-width="1080"
    data-ez-height="1080"
    data-ez-name="My design"
  ></div>
  <script src="https://unpkg.com/ezyreka/dist/ezyreka.umd.js"></script>
</body>
</html>
```

Any element with `data-ez-editor` is turned into an editor on page load.

## Programmatic initialization

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    #app { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="app"></div>

  <script src="https://unpkg.com/ezyreka/dist/ezyreka.umd.js"></script>
  <script>
    const { Editor } = Ezyreka

    const editor = new Editor({
      target: '#app',
      width: 1080,
      height: 1080,
      name: 'Untitled design'
    })

    editor.on('ready', () => {
      editor.addText({ text: 'Hello Ezyreka', fontSize: 96, fontWeight: 800 })
    })
  </script>
</body>
</html>
```

## As an ES module

```html
<script type="module">
  import { Editor } from 'https://unpkg.com/ezyreka/dist/ezyreka.esm.js'

  const editor = new Editor({ target: '#app' })
</script>
```

## Sizing

The editor UI fills its container. Give the container explicit dimensions:

```css
#app { width: 100vw; height: 100vh; }         /* full page */
#app { width: 100%; height: 600px; }          /* embedded panel */
```
