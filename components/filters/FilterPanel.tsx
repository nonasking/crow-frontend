"use client";

import { useStore } from "@/store/useStore";

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
    <div className="text-[9px] tracking-widest uppercase text-[#c0bbb4] font-mono pt-4 pb-2 border-t border-[#1a1a1e] mt-2">
      {title}
    </div>
  );
}

export default function FilterPanel({ onClose }: { onClose?: () => void }) {
  const {
    filters,
    setFilter,
    resetFilters,
    categoryOptions,
    subCategoryOptions,
    paymentMethodOptions,
    categorySubcategoryMap,
  } = useStore();

  const toggleMulti = (
    key: "sub_category" | "payment_method",
    val: string
  ) => {
    const curr = filters[key];
    setFilter(key, curr.includes(val) ? curr.filter((v) => v !== val) : [...curr, val]);
  };

  const toggleCategory = (val: string) => {
    const curr = filters.category;
    const next = curr.includes(val) ? curr.filter((v) => v !== val) : [...curr, val];

    // 새 카테고리 선택 기준으로 유효한 서브카테고리만 유지
    const validSubs = next.length
      ? filters.sub_category.filter((sub) =>
          next.some((cat) => categorySubcategoryMap[cat]?.includes(sub))
        )
      : filters.sub_category;

    setFilter("category", next);
    setFilter("sub_category", validSubs);
  };

  // 선택된 카테고리가 있으면 해당 서브카테고리만, 없으면 전체 표시
  const visibleSubCategories = filters.category.length
    ? subCategoryOptions.filter((opt) =>
        filters.category.some((cat) =>
          categorySubcategoryMap[cat]?.includes(opt.value)
        )
      )
    : subCategoryOptions;

  const activeCount = [
    filters.spent_at_after || filters.spent_at_before,
    filters.category.length,
    filters.sub_category.length,
    filters.payment_method.length,
    filters.amount_min || filters.amount_max,
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
          className="text-[9px] tracking-widest uppercase text-[#c0bbb4] hover:text-[#c9a96e] font-mono transition-colors"
        >
          초기화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-0.5">
        {/* Date */}
        <Section title="날짜" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-[#c0bbb4] font-mono block mb-1">시작일</label>
            <input
              type="date"
              value={filters.spent_at_after}
              onChange={(e) => setFilter("spent_at_after", e.target.value)}
              className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444]"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-[#c0bbb4] font-mono block mb-1">종료일</label>
            <input
              type="date"
              value={filters.spent_at_before}
              onChange={(e) => setFilter("spent_at_before", e.target.value)}
              className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444]"
            />
          </div>
        </div>

        {/* Categories */}
        <Section title="대분류" />
        <div className="flex flex-wrap gap-1.5">
          {categoryOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={filters.category.includes(opt.value)}
              onClick={() => toggleCategory(opt.value)}  // toggleMulti → toggleCategory
            />
          ))}
        </div>

        {/* Sub Categories */}
        <Section title="소분류" />
        <div className="flex flex-wrap gap-1.5">
          {visibleSubCategories.map((opt) => (  // subCategoryOptions → visibleSubCategories
            <Chip
              key={opt.value}
              label={opt.label}
              active={filters.sub_category.includes(opt.value)}
              onClick={() => toggleMulti("sub_category", opt.value)}
            />
          ))}
        </div>

        {/* Payment methods */}
        <Section title="결제방식" />
        <div className="flex flex-wrap gap-1.5">
          {paymentMethodOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={filters.payment_method.includes(opt.value)}
              onClick={() => toggleMulti("payment_method", opt.value)}
            />
          ))}
        </div>

        {/* Amount */}
        <Section title="금액 범위" />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="최소"
            value={filters.amount_min}
            onChange={(e) => setFilter("amount_min", e.target.value)}
            className="w-full bg-transparent border border-[#222] text-[#888] text-[10px] px-2 py-1.5 font-mono focus:outline-none focus:border-[#444] placeholder-[#2a2a2e]"
          />
          <input
            type="number"
            placeholder="최대"
            value={filters.amount_max}
            onChange={(e) => setFilter("amount_max", e.target.value)}
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