"use client";

import { useState } from "react";
import { useExpenseOptions, useBudgetMutations } from "@/lib/queries/budgetQueries";
import { Budget } from "@/types";

type Props =
  | { mode: "create"; budget?: never; onClose: () => void; year: number; month: number }
  | { mode: "edit"; budget: Budget; onClose: () => void; year: number; month: number };

type FormState = {
  year: number;
  month: number;
  category: string;
  sub_category: string;
  amount: number;
  memo: string;
};

export default function BudgetFormModal({ mode, budget, onClose, year, month }: Props) {
  const { data: options } = useExpenseOptions();
  const mutations = useBudgetMutations(year, month, 1);

  const [form, setForm] = useState<FormState>(
    mode === "edit"
      ? {
          year: budget.year,
          month: budget.month,
          category: budget.category,
          sub_category: budget.sub_category,
          amount: budget.amount,
          memo: budget.memo,
        }
      : {
          year,
          month,
          category: "",
          sub_category: "",
          amount: 0,
          memo: "",
        }
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categoryOptions = options?.categories ?? [];
  const subCategoryOptions = options?.sub_categories ?? [];
  const categorySubcategoryMap = options?.category_subcategory_map ?? {};

  const visibleSubCategories = form.category
    ? subCategoryOptions.filter((opt) =>
        categorySubcategoryMap[form.category]?.includes(opt.value)
      )
    : subCategoryOptions;

  const isValid =
    form.year > 0 &&
    form.month >= 1 &&
    form.month <= 12 &&
    !!form.category &&
    !!form.sub_category &&
    form.amount > 0;

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({ ...prev, category: value, sub_category: "" }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "edit") {
        await mutations.update.mutateAsync({ id: budget.id, payload: form });
      } else {
        await mutations.create.mutateAsync(form);
      }
      onClose();
    } catch (e) {
      try {
        const parsed = JSON.parse(String(e).replace("Error: ", ""));
        const messages = Object.values(parsed).flat().join(" / ");
        setError(messages as string);
      } catch {
        setError("오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent border border-[#222] text-[#888] text-[11px] px-3 py-2 font-mono focus:outline-none focus:border-[#444]";
  const labelClass =
    "text-[9px] text-[#c0bbb4] font-mono block mb-1 tracking-widest uppercase";
  const selectClass =
    "w-full bg-[#0e0e10] border border-[#222] text-[#888] text-[11px] px-3 py-2 font-mono focus:outline-none focus:border-[#444]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md bg-[#0e0e10] border border-[#1a1a1e] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1e] flex-shrink-0">
          <span className="text-[9px] tracking-widest uppercase text-[#444] font-mono">
            {mode === "edit" ? "예산 수정" : "예산 추가"}
          </span>
          <button
            onClick={onClose}
            className="text-[#444] hover:text-[#c0bbb4] font-mono text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 연도 */}
          <div>
            <label className={labelClass}>연도</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
              className={inputClass}
              min={2000}
              max={2100}
            />
          </div>

          {/* 월 */}
          <div>
            <label className={labelClass}>월</label>
            <select
              value={form.month}
              onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
              className={selectClass}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>

          {/* 대분류 */}
          <div>
            <label className={labelClass}>대분류</label>
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={selectClass}
            >
              <option value="">선택</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 소분류 */}
          <div>
            <label className={labelClass}>소분류</label>
            <select
              value={form.sub_category}
              onChange={(e) => setForm((prev) => ({ ...prev, sub_category: e.target.value }))}
              className={selectClass}
              disabled={!form.category}
            >
              <option value="">선택</option>
              {visibleSubCategories.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 금액 */}
          <div>
            <label className={labelClass}>금액</label>
            <div className="relative">
              <input
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                className={`${inputClass} pr-8`}
                placeholder="0"
                min={1}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#444]">
                원
              </span>
            </div>
          </div>

          {/* 비고 */}
          <div>
            <label className={labelClass}>비고</label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              className={inputClass}
              placeholder="선택 입력"
            />
          </div>

          {/* 에러 */}
          {error && (
            <div className="text-[10px] font-mono text-red-400 border border-red-900 px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-[#1a1a1e] flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 text-[9px] font-mono py-2.5 border border-[#222] text-[#444] hover:border-[#333] hover:text-[#666] tracking-widest uppercase transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className="flex-1 text-[9px] font-mono py-2.5 border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e10] disabled:opacity-40 disabled:cursor-not-allowed tracking-widest uppercase transition-colors"
          >
            {loading ? "저장 중..." : mode === "edit" ? "수정" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}
