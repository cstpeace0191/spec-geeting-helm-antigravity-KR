# Quickstart Validation Guide: Todo App Core

## 1. 사전 요구사항 (Prerequisites)

- **Node.js**: v22 LTS 이상 (`node -v`)
- **npm**: v10 이상 (`npm -v`)
- **Docker & Docker Compose** (선택 사항, 컨테이너 실행 시 필요): Docker Desktop 또는 Docker Engine
- **Helm v3** 및 **Kubectl** (선택 사항, Kubernetes 환경 배포 시 필요)

---

## 2. 로컬 개발 환경 구성 및 실행 (Local Setup)

### 2.1 의존성 설치

```bash
# 1. 백엔드 의존성 설치
cd backend
npm install

# 2. 클라이언트 의존성 설치
cd ../client
npm install
cd ..
```

### 2.2 로컬 개발 서버 실행

```bash
# 백엔드 실행 (포트 3000, nodemon 기반 자동 재시작)
cd backend
npm run dev

# 별도 터미널에서 클라이언트 개발 서버 실행 (포트 5173, Vite)
cd client
npm run dev
```

- 브라우저 접속: `http://localhost:5173` (백엔드와 프론트엔드가 독립 구동되며 Vite 프록시 또는 Traefik을 통해 통신)

---

## 3. Docker Compose 환경 실행 (Containerized Setup)

```bash
# 서비스 빌드 및 실행 (MySQL + 백엔드 + 프론트엔드 + Traefik 프록시)
docker compose up --build -d

# 실행 상태 확인
docker compose ps
```

- 브라우저 접속: `http://localhost` (Traefik 라우팅을 통해 단일 진입점으로 제공)
- phpMyAdmin 접속: `http://db.localhost` (MySQL 데이터 확인)

---

## 4. End-to-End 검증 시나리오 (Verification Scenarios)

### 시나리오 1: 환영 배너 및 서버 연결 확인
```bash
curl -s http://localhost:3000/api/greeting
```
- **예상 응답**: `{"greeting":"Hello world!"}`

### 시나리오 2: 할 일 목록 초기 상태 확인
```bash
curl -s http://localhost:3000/api/items
```
- **예상 응답**: `[]` (등록된 항목이 없을 때 빈 배열 반환, UI 상에서는 "등록된 항목이 없습니다" 문구 노출)

### 시나리오 3: 새로운 할 일 추가
```bash
curl -s -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"우유 사기"}'
```
- **예상 응답**: `{"id":"<UUID>","name":"우유 사기","completed":false}` (HTTP 201)

### 시나리오 4: 255자 초과 및 공백 유효성 검증
```bash
# 빈 문자열 전송 시
curl -s -i -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"   "}'
```
- **예상 응답**: HTTP 400 Bad Request

### 시나리오 5: 할 일 완료 상태 토글
```bash
curl -s -X PUT http://localhost:3000/api/items/<UUID> \
  -H "Content-Type: application/json" \
  -d '{"name":"우유 사기","completed":true}'
```
- **예상 응답**: `{"id":"<UUID>","name":"우유 사기","completed":true}` (HTTP 200)

### 시나리오 6: 할 일 즉시 영구 삭제
```bash
curl -s -i -X DELETE http://localhost:3000/api/items/<UUID>
```
- **예상 응답**: HTTP 200 OK (목록 조회 시 해당 항목 미포함)

