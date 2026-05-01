"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Expense, ExpenseCreatePayload, ExpenseUpdatePayload } from "@/types";

type CreateMode = {
  mode: "create";
  expense?: never;
};

type EditMode = {
  mode: "edit";
  expense: Expense;
};

type Props = (CreateMode | EditMode) & {
  onClose: () => void;
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DEFAULT_FORM: ExpenseCreatePayload = {
  spent_at: getToday(),
  category: "",
  sub_category: "",
  item: "",
  payment_method: "CASH",
  amount: 0,
  memo: "",
};

export default function ExpenseFormModal({ mode, expense, onClose }: Props) {
  const {
    createExpense,
    updateExpense,
    categoryOptions,
    subCategoryOptions,
    paymentMethodOptions,
    categorySubcategoryMap,
  } = useStore();

  const [form, setForm] = useState<ExpenseCreatePayload>(
    mode === "edit"
      ? {
          spent_at: expense.spent_at,
          category: expense.category,
          sub_category: expense.sub_category,
          item: expense.item,
          payment_method: expense.payment_method,
          amount: expense.amount,
          memo: expense.memo,
        }
      : DEFAULT_FORM
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 카테고리 변경 시 유효하지 않은 sub_category 초기화
  useEffect(() => {
    const allowed = categorySubcategoryMap[form.category] ?? [];
    if (form.sub_category && !allowed.includes(form.sub_category)) {
      setForm((prev) => ({ ...prev, sub_category: "" }));
    }
  }, [form.category]);

  const visibleSubCategories = form.category
    ? subCategoryOptions.filter((opt) =>
        categorySubcategoryMap[form.category]?.includes(opt.value)
      )
    : subCategoryOptions;

  const isValid =
    form.spent_at &&
    form.category &&
    form.sub_category &&
    form.item.trim() &&
    form.payment_method &&
    form.amount !== 0;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "edit") {
        await updateExpense(expense.id, form as ExpenseUpdatePayload);
      } else {
        await createExpense(form);
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
            {mode === "edit" ? "지출 수정" : "지출 추가"}
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
          {/* 날짜 */}
          <div>
            <label className={labelClass}>날짜</label>
            <input
              type="date"
              value={form.spent_at}
              onChange={(e) => setForm((p) => ({ ...p, spent_at: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* 대분류 */}
          <div>
            <label className={labelClass}>대분류</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
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
              onChange={(e) => setForm((p) => ({ ...p, sub_category: e.target.value }))}
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

          {/* 항목 */}
          <div>
            <label className={labelClass}>항목</label>
            <input
              type="text"
              value={form.item}
              onChange={(e) => setForm((p) => ({ ...p, item: e.target.value }))}
              className={inputClass}
              placeholder="항목명 입력"
            />
          </div>

          {/* 결제방식 */}
          <div>
            <label className={labelClass}>결제방식</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))}
              className={selectClass}
            >
              <option value="">선택</option>
              {paymentMethodOptions.map((opt) => (
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
                onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                className={`${inputClass} pr-8`}
                placeholder="0"
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
              onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
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