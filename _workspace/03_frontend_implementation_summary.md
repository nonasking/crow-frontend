# Frontend Implementation Summary — Budget 기능

## 생성/수정된 파일 목록

### 신규 생성

| 파일 | 역할 |
|------|------|
| `app/budget/page.tsx` | Budget 서버 컴포넌트 페이지. metadata 설정 후 BudgetPageClient를 렌더링 |
| `components/budget/BudgetPageClient.tsx` | Budget 페이지의 메인 클라이언트 컴포넌트. 헤더(섹션 네비, 연도/월 드롭다운, 로그아웃), BudgetStatsCards, BudgetTable을 조합 |
| `components/budget/BudgetStatsCards.tsx` | 총 예산, 항목 수, 최고 예산 카테고리, 평균 예산 4개 카드를 표시 |
| `components/budget/BudgetTable.tsx` | 예산 목록 테이블. 정렬, 페이지네이션, 체크박스 선택, 생성/수정 모달 연동 |
| `components/budget/BudgetFormModal.tsx` | 예산 추가/수정 폼 모달. create/edit mode 분기, 대분류 변경 시 소분류 초기화 |

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/page.tsx` | `Link` import 추가, "Expense Ledger" 텍스트 제거 후 섹션 네비게이션(EXPENSE / BUDGET 링크) 추가 |
| `lib/queries/budgetQueries.ts` | `useBudgets` 훅에 `ordering?: string` 파라미터 추가, queryKey에 ordering 포함 |

## 주요 구현 결정사항

1. **섹션 네비게이션**: `app/page.tsx`의 EXPENSE 링크는 항상 활성 스타일(gold border) 고정. BudgetPageClient의 EXPENSE/BUDGET 링크는 `usePathname()`으로 현재 경로 감지하여 조건부 스타일 적용.

2. **연도/월 드롭다운**: BudgetPageClient의 useState에서 관리. year는 현재 연도 기준 -3~+1 범위(5개 옵션), month는 1~12. props로 BudgetStatsCards와 BudgetTable에 전달.

3. **ordering 파라미터**: `useBudgets`에 optional ordering 파라미터 추가. BudgetTable에서 `sortDir === "desc" ? \`-${sortKey}\` : sortKey` 형태로 계산 후 전달. queryKey에 포함되어 정렬 변경 시 자동 리페치.

4. **대분류 변경 시 sub_category 초기화**: `useEffect` 대신 `handleCategoryChange` onChange 핸들러에서 직접 `sub_category: ""` 리셋. React Compiler 호환.

5. **에러 처리**: `JSON.parse(String(e).replace("Error: ", ""))` 후 `Object.values().flat().join(" / ")` 패턴으로 Django REST framework 응답 파싱 (ExpenseFormModal과 동일).

6. **isLoading 시 BudgetTable**: 로딩 중에는 컴포넌트 전체가 로딩 애니메이션으로 대체. BudgetStatsCards는 "—" 표시 (skeleton 불필요).

7. **DeleteToast 재사용**: `components/table/DeleteToast`를 그대로 import하여 BudgetTable에서 재사용.

## 알려진 제한 사항

- **@tanstack/react-query 미설치**: `budgetQueries.ts`가 `@tanstack/react-query`에 의존하지만 아직 설치되지 않음. `npm install @tanstack/react-query` 및 앱 루트에 `QueryClientProvider` 래핑 필요.
- **ordering 파라미터 미반영**: 현재 `fetchBudgets`는 ordering을 URLSearchParams에 포함하도록 이미 구현되어 있으나, 백엔드가 ordering 파라미터를 지원해야 실제 정렬이 동작.
- **BudgetFormModal의 page=1 고정**: `useBudgetMutations(year, month, 1)` — invalidate 시 page 1 기준으로만 쿼리 무효화. 다른 페이지에 있을 때 모달에서 수정하면 해당 페이지 캐시는 즉시 갱신되지 않을 수 있음(실제로는 `["budgets", year, month]` prefix로 invalidate되므로 문제없음).
- **Budget 삭제 후 selectedIds 유지**: DeleteToast의 onDismiss에서 selectedIds를 초기화하지만, 삭제 성공 후 React Query가 invalidate하면 해당 id가 없는 데이터가 반환되므로 실질적 문제는 없음.
