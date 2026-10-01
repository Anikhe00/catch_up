import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Fonts must be cached too or the app falls back to system fonts offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,vietnamese,greek,greek-ext}-*.woff2'],
      },
      manifest: {
        name: 'Catch-Up',
        short_name: 'Catch-Up',
        description: 'A calm way to work through a study backlog before a deadline.',
        theme_color: '#185FA5',
        background_color: '#f6f8fb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
})
