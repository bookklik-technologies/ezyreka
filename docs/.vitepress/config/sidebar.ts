import type { DefaultTheme } from 'vitepress'

// Guide sidebar begins with "Getting started", followed by topic groups in learning order.
export const guideSidebar: DefaultTheme.SidebarItem[] = [
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
]

export const apiSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'API reference',
    items: [
      { text: 'Editor', link: '/api/editor' },
      { text: 'Events', link: '/api/events' },
      { text: 'Document & element schema', link: '/api/document' },
      { text: 'TypeScript definitions', link: '/api/typescript' }
    ]
  }
]

export const advancedSidebar: DefaultTheme.SidebarItem[] = [
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
]

export const examplesSidebar: DefaultTheme.SidebarItem[] = [
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

export const sidebar: DefaultTheme.Sidebar = {
  '/guide/': guideSidebar,
  '/api/': apiSidebar,
  '/advanced/': advancedSidebar,
  '/examples/': examplesSidebar
}
