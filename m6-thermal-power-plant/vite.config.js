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
          // Không set cứng header Origin nữa — để nguyên Origin thật của trình
          // duyệt (http://localhost:5173/5174), CorsConfig.java backend đã cho
          // phép 2 origin này. Set cứng 8080 trước đây làm login qua proxy luôn
          // bị 403 (CORS) vì 8080 không nằm trong allowlist.
        },
        // WebSocket (STOMP) — useWebSocket.js giờ dùng path tương đối '/ws',
        // cần proxy riêng ở dev vì Vite không tự forward theo '/api'.
        '/ws': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
