import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      // Proxy mọi request /api → backend Spring Boot (dev). Tránh CORS.
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Giả lập Origin từ backend để Spring Security không coi là Cross-Origin
            proxyReq.setHeader('Origin', 'http://localhost:8080');
          });
        }
      },
    },
  },
})
