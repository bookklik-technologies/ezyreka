import { defineConfig } from 'vitepress'
import { nav } from './config/nav'
import { sidebar } from './config/sidebar'
import { editLinkConfig, sharedThemeConfig } from './config/shared'

const description =
  'Ezyreka is an embeddable, dependency-free JavaScript library for adding a Canva-style design editor to web apps.'

export default defineConfig({
  lang: 'en-US',
  title: 'Ezyreka',
  titleTemplate: false,
  description,
  head: [
    // Resolve beneath the deployment base path.
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/ezyreka/icon.svg' }],
    ['meta', { name: 'theme-color', content: '#FACC15' }]
  ],
  // GitHub Pages project site: docs are served from /ezyreka/.
  base: '/ezyreka/',
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    lineNumbers: false
  },
  themeConfig: {
    logo: '/logo.svg',
    nav,
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bookklik-technologies/ezyreka' }
    ],
    editLink: editLinkConfig('ezyreka'),
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Ezyreka'
    },
    ...sharedThemeConfig
  }
})
