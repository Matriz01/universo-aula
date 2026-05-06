import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 5_242_880,
        runtimeCaching: [
          {
            urlPattern: /\/textures\/.+\.(jpg|png|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'solar-textures-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/data\/.+\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'solar-data-v1',
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            '@react-spring/three',
            '@react-three/postprocessing',
          ],
          'vendor-react': ['react', 'react-dom'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
});
