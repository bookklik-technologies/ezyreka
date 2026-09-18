# Examples

Runnable examples live in the repo under [`examples/`](https://github.com/bookklik-technologies/ezyreka/tree/main/examples):

- **declarative.html** — declarative `<div data-ez-editor>` setup
- **programmatic.html** — JS-driven setup with the `Editor` class
- **events.html** — `ready`, `change` and `selection` events
- **advanced.html** — community plugin with a custom element type and sidebar panel

Run them locally with the dev server:

```bash
npm run dev # watch + dev server at http://localhost:8080/examples/
```

## Framework guides

- [Embed in plain HTML](/examples/plain-html) — one script tag, zero build tools
- [React integration](/examples/react) — mount, clean up, and build custom toolbars
- [Vue integration](/examples/vue) — composables and lifecycle-safe integration

## Key patterns at a glance

| Goal | Where |
| --- | --- |
| Autosave & persistence | [Recipes](/advanced/recipes) |
| Custom panels & element types | [Extensibility](/advanced/extensibility) |
| Brand fonts, palette, templates | [Customization & registries](/advanced/customization) |
| Headless rendering pipelines | [Headless mode](/guide/headless) |
