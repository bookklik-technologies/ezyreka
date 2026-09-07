# Development skills

Ezyreka provides seven repository skills for developers using AI coding agents. Each skill explains how to create a particular kind of editor content or extension using the current source and public API.

An **Ezyreka plugin** is trusted JavaScript that runs inside your application. An **agent skill** is a `SKILL.md` instruction file that helps a coding agent author that JavaScript or design data. These skills do not add runtime capabilities to the editor.

## Repository setup

Clone the Ezyreka repository and open the checkout in your coding agent. The skills are versioned under `.agents/skills/`; they are not included in the npm package and require no personal installation.

Codex discovers repository skills from `.agents/skills` between the working directory and repository root. It can select a skill when its description matches the request, or you can invoke it explicitly. If a new skill does not appear, restart Codex. See [OpenAI's skill documentation](https://learn.chatgpt.com/docs/build-skills) for discovery and client-specific invocation details.

In Codex CLI or the IDE extension, use `/skills` or type `$` to select a skill. For other agents that support `SKILL.md`, follow that agent's discovery rules or explicitly ask it to read the relevant file. Do not assume every agent discovers this directory automatically.

The files refer to documentation and source in this checkout. Keep that layout intact; copying a single skill folder elsewhere will not preserve those references.

## Skill catalog

| Skill | Use it for | Guide |
| --- | --- | --- |
| [`ezyreka-plugin-development`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-plugin-development/SKILL.md) | Plugin setup, options, instance isolation and teardown | [Plugins](/advanced/plugins) |
| [`ezyreka-element-creation`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-element-creation/SKILL.md) | Built-in elements, custom types, manifests and rendering | [Elements](/guide/elements) |
| [`ezyreka-template-creation`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-template-creation/SKILL.md) | Editable page compositions and template packs | [Templates](/guide/templates) |
| [`ezyreka-chart-creation`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-chart-creation/SKILL.md) | Chart data, custom presets and painters | [Charts](/guide/charts) |
| [`ezyreka-text-creation`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-text-creation/SKILL.md) | Text boxes, typography, wrapping and fonts | [Text](/guide/text) |
| [`ezyreka-assets-backgrounds`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-assets-backgrounds/SKILL.md) | Shapes, icons, images, providers and backgrounds | [Assets](/advanced/customization) |
| [`ezyreka-ui-customization`](https://github.com/bookklik-technologies/ezyreka/blob/main/.agents/skills/ezyreka-ui-customization/SKILL.md) | Panels, themes, palettes and UI modules | [UI modules](/guide/ui-modules) |

## Example requests

Include the intended result, dimensions or data, editable controls and target integration. The agent should inspect existing code before asking for information already available there.

### Plugin Development

```text
Use $ezyreka-plugin-development to create a badge plugin with configurable color and a sidebar insertion button.
```

### Element Creation

```text
Use $ezyreka-element-creation to create a configurable diamond badge element with a canvas renderer.
```

### Template Creation

```text
Use $ezyreka-template-creation to create an editable 1200 by 628 event announcement template.
```

### Chart Creation

```text
Use $ezyreka-chart-creation to create a grouped bar chart that preserves missing values and supports editing.
```

### Text Creation

```text
Use $ezyreka-text-creation to create an editable heading and paragraph with consistent typography.
```

### Assets and Backgrounds

```text
Use $ezyreka-assets-backgrounds to create a brand asset pack with an icon, vector shape and striped background.
```

### UI Customization

```text
Use $ezyreka-ui-customization to add a brand sidebar panel with a heading button and a named theme.
```

## Choosing and combining skills

For a built-in text box, start with text creation. For a reusable page composition, start with template creation and use the text/chart guidance for those elements. Use element creation when a built-in shape or custom vector path cannot provide the needed behavior.

For a packaged editor extension, use plugin development to establish registration and lifecycle, then the skills for its contributed capabilities. For example:

```text
Use $ezyreka-plugin-development and $ezyreka-ui-customization to create
a brand plugin with a sidebar insertion button and a named theme.
Use $ezyreka-template-creation for its editable announcement template.
Keep each editor's registrations isolated and clean up panel listeners.
```

A request may produce JavaScript definitions, editable template data or configuration rather than changes to Ezyreka core. Runtime API additions are a separate implementation decision, not a requirement of using a skill.

## Development contracts

Use the [public TypeScript definitions](/api/typescript) and current implementation to check signatures. The guides describe these important distinctions:

- **Scope:** Plugin-context registrations are per editor. Several direct editor registration methods also write shared module tables; see the [scope table](/advanced/customization#scope-notes).
- **Lifecycle:** Plugins register synchronously before UI and initial-document loading. Insert startup content or select a plugin-registered theme after `ready`. Panels release mounted resources when their render cleanup runs.
- **Content:** `addElement()` returns the element but does not select it. Explicitly select before selection-based updates. `applyTemplate()` replaces the document with a single page.
- **Persistence:** Keep document data JSON-compatible and register its capabilities before loading. Missing capabilities preserve data as placeholders and can prevent image export.
- **Chart data:** Store numbers or null, preserve missing values and use supported chart fields. Arbitrary extra fields inside chart configuration are discarded by normalization.
- **Rendering:** Keep custom painters synchronous and use their supplied coordinates. Canvas, previews and exports need the same registrations and assets.

## Skill structure and maintenance

Each folder contains:

```text
ezyreka-<workflow>/
  SKILL.md
  agents/
    openai.yaml
```

`SKILL.md` contains YAML `name` and `description`, task inputs, implementation guidance, source links, an example and verification scenarios. The name matches its folder. `agents/openai.yaml` supplies a display name, short description and default prompt; automatic invocation remains enabled.

When an API changes, update its human guide and affected skills together. Keep detailed API explanations in the guides and link to them from the skills. Add scripts or additional references only when they provide a concrete benefit; avoid copied manuals and empty scaffolds.

For a new or revised skill:

1. Check the description against a representative request and a nearby task that should use another skill.
2. Check examples against implementation and types, including registration scope and cleanup.
3. Validate frontmatter with the skill-creator's `scripts/quick_validate.py <skill-folder>` when that tool is installed. The validator belongs to the skill-creator installation, not this repository.
4. Verify `openai.yaml`, source links and unfinished placeholders separately.
5. Run `npm run docs:build` and inspect the rendered guide and navigation.

**Ask before running any unit tests.** This includes `npm test` and individual `tests/*.test.mjs` files. Skill metadata validation and the documentation build do not run the unit suite.

For behavior changes produced with these skills, choose checks relevant to the task: plugin isolation and teardown, template replacement and undo, chart data boundaries, text fit, asset geometry or panel accessibility. Report which checks ran and which remain unverified.

These guides are maintained in the repository for the official documentation site. Creating or editing them does not publish a release or deploy the site.
