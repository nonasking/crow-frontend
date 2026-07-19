# UI 아키텍처 설계

작성일: 2026-04-11  
작성자: ui_architect  

---

## 1. 페이지 디렉토리 구조

```
app/
├── layout.tsx                  ← 기존 (ReactQueryProvider 추가)
├── page.tsx                    ← 기존 Expense 페이지 (헤더 섹션 네비 추가)
├── login/
│   └── page.tsx                ← 기존
└── budget/
    └── page.tsx                ← 신규 서버 컴포넌트

components/
├── auth/                       ← 기존
├── charts/                     ← 기존
├── filters/                    ← 기존
├── table/                      ← 기존 Expense 테이블 컴포넌트
├── ui/
│   └── StatsCards.tsx          ← 기존 (변경 없음)
└── budget/                     ← 신규
    ├── BudgetStatsCards.tsx
    ├── BudgetTable.tsx
    ├── BudgetFormModal.tsx
    └── BudgetDeleteToast.tsx   ← DeleteToast 재사용 or 래퍼

lib/
├── chartUtils.ts               ← 기존
├── api/
│   └── budget.ts               ← 신규 fetch 함수
└── queries/
    └── budgetQueries.ts        ← 신규 React Query 훅

providers/
└── ReactQueryProvider.tsx      ← 신규 QueryClientProvider 래퍼

types/
└── index.ts                    ← Budget 관련 타입 추가
```

---

## 2. 컴포넌트 트리

### 2-1. `app/layout.tsx` (서버 컴포넌트)
```
RootLayout
  └── ReactQueryProvider        ← 신규 클라이언트 컴포넌트 래퍼
        └── AuthGuard           ← 기존
              └── {children}
```

### 2-2. `app/budget/page.tsx` (서버 컴포넌트)
```
BudgetPage (서버)
  └── BudgetPageClient          ← 'use client' 경계
        ├── Header (인라인 — app/page.tsx와 동일 구조)
        │     ├── 브랜드 + 섹션 네비 (EXPENSE | BUDGET)
        │     ├── YearMonthFilter (연도/월 드롭다운)
        │     └── 유저 정보 + 로그아웃
        ├── BudgetStatsCards    ← React Query로 데이터 읽기
        └── BudgetTable
              ├── 추가 버튼
              ├── <table> (컬럼: 체크박스 | 연도 | 월 | 대분류 | 소분류 | 금액 | 비고)
              ├── Pagination
              ├── BudgetFormModal (mode="create"|"edit", 조건부 렌더)
              └── BudgetDeleteToast (조건부 렌더)
```

---

## 3. 서버 / 클라이언트 컴포넌트 분류

| 컴포넌트 | 분류 | 이유 |
|----------|------|------|
| `app/budget/page.tsx` | 서버 | 메타데이터, 초기 HTML. 데이터 fetch 없음 (React Query가 클라이언트에서 처리) |
| `BudgetPageClient` | 클라이언트 | useState, useRouter, useQuery 사용 |
| `BudgetStatsCards` | 클라이언트 | useQuery로 데이터 읽기 |
| `BudgetTable` | 클라이언트 | useState(selectedIds, modals), useQuery |
| `BudgetFormModal` | 클라이언트 | useState, form, useMutation |
| `BudgetDeleteToast` | 클라이언트 | useState(confirming, loading) — 기존 DeleteToast 재사용 |
| `ReactQueryProvider` | 클라이언트 | QueryClientProvider는 클라이언트 전용 |
| `providers/ReactQueryProvider.tsx` | 클라이언트 ('use client') | QueryClient 인스턴스 생성 |

---

## 4. 상태 흐름

```
BudgetPageClient
  ├── useState: year (현재 연도)
  ├── useState: month (현재 월)
  │
  ├── useBudgets(year, month)          ← React Query: GET /api/expenses/budget/
  │     └── data: { results, count }
  │
  ├── useExpenseOptions()              ← React Query: GET /api/expenses/expenses/options/
  │     └── data: { categoryOptions, subCategoryOptions, categorySubcategoryMap }
  │
  └── useBudgetMutations()
        ├── createBudget               ← POST /api/expenses/budget/
        ├── updateBudget               ← PATCH /api/expenses/budget/{id}/
        └── deleteBudgets              ← DELETE /api/expenses/budget/{id}/ (병렬)
```

**캐시 무효화 전략:**
- create/update/delete mutation 성공 시 `queryClient.invalidateQueries(['budgets', year, month])`

---

## 5. 라우팅 및 네비게이션

### 헤더 섹션 네비게이션

기존 `app/page.tsx` 헤더와 `app/budget/page.tsx` 헤더에 공통으로 추가:

```tsx
// 헤더 내 섹션 네비
<Link href="/"
  className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
    pathname === "/" ? "border-[#c9a96e] text-[#c9a96e]" : "border-[#1a1a1e] text-[#c0bbb4] ..."
  }`}
>EXPENSE</Link>
<Link href="/budget"
  className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
    pathname === "/budget" ? "border-[#c9a96e] text-[#c9a96e]" : "border-[#1a1a1e] text-[#c0bbb4] ..."
  }`}
>BUDGET</Link>
```

**참고:** `app/page.tsx`의 기존 `표 | 차트` 토글은 그대로 유지 (Expense 전용). Budget 페이지는 테이블만.

---

## 6. YearMonthFilter 인라인 컴포넌트 설계

Budget 페이지 헤더 우측에 위치. `app/page.tsx`의 `표 | 차트` 토글 자리를 대체.

```tsx
// 헤더 내 인라인 배치
<div className="flex items-center gap-1">
  <select value={year} onChange={...} className="text-[9px] font-mono ...">
    {[2023..2029].map(y => <option key={y}>{y}</option>)}
  </select>
  <span className="text-[9px] font-mono text-[#444]">년</span>
  <select value={month} onChange={...} className="text-[9px] font-mono ...">
    {[1..12].map(m => <option key={m}>{m}</option>)}
  </select>
  <span className="text-[9px] font-mono text-[#444]">월</span>
</div>
```

---

## 7. BudgetStatsCards 설계

React Query `useBudgets` 데이터에서 클라이언트 계산:

| 카드 | 값 |
|------|-----|
| 총 예산 | `results.reduce((sum, b) => sum + b.amount, 0)` |
| 항목 수 | `count` |
| 최고 예산 | `results.sort by amount desc [0].category label` |
| (4번째) | 빈 카드 or 평균 예산 (`총예산 / 항목수`) |

---

## 8. BudgetFormModal 설계

`ExpenseFormModal` 패턴을 그대로 따름. 

**차이점:**
- `spent_at`, `item`, `payment_method` 필드 없음
- `year` (number input), `month` (select 1~12) 필드 추가
- 대분류/소분류 연동 로직은 동일 (`categorySubcategoryMap` 사용)
- mode="create": POST → 201
- mode="edit": PATCH → 200
- 에러 키: `non_field_errors`, `year`, `amount`, `sub_category`

**통합 컴포넌트 (단일 BudgetFormModal):**
```tsx
type Props = 
  | { mode: "create"; budget?: never; onClose: () => void }
  | { mode: "edit"; budget: Budget; onClose: () => void }
```

---

## 9. 기존 파일 변경 최소화 원칙

| 파일 | 변경 범위 |
|------|----------|
| `app/layout.tsx` | `<AuthGuard>` 를 `<ReactQueryProvider><AuthGuard>` 로 감싸기 |
| `app/page.tsx` | 헤더에 섹션 네비 버튼 2개 추가 (Link 컴포넌트) |
| `types/index.ts` | Budget 관련 타입 4개 추가 (기존 타입 변경 없음) |
| `components/table/DeleteToast.tsx` | 변경 없음 (그대로 재사용) |

---

## 10. React Query 설정

- `staleTime`: 30초 (Budget은 자주 변경되지 않음)
- `gcTime`: 5분
- `retry`: 1회
- `refetchOnWindowFocus`: false

QueryKey 컨벤션:
```ts
['budgets', year, month]          // 목록
['expense-options']               // 카테고리 옵션 (Expense와 공유 가능)
```
