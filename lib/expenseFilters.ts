import { Filters, SortDir, SortKey } from "@/types";

/** 오늘이 속한 달의 1일 ("YYYY-MM-01") */
export function getFirstDayOfMonth(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** 오늘이 속한 달의 말일 ("YYYY-MM-DD") */
export function getLastDayOfMonth(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export const DEFAULT_FILTERS: Filters = {
  spent_at_after: "",
  spent_at_before: "",
  category: [],
  sub_category: [],
  payment_method: [],
  amount_min: "",
  amount_max: "",
  search: "",
};

/** 초기 로드용 — 당월 1일 ~ 말일 */
export function getInitialFilters(now: Date = new Date()): Filters {
  return {
    ...DEFAULT_FILTERS,
    spent_at_after: getFirstDayOfMonth(now),
    spent_at_before: getLastDayOfMonth(now),
  };
}

/**
 * 날짜 필터 하나가 바뀌었을 때 반대쪽 날짜를 보정한 새 Filters를 돌려준다.
 * 기간은 여러 달에 걸칠 수 있고, 시작일 > 종료일이 되면 반대쪽을 같은 날로 맞춘다.
 * 날짜 외 필터거나 값이 비어 있으면 그대로 반환한다.
 */
export function applyDateFilter<K extends keyof Filters>(
  filters: Filters,
  key: K,
  value: Filters[K]
): Filters {
  const next = { ...filters, [key]: value };

  if (key === "spent_at_after" && typeof value === "string" && value) {
    if (next.spent_at_before && value > next.spent_at_before) {
      next.spent_at_before = value;
    }
  }

  if (key === "spent_at_before" && typeof value === "string" && value) {
    if (next.spent_at_after && value < next.spent_at_after) {
      next.spent_at_after = value;
    }
  }

  return next;
}

/** 목록 조회용 쿼리스트링. 빈 값은 보내지 않는다. */
export function buildQueryParams(
  filters: Filters,
  page: number,
  pageSize: number,
  sortKey: SortKey,
  sortDir: SortDir
): string {
  const params = new URLSearchParams();

  if (filters.spent_at_after)
    params.set("spent_at_after", filters.spent_at_after);
  if (filters.spent_at_before)
    params.set("spent_at_before", filters.spent_at_before);

  // BaseInFilter: 쉼표로 join해서 전송
  if (filters.category.length)
    params.set("category", filters.category.join(","));
  if (filters.sub_category.length)
    params.set("sub_category", filters.sub_category.join(","));
  if (filters.payment_method.length)
    params.set("payment_method", filters.payment_method.join(","));

  if (filters.amount_min) params.set("amount_min", filters.amount_min);
  if (filters.amount_max) params.set("amount_max", filters.amount_max);
  if (filters.search) params.set("search", filters.search);

  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  params.set("ordering", sortDir === "desc" ? `-${sortKey}` : sortKey);

  return params.toString();
}

/** 예산 요약 조회용 쿼리스트링. 기준월은 시작일(없으면 오늘)에서 뽑는다. */
export function buildBudgetSummaryParams(
  filters: Filters,
  now: Date = new Date()
): string {
  const params = new URLSearchParams();

  const baseDate = filters.spent_at_after
    ? new Date(filters.spent_at_after)
    : now;
  params.set("year", String(baseDate.getFullYear()));
  params.set("month", String(baseDate.getMonth() + 1));

  if (filters.category.length)
    params.set("category", filters.category.join(","));
  if (filters.spent_at_after)
    params.set("spent_at_after", filters.spent_at_after);
  if (filters.spent_at_before)
    params.set("spent_at_before", filters.spent_at_before);

  return params.toString();
}

/** 같은 컬럼을 다시 누르면 방향을 뒤집고, 다른 컬럼이면 오름차순부터 시작한다. */
export function nextSortDir(
  currentKey: SortKey,
  currentDir: SortDir,
  key: SortKey
): SortDir {
  if (currentKey !== key) return "asc";
  return currentDir === "asc" ? "desc" : "asc";
}
