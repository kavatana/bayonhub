import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },
  build: {
    reportCompressedSize: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/src/lib/translations.js")) {
            return "app-translations"
          }
          if (id.includes("@react-three")) {
            return "vendor-three-renderers"
          }
          if (id.includes("three")) {
            return "vendor-three"
          }
          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "vendor-maps"
          }
          if (id.includes("gsap")) {
            return "vendor-gsap"
          }
          if (id.includes("react-dom") || id.includes("react-router")) {
            return "vendor-react"
          }
          if (id.includes("zustand") || id.includes("immer")) {
            return "vendor-state"
          }
          if (id.includes("lucide-react")) {
            return "vendor-ui"
          }
          if (id.includes("node_modules")) {
            return "vendor-misc"
          }
          if (id.includes("/components/three/")) return "three-components"
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 500,
    outDir: "dist",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "noise.svg"],
      manifest: {
        name: "BayonHub",
        short_name: "BayonHub",
        description: "Cambodia's Premier Marketplace",
        theme_color: "#C62828",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        mode: "development",
        sourcemap: false,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/listings/,
            handler: "NetworkFirst",
            options: {
              cacheName: "listings-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|avif)/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/api\/search/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "search-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 600 },
            },
          },
        ],
        importScripts: ["/push-handler.js"],
        globIgnores: ["**/vendor-three*", "**/vendor-maps*", "**/node_modules/**"],
      },
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
  ],
})
