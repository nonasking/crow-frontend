# 프론트엔드 구현 요약

## 생성/수정된 파일
- `components/common/Combobox.tsx` — 신규, 클라이언트. 자동완성 콤보박스 (기존 옵션만 선택 가능)
- `lib/comboboxFilter.ts` — 신규, 순수 로직. `filterOptions`(접두 우선), `findExactOption`
- `components/table/ExpenseFormModal.tsx` — 수정. 대분류/소분류 `<select>` → `<Combobox>` 교체

## 서버/클라이언트 결정 사유
- Combobox: 입력 상태·키보드 이벤트·드롭다운 토글 → 클라이언트 필수

## 주요 설계 결정
- **없는 카테고리 생성 금지**: 확정 경로가 3가지뿐 — ① 드롭다운 클릭 ② Enter로 하이라이트 선택 ③ blur 시 정확 일치. 그 외 텍스트는 blur 시 기존 선택값으로 되돌림. 빈 텍스트로 blur하면 선택 해제(`""`).
- `query: string | null` 패턴: null이면 부모의 value에서 label을 파생 표시 → 대분류 변경으로 부모가 소분류를 리셋해도 표시 자동 동기화.
- 접두 일치 우선 정렬로 "자동완성되는 게 먼저" 요구 충족.
- 한글 IME: `e.nativeEvent.isComposing` 중 키 이벤트 무시.
- React Compiler 활성 환경 → 수동 메모이제이션 없음.
- 옵션 클릭은 `onMouseDown + preventDefault`로 input blur보다 먼저 처리.

## 상태/API 요구사항
- 없음. 기존 store의 `categoryOptions`/`subCategoryOptions`/`categorySubcategoryMap` 그대로 사용. 소분류 제약은 기존 `visibleSubCategories` 필터링 유지.
