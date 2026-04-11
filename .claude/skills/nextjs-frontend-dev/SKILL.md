---
name: nextjs-frontend-dev
description: "Next.js App Router 컴포넌트 구현 스킬. UI 아키텍처 설계를 바탕으로 실제 TSX 파일을 작성한다. Tailwind CSS v4, React 19, React Compiler 환경에서 서버/클라이언트 컴포넌트를 올바르게 구현한다. '컴포넌트 구현', '페이지 만들어줘', 'TSX 파일 작성', '화면 개발' 요청 시 반드시 이 스킬을 사용할 것."
---

# Next.js 컴포넌트 구현 스킬

## 1. 구현 전 필수 확인

- `_workspace/02_ui_architecture.md` 읽기 — 서버/클라이언트 분류 확인
- 재사용하는 기존 컴포넌트 파일 읽기
- `types/index.ts` 읽기 — 기존 타입 재사용
- `globals.css` 읽기 — Tailwind v4 설정 확인

## 2. 서버 컴포넌트 구현

```tsx
// app/{segment}/page.tsx — "use client" 없음
import type { Metadata } from "next";
import SomeClientComponent from "@/components/SomeClientComponent";

export const metadata: Metadata = {
  title: "페이지 제목",
};

export default async function SomePage() {
  // 서버에서만 실행 — 환경변수, 쿠키, DB 접근 가능
  return (
    <div className="min-h-screen bg-[#0e0e10]">
      <SomeClientComponent />
    </div>
  );
}
```

## 3. 클라이언트 컴포넌트 구현

```tsx
"use client";

import { useState } from "react";
import type { SomeType } from "@/types";

interface Props {
  items: SomeType[];
  onSelect: (id: number) => void;
}

export default function SomeComponent({ items, onSelect }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => { setSelected(item.id); onSelect(item.id); }}
          className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
            selected === item.id
              ? "border-[#c9a96e] text-[#c9a96e]"
              : "border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

## 4. 특수 파일 구현

### loading.tsx (Suspense 기반, 서버)
```tsx
export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0e0e10]">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1 h-4 bg-[#c9a96e] opacity-40 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
```

### error.tsx (반드시 "use client")
```tsx
"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-screen bg-[#0e0e10]">
      <p className="text-[#553333] text-xs font-mono">{error.message}</p>
      <button onClick={reset}
        className="text-[9px] font-mono text-[#c0bbb4] hover:text-[#c9a96e] tracking-widest uppercase border border-[#1a1a1e] px-3 py-1.5">
        다시 시도
      </button>
    </div>
  );
}
```

## 5. React Compiler 주의사항

컴파일러가 활성화되어 있으므로:
- `useMemo`, `useCallback`, `memo()`를 **추가하지 않는다**
- 렌더 함수 내에서 side effect 금지 (useEffect로 분리)
- 배열/객체 prop을 인라인으로 생성하지 않는다 (컴파일러가 감지하여 최적화)

## 6. Tailwind CSS v4 주의사항

```css
/* globals.css — v4 방식 */
@import "tailwindcss";

/* 커스텀 값은 @theme 블록에 */
@theme {
  --color-brand: #c9a96e;
}
```

v3 지시어 사용 금지:
```css
/* 금지 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 7. 구현 요약 작성

`_workspace/03_frontend_implementation_summary.md`:

```markdown
# 프론트엔드 구현 요약

## 생성/수정된 파일
- `app/{path}/page.tsx` — {설명, 서버/클라이언트}
- `components/{domain}/{Name}.tsx` — {설명}

## 서버/클라이언트 결정 사유
- {컴포넌트}: {클라이언트인 이유}

## 주요 설계 결정
- {결정사항과 이유}

## state_manager에게 전달할 상태 요구사항
- {어떤 데이터를 React Query로 관리해야 하는가}
- {어떤 UI 상태를 Zustand로 관리해야 하는가}

## api_integrator에게 전달할 API 요구사항
- {어떤 API 엔드포인트가 필요한가}
- {요청/응답 형식}
```
