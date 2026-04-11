"use client";

import { useBudgets, useExpenseOptions } from "@/lib/queries/budgetQueries";
import { formatKRWFull } from "@/lib/chartUtils";

type Props = {
  year: number;
  month: number;
};

export default function BudgetStatsCards({ year, month }: Props) {
  const { data, isLoading } = useBudgets(year, month);
  const { data: options } = useExpenseOptions();

  const results = data?.results ?? [];
  const count = results.length;

  const totalAmount = results.reduce((sum, b) => sum + b.amount, 0);

  const topBudget = results.reduce<(typeof results)[0] | null>((max, b) => {
    if (!max || b.amount > max.amount) return b;
    return max;
  }, null);

  const topCategoryLabel = topBudget
    ? (options?.categories.find((o) => o.value === topBudget.category)?.label ??
      topBudget.category)
    : null;

  const avgAmount = count > 0 ? Math.round(totalAmount / count) : null;

  const stats = [
    {
      label: "총 예산",
      value: isLoading ? "—" : formatKRWFull(totalAmount),
      sub: isLoading ? "" : `${count}개 항목`,
    },
    {
      label: "항목 수",
      value: isLoading ? "—" : `${count}건`,
      sub: isLoading ? "" : `${year}년 ${month}월`,
    },
    {
      label: "최고 예산 카테고리",
      value: isLoading ? "—" : (topCategoryLabel ?? "—"),
      sub: isLoading
        ? ""
        : topBudget
          ? formatKRWFull(topBudget.amount)
          : "항목 없음",
    },
    {
      label: "평균 예산",
      value: isLoading ? "—" : avgAmount != null ? formatKRWFull(avgAmount) : "—",
      sub: isLoading ? "" : count > 0 ? "항목당 평균" : "항목 없음",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#2a2a2e]">
      {stats.map((s, i) => (
        <div key={i} className="bg-[#0e0e10] px-5 py-4">
          <div className="text-[9px] tracking-widest uppercase text-[#444] font-mono mb-1.5">
            {s.label}
          </div>
          <div className="text-lg font-mono leading-none mb-1 text-[#e8e4dc]">
            {s.value}
          </div>
          <div className="text-[10px] font-mono text-[#c0bbb4]">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
