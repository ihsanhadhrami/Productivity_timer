import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use 'prompt' to give users control over when to update
      // This prevents disruptive auto-reloads during active sessions
      registerType: 'prompt',
      
      // Include all static assets for offline support
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.svg',
        'pwa-192x192.svg',
        'pwa-512x512.svg',
        'pwa-maskable-512x512.svg',
        'og-image.png',
        'timer-worker.js'
      ],

      // Web App Manifest configuration
      manifest: {
        name: 'Focus Timer by Ihsan',
        short_name: 'Focus Timer',
        description: 'A beautiful productivity timer with focus sessions, break reminders, streak tracking, and notification sounds.',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },

      // Workbox configuration for service worker
      workbox: {
        // Files to precache - Vite build outputs
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        
        // Clean up old caches automatically
        cleanupOutdatedCaches: true,
        
        // Use network-first for navigation to ensure fresh content
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/], // Exclude API routes if any
        
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache images with cache-first strategy
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },

      // Development options
      devOptions: {
        enabled: false, // Disable SW in dev to avoid caching issues
        type: 'module'
      }
    })
  ],
})
