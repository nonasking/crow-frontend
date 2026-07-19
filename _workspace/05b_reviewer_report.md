# 코드 리뷰 보고서

## 결론: 승인

## 검토 항목
- **React Compiler 규칙**: 수동 메모이제이션 없음, 렌더 중 side effect 없음 ✓
- **없는 카테고리 생성 불가 보장**: 모든 확정 경로(클릭/Enter/blur 정확일치)가 `options` 배열 원소만 통과 ✓
- **접근성**: `role="combobox"` + `aria-expanded/controls/autocomplete`, `role="listbox"`, jsx-a11y 경고 0 ✓
- **스타일 일관성**: 기존 `selectClass` 토큰 계승, 다크 팔레트(#0e0e10/#222/#c9a96e) 유지 ✓
- **기존 로직 보존**: `categorySubcategoryMap` 소분류 제약, 대분류 변경 시 소분류 리셋 useEffect 미변경 ✓

## Warning (수용)
1. 드롭다운이 모달의 `overflow-y-auto` 컨테이너 내부에 absolute 배치 → 화면 밖으로 뜨는 대신 컨테이너 스크롤 확장. 폼 하단 여백이 충분해 실사용 문제 없음. portal 도입은 과설계로 판단.
2. `aria-activedescendant` 미설정 — 스크린리더 하이라이트 추적 미지원. 후속 개선 후보.
3. `ExpenseFormModal.tsx:70` exhaustive-deps 경고는 이번 변경 이전부터 존재하는 의도된 패턴(대분류 변경 시에만 리셋)으로 유지.
