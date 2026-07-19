# 기능 명세: 지출 입력 카테고리 자동완성 콤보박스

## 요청
지출 입력/수정 모달의 대분류·소분류 셀렉트박스에 텍스트 입력 시 자동완성 기능 추가.

## 요구사항
1. 텍스트를 타이핑하면 기존 옵션 중 일치하는 항목이 드롭다운으로 필터링되어 표시된다.
2. **새 카테고리 생성 금지** — `categoryOptions` / `subCategoryOptions`에 존재하는 값만 선택 가능. 일치하지 않는 텍스트는 blur 시 기존 선택값으로 되돌린다.
3. 접두(prefix) 일치가 부분(includes) 일치보다 먼저 표시된다.
4. 카테고리별 소분류 제약(`categorySubcategoryMap`) 유지 — 대분류 미선택 시 소분류 비활성, 대분류 변경 시 유효하지 않은 소분류 초기화(기존 로직 유지).
5. 키보드 조작: ↑/↓ 하이라이트 이동, Enter 선택, Escape 닫기+되돌리기. 한글 IME 조합 중 Enter 무시.
6. 마우스 클릭으로도 선택 가능.

## 영향 범위
- `components/table/ExpenseFormModal.tsx` (create/edit 공용 — EditExpenseModal은 래퍼)
- 신규: 재사용 가능한 콤보박스 컴포넌트 + 순수 필터 로직

## 데이터/API
- 옵션 데이터는 이미 Zustand store(`categoryOptions`, `subCategoryOptions`, `categorySubcategoryMap`)에 존재. 신규 API·상태 불필요 → state_manager/api_integrator 단계 해당 없음.
