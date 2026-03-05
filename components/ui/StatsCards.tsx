"use client";

import { useStore } from "@/store/useStore";
import { formatKRWFull } from "@/lib/chartUtils";

export default function StatsCards() {
  const { expenses, pagination } = useStore();

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const avg = expenses.length ? Math.round(total / expenses.length) : 0;

  const months = new Set(expenses.map((e) => e.spent_at.slice(0, 7))).size;
  const monthlyAvg = months > 0 ? Math.round(total / months) : 0;

  const stats = [
    {
      label: "조회 건수",
      value: pagination.count.toLocaleString(),
      sub: `현재 페이지 ${expenses.length}건`,
    },
    {
      label: "합계 (현재 페이지)",
      value: formatKRWFull(total),
      sub: `${expenses.length}건`,
    },
    {
      label: "건당 평균",
      value: formatKRWFull(avg),
      sub: `${expenses.length}건 기준`,
    },
    {
      label: "월 평균",
      value: formatKRWFull(monthlyAvg),
      sub: `${months}개월`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#2a2a2e]">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-[#0e0e10] px-5 py-4"
        >
          <div className="text-[9px] tracking-widest uppercase text-[#444] font-mono mb-1.5">
            {s.label}
          </div>
          <div className="text-lg font-mono text-[#e8e4dc] leading-none mb-1">
            {s.value}
          </div>
          <div className="text-[10px] text-[#c0bbb4] font-mono">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}