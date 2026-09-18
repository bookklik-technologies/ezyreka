# AGENTS.md — Ezyreka documentation standard

Guidance for contributors and coding agents working on this repository's documentation (`docs/`).

## Build and validation

- Build the docs with `npm run docs:build` (this repo uses npm, not pnpm). Dead-link checking stays enabled; fix broken links instead of suppressing them.
- Do not run unit tests without asking first.

## Formatting conventions

- One H1 per page, followed by a short introduction paragraph. Sections use H2/H3 only.
- Tag every code fence with a language (`js`, `html`, `bash`, `json`, `text`, …).
- Use standard GFM tables and lists, aligned per column.
- Use VitePress containers (`::: tip`, `::: warning`, `::: details`) for callouts.
- Sentence case for headings, nav labels, and sidebar labels.
- Preserve existing heading anchors. If a heading must change, keep an explicit legacy anchor so inbound links do not break.
- Usage-first organization for guides; signatures/options/member references for API pages.

## Navigation and structure

- Top navigation order: **Guide → API reference → Advanced → Examples → Resources**.
- Guide sidebar begins with **Getting started**, followed by the existing topic groups in learning order.
- Repository/release links and remaining resource links live in the **Resources** dropdown.
- Configuration layout: `docs/.vitepress/config/nav.ts` (navigation), `docs/.vitepress/config/sidebar.ts` (sidebar), `docs/.vitepress/config/shared.ts` (common presentation settings), `docs/.vitepress/config.mts` (site config).
- Common presentation settings (outline 2–3 "On this page", local search labels, "Previous page"/"Next page" footer, "Last updated", edit links) match the other Ezy project docs sites — update all three repos together when they change.

## Branding boundaries

- Ezyreka brand styles (orange `#FF6600` / yellow `#FACC15` palette, gradients) live only in `docs/.vitepress/theme/custom.css`. The official brand assets are `logo.svg` (navbar + home hero) and `icon.svg` (favicon), copied from the repository root into `docs/public/` and referenced as `/ezyreka/logo.svg` and `/ezyreka/icon.svg`.
- Never alter palette values, brand assets, or the deployment base path (`/ezyreka/`) during standardization. Favicon and logo links must resolve beneath the base path.

## Examples standard

The `examples/` folder follows the shared Ezy examples standard:

- One self-contained HTML file per concept: `declarative.html` (zero-JS embed via data-attributes), `programmatic.html` (constructor via the local bundle), `events.html` (core lifecycle/data events), and `advanced.html` (one library-specific showcase — for Ezyreka: community plugins with custom element types and sidebar panels).
- `examples/README.md` lists the four examples and the build command. No `index.html`, no shared CSS/JS, no gallery chrome, no framework bundles (framework integrations are documented under `docs/` instead).
- Per-file rules: identical skeleton (`<!doctype html>`, `lang="en"`, charset, viewport, title `<Library> - <Feature>`); inline `<style>` limited to host sizing; host `<div id="app">` or attribute-marked host; local build loaded via relative path at the end of `<body>`; inline `<script>` using only the public API (2-space indent, semicolons); `window.editor = editor` debug export in programmatic examples; at most one or two clarifying comments.
- Keep examples minimal: one library feature per file. Do not reintroduce shared demo helpers, copy buttons or a landing page.

## Page templates

- Home page: frontmatter `layout: home` and `titleTemplate: false`; hero actions in order **Get started → API reference → View on GitHub**; the six existing feature cards.
- Guide pages: H1 title, short intro, runnable examples, cross-links to related API pages.
- API pages: member/signature reference grouped by area, with short intro up top.
