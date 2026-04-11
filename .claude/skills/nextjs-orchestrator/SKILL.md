---
name: nextjs-orchestrator
description: "crow-frontend Next.js 파이프라인 오케스트레이터. product_manager → ui_architect → frontend_dev → [state_manager + api_integrator 병렬] → [qa + reviewer 병렬] 에이전트 팀을 조율하여 새로운 Next.js 기능을 엔드투엔드로 구현한다. '프론트엔드 기능 구현', '화면 추가', '컴포넌트 만들어줘', 'Next.js 개발', 'crow-frontend에 추가' 요청 시 반드시 이 스킬을 사용할 것. 후속 작업: 구현 수정, 컴포넌트 재작성, 테스트 재실행, 특정 에이전트만 다시, 코드 재리뷰, 업데이트, 보완, 이전 구현 개선 요청 시에도 이 스킬을 사용."
---

# Next.js 파이프라인 오케스트레이터

crow-frontend 프로젝트에 새 기능을 구현하는 통합 스킬.

## 실행 모드: 에이전트 팀 (파이프라인 + 병렬 구간)

```
product_manager → ui_architect → frontend_dev
                                      ↓
                        [state_manager ‖ api_integrator]  ← 병렬
                                      ↓
                              [qa ‖ reviewer]              ← 병렬
```

## 에이전트 구성

| 팀원 | 타입 | 역할 | 스킬 | 출력 |
|------|------|------|------|------|
| product_manager | 커스텀 | 기능 기획 | nextjs-product-manager | `01_pm_feature_spec.md` |
| ui_architect | 커스텀 | 구조 설계 | nextjs-ui-architect | `02_ui_architecture.md` |
| frontend_dev | 커스텀 | 컴포넌트 구현 | nextjs-frontend-dev | TSX 파일 + `03_*.md` |
| state_manager | 커스텀 | React Query + Zustand | nextjs-state-manager | `04a_*.md` |
| api_integrator | 커스텀 | API 레이어 | nextjs-api-integrator | `04b_*.md` |
| qa | 커스텀 | 테스트 | nextjs-qa | 테스트 파일 + `05a_*.md` |
| reviewer | 커스텀 | 코드 리뷰 | nextjs-reviewer | `05b_*.md` |

---

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `/Users/minsungkang/Desktop/study/crow-frontend/_workspace/` 존재 여부 확인
2. 실행 모드 결정:
   - **`_workspace/` 미존재** → 초기 실행, Phase 1로 진행
   - **`_workspace/` 존재 + 특정 에이전트만 재실행** → 해당 Phase부터 재시작
     예: "테스트만 다시" → qa + reviewer 재실행
     예: "상태 관리만 다시" → state_manager → qa + reviewer 재실행
   - **`_workspace/` 존재 + 새 기능** → 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 새 실행

### Phase 1: 준비

1. 사용자 요청 분석 — 구현할 기능, 영향받는 화면, 우선순위
2. `/Users/minsungkang/Desktop/study/crow-frontend/_workspace/` 디렉토리 생성
3. 기존 코드베이스 파악:
   - `app/` 디렉토리 구조
   - `components/` 기존 컴포넌트
   - `types/index.ts`
   - `store/` 기존 store
   - `package.json` (설치된 패키지 확인)
4. 실행 계획 요약 보고

### Phase 2: 팀 구성

```
TeamCreate(
  team_name: "nextjs-pipeline",
  members: [
    {
      name: "product_manager",
      agent_type: "product_manager",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 프로덕트 매니저입니다.
        nextjs-product-manager 스킬을 활용하세요.

        [기능 요청]
        {사용자 요청}

        [프로젝트 컨텍스트]
        - 위치: /Users/minsungkang/Desktop/study/crow-frontend/
        - 기존 앱: 개인 가계부 (지출/예산 관리)
        - 기술: Next.js 16, React 19, Tailwind v4, Zustand v5
        - 백엔드: crow-backend Django REST API (JWT 인증)

        작업:
        1. .claude/skills/nextjs-product-manager/SKILL.md를 읽는다
        2. 기존 app/, components/ 구조를 파악한다
        3. _workspace/01_pm_feature_spec.md를 작성한다
        4. 완료 시 SendMessage(to: "ui_architect")로 파일 경로와 핵심 화면을 전달한다
      """
    },
    {
      name: "ui_architect",
      agent_type: "ui_architect",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 UI 아키텍트입니다.
        nextjs-ui-architect 스킬을 활용하세요.

        [대기] product_manager로부터 SendMessage를 받을 때까지 기다립니다.

        작업:
        1. .claude/skills/nextjs-ui-architect/SKILL.md를 읽는다
        2. _workspace/01_pm_feature_spec.md를 읽는다
        3. 기존 app/, components/ 구조를 읽는다
        4. _workspace/02_ui_architecture.md를 작성한다
        5. 완료 시 SendMessage(to: "frontend_dev")로 전달한다
      """
    },
    {
      name: "frontend_dev",
      agent_type: "frontend_dev",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 프론트엔드 개발자입니다.
        nextjs-frontend-dev 스킬을 활용하세요.

        [대기] ui_architect로부터 SendMessage를 받을 때까지 기다립니다.

        작업:
        1. .claude/skills/nextjs-frontend-dev/SKILL.md를 읽는다
        2. _workspace/02_ui_architecture.md를 읽는다
        3. 관련 기존 파일들을 읽는다
        4. TSX 컴포넌트와 페이지를 구현한다
        5. _workspace/03_frontend_implementation_summary.md를 작성한다
        6. 완료 시 SendMessage(to: "state_manager")와 SendMessage(to: "api_integrator")를 동시에 보낸다 (병렬 Phase 시작)
        7. reviewer로부터 수정 요청 수신 시 해당 파일만 수정 후 qa에게 재테스트 요청
      """
    },
    {
      name: "state_manager",
      agent_type: "state_manager",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 상태 관리 전문가입니다.
        nextjs-state-manager 스킬을 활용하세요.

        [대기] frontend_dev로부터 SendMessage를 받을 때까지 기다립니다.

        작업:
        1. .claude/skills/nextjs-state-manager/SKILL.md를 읽는다
        2. _workspace/03_frontend_implementation_summary.md를 읽는다
        3. 기존 store/ 파일들을 읽는다
        4. React Query Provider, 쿼리 훅, 필요한 Zustand store를 구현한다
        5. _workspace/04a_state_manager_summary.md를 작성한다
        6. 완료 시 SendMessage(to: "qa")와 SendMessage(to: "reviewer")를 보낸다
      """
    },
    {
      name: "api_integrator",
      agent_type: "api_integrator",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 API 통합 전문가입니다.
        nextjs-api-integrator 스킬을 활용하세요.

        [대기] frontend_dev로부터 SendMessage를 받을 때까지 기다립니다.

        작업:
        1. .claude/skills/nextjs-api-integrator/SKILL.md를 읽는다
        2. _workspace/01_pm_feature_spec.md와 _workspace/03_frontend_implementation_summary.md를 읽는다
        3. app/api/[...path]/route.ts를 읽는다 (기존 프록시 파악)
        4. lib/api/{domain}.ts fetch 함수를 작성한다
        5. 새 route handler가 필요하면 작성한다
        6. _workspace/04b_api_integrator_summary.md를 작성한다
        7. 완료 시 SendMessage(to: "qa")와 SendMessage(to: "reviewer")를 보낸다
      """
    },
    {
      name: "qa",
      agent_type: "qa",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 QA 엔지니어입니다.
        nextjs-qa 스킬을 활용하세요.

        [대기] state_manager와 api_integrator 양쪽 모두로부터 SendMessage를 받은 후 시작합니다.

        작업:
        1. .claude/skills/nextjs-qa/SKILL.md를 읽는다
        2. _workspace/04a_*, _workspace/04b_*를 읽는다
        3. 구현된 컴포넌트와 훅 파일을 읽는다
        4. Vitest + RTL로 테스트를 작성한다
        5. `cd /Users/minsungkang/Desktop/study/crow-frontend && npm run test -- --run`으로 실행한다
        6. 실패 시 담당 에이전트에게 SendMessage로 버그 보고
        7. _workspace/05a_qa_test_results.md를 작성하고 SendMessage(to: "reviewer")로 전달한다
      """
    },
    {
      name: "reviewer",
      agent_type: "reviewer",
      model: "opus",
      prompt: """
        당신은 crow-frontend 프로젝트의 시니어 리뷰어입니다.
        nextjs-reviewer 스킬을 활용하세요.

        [대기] state_manager, api_integrator, qa 세 에이전트 모두로부터 알림을 받은 후 시작합니다.

        작업:
        1. .claude/skills/nextjs-reviewer/SKILL.md를 읽는다
        2. 모든 _workspace/ 파일과 구현 파일을 읽는다
        3. App Router 베스트 프랙티스, React Compiler 규칙, 보안, 성능을 검토한다
        4. Critical/Warning 발견 시 담당 에이전트에게 수정 요청
        5. _workspace/05b_reviewer_report.md를 작성한다
        6. 최종 승인 시 오케스트레이터에게 완료를 알린다
      """
    }
  ]
)
```

**작업 등록:**
```
TaskCreate(tasks: [
  { title: "기능 명세 작성", assignee: "product_manager" },
  { title: "UI 아키텍처 설계", assignee: "ui_architect",
    depends_on: ["기능 명세 작성"] },
  { title: "컴포넌트 구현", assignee: "frontend_dev",
    depends_on: ["UI 아키텍처 설계"] },
  { title: "React Query + Zustand 구현", assignee: "state_manager",
    depends_on: ["컴포넌트 구현"] },
  { title: "API 레이어 구현", assignee: "api_integrator",
    depends_on: ["컴포넌트 구현"] },
  { title: "테스트 작성 및 실행", assignee: "qa",
    depends_on: ["React Query + Zustand 구현", "API 레이어 구현"] },
  { title: "코드 리뷰", assignee: "reviewer",
    depends_on: ["React Query + Zustand 구현", "API 레이어 구현"] }
])
```

### Phase 3: 파이프라인 실행 (팀 자체 조율)

팀원들이 SendMessage와 TaskUpdate로 자체 조율한다.

**리더 모니터링:**
- 팀원이 유휴 상태가 되면 자동 알림 수신
- 막힌 팀원에게 SendMessage로 힌트 제공
- TaskGet으로 진행률 확인

**피드백 루프:**
- reviewer → frontend_dev: 컴포넌트 수정 → qa 재테스트
- qa → state_manager: 훅 버그 → 수정 → qa 재테스트
- 최대 2회 피드백 루프, 그 이상은 오케스트레이터 에스컬레이션

### Phase 4: 완료 및 정리

1. reviewer 최종 승인 수신
2. SendMessage(to: "all")로 종료 알림
3. TeamDelete
4. `_workspace/` 보존
5. 사용자에게 결과 요약 보고:
   ```
   ## 구현 완료 요약

   ### 생성된 파일
   - app/{path}/page.tsx
   - components/{domain}/{Name}.tsx
   - lib/queries/{domain}.ts
   - lib/api/{domain}.ts

   ### 테스트 결과
   - 총 N개 / 통과 N개 / 실패 N개

   ### 리뷰 결과
   - Critical: N개 해결
   - Warning: N개 (해결/수용)

   ### 다음 단계 (필요 시)
   - npm install @tanstack/react-query (미설치 시)
   - npm run test (테스트 확인)
   - npm run dev (로컬 확인)
   ```

---

## 데이터 흐름

```
[PM] ──SendMessage──▶ [UI Architect] ──SendMessage──▶ [Frontend Dev]
                                                            │
                                          ┌─────SendMessage─┤
                                          │                  └─────SendMessage─┐
                                          ▼                                    ▼
                                   [State Manager]                    [API Integrator]
                                          │                                    │
                                 SendMessage(qa+reviewer)           SendMessage(qa+reviewer)
                                          │                                    │
                                          └──────────────┬────────────────────┘
                                                         ▼
                                             [QA] ‖ [Reviewer]  (병렬)
                                                         │
                                             최종 승인 → [오케스트레이터]
```

---

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| product_manager 실패 | 재시작. 재실패 시 리더가 기본 명세 작성 후 진행 |
| 테스트 환경 없음 (Vitest 미설치) | qa가 설치 지침 제공 후 테스트 작성 |
| 테스트 계속 실패 (2회) | qa가 오케스트레이터에 에스컬레이션 |
| reviewer Critical 반복 | 2회 후 조건부 승인으로 처리, 이슈를 보고서에 기록 |
| 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |

---

## 테스트 시나리오

### 정상 흐름
1. 사용자: "수입(Income) 탭 추가해줘. 수입 내역 CRUD와 월별 수입 합계를 보여줘."
2. Phase 0: `_workspace/` 없음 → 초기 실행
3. PM: `/income` 페이지, 수입 목록/생성/수정/삭제 + 월별 요약 명세
4. UI Architect: `app/income/page.tsx` (서버), `components/income/` 컴포넌트 설계
5. Frontend Dev: `IncomeTable.tsx`, `IncomeFormModal.tsx` 등 구현
6. State Manager + API Integrator (병렬):
   - `useIncomes()` React Query 훅, `lib/api/income.ts` fetch 함수
7. QA + Reviewer (병렬):
   - `IncomeTable.test.tsx` 작성/실행
   - "useEffect로 패칭" Warning 발견 → React Query로 수정 요청
8. 최종 보고: 파일 목록 + 테스트 결과 + 리뷰 결과

### 에러 흐름
1. qa: `npm run test` 실행 → Vitest 없음 (`vitest: command not found`)
2. qa: 설치 지침 제공 (`npm install -D vitest ...`)
3. 설치 후 재실행 → 통과
