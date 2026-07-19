# Budget 기능 명세서

작성일: 2026-04-11  
작성자: product_manager  

---

## 1. 개요

개인 가계부 앱(crow-frontend)에 예산(Budget) 관리 전용 화면을 추가한다.  
현재 예산 정보는 Expense 화면의 StatsCards 요약 카드로만 노출되며, 예산 데이터의 조회/생성/수정/삭제(CRUD)를 위한 독립 화면이 없다.

---

## 2. 목표

- `/budget` 전용 라우트에서 예산 목록을 테이블로 조회
- 예산 항목 생성 / 수정 / 삭제 (단건 수정, 다중 삭제)
- Expense UI와 시각적 일관성 유지
- React Query 기반 서버 상태 관리 (Budget 도메인만 도입, Expense는 Zustand 유지)

---

## 3. 화면 목록

### 3-1. Budget 목록 페이지 (`/budget`)

**레이아웃:**
- 상단 헤더 (공유): `ACCOUNT BOOK` 브랜드 + 섹션 네비 (`EXPENSE | BUDGET`) + 유저 정보 + 로그아웃
- 헤더 우측 인라인 필터: 연도(year) 드롭다운 + 월(month) 드롭다운
- 본문: Budget 테이블 (전체 너비, 사이드바 없음)
- 하단: 페이지네이션

**테이블 컬럼:**
| 컬럼 | 정렬 | 비고 |
|------|------|------|
| (체크박스) | 중앙 | 다중 선택용 |
| 연도 | 좌 | tabular-nums |
| 월 | 좌 | tabular-nums |
| 대분류 | 좌 | 배지 스타일 (Expense와 동일) |
| 소분류 | 좌 | |
| 금액 | 우 | 천 단위 콤마 + 원 |
| 비고 | 좌 | 없으면 — |

**상단 요약 (Budget 전용 StatsCards 대체):**
- 이 달 총 예산: 현재 필터(year+month)의 amount 합계
- 예산 항목 수: count
- 최고 예산 카테고리: amount 최대 항목의 category
- (4번째 카드는 여백 또는 생략)

**헤더 인라인 필터:**
- 연도 드롭다운: 현재 연도 기준 ±3년 범위 옵션 (2023~2029)
- 월 드롭다운: 1~12월 (기본값: 현재 월)
- 필터 변경 시 즉시 API 호출

**인터랙션:**
- 행 클릭 → EditBudgetModal (수정 모달)
- `+ 추가` 버튼 → BudgetFormModal (생성 모달)
- 체크박스 선택 → DeleteToast 표시
- 정렬: 연도/월/대분류/금액 컬럼 클릭으로 정렬 토글

---

### 3-2. Budget 생성 모달 (BudgetFormModal, mode="create")

**필드:**
| 필드 | 타입 | 필수 | 규칙 |
|------|------|------|------|
| 연도 | number input | ✓ | 2000~2100 |
| 월 | select (1~12) | ✓ | |
| 대분류 | select | ✓ | CATEGORY_SUBCATEGORY_MAP 기준 |
| 소분류 | select (대분류 연동) | ✓ | 대분류 변경 시 초기화 |
| 금액 | number input | ✓ | 양수 정수 |
| 비고 | text input | ✗ | |

**에러 처리:**
- `non_field_errors`: 동일 year+month+category+sub_category 중복 → "이미 존재하는 예산입니다" 표시
- `year`: 범위 오류
- `amount`: 0 이하
- `sub_category`: 매핑 불일치

---

### 3-3. Budget 수정 모달 (BudgetFormModal, mode="edit")

- 동일 폼, PATCH 호출
- 자기 자신으로 PATCH 시 중복 오류 없음

---

### 3-4. 다중 삭제 (DeleteToast)

- Expense의 DeleteToast 컴포넌트를 재사용 또는 Budget 전용으로 분리
- 선택된 항목 수 표시 + 삭제 확인

---

## 4. 데이터 요구사항

### 4-1. API 엔드포인트

| 동작 | 메서드 | URL |
|------|--------|-----|
| 목록 조회 | GET | `/api/expenses/budget/` |
| 생성 | POST | `/api/expenses/budget/` |
| 단건 조회 | GET | `/api/expenses/budget/{id}/` |
| 수정 | PATCH | `/api/expenses/budget/{id}/` |
| 삭제 | DELETE | `/api/expenses/budget/{id}/` |

### 4-2. 기본 필터 (초기 로드)

- `year`: 현재 연도
- `month`: 현재 월
- `ordering`: `-year,-month,category` (API 기본값)

### 4-3. 카테고리 레이블

- `/api/expenses/expenses/options/` 재사용 (categoryOptions, subCategoryOptions, categorySubcategoryMap)
- Budget 페이지에서 React Query로 옵션을 한 번 fetch, 캐시

---

## 5. 타입 추가 (types/index.ts)

```ts
export type Budget = {
  id: number;
  year: number;
  month: number;
  category: string;
  sub_category: string;
  amount: number;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type BudgetCreatePayload = {
  year: number;
  month: number;
  category: string;
  sub_category: string;
  amount: number;
  memo?: string;
};

export type BudgetUpdatePayload = Partial<BudgetCreatePayload>;

export type BudgetListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Budget[];
};

export type BudgetFilters = {
  year: number;
  month: number;
  category?: string;
  sub_category?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};
```

---

## 6. 기술 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 상태관리 | React Query (Budget 전용) | 신규 도메인, 점진적 도입. Expense 마이그레이션은 별도 작업 |
| API 프록시 | 기존 catch-all 재사용 | `/api/[...path]/route.ts`가 Budget URL도 커버 |
| 필터 UI | 헤더 인라인 드롭다운 | Budget 필터는 year+month만. 사이드바는 오버킬 |
| 카테고리 옵션 | expenses/options/ 재사용 | 동일 enum 공유, 별도 엔드포인트 없음 |
| 다중 삭제 | 체크박스 + DeleteToast | Expense와 동일 패턴 |
| 서버/클라이언트 분리 | page.tsx 서버, 나머지 클라이언트 | App Router 베스트 프랙티스 |

---

## 7. 영향받는 기존 파일

| 파일 | 변경 내용 |
|------|----------|
| `types/index.ts` | Budget, BudgetCreatePayload, BudgetUpdatePayload, BudgetListResponse, BudgetFilters 타입 추가 |
| `app/layout.tsx` | ReactQueryProvider 추가 (또는 별도 providers.tsx) |
| `app/page.tsx` | 헤더 섹션 네비 추가 (EXPENSE ↔ BUDGET 링크) |

---

## 8. 신규 생성 파일

```
app/
  budget/
    page.tsx                          ← 서버 컴포넌트 (메타데이터, Suspense wrapper)
    loading.tsx                       ← 로딩 UI (선택)

components/
  budget/
    BudgetTable.tsx                   ← 테이블 + 페이지네이션 + 다중 선택
    BudgetFormModal.tsx               ← 생성/수정 통합 모달
    BudgetDeleteToast.tsx             ← 삭제 확인 토스트 (DeleteToast 패턴)
    BudgetStatsCards.tsx              ← Budget 전용 요약 카드

lib/
  api/
    budget.ts                         ← fetch 함수 (getBudgets, createBudget, updateBudget, deleteBudget)
  queries/
    budgetQueries.ts                  ← React Query 훅 (useBudgets, useBudgetMutations)

providers/
  ReactQueryProvider.tsx              ← QueryClientProvider 래퍼
```
