---
name: nextjs-ui-architect
description: "Next.js App Router 구조 설계 스킬. 기능 명세를 받아 페이지 디렉토리 구조, 컴포넌트 트리, 서버/클라이언트 컴포넌트 분류를 설계한다. 'App Router 구조', '컴포넌트 계층 설계', '레이아웃 설계', '서버/클라이언트 분리' 요청 시 반드시 이 스킬을 사용할 것."
---

# Next.js App Router 구조 설계 스킬

## 1. App Router 디렉토리 규칙

```
app/
├── layout.tsx          # 루트 레이아웃 (서버 컴포넌트)
├── page.tsx            # 루트 페이지
├── loading.tsx         # 루트 로딩 UI (선택)
├── error.tsx           # 루트 에러 UI (선택, "use client")
├── {segment}/
│   ├── layout.tsx      # 중첩 레이아웃
│   ├── page.tsx        # 페이지
│   ├── loading.tsx     # 세그먼트 로딩
│   └── error.tsx       # 세그먼트 에러
└── api/
    └── {route}/route.ts
```

**파일 컨벤션:**
- `page.tsx` — 라우트의 UI, URL로 직접 접근 가능
- `layout.tsx` — 자식에게 공유되는 UI, 리렌더되지 않음
- `loading.tsx` — Suspense 기반 로딩 UI (자동 래핑)
- `error.tsx` — 에러 경계, 반드시 `"use client"`
- `not-found.tsx` — 404 UI

## 2. 서버 vs 클라이언트 컴포넌트 분류 체계

### 분류 의사결정

```
이 컴포넌트에서...
useState / useEffect / 이벤트 핸들러가 있는가?  → 클라이언트
브라우저 API (window, localStorage)를 쓰는가?  → 클라이언트
Zustand store를 직접 읽는가?                  → 클라이언트
React Query 훅을 사용하는가?                  → 클라이언트
위 중 하나도 없는가?                           → 서버 (기본값)
```

### 경계(Boundary) 설계 패턴

```tsx
// 올바른 패턴: 서버가 클라이언트를 children으로 감싸기
// app/dashboard/page.tsx (서버)
import InteractivePanel from "@/components/InteractivePanel"; // 클라이언트

export default async function DashboardPage() {
  const data = await fetchSomeData(); // 서버에서 패칭
  return (
    <div>
      <StaticHeader title="Dashboard" />  {/* 서버 */}
      <InteractivePanel initialData={data} />  {/* 클라이언트 */}
    </div>
  );
}
```

```tsx
// 나쁜 패턴: 불필요한 클라이언트 컴포넌트
"use client"; // 이 컴포넌트 하위의 모든 서버 컴포넌트가 클라이언트로 전환됨

export default function PageWrapper({ children }) {
  return <div className="wrapper">{children}</div>; // 클라이언트 불필요
}
```

## 3. 컴포넌트 분류표 형식

```
| 컴포넌트 | 위치 | 타입 | 이유 |
|---------|------|------|------|
| DashboardPage | app/page.tsx | 서버 | 데이터 패칭, 인터랙션 없음 |
| ExpenseTable | components/table/ | 클라이언트 | 정렬/선택 상태 |
| FilterPanel | components/filters/ | 클라이언트 | 필터 상태 관리 |
| StatsCards | components/ui/ | 클라이언트 | Zustand 구독 |
| AuthGuard | components/auth/ | 클라이언트 | router, useEffect |
```

## 4. 컴포넌트 트리 표현

```
app/page.tsx (서버)
└── AuthGuard (클라이언트) — 인증 확인
    └── Layout (서버)
        ├── Header (클라이언트) — 로그아웃, 뷰 전환
        ├── StatsCards (클라이언트) — Zustand 구독
        └── Body
            ├── FilterPanel (클라이언트) — 필터 상태
            └── Main
                ├── ExpenseTable (클라이언트) — CRUD
                └── Charts (클라이언트) — Recharts
```

## 5. Props 인터페이스 설계

```ts
// 컴포넌트별 Props 정의
interface ExpenseTableProps {
  // 서버에서 초기 데이터를 넘겨받는 경우
  initialExpenses?: Expense[];
}

interface FilterPanelProps {
  // 상태는 Zustand에서 — props로 받지 않음
}

interface StatsCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}
```

## 6. 출력 형식

`_workspace/02_ui_architecture.md`:

```markdown
# UI 아키텍처 설계

## 신규 파일 목록
- `app/{path}/page.tsx` — {설명}
- `components/{domain}/{Name}.tsx` — {설명}

## 컴포넌트 트리
{트리 다이어그램}

## 서버/클라이언트 분류표
{표}

## Props 인터페이스
{TypeScript 인터페이스 정의}

## 레이아웃 공유 전략
{기존 layout.tsx 재사용 vs 신규 layout 생성}

## 재사용 컴포넌트 vs 페이지 전용
- 재사용: {목록}
- 페이지 전용: {목록}
```
