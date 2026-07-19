# UI 아키텍처: 카테고리 자동완성 콤보박스

## 컴포넌트 트리
```
ExpenseFormModal ("use client", 기존)
├── Combobox (대분류)  ← 신규, "use client"
└── Combobox (소분류)  ← 동일 컴포넌트 재사용
```

## 신규 파일
| 파일 | 분류 | 역할 |
|------|------|------|
| `lib/comboboxFilter.ts` | 순수 로직 | `filterOptions`(접두 우선 필터), `findExactOption`(정확 일치 판정). vitest node 환경에서 테스트 가능하도록 DOM 무관 순수 함수로 분리 |
| `components/common/Combobox.tsx` | 클라이언트 | 제어 컴포넌트. `value`/`options`/`onChange`/`disabled`/`placeholder` props. 내부 상태는 편집 중 텍스트(query)·드롭다운 open·하이라이트 인덱스만 |

## 설계 결정
- **선택 확정 규칙**: Enter/클릭 = 하이라이트 옵션 확정. blur = 정확 일치 시 확정, 빈 텍스트 시 선택 해제, 그 외 되돌리기. → "없는 카테고리 생성 금지" 보장.
- `query`는 `string | null` — null이면 비편집 상태로 선택된 옵션의 label을 표시. 부모가 value를 외부에서 초기화해도(대분류 변경 시 소분류 리셋) 표시가 자동 동기화된다.
- React Compiler 활성 → useMemo/useCallback 사용 안 함.
- 스타일은 기존 `selectClass` 토큰(bg-[#0e0e10], border-[#222], text-[11px] font-mono) 그대로 계승.

## 테스트 전략 (vitest, node 환경 — RTL/jsdom 미설치)
- `lib/__tests__/comboboxFilter.test.ts`에서 필터·정확일치 로직 검증.
- DOM 상호작용(키보드/blur)은 수동 확인 항목으로 QA 문서에 기록.
