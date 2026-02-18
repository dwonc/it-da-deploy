# ===================================
# Stage 1: Build
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

# ✅ ARG 한 번만 선언
ARG VITE_API_URL
ARG VITE_KAKAO_MAP_KEY

# ENV로 변환
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KAKAO_MAP_KEY=$VITE_KAKAO_MAP_KEY

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ===================================
# Stage 2: Production
# ===================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]