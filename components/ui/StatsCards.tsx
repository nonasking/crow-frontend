"use client";

import { useStore } from "@/store/useStore";
import { formatKRWFull } from "@/lib/chartUtils";

function getDailyBudget(totalBudget: number): number {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate(); // 말일
  const todayDate = today.getDate();
  return Math.round((totalBudget / lastDay) * todayDate);
}

export default function StatsCards() {
  const { expenses, pagination, budgetSummary } = useStore();

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const dailyBudget = budgetSummary
    ? getDailyBudget(budgetSummary.total_budget)
    : null;

  const remaining = dailyBudget != null ? dailyBudget - total : null;
  const usedPct =
    dailyBudget != null && dailyBudget > 0
      ? Math.round((total / dailyBudget) * 100)
      : null;

  const isOver = remaining != null && remaining < 0;

  const stats = [
    {
      label: "합계",
      value: formatKRWFull(total),
      sub: `${pagination.count.toLocaleString()}건`,
      highlight: false,
    },
    {
      label: "일할 배정 예산",
      value: dailyBudget != null ? formatKRWFull(dailyBudget) : "—",
      sub: budgetSummary
        ? `월 예산 ${formatKRWFull(budgetSummary.total_budget)}`
        : "예산 없음",
      highlight: false,
    },
    {
      label: "예산 사용률",
      value: usedPct != null ? `${usedPct}%` : "—",
      sub: dailyBudget != null ? `일할 예산 기준` : "예산 없음",
      highlight: usedPct != null && usedPct >= 90,
    },
    {
      label: "잔여 예산",
      value: remaining != null ? formatKRWFull(remaining) : "—",
      sub: isOver ? "예산 초과" : remaining != null ? "사용 가능" : "예산 없음",
      highlight: isOver,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#2a2a2e]">
      {stats.map((s, i) => (
        <div key={i} className="bg-[#0e0e10] px-5 py-4">
          <div className="text-[9px] tracking-widest uppercase text-[#444] font-mono mb-1.5">
            {s.label}
          </div>
          <div
            className={`text-lg font-mono leading-none mb-1 ${
              s.highlight ? "text-red-400" : "text-[#e8e4dc]"
            }`}
          >
            {s.value}
          </div>
          <div className={`text-[10px] font-mono ${
            s.highlight ? "text-red-400/60" : "text-[#c0bbb4]"
          }`}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}