import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv đọc file .env — KHÔNG dùng process.env, vì Vite nạp .env vào
  // import.meta.env chứ không nạp vào process.env (proxy target từng luôn
  // rơi về 8080 dù .env khai cổng khác).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    server: {
      proxy: {
        // Proxy mọi request /api → backend Spring Boot (dev). Tránh CORS.
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
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
  }
})
