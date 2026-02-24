"use client";

import { useStore } from "@/store/useStore";
import { DateMode, Filters } from "@/types";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-1 border transition-all font-mono ${
        active
          ? "border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e10]"
          : "border-[#222] text-[#444] hover:border-[#3a3a3e] hover:text-[#666]"
      }`}
    >
      {label}
    </button>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="text-[9px] tracking-widest uppercase text-[#333] font-mono pt-4 pb-2 border-t border-[#1a1a1e] mt-2">
      {title}
    </div>
  );
}

export default function FilterPanel({ onClose }: { onClose?: () => void }) {
  const { filters, setFilter, resetFilters, categoryOptions, subCategoryOptions, paymentMethodOptions } =
    useStore();

  const toggleMulti = (key: "categories" | "subCategories" | "paymentMethods", val: string) => {
    const curr = filters[key];
    setFilter(key, curr.includes(val) ? curr.filter((v) => v !== val) : [...curr, val]);
  };

  const activeCount = [
    filters.dateFrom || filters.dateTo,
    filters.categories.length,
    filters.subCategories.length,
    filters.paymentMethods.length,
    filters.amountMin || filters.amountMax,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1a1a1e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] tracking-widest uppercase text-[#444] font-mono">필터</span>
          {activeCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 bg-[#c9a96e20] text-[#c9a96e] font-mono border border-[#c9a96e40]">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={resetFilters}
          className="text-[9px] tracking-widest uppercase text-[#333] hover:text-[#c9a96e] font-mono transition-colors"
        >
          초기화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-0.5">
        {/* Date */}
        <Section title="날짜" />
        <div className="flex gap-1 mb-3">
          {(["range", "before", "after"] as DateMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter("dateMode", mode)}
              className={`flex-1 text-[9px] py-1 border font-mono transition-all ${
                filters.dateMode === mode
                  ? "border-[#c9a96e] text-[#c9a96e]"
                  : "border-[#222] text-[#444] hover:border-[#333]"
              }`}
            >
              {mode === "range" ? "기간" : mode === "before" ? "이전" : "이후"}
            </button>
          ))}
        </div>

        {filters.dateMode !== "after" && (
          <div className="mb-2">
            <label className="text-[9px] text-[#333] font-mono block mb-1">
              {filters.dateMode === "before" ? "기준일 (미만)" : "시작일"}
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444]"
            />
          </div>
        )}
        {filters.dateMode !== "before" && (
          <div className="mb-2">
            <label className="text-[9px] text-[#333] font-mono block mb-1">
              {filters.dateMode === "after" ? "기준일 (초과)" : "종료일"}
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444]"
            />
          </div>
        )}

        {/* Categories */}
        <Section title="대분류" />
        <div className="flex flex-wrap gap-1.5">
          {categoryOptions.map((c) => (
            <Chip
              key={c}
              label={c}
              active={filters.categories.includes(c)}
              onClick={() => toggleMulti("categories", c)}
            />
          ))}
        </div>

        {/* Sub Categories */}
        <Section title="소분류" />
        <div className="flex flex-wrap gap-1.5">
          {subCategoryOptions.map((c) => (
            <Chip
              key={c}
              label={c}
              active={filters.subCategories.includes(c)}
              onClick={() => toggleMulti("subCategories", c)}
            />
          ))}
        </div>

        {/* Payment methods */}
        <Section title="결제방식" />
        <div className="flex flex-wrap gap-1.5">
          {paymentMethodOptions.map((p) => (
            <Chip
              key={p}
              label={p}
              active={filters.paymentMethods.includes(p)}
              onClick={() => toggleMulti("paymentMethods", p)}
            />
          ))}
        </div>

        {/* Amount */}
        <Section title="금액 범위" />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="최소"
            value={filters.amountMin}
            onChange={(e) => setFilter("amountMin", e.target.value)}
            className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444] placeholder-[#2a2a2e]"
          />
          <input
            type="number"
            placeholder="최대"
            value={filters.amountMax}
            onChange={(e) => setFilter("amountMax", e.target.value)}
            className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444] placeholder-[#2a2a2e]"
          />
        </div>

        {/* Search */}
        <Section title="검색 (항목 / 비고)" />
        <input
          type="text"
          placeholder="검색어..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444] placeholder-[#2a2a2e]"
        />

        <div className="h-8" />
      </div>
    </div>
  );
}