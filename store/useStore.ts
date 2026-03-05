import { create } from "zustand";
import { Expense, Filters, SortKey, SortDir } from "@/types";

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

function buildQueryParams(
  filters: Filters,
  page: number,
  pageSize: number,
  sortKey: SortKey,
  sortDir: SortDir
): string {
  const params = new URLSearchParams();

  if (filters.spent_at_after) params.set("spent_at_after", filters.spent_at_after);
  if (filters.spent_at_before) params.set("spent_at_before", filters.spent_at_before);

  // BaseInFilter: 쉼표로 join해서 전송
  if (filters.category.length) params.set("category", filters.category.join(","));
  if (filters.sub_category.length) params.set("sub_category", filters.sub_category.join(","));
  if (filters.payment_method.length) params.set("payment_method", filters.payment_method.join(","));

  if (filters.amount_min) params.set("amount_min", filters.amount_min);
  if (filters.amount_max) params.set("amount_max", filters.amount_max);
  if (filters.search) params.set("search", filters.search);

  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  params.set("ordering", sortDir === "desc" ? `-${sortKey}` : sortKey);

  return params.toString();
}

type PaginationMeta = {
  count: number;
  next: string | null;
  previous: string | null;
};

type Store = {
  // Data
  expenses: Expense[];
  pagination: PaginationMeta;
  loading: boolean;
  error: string | null;

  // Filters
  filters: Filters;

  // Pagination
  page: number;
  pageSize: number;

  // Sort
  sortKey: SortKey;
  sortDir: SortDir;

  // Filter options (최초 1회 로드)
  categoryOptions: string[];
  subCategoryOptions: string[];
  paymentMethodOptions: string[];

  // Actions
  fetchExpenses: () => Promise<void>;
  fetchFilterOptions: () => Promise<void>;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  setSort: (key: SortKey) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
};

export const useStore = create<Store>((set, get) => ({
  expenses: [],
  pagination: { count: 0, next: null, previous: null },
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,
  page: 1,
  pageSize: 20,
  sortKey: "spent_at",
  sortDir: "desc",
  categoryOptions: [],
  subCategoryOptions: [],
  paymentMethodOptions: [],

  fetchExpenses: async () => {
    try {
      set({ loading: true, error: null });
      const { filters, page, pageSize, sortKey, sortDir } = get();
      const query = buildQueryParams(filters, page, pageSize, sortKey, sortDir);
      const res = await fetch(`/api/expenses/?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      set({
        expenses: data.results ?? data,
        pagination: {
          count: data.count ?? 0,
          next: data.next ?? null,
          previous: data.previous ?? null,
        },
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  // 필터 드롭다운 옵션용: page_size=1로 count만 확인 후 전체 옵션 fetch
  // 백엔드에 /api/expenses/options/ 전용 엔드포인트가 생기면 교체 권장
  fetchFilterOptions: async () => {
    try {
      const res = await fetch("/api/expenses/?page_size=100&ordering=category");
      if (!res.ok) return;
      const data = await res.json();
      const all: Expense[] = data.results ?? data;

      set({
        categoryOptions: [...new Set(all.map((e) => e.category))].sort(),
        subCategoryOptions: [...new Set(all.map((e) => e.sub_category))].sort(),
        paymentMethodOptions: [...new Set(all.map((e) => e.payment_method))].sort(),
      });
    } catch {
      // 옵션 로드 실패는 무시
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1, // 필터 변경 시 첫 페이지로
    }));
    get().fetchExpenses();
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS, page: 1 });
    get().fetchExpenses();
  },

  setSort: (key) => {
    const { sortKey, sortDir } = get();
    const dir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    set({ sortKey: key, sortDir: dir, page: 1 });
    get().fetchExpenses();
  },

  setPage: (page) => {
    set({ page });
    get().fetchExpenses();
  },

  setPageSize: (size) => {
    set({ pageSize: size, page: 1 });
    get().fetchExpenses();
  },
}));