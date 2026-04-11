---
name: nextjs-api-integrator
description: "Next.js route handler 기반 API 프록시 레이어 구현 스킬. Django 백엔드와의 통신을 위한 타입 안전한 fetch 함수와 route handler를 작성한다. JWT HttpOnly 쿠키 인증을 안전하게 처리한다. 'API 레이어', 'route handler', '프록시', 'fetch 함수', '백엔드 연동', '쿠키 인증' 요청 시 반드시 이 스킬을 사용할 것."
---

# Next.js API 프록시 & 통합 스킬

## 1. 기존 아키텍처 이해 (항상 먼저 읽기)

```
app/api/[...path]/route.ts  ← 먼저 읽는다
app/api/auth/set-cookie/route.ts
app/api/auth/clear-cookie/route.ts
```

**기존 catch-all 프록시 동작:**
1. 브라우저 `fetch("/api/expenses/...")` 호출
2. `[...path]/route.ts`가 수신
3. HttpOnly 쿠키에서 `access_token` 읽음
4. `BACKEND_URL/expenses/...`로 포워딩 (Bearer 헤더 첨부)
5. 응답을 그대로 반환

이 패턴은 대부분의 CRUD 요청을 커버한다. **새 route handler는 이 프록시로 불가능한 경우에만 작성한다.**

## 2. 타입 안전 fetch 함수 패턴

```ts
// lib/api/expenses.ts
import type { Expense, ExpenseCreatePayload, ExpenseUpdatePayload, Filters } from "@/types";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type QueryParams = {
  filters: Filters;
  page: number;
  pageSize: number;
  sortKey: string;
  sortDir: "asc" | "desc";
};

function buildQuery(params: QueryParams): string {
  const p = new URLSearchParams();
  const { filters, page, pageSize, sortKey, sortDir } = params;
  if (filters.spent_at_after) p.set("spent_at_after", filters.spent_at_after);
  if (filters.spent_at_before) p.set("spent_at_before", filters.spent_at_before);
  if (filters.category.length) p.set("category", filters.category.join(","));
  if (filters.sub_category.length) p.set("sub_category", filters.sub_category.join(","));
  if (filters.payment_method.length) p.set("payment_method", filters.payment_method.join(","));
  if (filters.amount_min) p.set("amount_min", filters.amount_min);
  if (filters.amount_max) p.set("amount_max", filters.amount_max);
  if (filters.search) p.set("search", filters.search);
  p.set("page", String(page));
  p.set("page_size", String(pageSize));
  p.set("ordering", sortDir === "desc" ? `-${sortKey}` : sortKey);
  return p.toString();
}

export async function fetchExpenses(params: QueryParams): Promise<PaginatedResponse<Expense>> {
  const res = await fetch(`/api/expenses/expenses/?${buildQuery(params)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createExpense(payload: ExpenseCreatePayload): Promise<Expense> {
  const res = await fetch("/api/expenses/expenses/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return res.json();
}

export async function updateExpense(id: number, payload: ExpenseUpdatePayload): Promise<Expense> {
  const res = await fetch(`/api/expenses/expenses/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return res.json();
}

export async function deleteExpenses(ids: number[]): Promise<void> {
  await Promise.all(
    ids.map((id) => fetch(`/api/expenses/expenses/${id}/`, { method: "DELETE" }))
  );
}

export async function fetchFilterOptions() {
  const res = await fetch("/api/expenses/expenses/options/");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

## 3. 새 route handler 작성 기준

### 쿠키 조작이 필요한 경우
```ts
// app/api/auth/{action}/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.set("token_name", value, {
    httpOnly: true,                                    // JS 접근 차단
    secure: process.env.NODE_ENV === "production",    // HTTPS only (prod)
    sameSite: "lax",                                  // CSRF 방어
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return NextResponse.json({ ok: true });
}
```

### BFF 패턴 (여러 API 조합)
```ts
// app/api/dashboard/route.ts
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const headers = { Authorization: `Bearer ${token}` };
  const base = process.env.BACKEND_URL ?? "http://localhost:8000";

  const [expenses, budgets] = await Promise.all([
    fetch(`${base}/expenses/expenses/summary/`, { headers }).then(r => r.json()),
    fetch(`${base}/expenses/budget/`, { headers }).then(r => r.json()),
  ]);

  return Response.json({ expenses, budgets });
}
```

## 4. NO_AUTH_PATHS 관리

새 공개 엔드포인트 추가 시 기존 파일을 수정한다:
```ts
// app/api/[...path]/route.ts
const NO_AUTH_PATHS = [
  "auth/login/",
  // 새 공개 경로 추가 시 여기에
];
```

## 5. 인증 에러 처리

```ts
export async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // 토큰 만료 — 로그인 페이지로
    window.location.replace("/login");
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

## 6. 출력 형식

`_workspace/04b_api_integrator_summary.md`:
```markdown
# API 레이어 구현 요약

## 생성/수정된 파일
- `lib/api/{domain}.ts` — {설명}
- `app/api/{path}/route.ts` — {새 route handler, 이유}

## fetch 함수 목록
- `fetch{Resource}()` — {역할, 엔드포인트}

## 수정된 NO_AUTH_PATHS
- 추가: {경로} (이유)

## 주의사항
- {토큰 처리, 에러 처리 특이사항}
```
