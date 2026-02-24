"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { SortKey } from "@/types";
import { formatKRWFull } from "@/lib/chartUtils";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "spent_at", label: "날짜" },
  { key: "category", label: "대분류" },
  { key: "sub_category", label: "소분류" },
  { key: "item", label: "항목" },
  { key: "payment_method", label: "결제방식" },
  { key: "amount", label: "금액", align: "right" },
  { key: "memo", label: "비고" },
];

const PER_PAGE = 50;

export default function ExpenseTable() {
  const { filteredExpenses, sortKey, sortDir, setSort } = useStore();
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredExpenses, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const handleSort = (key: SortKey) => {
    setSort(key);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <table className="w-full text-xs border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-[#0e0e10] z-10">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 border-b border-[#1a1a1e] font-normal text-[9px] tracking-widest uppercase cursor-pointer select-none transition-colors font-mono whitespace-nowrap ${
                    col.align === "right" ? "text-right" : "text-left"
                  } ${
                    sortKey === col.key
                      ? "text-[#c9a96e]"
                      : "text-[#333] hover:text-[#555]"
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 opacity-60">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-24 text-[#222] text-[10px] tracking-widest font-mono"
                >
                  조건에 맞는 데이터가 없습니다
                </td>
              </tr>
            ) : (
              paginated.map((e, i) => (
                <tr
                  key={e.id}
                  className="border-b border-[#111] hover:bg-[#141418] transition-colors group"
                >
                  <td className="px-4 py-2.5 font-mono text-[#444] tabular-nums whitespace-nowrap">
                    {e.spent_at}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[10px] text-[#666] border border-[#222] px-1.5 py-0.5">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#444]">{e.sub_category}</td>
                  <td className="px-4 py-2.5 font-mono text-[#c0bbb4] group-hover:text-[#e8e4dc] transition-colors">
                    {e.item}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#3a3a3e]">{e.payment_method}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    <span className="text-[#e8e4dc]">{e.amount.toLocaleString()}</span>
                    <span className="text-[#2a2a2e] ml-0.5">원</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#333] max-w-[180px] truncate">
                    {e.memo || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-[#1a1a1e] px-4 py-3 flex-shrink-0">
        <span className="text-[9px] font-mono text-[#333] tabular-nums">
          {((safePage - 1) * PER_PAGE + 1).toLocaleString()}–
          {Math.min(safePage * PER_PAGE, sorted.length).toLocaleString()} /{" "}
          {sorted.length.toLocaleString()}건
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="text-[9px] font-mono px-2 py-1 border border-[#1a1a1e] text-[#333] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="text-[9px] font-mono px-3 py-1 border border-[#1a1a1e] text-[#333] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            PREV
          </button>
          <span className="text-[9px] font-mono text-[#333] tabular-nums px-3">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="text-[9px] font-mono px-3 py-1 border border-[#1a1a1e] text-[#333] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            NEXT
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="text-[9px] font-mono px-2 py-1 border border-[#1a1a1e] text-[#333] hover:border-[#2a2a2e] hover:text-[#555] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}