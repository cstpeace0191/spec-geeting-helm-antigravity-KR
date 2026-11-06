# Phase 0 Research: Todo App Core

## Overview

본 문서는 `requirements-KR.txt` 및 기능 명세서(`specs/001-todo-app-core/spec.md`), 프로젝트 헌법(`.specify/memory/constitution.md`)을 기반으로 기술 스택, 아키텍처 패턴, 모범 사례 및 설계 결정을 분석하고 문서화합니다.

---

## Technical Decisions & Rationale

### 1. Dual Persistence Layer (SQLite & MySQL)

- **결정 (Decision)**:
  - 추상 저장소 인터페이스(`persistence/index.js`)를 두고, 환경변수 `MYSQL_HOST` 유무에 따라 `mysql.js` 또는 `sqlite.js` 드라이버를 동적으로 로드한다.
  - `sqlite3` 모듈을 사용하여 로컬 파일 기반(`/etc/todos/todo.db` 또는 `SQLITE_DB_LOCATION`)으로 동작하며 디렉터리 자동 생성을 지원한다.
  - `mysql2` 및 `wait-port`를 사용하여 MySQL 인프라 연결 시 포트 오픈 대기 및 자동 테이블 스키마 초기화(`CREATE TABLE IF NOT EXISTS todo_items ...`)를 수행한다.
- **근거 (Rationale)**:
  - 로컬 단독 실행(경량 데모, 유닛 테스트) 시 추가 인프라 없이 SQLite로 즉시 실행 가능해야 함.
  - 컨테이너 및 클라우드(Kubernetes/Helm) 환경에서는 분리된 MySQL 데이터베이스를 연결하여 확장성과 영속성을 보장할 수 있음.
- **고려된 대안 (Alternatives Considered)**:
  - *TypeORM / Prisma*: 강력한 ORM이지만 본 프로젝트의 경량화 목표와 단순 CRUD 스키마 대비 불필요한 번들/복잡도 증가로 배제.
  - *In-Memory 저장소*: 재시작 시 데이터가 유실되므로 헌법 및 성공 기준(SC-005, 데이터 유실률 0%)에 위배되어 배제.

---

### 2. 백엔드 아키텍처 및 Express 5.x 라우팅

- **결정 (Decision)**:
  - Node.js 22 LTS 및 최신 Express 5.x를 채택.
  - 라우트 핸들러를 도메인 기능별로 모듈화 분리:
    - `routes/getGreeting.js`: 환영 메시지 반환
    - `routes/getItems.js`: 목록 조회 (오래된 순 FIFO 정렬)
    - `routes/addItem.js`: 신규 등록 (UUID v4 생성, 255자 검증, 중복 허용)
    - `routes/updateItem.js`: 상태 토글 및 업데이트
    - `routes/deleteItem.js`: 즉시 영구 삭제
  - Graceful Shutdown: `SIGINT`, `SIGTERM`, `SIGUSR2`(nodemon) 수신 시 DB 커넥션을 안전하게 닫고 프로세스를 종료.
- **근거 (Rationale)**:
  - Express 5.x는 Promise 기반 비동기 에러 핸들링을 기본 지원하여 미들웨어 복잡도를 줄임.
  - 각 라우터가 독립된 단일 책임을 가져 단위 테스트(Jest) 작성이 용이함.
- **고려된 대안 (Alternatives Considered)**:
  - *Fastify*: 성능이 뛰어나지만 기존 요구사항 및 표준 npm 생태계 호환성을 위해 Express 선택.

---

### 3. 클라이언트 아키텍처 및 상태 관리

- **결정 (Decision)**:
  - React 19 + Vite 6.x 번들러 사용.
  - Bootstrap 5.3 및 React-Bootstrap 2.10 컴포넌트 활용.
  - 클라이언트 상태는 컴포넌트 트리 상위(`App.jsx` 또는 전용 상태 훅)에서 일원화하여 관리하며, API 호출 완료 시 즉시 로컬 상태를 동기화.
  - 비동기 작업 중 중복 제출 방지: 추가 요청 중 `isAdding` 상태로 버튼 비활성화 및 "Adding..." 텍스트 노출.
  - 상단 알림 배너: 네트워크 실패 시 Bootstrap `Alert` 컴포넌트를 통해 비간섭형 에러 메시지 노출.
- **근거 (Rationale)**:
  - 외부 대규모 상태 관리 라이브러리(Redux, Zustand 등) 없이 React 내장 훅(`useState`, `useEffect`, `useCallback`)만으로 충분히 가볍고 빠른 성능 달성.
  - 불필요한 리렌더링을 방지하고 빠른 번들 로딩(LCP < 2.5s) 보장.
- **고려된 대안 (Alternatives Considered)**:
  - *Redux Toolkit*: 단일 Todo 앱 도메인에 비해 보일러플레이트가 과도함.

---

### 4. 웹 접근성 (WCAG 2.1 AA) 준수 전략

- **결정 (Decision)**:
  - 마우스 없는 전 기능 키보드 조작: `Tab`, `Shift+Tab` 포커스 이동, `Enter` 폼 제출, `Space` 체크박스 토글, `Enter/Space` 삭제 버튼 활성화.
  - 모든 대화형 아이콘(@fortawesome)에 시각장애인용 대체 텍스트 제공:
    - 체크박스: `aria-label="Mark task as complete"` / `aria-label="Mark task as incomplete"`
    - 삭제 버튼: `aria-label="Delete task: {taskName}"`
  - 고대비 색상 적용: 텍스트 및 UI 요소의 명도 대비 4.5:1 이상 유지.
  - 스크린 리더 친화적 폼 구조: `<Form.Label visually-hidden>` 제공.
- **근거 (Rationale)**:
  - 헌법 핵심 원칙 III(웹 접근성) 및 기능 명세서 SC-004 기준을 완벽하게 만족.

---

### 5. 인프라 및 Helm 차트 배포 아키텍처

- **결정 (Decision)**:
  - 멀티 컨테이너 환경:
    - 백엔드 컨테이너: Node.js 22 이미지, 포트 3000, 정적 클라이언트 파일 서빙 기능 내장.
    - 데이터베이스: MySQL 9.3 컨테이너 (Kubernetes 배포 시 Helm 하위 차트 또는 독립 StatefulSet/Service).
  - 리버스 프록시: 로컬 개발 환경에서는 Traefik v3.6 활용 (`/api`는 백엔드로, 정적 에셋은 Vite 개발서버 또는 프론트엔드로 라우팅).
  - Helm 차트 구성:
    - `templates/deployment.yaml`: 백엔드/프론트엔드 파드 배포
    - `templates/service.yaml`: 클러스터 내부 네트워킹
    - `templates/ingress.yaml`: 외부 트래픽 진입점
    - `templates/secret.yaml`: DB 비밀번호 등 민감정보 보호
- **근거 (Rationale)**:
  - 개발 환경(Docker Compose)과 운영/스테이징 환경(Kubernetes Helm) 간의 아키텍처 정합성을 유지.

