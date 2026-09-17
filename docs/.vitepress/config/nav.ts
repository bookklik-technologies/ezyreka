import type { DefaultTheme } from 'vitepress'

// Shared navigation order: Guide → API reference → project-specific sections → Resources.
export const nav: DefaultTheme.NavItem[] = [
  { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
  { text: 'API reference', link: '/api/editor', activeMatch: '/api/' },
  { text: 'Advanced', link: '/advanced/customization', activeMatch: '/advanced/' },
  { text: 'Examples', link: '/examples/', activeMatch: '/examples/' },
  {
    text: 'Resources',
    items: [
      { text: 'Development skills', link: '/advanced/development-skills' },
      { text: 'TypeScript definitions', link: '/api/typescript' },
      { text: 'Changelog (GitHub)', link: 'https://github.com/bookklik-technologies/ezyreka/releases' }
    ]
  }
]
