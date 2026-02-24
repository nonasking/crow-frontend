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