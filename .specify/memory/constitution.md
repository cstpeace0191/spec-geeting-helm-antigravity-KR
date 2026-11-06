<!--
SYNC IMPACT REPORT
Version change: 0.0.0 (Template/Draft) -> 1.0.0
List of modified principles:
- [PRINCIPLE_1_NAME] -> I. 코드 품질 (Code Quality)
- [PRINCIPLE_2_NAME] -> II. 테스트 우선 (Test-First - NON-NEGOTIABLE)
- [PRINCIPLE_3_NAME] -> III. 웹 접근성 (Accessibility)
- [PRINCIPLE_4_NAME] -> IV. 성능 및 효율성 (Performance & Efficiency)
- [PRINCIPLE_5_NAME] -> Removed (사용자 요구사항에 따라 4대 핵심 원칙으로 구성)
Added sections:
- 기술 스택 및 보안 제약사항 (Technical Stack & Security Constraints)
- 개발 워크플로우 및 품질 게이트 (Development Workflow & Quality Gates)
Removed sections: None
Follow-up TODOs: None
-->

# Getting Started Todo App Constitution

## Core Principles

### I. 코드 품질 (Code Quality)
모든 소스 코드는 높은 가독성, 유지보수성 및 일관성을 유지해야 한다 (MUST).
- 백엔드(Express)와 클라이언트(React) 전반에서 책임 분리(Separation of Concerns)와 컴포넌트 모듈화를 엄격히 준수한다.
- ESLint 정적 분석 검사 및 Prettier 포맷팅 규칙을 준수해야 하며, 린트 오류나 경고가 남아있는 상태로 커밋할 수 없다 (MUST).
- 코드는 자체 설명적이어야 하며, 주석은 코드의 단순 동작 설명이 아닌 비즈니스적 이유와 의도(Why)를 설명하는 데 집중해야 한다.

### II. 테스트 우선 (Test-First - NON-NEGOTIABLE)
테스트 주도 개발(TDD) 사이클(Red-Green-Refactor)을 엄격하게 적용한다 (MUST).
- 새로운 기능 구현이나 엔드포인트 추가 전, 실패하는 테스트 케이스를 먼저 작성해야 한다 (MUST).
- 백엔드 핵심 비즈니스 로직(할 일 추가, 수정, 삭제, 조회)에 대한 단위 테스트 및 API 계약 테스트는 필수이다 (MUST).
- 버그 수정 시에는 해당 결함을 재현하는 단위/통합 테스트를 반드시 먼저 작성하여 검증해야 한다 (MUST).

### III. 웹 접근성 (Accessibility - a11y)
모든 사용자가 차별 없이 애플리케이션을 사용할 수 있도록 웹 접근성 표준을 준수해야 한다 (MUST).
- WCAG 2.1 Level AA 기준을 충족해야 한다 (MUST).
- 마우스 없이 키보드(Tab, Enter, Space, Escape 등)만으로 모든 작업(할 일 입력, 상태 토글, 삭제)을 완전히 수행할 수 있어야 한다 (MUST).
- 시각 장애인 및 보조공학기기 사용자를 위해 모든 대화형 요소(입력 필드, 버튼, 아이콘 등)에 의미 있는 `aria-label` 및 스크린 리더 텍스트를 제공해야 한다 (MUST).
- 텍스트와 배경 간의 명도 대비는 최소 4.5:1 이상을 유지해야 한다 (MUST).

### IV. 성능 및 효율성 (Performance & Efficiency)
클라이언트와 백엔드 모두에서 빠르고 안정적인 사용자 경험과 자원 효율성을 보장해야 한다 (MUST).
- 불필요한 React 리렌더링을 방지하고 번들 크기를 최적화하여 빠른 초기 로딩 속도(LCP < 2.5s)를 유지해야 한다 (MUST).
- 백엔드 REST API는 경량화된 JSON 페이로드를 제공하고, P95 응답 지연 시간을 200ms 이내로 유지해야 한다 (SHOULD).
- 데이터베이스(MySQL 및 SQLite) 쿼리는 전체 테이블 스캔(Full Table Scan)을 방지하고 인덱스를 적극 활용해야 한다 (MUST).

## 기술 스택 및 보안 제약사항

애플리케이션의 신뢰성과 보안을 위해 명시된 기술 스택과 제약사항을 준수한다.
- **런타임 및 프레임워크**: Node.js 22 LTS 환경에서 동작하며, 백엔드는 Express 5.x, 클라이언트는 React 19 + Vite를 표준으로 한다.
- **데이터베이스 추상화**: SQLite와 MySQL 듀얼 구성을 지원하며, 환경변수(`MYSQL_HOST` 등)를 통해 유연하게 전환 가능해야 한다.
- **보안 및 시크릿 관리**: 데이터베이스 자격 증명 및 민감 정보는 코드에 하드코딩하지 않고 환경 변수나 Helm Values/Kubernetes Secret으로 주입한다 (MUST).
- **입력 유효성 검증**: 모든 클라이언트 입력값은 백엔드에서 타입 검증 및 새니타이징(Sanitization)을 거쳐 SQL Injection 및 XSS 공격을 원천 차단해야 한다 (MUST).

## 개발 워크플로우 및 품질 게이트

모든 변경 사항은 체계적인 품질 검증 절차를 거쳐야 한다.
- 모든 기능 개발과 수정은 별도의 브랜치에서 진행되며, Pull Request(PR) 코드 리뷰를 필수로 거쳐야 한다 (MUST).
- **머지 전 필수 품질 게이트**:
  1. `npm run lint` 통과 (경고 및 에러 0건).
  2. `npm run format-check` 통과.
  3. 모든 단위/통합 테스트 성공 (`npm test`).
  4. 웹 접근성(a11y) 검사 및 성능 저하 유무 검증.
- 새로운 외부 라이브러리 도입 시 필요성과 번들 영향도를 명확히 입증하고 정당화해야 한다 (MUST).

## Governance

본 헌법은 Getting Started Todo App 프로젝트의 최상위 개발 규범이며 다른 모든 관행에 우선한다.
- 본 헌법의 개정은 명확한 제안 사유, 영향 분석(Sync Impact Report), 팀 승인 및 버전 업데이트 절차를 필수로 거쳐야 한다 (MUST).
- 버전 번호는 시맨틱 버저닝(Semantic Versioning)에 따라 엄격히 관리한다:
  - MAJOR: 원칙 삭제 또는 거버넌스 룰의 비호환적 대규모 재정의
  - MINOR: 새로운 핵심 원칙 추가 또는 실질적인 가이드라인 확장
  - PATCH: 문구 명확화, 오탈자 수정, 비시맨틱 보완
- 모든 PR 및 코드 리뷰 시 본 헌법에 정의된 4대 원칙(코드 품질, 테스트 우선, 접근성, 성능) 준수 여부를 필수 확인 항목으로 평가한다 (MUST).

**Version**: 1.0.0 | **Ratified**: 2026-11-06 | **Last Amended**: 2026-11-06
