"use client";

import { useEffect, useId, useRef, useState } from "react";
import { OptionItem } from "@/types";
import { filterOptions, findExactOption } from "@/lib/comboboxFilter";

interface Props {
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// 기존 옵션 중에서만 선택 가능한 자동완성 콤보박스.
// 일치하지 않는 텍스트는 blur 시 마지막 유효 선택값으로 되돌린다.
export default function Combobox({
  value,
  options,
  onChange,
  placeholder = "선택",
  disabled = false,
}: Props) {
  // null = 비편집 상태 → 선택된 옵션의 label을 표시
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label ?? "";
  const displayText = query !== null ? query : selectedLabel;
  const filtered = filterOptions(options, query ?? "");

  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const commit = (opt: OptionItem) => {
    onChange(opt.value);
    setQuery(null);
    setOpen(false);
  };

  const revert = () => {
    setQuery(null);
    setOpen(false);
  };

  const handleBlur = () => {
    if (query === null) {
      setOpen(false);
      return;
    }
    if (query.trim() === "") {
      onChange("");
      revert();
      return;
    }
    const exact = findExactOption(options, query);
    if (exact) {
      commit(exact);
    } else {
      revert();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlight]) {
        commit(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      revert();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={displayText}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full bg-[#0e0e10] border border-[#222] text-[#888] text-[11px] px-3 py-2 font-mono focus:outline-none focus:border-[#444] disabled:opacity-40 placeholder:text-[#444]"
      />
      {open && !disabled && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-[#0e0e10] border border-[#222] z-10"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-[10px] font-mono text-[#444]">
              일치하는 항목 없음
            </li>
          ) : (
            filtered.map((opt, i) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(opt);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full text-left px-3 py-2 text-[11px] font-mono transition-colors ${
                    i === highlight
                      ? "bg-[#1a1a1e] text-[#c9a96e]"
                      : "text-[#888]"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
