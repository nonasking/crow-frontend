"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Expense, ExpenseCreatePayload, SortKey } from "@/types";
import EditExpenseModal from "@/components/table/EditExpenseModal";
import ExpenseFormModal from "@/components/table/ExpenseFormModal";
import DeleteToast from "@/components/table/DeleteToast";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "spent_at", label: "날짜" },
  { key: "category", label: "대분류" },
  { key: "sub_category", label: "소분류" },
  { key: "item", label: "항목" },
  { key: "payment_method", label: "결제방식" },
  { key: "amount", label: "금액", align: "right" },
  { key: "memo", label: "비고" },
];

export default function ExpenseTable() {
  const {
    expenses,
    pagination,
    page,
    pageSize,
    sortKey,
    sortDir,
    setSort,
    setPage,
    categoryOptions,
    subCategoryOptions,
    deleteExpenses,
    createExpense,
  } = useStore();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletedExpenses, setDeletedExpenses] = useState<Expense[] | null>(null);

  const categoryLabel = (value: string) =>
    categoryOptions.find((o) => o.value === value)?.label ?? value;
  const subCategoryLabel = (value: string) =>
    subCategoryOptions.find((o) => o.value === value)?.label ?? value;

  const totalPages = Math.max(1, Math.ceil(pagination.count / pageSize));
  const rangeStart = ((page - 1) * pageSize + 1).toLocaleString();
  const rangeEnd = Math.min(page * pageSize, pagination.count).toLocaleString();

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map((e) => e.id)));
    }
  };

  const handleDelete = async () => {
    await deleteExpenses(Array.from(selectedIds));
  };

  const handleDismiss = () => {
    setSelectedIds(new Set());
    setDeletedExpenses(null);
  };

  const showToast = selectedIds.size > 0;

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
          <table className="w-full text-xs border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[#0e0e10] z-10">
              <tr>
                {/* 전체 선택 체크박스 */}
                <th className="px-4 py-3 border-b border-[#1a1a1e] w-8">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                      expenses.length > 0 && selectedIds.size === expenses.length
                        ? "border-[#555] bg-[#555]"
                        : "border-[#333] bg-transparent hover:border-[#555]"
                    }`}
                  >
                    {expenses.length > 0 && selectedIds.size === expenses.length && (
                      <span className="text-[#0e0e10] text-[8px] leading-none">✓</span>
                    )}
                  </button>
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => setSort(col.key)}
                    className={`px-4 py-3 border-b border-[#1a1a1e] font-normal text-[9px] tracking-widest uppercase cursor-pointer select-none transition-colors font-mono whitespace-nowrap ${
                      col.align === "right" ? "text-right" : "text-left"
                    } ${
                      sortKey === col.key
                        ? "text-[#c9a96e]"
                        : "text-[#c0bbb4] hover:text-[#555]"
                    }`}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1 opacity-60">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-24 text-[#222] text-[10px] tracking-widest font-mono"
                  >
                    조건에 맞는 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const isSelected = selectedIds.has(e.id);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setEditingExpense(e)}
                      className={`border-b border-[#111] transition-colors group cursor-pointer ${
                        isSelected
                          ? "bg-[#c9a96e08] hover:bg-[#c9a96e10]"
                          : "hover:bg-[#141418]"
                      }`}
                    >
                      <td
                        className="px-4 py-2.5 w-8"
                        onClick={(ev) => toggleSelect(e.id, ev)}
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
                      <td className="px-4 py-2.5 font-mono text-[#444] tabular-nums whitespace-nowrap">
                        {e.spent_at}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[10px] text-[#666] border border-[#222] px-1.5 py-0.5">
                          {categoryLabel(e.category)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#444]">
                        {subCategoryLabel(e.sub_category)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#e0ddd8] group-hover:text-[#e8e4dc] transition-colors">
                        {e.item}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#3a3a3e]">
                        {e.payment_method}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        <span className="text-[#e8e4dc]">{e.amount.toLocaleString()}</span>
                        <span className="text-[#2a2a2e] ml-0.5">원</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[#c0bbb4] max-w-[180px] truncate">
                        {e.memo || "—"}
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
            {rangeStart}–{rangeEnd} / {pagination.count.toLocaleString()}건
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

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {showCreateModal && (
        <ExpenseFormModal
          mode="create"
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