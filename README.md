# 🎯 IT-DA 배포 레포지토리

AI 기반 모임 추천 플랫폼 IT-DA의 배포 환경 구성

## 📁 프로젝트 구조

```
it-da-deploy/
├── backend/              # Spring Boot (Java 17)
│   ├── Dockerfile
│   └── .env.example
├── ai-service/           # FastAPI (Python 3.11)
│   ├── Dockerfile
│   └── .env.example
├── frontend/             # React (Vite)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml    # 통합 실행
├── .env.example          # 루트 환경변수
└── README.md
```

## 🚀 빠른 시작 (로컬 Docker)

### 1. 환경변수 설정

```bash
# 루트 .env 파일 생성
cp .env.example .env
# .env 파일 편집하여 실제 값 입력

# 각 서비스별 .env 설정 (선택)
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env
```

### 2. Docker Compose 실행

```bash
# 빌드 & 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down

# 데이터까지 삭제
docker-compose down -v
```

### 3. 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- FastAPI Docs: http://localhost:8000/docs
- MySQL: localhost:3306
- Redis: localhost:6379

## 🔧 개발 환경 설정

### 필수 요구사항

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 선택 요구사항 (로컬 개발)

- Java 17
- Node.js 18+
- Python 3.11
- MySQL 8.0
- Redis 7.0

## 📦 서비스별 상세

### Backend (Spring Boot)

- **포트:** 8080
- **프로필:** `local`, `docker`, `prod`
- **주요 기능:** OAuth2, WebSocket, Redis Session

### AI Service (FastAPI)

- **포트:** 8000
- **모델:** LightGBM, SVD (경량화)
- **제외:** KcELECTRA (배포 시 불필요)

### Frontend (React + Vite)

- **포트:** 3000 (Docker), 5173 (개발)
- **빌드:** Nginx로 정적 파일 서빙

## 🌐 AWS 배포

### EC2 배포 준비

```bash
# EC2 인스턴스 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# Docker 설치
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER

# 프로젝트 클론
git clone https://github.com/your-repo/it-da-deploy.git
cd it-da-deploy

# 환경변수 설정
nano .env

# 실행
docker-compose up -d --build
```

### Vercel 프론트엔드 배포

1. Vercel 프로젝트 연결
2. 환경변수 설정:
   - `VITE_API_URL`: AWS EC2 백엔드 URL
   - `VITE_KAKAO_MAP_KEY`: 카카오 맵 API 키
3. 자동 배포

### 도메인 연결 (가비아)

- **프론트:** `itda.com` → Vercel
- **백엔드:** `api.itda.com` → AWS EC2

## 🔄 CI/CD

GitHub Actions를 통한 자동 배포 (`.github/workflows/deploy.yml`)

## 🐛 트러블슈팅

### MySQL 연결 실패

```bash
# 컨테이너 재시작
docker-compose restart mysql backend

# 로그 확인
docker-compose logs mysql
```

### Redis 연결 실패

```bash
docker-compose restart redis
```

### 빌드 실패

```bash
# 캐시 제거 후 재빌드
docker-compose build --no-cache
docker-compose up -d
```

## 📝 환경 변수 목록

| 변수명               | 설명             | 기본값                |
| -------------------- | ---------------- | --------------------- |
| `DB_PASSWORD`        | MySQL 비밀번호   | 1234                  |
| `VITE_API_URL`       | 백엔드 API URL   | http://localhost:8080 |
| `VITE_KAKAO_MAP_KEY` | 카카오 맵 API 키 | -                     |

## 📄 라이선스

MIT License

## 👥 팀

IT-DA 개발팀
