import type { ExpenseBreakdown } from "@/types";

export const CHART_COLORS = [
  "#c9a96e", // gold
  "#7eb8b0", // teal
  "#b07eb8", // violet
  "#7eb87e", // green
  "#b87e7e", // rose
  "#7e9eb8", // blue
  "#b8a47e", // sand
  "#8ab87e", // lime
  "#b87eb0", // pink
  "#7eb8a4", // seafoam
];

export function getColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function formatKRW(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

export function formatKRWFull(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}


export type PieEntry = { name: string; value: number; pct: number };

/**
 * 대분류 파이 데이터. 파이는 양수만 그릴 수 있으므로 합계가 0 이하인 대분류(환불이 더 큰 경우 등)는
 * 빼고, 비율도 양수 합계 기준으로 낸다. 빠진 대분류가 있으면 excluded에 담아 화면에 알린다.
 */
export function toPieData(breakdown: ExpenseBreakdown | null): {
  data: PieEntry[];
  excluded: string[];
} {
  const categories = breakdown?.by_category ?? [];
  const positive = categories.filter((c) => c.total > 0);
  const sum = positive.reduce((s, c) => s + c.total, 0);
  return {
    data: positive.map((c) => ({
      name: c.label,
      value: c.total,
      pct: sum > 0 ? (c.total / sum) * 100 : 0,
    })),
    excluded: categories.filter((c) => c.total <= 0).map((c) => c.label),
  };
}

export type BarEntry = { month: string; total: number; opacity: number };

/** 월별 막대 데이터. "YYYY-MM" → "YY-MM", 진하기는 절댓값 기준이라 음수 달도 보인다. */
export function toBarData(breakdown: ExpenseBreakdown | null): BarEntry[] {
  const months = breakdown?.by_month ?? [];
  const max = Math.max(...months.map((m) => Math.abs(m.total)), 1);
  return months.map((m) => ({
    month: m.month.slice(2),
    total: m.total,
    opacity: 0.3 + 0.7 * (Math.abs(m.total) / max),
  }));
}
