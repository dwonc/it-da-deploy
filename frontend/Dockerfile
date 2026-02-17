# ===================================
# Stage 1: Build
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

# 빌드에 필요한 도구 설치
RUN apk add --no-cache python3 make g++

# package.json과 lock 파일 복사
COPY package*.json ./

# 의존성 설치 (npm install 사용)
RUN npm install

# 소스 코드 복사
COPY . .

# 환경변수 설정 (빌드 타임)
ARG VITE_API_URL=import.meta.env.VITE_API_URL || 'https://api.it-da.cloud'
ARG VITE_KAKAO_MAP_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KAKAO_MAP_KEY=$VITE_KAKAO_MAP_KEY

# 프로덕션 빌드
RUN npm run build

# ===================================
# Stage 2: Production
# ===================================
FROM nginx:alpine

# 빌드된 파일을 Nginx html 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정 파일 복사 (있는 경우)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
