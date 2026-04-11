---
name: nextjs-reviewer
description: "Next.js 프론트엔드 코드 리뷰 스킬. App Router 베스트 프랙티스, React 19 + React Compiler 규칙, 성능 최적화, 보안(JWT 처리), Tailwind CSS v4 사용 패턴을 검토하고 개선 방향을 제시한다. '코드 리뷰', '성능 최적화', '베스트 프랙티스', '개선점', '리팩토링' 요청 시 반드시 이 스킬을 사용할 것."
---

# Next.js 코드 리뷰 & 최적화 스킬

## 1. 리뷰 순서

모든 파일을 읽기 전에 시작하지 않는다:
1. `_workspace/01_pm_feature_spec.md` — 원래 의도
2. `_workspace/02_ui_architecture.md` — 설계 결정
3. `_workspace/04a_state_manager_summary.md` — 상태 관리
4. `_workspace/04b_api_integrator_summary.md` — API 레이어
5. `_workspace/05a_qa_test_results.md` — 테스트 결과
6. 실제 구현 파일들

## 2. App Router 리뷰 기준

### 서버/클라이언트 컴포넌트 오용 탐지

```tsx
// BAD: "use client" 불필요
"use client";
export default function StaticCard({ title, value }: Props) {
  return <div>{title}: {value}</div>; // 인터랙션 없음
}

// GOOD: 서버 컴포넌트로 충분
export default function StaticCard({ title, value }: Props) {
  return <div>{title}: {value}</div>;
}
```

```tsx
// BAD: "use client" 경계가 너무 위에 있음
"use client";
export default function PageWrapper({ children }) {
  // children에 서버 컴포넌트가 있어도 모두 클라이언트가 됨
  return <div className="wrapper">{children}</div>;
}

// GOOD: 클라이언트 로직을 말단으로 이동
// wrapper는 서버 컴포넌트로, 인터랙티브 버튼만 클라이언트로
```

### 데이터 패칭 오용

```tsx
// BAD: 클라이언트에서 초기 데이터를 useEffect로 패칭
"use client";
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/...").then(r => r.json()).then(setData); }, []);
  // ...
}

// GOOD: React Query 훅 사용 (캐싱, 에러 처리 자동)
"use client";
export default function Page() {
  const { data, isLoading, error } = useExpenses(params);
  // ...
}
```

## 3. React Compiler 규칙 위반 탐지

```tsx
// BAD: 수동 메모이제이션 (컴파일러가 처리하므로 불필요, 오히려 방해)
const memoizedValue = useMemo(() => computeExpensive(data), [data]);
const stableCallback = useCallback(() => doSomething(), [dep]);
const MemoizedComponent = memo(SomeComponent);

// GOOD: 그냥 일반 코드로 작성
const value = computeExpensive(data); // 컴파일러가 최적화
```

```tsx
// BAD: render 중 side effect
export default function Component() {
  fetch("/api/..."); // render 중 side effect — 컴파일러 최적화 방해
  return <div />;
}
```

## 4. 보안 체크리스트

```tsx
// BAD: 토큰을 클라이언트 스토리지에 저장
localStorage.setItem("token", accessToken); // XSS에 취약

// GOOD: 이 프로젝트의 패턴 — HttpOnly 쿠키
await fetch("/api/auth/set-cookie/", {
  method: "POST",
  body: JSON.stringify({ access_token, refresh_token }),
});
```

```tsx
// BAD: 서버 전용 환경변수를 클라이언트에 노출
const url = process.env.BACKEND_URL; // 클라이언트 컴포넌트에서 사용 시 undefined

// GOOD: NEXT_PUBLIC_ 접두사 없는 변수는 서버에서만 접근
// 클라이언트에서 필요한 공개 변수만 NEXT_PUBLIC_ 사용
```

## 5. 성능 체크리스트

**React Query 설정:**
```ts
// BAD: staleTime 없음 — 매 렌더마다 리패칭
useQuery({ queryKey: [...], queryFn: fetch });

// GOOD: 적절한 캐싱
useQuery({ queryKey: [...], queryFn: fetch, staleTime: 30_000 });
```

**번들 크기:**
```tsx
// BAD: 전체 라이브러리 import
import * as Recharts from "recharts";

// GOOD: 필요한 것만 import
import { PieChart, Pie, Cell } from "recharts";
```

**목록 렌더링:**
- 100개 이상의 항목을 렌더하는 경우 가상화(react-virtual 등)를 고려한다
- 현재 프로젝트는 페이지네이션(20개/페이지)으로 충분

## 6. 이슈 분류 기준

**Critical:**
- JWT를 localStorage/sessionStorage에 저장
- render 중 직접 side effect 발생
- 인증 필요 API를 NO_AUTH_PATHS에 잘못 추가
- TypeScript `any` 사용으로 런타임 에러 가능성

**Warning:**
- 불필요한 `"use client"` (서버 컴포넌트로 충분한 경우)
- useEffect로 초기 데이터 패칭 (React Query 미사용)
- 수동 `useMemo`/`useCallback`/`memo()` (React Compiler 방해)
- staleTime 없는 React Query

**Suggestion:**
- 타입 개선 (제네릭, 유니온 타입 활용)
- 공통 로직을 커스텀 훅으로 추출
- 에러 메시지 개선

## 7. 리뷰 보고서 형식

`_workspace/05b_reviewer_report.md`:

```markdown
# 코드 리뷰 보고서

## 총평
{전반적인 품질 평가 2-3문장}

## Critical 이슈 ({N}개)
### [CRITICAL-01] {이슈명}
- **파일:** `{경로}:{라인}`
- **문제:** {설명}
- **수정:**
  ```tsx
  // Before
  {현재 코드}
  // After
  {수정 코드}
  ```

## Warning ({N}개)
### [WARN-01] {이슈명}
- **파일:** `{경로}`
- **문제:** {설명}
- **권장:** {방법}

## Suggestion ({N}개)
- [SUGG-01] `{파일}`: {제안}

## 최종 승인
- [ ] Critical 모두 해결
- [ ] Warning 검토 완료
- **결과:** {승인 / 조건부 승인 / 반려}
```
