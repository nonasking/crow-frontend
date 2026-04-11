"use client";

import { useState } from "react";
import { useBudgets, useExpenseOptions, useBudgetMutations } from "@/lib/queries/budgetQueries";
import { Budget } from "@/types";
import BudgetFormModal from "@/components/budget/BudgetFormModal";
import DeleteToast from "@/components/table/DeleteToast";

type BudgetSortKey = "year" | "month" | "category" | "amount";

const COLUMNS: { key: string; label: string; align?: "right" }[] = [
  { key: "year", label: "연도" },
  { key: "month", label: "월" },
  { key: "category", label: "대분류" },
  { key: "sub_category", label: "소분류" },
  { key: "amount", label: "금액", align: "right" },
  { key: "memo", label: "비고" },
];

const SORTABLE_KEYS: BudgetSortKey[] = ["year", "month", "category", "amount"];

type Props = {
  year: number;
  month: number;
};

export default function BudgetTable({ year, month }: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<BudgetSortKey>("year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const ordering = sortDir === "desc" ? `-${sortKey}` : sortKey;

  const { data, isLoading, isError } = useBudgets(year, month, page, ordering);
  const { data: options } = useExpenseOptions();
  const mutations = useBudgetMutations(year, month, page);

  const budgets = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const categoryLabel = (value: string) =>
    options?.categories.find((o) => o.value === value)?.label ?? value;

  const subCategoryLabel = (value: string) =>
    options?.sub_categories.find((o) => o.value === value)?.label ?? value;

  const handleSort = (key: string) => {
    if (!SORTABLE_KEYS.includes(key as BudgetSortKey)) return;
    const typedKey = key as BudgetSortKey;
    if (sortKey === typedKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(typedKey);
      setSortDir("desc");
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === budgets.length && budgets.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(budgets.map((b) => b.id)));
    }
  };

  const handleDelete = async () => {
    await mutations.remove.mutateAsync(Array.from(selectedIds));
  };

  const handleDismiss = () => {
    setSelectedIds(new Set());
  };

  const showToast = selectedIds.size > 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#222] text-[9px] font-mono tracking-widest uppercase mb-4">
            Loading
          </div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-4 bg-[#c9a96e] opacity-40 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#553333] text-xs font-mono">
        데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* 추가 버튼 */}
        <div className="flex justify-end px-4 py-2 border-b border-[#1a1a1e] flex-shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-[9px] font-mono px-3 py-1.5 border border-[#c9a96e40] text-[#c9a96e] hover:bg-[#c9a96e10] tracking-widest uppercase transition-colors"
          >
            + 추가
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-[#0e0e10] z-10">
              <tr>
                {/* 전체 선택 체크박스 */}
                <th className="px-4 py-3 border-b border-[#1a1a1e] w-8">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                      budgets.length > 0 && selectedIds.size === budgets.length
                        ? "border-[#555] bg-[#555]"
                        : "border-[#333] bg-transparent hover:border-[#555]"
                    }`}
                  >
                    {budgets.length > 0 && selectedIds.size === budgets.length && (
                      <span className="text-[#0e0e10] text-[8px] leading-none">✓</span>
                    )}
                  </button>
                </th>
                {COLUMNS.map((col) => {
                  const isSortable = SORTABLE_KEYS.includes(col.key as BudgetSortKey);
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-4 py-3 border-b border-[#1a1a1e] font-normal text-[9px] tracking-widest uppercase select-none transition-colors font-mono whitespace-nowrap ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${
                        isSortable ? "cursor-pointer" : "cursor-default"
                      } ${
                        isActive
                          ? "text-[#c9a96e]"
                          : "text-[#c0bbb4] hover:text-[#555]"
                      }`}
                    >
                      {col.label}
                      {isActive && (
                        <span className="ml-1 opacity-60">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-24 text-[#222] text-[10px] tracking-widest font-mono"
                  >
                    조건에 맞는 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                budgets.map((b) => {
                  const isSelected = selectedIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setEditingBudget(b)}
                      className={`border-b border-[#111] transition-colors group cursor-pointer ${
                        isSelected
                          ? "bg-[#c9a96e08] hover:bg-[#c9a96e10]"
                          : "hover:bg-[#141418]"
                      }`}
                    >
                      <td
                        className="px-4 py-2.5 w-8"
                        onClick={(ev) => toggleSelect(b.id, ev)}
                      >
                        <div
                          className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-[#555] bg-[#555]"
                              : "border-[#333] bg-transparent hover:border-[#555]"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-[#0e0e10] text-[8px] leading-none">✓</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#444] tabular-nums">
                        {b.year}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#444] tabular-nums">
                        {b.month}월
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[10px] text-[#666] border border-[#222] px-1.5 py-0.5">
                          {categoryLabel(b.category)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#444]">
                        {subCategoryLabel(b.sub_category)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <span className="text-[#e8e4dc]">{b.amount.toLocaleString()}</span>
                        <span className="text-[#2a2a2e] ml-0.5">원</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#c0bbb4] max-w-[180px] truncate">
                        {b.memo || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#1a1a1e] px-4 py-3 flex-shrink-0">
          <span className="text-[9px] font-mono text-[#c0bbb4] tabular-nums">
            {totalCount.toLocaleString()}건
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="text-[9px] font-mono px-2 py-1 border border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              «
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="text-[9px] font-mono px-3 py-1 border border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              PREV
            </button>
            <span className="text-[9px] font-mono text-[#c0bbb4] tabular-nums px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="text-[9px] font-mono px-3 py-1 border border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              NEXT
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="text-[9px] font-mono px-2 py-1 border border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {editingBudget && (
        <BudgetFormModal
          mode="edit"
          budget={editingBudget}
          year={year}
          month={month}
          onClose={() => setEditingBudget(null)}
        />
      )}

      {showCreateModal && (
        <BudgetFormModal
          mode="create"
          year={year}
          month={month}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showToast && (
        <DeleteToast
          selectedCount={selectedIds.size}
          onDelete={handleDelete}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
