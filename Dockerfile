# ─────────────────────────────────────────
# Stage 1: Build React + Vite
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
COPY m6-thermal-power-plant/package*.json ./

# Dùng npm ci (clean install) để đảm bảo version lock
RUN npm ci

# Copy toàn bộ source code
COPY m6-thermal-power-plant/ .

# Build arg để inject API URL lúc build (ví dụ: http://your-cloud-ip:8080)
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle → /app/dist
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Serve bằng Nginx
# ─────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy static files từ stage build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
