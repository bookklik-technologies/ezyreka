import { defineConfig } from 'vitepress'

const description =
  'Ezyreka is an embeddable, dependency-free JavaScript library for adding a Canva-style design editor to web apps.'

export default defineConfig({
  lang: 'en-US',
  title: 'Ezyreka',
  description,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#FACC15' }]
  ],
  // GitHub Pages project site: docs are served from /ezyreka/.
  base: '/ezyreka/',
  cleanUrls: true,
  markdown: {
    lineNumbers: false
  },
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/editor', activeMatch: '/api/' },
      { text: 'Advanced', link: '/advanced/customization', activeMatch: '/advanced/' },
      {
        text: 'Resources',
        items: [
          { text: 'Examples', link: '/examples/' },
          { text: 'Development skills', link: '/advanced/development-skills' },
          { text: 'TypeScript definitions', link: '/api/typescript' },
          { text: 'Changelog', link: 'https://github.com/bookklik-technologies/ezyreka/releases' }
        ]
      }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Editor options', link: '/guide/editor-options' }
          ]
        },
        {
          text: 'Designing',
          items: [
            { text: 'Elements & shapes', link: '/guide/elements' },
            { text: 'Text', link: '/guide/text' },
            { text: 'Images & uploads', link: '/guide/uploads' },
            { text: 'Charts', link: '/guide/charts' },
            { text: 'Templates', link: '/guide/templates' },
            { text: 'Layers', link: '/guide/layers' },
            { text: 'Pages, view & backgrounds', link: '/guide/pages' }
          ]
        },
        {
          text: 'Output',
          items: [
            { text: 'Exporting', link: '/guide/export' },
            { text: 'Keyboard shortcuts', link: '/guide/keyboard-shortcuts' }
          ]
        },
        {
          text: 'Configuration',
          items: [
            { text: 'UI modules', link: '/guide/ui-modules' },
            { text: 'Themes & colors', link: '/guide/themes' },
            { text: 'Headless mode', link: '/guide/headless' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API reference',
          items: [
            { text: 'Editor', link: '/api/editor' },
            { text: 'Events', link: '/api/events' },
            { text: 'Document & element schema', link: '/api/document' },
            { text: 'TypeScript definitions', link: '/api/typescript' }
          ]
        }
      ],
      '/advanced/': [
        {
          text: 'Advanced',
          items: [
            { text: 'Customization & registries', link: '/advanced/customization' },
            { text: 'Extensibility', link: '/advanced/extensibility' },
            { text: 'Community plugins', link: '/advanced/plugins' },
            { text: 'Development skills', link: '/advanced/development-skills' },
            { text: 'Image sources', link: '/advanced/image-sources' },
            { text: 'Recipes', link: '/advanced/recipes' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Embed in plain HTML', link: '/examples/plain-html' },
            { text: 'React integration', link: '/examples/react' },
            { text: 'Vue integration', link: '/examples/vue' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bookklik-technologies/ezyreka' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@bookklik/ezyreka' }
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Search docs' }
        }
      }
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Ezyreka'
    },
    outline: { level: [2, 3], label: 'On this page' },
    docFooter: { prev: 'Previous', next: 'Next' },
    lastUpdated: { text: 'Last updated' }
  }
})
