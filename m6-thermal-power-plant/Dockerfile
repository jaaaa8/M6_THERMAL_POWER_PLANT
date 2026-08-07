# ─────────────────────────────────────────
# Stage 1: Build bundle production bằng Vite
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Không set VITE_API_BASE_URL — apiClient.js mặc định dùng path tương đối
# ('/api/...') khi thiếu biến này, để Nginx proxy cùng origin (tránh CORS).
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Serve bằng Nginx + reverse-proxy /api sang backend
# ─────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
