import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Convoy — Group Trip Tracker',
        short_name: 'Convoy',
        description: 'Real-time many-to-many group trip tracker',
        theme_color: '#FAF9F5',
        background_color: '#FAF9F5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
          },
          {
            urlPattern: /^https:\/\/.*\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
          },
        ],
      },
    }),
  ],
})
