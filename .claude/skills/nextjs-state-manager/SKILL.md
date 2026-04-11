---
name: nextjs-state-manager
description: "React Query + Zustand 상태 아키텍처 스킬. 서버 상태(API 데이터)는 React Query로, 클라이언트 상태(UI 상태)는 Zustand v5로 분리하여 구현한다. '상태 관리', 'React Query 설정', 'Zustand store', '데이터 패칭 훅', '캐싱' 요청 시 반드시 이 스킬을 사용할 것."
---

# React Query + Zustand 상태 관리 스킬

## 1. 상태 분류 원칙

```
데이터가 서버에서 오는가? (API fetch)
  → Yes: React Query (서버 상태)
  → No: 로컬 UI 상태인가?
    → 단순 토글/선택: useState (컴포넌트 로컬)
    → 여러 컴포넌트가 공유: Zustand (글로벌 클라이언트 상태)
```

**React Query:** 지출 목록, 예산 요약, 필터 옵션
**Zustand:** 사이드바 열림/닫힘, 뷰 모드, 선택된 행, 필터 파라미터
**useState:** 모달 열림, 폼 입력값 (단일 컴포넌트 내)

## 2. React Query 설정

### QueryClient Provider

```tsx
// app/providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,      // 30초 — 같은 데이터 재요청 방지
          gcTime: 5 * 60_000,    // 5분 — 캐시 유지
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

```tsx
// app/layout.tsx — Providers 추가
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body ...>
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
```

### Query Key 팩토리

```ts
// lib/queries/{domain}.ts
export const expenseKeys = {
  all: ["expenses"] as const,
  list: (params: { filters: Filters; page: number; pageSize: number; sortKey: string; sortDir: string }) =>
    [...expenseKeys.all, "list", params] as const,
  detail: (id: number) => [...expenseKeys.all, "detail", id] as const,
  options: () => [...expenseKeys.all, "options"] as const,
  summary: (params: { year: number; month: number }) =>
    [...expenseKeys.all, "summary", params] as const,
};
```

### Query 훅 패턴

```ts
export function useExpenses(params: QueryParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => fetchExpenses(params),
    placeholderData: keepPreviousData, // 페이지 전환 시 이전 데이터 유지
  });
}
```

### Mutation 패턴

```ts
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      // 관련 쿼리 모두 무효화
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
    onError: (error: Error) => {
      // 에러는 컴포넌트에서 처리 — 여기서는 logging만
      console.error("Create failed:", error.message);
    },
  });
}
```

## 3. Zustand v5 패턴

### 새 store 작성

```ts
// store/useUIStore.ts
import { create } from "zustand";

type UIStore = {
  sidebarOpen: boolean;
  view: "table" | "charts";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setView: (view: "table" | "charts") => void;
};

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  view: "table",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setView: (view) => set({ view }),
}));
```

### 기존 store 확장 시

기존 `useStore.ts`의 API를 유지하면서 새 상태만 추가한다:
```ts
// 기존 타입에 추가
type Store = {
  // ... 기존 필드 유지 ...
  newField: NewType;
  newAction: (arg: Arg) => void;
};
```

## 4. React Query ↔ Zustand 연결

필터(Zustand) 변경 → 쿼리 재실행 패턴:
```tsx
"use client";
import { useFiltersStore } from "@/store/useFiltersStore";
import { useExpenses } from "@/lib/queries/expenses";

export default function ExpenseContainer() {
  const { filters, page, pageSize, sortKey, sortDir } = useFiltersStore();
  const { data, isLoading, error } = useExpenses({ filters, page, pageSize, sortKey, sortDir });

  if (isLoading) return <LoadingUI />;
  if (error) return <ErrorUI message={error.message} />;
  return <ExpenseTable expenses={data?.results ?? []} />;
}
```

## 5. 기존 useStore.ts 이전 전략

기존 `useStore.ts`가 raw fetch를 사용하는 경우, 점진적으로 React Query로 이전한다:
1. React Query 훅을 `lib/queries/`에 추가한다
2. 컴포넌트에서 useStore 대신 React Query 훅을 사용하도록 변경한다
3. useStore의 API 호출 부분은 제거하되 필터/정렬/페이지 상태는 유지한다

## 6. 출력 형식

`_workspace/04a_state_manager_summary.md`:
```markdown
# 상태 관리 구현 요약

## 설치한 패키지
- @tanstack/react-query (있으면 생략)

## 생성/수정된 파일
- `app/providers.tsx` — QueryClientProvider
- `lib/queries/{domain}.ts` — React Query 훅
- `store/{name}Store.ts` — Zustand store

## React Query 훅 목록
- `use{Resource}()` — {역할}

## Zustand Store 구조
- `use{Name}Store`: {관리하는 상태}
```
