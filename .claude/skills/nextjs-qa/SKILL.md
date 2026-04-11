---
name: nextjs-qa
description: "Next.js 프론트엔드 테스트 작성 및 실행 스킬. React Testing Library와 Vitest로 컴포넌트, React Query 훅, Zustand store를 테스트한다. '테스트 작성', 'Vitest', 'RTL', '컴포넌트 테스트', '훅 테스트', '테스트 실행' 요청 시 반드시 이 스킬을 사용할 것."
---

# Next.js 프론트엔드 테스트 스킬

## 1. 테스트 환경 확인 & 설정

`package.json`에서 `vitest`가 있는지 먼저 확인한다. 없으면:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom @vitejs/plugin-react jsdom
```

`vitest.config.ts` (프로젝트 루트):
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom";
```

`package.json`에 스크립트 추가:
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"
```

## 2. 컴포넌트 테스트 패턴

```tsx
// components/{domain}/__tests__/{Component}.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SomeComponent from "../SomeComponent";

describe("SomeComponent", () => {
  it("주요 콘텐츠를 렌더한다", () => {
    render(<SomeComponent label="테스트" onAction={vi.fn()} />);
    expect(screen.getByText("테스트")).toBeInTheDocument();
  });

  it("클릭 시 onAction을 호출한다", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<SomeComponent label="클릭" onAction={onAction} />);
    await user.click(screen.getByText("클릭"));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("로딩 상태를 표시한다", () => {
    render(<SomeComponent loading />);
    expect(screen.getByRole("status")).toBeInTheDocument(); // aria-role 확인
  });

  it("에러 상태를 표시한다", () => {
    render(<SomeComponent error="백엔드 오류" />);
    expect(screen.getByText(/백엔드 오류/)).toBeInTheDocument();
  });
});
```

## 3. React Query 훅 테스트

```tsx
// lib/queries/__tests__/expenses.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useExpenses } from "../expenses";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useExpenses", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("성공 시 데이터를 반환한다", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1, item: "커피", amount: 4500 }], count: 1 }),
    } as Response);

    const { result } = renderHook(() => useExpenses(DEFAULT_PARAMS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.results[0].item).toBe("커피");
  });

  it("API 실패 시 error 상태가 된다", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);

    const { result } = renderHook(() => useExpenses(DEFAULT_PARAMS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

## 4. Zustand Store 테스트

```ts
// store/__tests__/useUIStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../useUIStore";

describe("useUIStore", () => {
  beforeEach(() => {
    // 스토어를 초기 상태로 리셋
    useUIStore.setState({ sidebarOpen: true, view: "table" });
  });

  it("초기 상태가 올바르다", () => {
    const { sidebarOpen, view } = useUIStore.getState();
    expect(sidebarOpen).toBe(true);
    expect(view).toBe("table");
  });

  it("setSidebarOpen으로 사이드바를 닫는다", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("setView로 뷰를 전환한다", () => {
    useUIStore.getState().setView("charts");
    expect(useUIStore.getState().view).toBe("charts");
  });
});
```

## 5. 테스트 실행

```bash
# 전체 실행
npm run test

# watch 모드
npm run test -- --watch

# 특정 파일
npm run test -- components/table/__tests__/ExpenseTable.test.tsx

# 커버리지
npm run test:coverage
```

## 6. 테스트 결과 보고서

`_workspace/05a_qa_test_results.md`:
```markdown
# 테스트 결과

## 실행 요약
- 총 테스트: N개 | 통과: N개 | 실패: N개

## 통과한 테스트
- ✅ {테스트명}

## 실패한 테스트 & 원인
### {테스트명}
- 실패 메시지: `{error}`
- 원인: {분석}
- 권장 수정: {방법}

## 커버리지
- 컴포넌트: {N}/{M}
- 훅: {N}/{M}
- 미커버 영역: {목록}
```
