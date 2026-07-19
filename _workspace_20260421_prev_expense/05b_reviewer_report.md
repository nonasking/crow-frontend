# 코드 리뷰 보고서

작성일: 2026-04-11  
작성자: reviewer  

---

## 최종 승인: ✅ APPROVED

빌드 성공, 타입 오류 없음.

---

## Critical (수정 완료)

### [FIXED] DELETE 204 처리 누락 — `app/api/[...path]/route.ts`

**문제:** 기존 route handler는 성공 응답에서 무조건 `res.json()`을 호출.  
DELETE 엔드포인트는 204 No Content를 반환하며 body가 없으므로 `res.json()`이 throw → catch → 502 반환.  
결과: 백엔드에서 실제로 삭제가 성공했음에도 프론트에서 에러로 처리됨.

**수정:** `res.status === 204`일 때 `new NextResponse(null, { status: 204 })` 반환.

**영향 범위:** 기존 Expense DELETE도 동일 버그였으나, `deleteExpenses`가 에러 무시 패턴(`await Promise.all(...)` 후 refetch)을 써서 증상이 없었음. 이번 수정으로 함께 해결됨.

---

## Warning (수용됨)

### [ACCEPTED] BudgetStatsCards — 페이지 데이터 기준 집계

현재 `useBudgets(year, month)` 반환값(최대 20건)으로 총예산·최고카테고리를 계산함.  
월별 예산 항목이 20개를 넘으면 통계가 부정확해짐.

**수용 이유:** 개인 가계부 특성상 월별 예산 항목이 카테고리 수를 초과할 가능성이 낮음 (최대 17개 카테고리). 별도 집계 API가 없으므로 현 방식 유지.

### [ACCEPTED] BudgetFormModal — invalidate 범위

`useBudgetMutations(year, month, 1)` — page 파라미터가 1로 고정.  
하지만 `invalidateQueries({ queryKey: ["budgets", year, month] })`는 prefix 매칭이므로 모든 페이지·ordering 쿼리가 무효화됨. 문제없음.

---

## 검토 통과 항목

| 항목 | 결과 |
|------|------|
| `"use client"` 지시어 — 클라이언트 컴포넌트 모두 적용 | ✅ |
| 서버 컴포넌트 (`app/budget/page.tsx`) — 클라이언트 코드 없음 | ✅ |
| React Compiler 호환 — useEffect 최소화, 대분류 변경 시 onChange 처리 | ✅ |
| API 직접 호출 없음 — 모든 fetch가 `/api/` 경로 통해 프록시 | ✅ |
| HttpOnly 쿠키 — route handler에서 `cookies()` 읽어 Bearer 토큰 주입 | ✅ |
| React Query QueryClient — `useState`로 생성 (SSR hydration 안전) | ✅ |
| 타입 안전성 — `Budget`, `BudgetCreatePayload` 등 명시적 타입 적용 | ✅ |
| 기존 Expense 코드 영향 없음 — useStore.ts, ExpenseTable.tsx 변경 없음 | ✅ |
| 디자인 시스템 일관성 — 동일 색상·폰트·버튼 클래스 사용 | ✅ |
| DeleteToast 재사용 — 기존 컴포넌트 그대로 사용 | ✅ |
| 빌드 성공 (`npm run build`) | ✅ |
| TypeScript 오류 없음 (`tsc --noEmit`) | ✅ |
