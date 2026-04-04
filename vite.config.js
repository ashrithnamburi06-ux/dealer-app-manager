import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: ['favicon.svg', 'robots.txt'],

      manifest: {
        name: 'Grocery Dealer App',
        short_name: 'DealerApp',
        description: 'Manage grocery store easily',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',

        icons: [
  {
    src: '/assets/icon-192.png',
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: '/assets/icon-512.png',
    sizes: '512x512',
    type: 'image/png'
  }
]
      },

      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache'
            }
          }
        ]
      }
    })
  ]
})