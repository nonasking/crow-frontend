# API Integrator 구현 요약

## 생성된 파일 목록

| 파일 | 역할 |
|------|------|
| `types/index.ts` | Budget 관련 타입 5종 추가 (기존 타입 유지) |
| `lib/api/budget.ts` | Budget API fetch 함수 모음 |
| `lib/queries/budgetQueries.ts` | React Query 훅 모음 |
| `providers/ReactQueryProvider.tsx` | QueryClient 전역 Provider |
| `app/layout.tsx` | ReactQueryProvider 래핑 추가 |
| `_workspace/04_install_note.md` | 설치 명령어 기록 |

---

## API 함수 시그니처 요약 (`lib/api/budget.ts`)

```ts
fetchBudgets(filters: BudgetFilters): Promise<BudgetListResponse>
createBudget(payload: BudgetCreatePayload): Promise<Budget>
updateBudget(id: number, payload: BudgetUpdatePayload): Promise<Budget>
deleteBudget(id: number): Promise<void>
fetchExpenseOptions(): Promise<{ categories, sub_categories, payment_methods, category_subcategory_map }>
```

- 모두 Next.js route handler 프록시(`/api/expenses/...`)를 경유하여 백엔드와 통신
- 실패 시 `res.json()` 응답 본문을 포함한 `Error`를 throw

---

## React Query 훅 요약 (`lib/queries/budgetQueries.ts`)

| 훅 | queryKey | 설명 |
|----|----------|------|
| `useBudgets(year, month, page)` | `["budgets", year, month, page]` | 예산 목록 조회 (페이지네이션 포함) |
| `useExpenseOptions()` | `["expense-options"]` | 카테고리/결제수단 옵션 조회 (`staleTime: Infinity`) |
| `useBudgetMutations(year, month, page)` | - | create / update / remove mutation 반환, 성공 시 `["budgets", year, month]` 자동 무효화 |

---

## 설치 필요 패키지

```bash
npm install @tanstack/react-query
```

> 현재 `package.json`에 `@tanstack/react-query`가 없으므로 반드시 설치 후 빌드할 것.
