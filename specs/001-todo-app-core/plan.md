# Implementation Plan: Todo App Core (할 일 관리 기본 기능)

**Branch**: `001-todo-app-core` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-todo-app-core/spec.md`

## Summary

`requirements-KR.txt` 및 기능 명세서에 정의된 Todo App 핵심 기능(신규 등록, 전체 조회, 완료 토글, 영구 삭제, 연결 확인 배너)을 구현하기 위한 종합 기술 계획입니다. 백엔드는 Node.js 22 LTS 및 Express 5.x 기반 모듈화된 REST 라우터와 SQLite/MySQL 듀얼 저장소 추상화를 구성하고, 프론트엔드는 React 19와 React-Bootstrap을 활용하여 WCAG 2.1 AA 웹 접근성과 고성능 반응성을 갖춘 반응형 UI를 제공합니다.

## Technical Context

**Language/Version**: Node.js 22 LTS (ES Modules & CommonJS 지원)

**Primary Dependencies**:
- **백엔드**: Express `^5.1.0`, `mysql2` `^3.14.1`, `sqlite3` `^5.1.7`, `uuid` `^11.1.0`, `wait-port` `^1.1.0`
- **클라이언트**: React `^19.1.0`, `react-dom` `^19.1.0`, `react-bootstrap` `^2.10.10`, `bootstrap` `^5.3.6`, `@fortawesome/react-fontawesome` `^0.2.2`, `@fortawesome/free-solid-svg-icons` `^6.5.1`, `vite` `^6.3.5`, `sass` `^1.62.1`

**Storage**:
- 로컬/기본: SQLite 3 파일 저장소 (`/etc/todos/todo.db` 또는 `SQLITE_DB_LOCATION`)
- 컨테이너/프로덕션: MySQL 9.3 (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB` 환경변수 기반 연결)

**Testing**:
- 백엔드: Jest `^29.7.0` 단위 및 라우트 계약 테스트
- 정적 검사: ESLint `^8.55.0`, Prettier `^3.2.4`

**Target Platform**: Linux 컨테이너 환경 (Docker, Docker Compose, Kubernetes/Helm 차트 배포, Traefik v3.6 리버스 프록시)

**Project Type**: 웹 애플리케이션 (React 클라이언트 + Express 백엔드 REST API + Helm 인프라)

**Performance Goals**:
- 사용자 작업 반영 지연 시간 1초 이내 (SC-001)
- 백엔드 API P95 응답 지연 시간 200ms 이내
- 클라이언트 초기 로딩(LCP) 2.5초 이내

**Constraints**:
- WCAG 2.1 Level AA 웹 접근성 준수 (키보드 100% 조작, 스크린 리더 대체 텍스트, 4.5:1 이상 명도 대비)
- 할 일 이름 최대 255자 제약 및 공백 차단
- 확인 팝업 없는 즉각 삭제 및 등록 순(FIFO) 정렬
- 민감 정보 하드코딩 금지 (시크릿 환경변수 주입)
- 프로세스 종료 시 안전한 커넥션 종료(Graceful Shutdown)

**Scale/Scope**: 단일 공유 작업 환경 MVP, 5대 REST API 엔드포인트 (`/api/greeting`, `/api/items` [GET, POST], `/api/items/:id` [PUT, DELETE])

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 (Principle) | 요구 기준 | 준수 계획 및 검증 결과 | 게이트 상태 |
| :--- | :--- | :--- | :---: |
| **I. 코드 품질 (Code Quality)** | ESLint 및 Prettier 무경고/무에러, 책임 분리, 명확한 모듈화 | 라우터별 파일 분리, DB 드라이버 추상화 계층 구축, CI/PR 단계에서 린트/포맷 강제 | **PASS** |
| **II. 테스트 우선 (Test-First)** | TDD 사이클 준수, 단위 및 API 계약 테스트 필수 | Jest 기반 각 API 엔드포인트 및 저장소 테스트 선행 작성, 회귀 방지 | **PASS** |
| **III. 웹 접근성 (Accessibility)** | WCAG 2.1 AA 준수, 전 기능 키보드 조작, 명도 대비 4.5:1, aria-label | React-Bootstrap 폼 접근성 속성, 아이콘 버튼 `aria-label` 필수 지정, 탭 포커스 스타일링 | **PASS** |
| **IV. 성능 및 효율성 (Performance)** | UI 반응 1초 이내, P95 200ms 이내, 초기 로딩 LCP < 2.5s | 인덱스 기반 PK 쿼리, 경량 JSON 응답, Vite 번들 최적화 및 불필요한 상태 리렌더링 방지 | **PASS** |

*모든 게이트 검증 결과: 이상 없음 (ALL PASS)*

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-app-core/
├── plan.md              # 본 구현 계획 문서 (/speckit-plan 생성)
├── research.md          # 기술 연구 및 의사결정 문서 (Phase 0)
├── data-model.md        # 엔티티, DDL 스키마 및 상태 전이 모델 (Phase 1)
├── quickstart.md        # E2E 검증 및 실행 가이드 (Phase 1)
├── contracts/           # 인터페이스 계약 명세 (Phase 1)
│   └── todo-api.yaml    # OpenAPI 3.1 REST API 명세서
├── checklists/
│   └── requirements.md  # 명세 품질 검증 체크리스트
└── tasks.md             # 세부 작업 분해 목록 (/speckit-tasks 생성 대상)
```

### Source Code (repository root)

```text
backend/
├── package.json
├── src/
│   ├── index.js              # Express 앱 진입점 및 Graceful Shutdown
│   ├── routes/
│   │   ├── getGreeting.js    # GET /api/greeting
│   │   ├── getItems.js       # GET /api/items (FIFO 등록 순 조회)
│   │   ├── addItem.js        # POST /api/items (UUID v4 부여, 255자 검증)
│   │   ├── updateItem.js     # PUT /api/items/:id (완료 상태 토글)
│   │   └── deleteItem.js     # DELETE /api/items/:id (즉시 영구 삭제)
│   └── persistence/
│       ├── index.js          # DB 팩토리 및 초기화 (MYSQL_HOST 분기)
│       ├── mysql.js          # MySQL 드라이버 (mysql2, wait-port)
│       └── sqlite.js         # SQLite 드라이버 (sqlite3)
└── spec/
    └── routes/
        ├── getGreeting.spec.js
        ├── getItems.spec.js
        ├── addItem.spec.js
        ├── updateItem.spec.js
        └── deleteItem.spec.js

client/
├── package.json
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx              # React 19 마운트 진입점
    ├── App.jsx               # 전역 상태 관리 및 에러 배너 렌더링
    ├── App.scss              # 테마 및 접근성 고대비 스타일
    └── components/
        ├── Greeting.jsx      # 환영 배너 컴포넌트
        ├── AddNewItemForm.jsx# 신규 할 일 추가 폼 (입력 검증 및 버튼 상태)
        ├── TodoListCard.jsx  # 할 일 목록 컨테이너 및 빈 상태/로딩 안내
        └── ItemDisplay.jsx   # 개별 할 일 아이템 (체크박스 토글, 삭제 버튼)

helm/
└── todo-app/
    ├── Chart.yaml            # Helm 차트 메타데이터
    ├── values.yaml           # 구성 매개변수 (이미지, 리소스, DB 설정)
    └── templates/
        ├── deployment.yaml   # 애플리케이션 및 DB 디플로이먼트
        ├── service.yaml      # ClusterIP / NodePort 서비스
        ├── ingress.yaml      # Ingress 트래픽 라우팅
        └── secret.yaml       # DB 인증정보 시크릿
```

**Structure Decision**:
- 백엔드와 프론트엔드가 명확히 분리된 `Web application` 구조를 채택함.
- 백엔드는 단일 책임 원칙에 따라 라우트별 모듈 분리를 적용하며, DB 인터페이스를 추상화하여 SQLite와 MySQL을 투명하게 지원.
- 클라이언트는 React 19 + Vite를 사용하고 재사용 가능한 UI 컴포넌트로 분리하여 웹 접근성(a11y)과 고성능을 보장.
- Helm 차트는 애플리케이션과 MySQL 컨테이너 배포 명세를 정의하여 Kubernetes 환경 배포를 완벽히 지원.

## Complexity Tracking

> **Constitution Check의 모든 게이트를 통과하였으며(ALL PASS), 정당화가 필요한 불필요한 아키텍처 복잡성 위반 사항 없음.**

| 위반 항목 | 필요 사유 | 기각된 더 단순한 대안 및 이유 |
| :--- | :--- | :--- |
| 없음 (None) | N/A | N/A |
