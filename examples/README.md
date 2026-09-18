# Ezyreka examples

Build the distribution first, then open any example directly or run the dev
server (`npm run dev` → `http://localhost:8080/examples/`).

```sh
npm run build
```

Each example is a single self-contained HTML file loading the local UMD bundle
from `dist/`.

| Example | File | Shows |
| --- | --- | --- |
| Declarative embed | [declarative.html](declarative.html) | Zero-JS startup via `data-ezr-editor` |
| Programmatic embed | [programmatic.html](programmatic.html) | `new Editor({ target })` plus ready/change events |
| Events | [events.html](events.html) | `ready`, `change` and `selection` events |
| Plugins | [advanced.html](advanced.html) | Community plugin with custom element type and sidebar panel |
