import { create } from "zustand";
import {
  Expense,
  Filters,
  OptionItem,
  SortKey,
  SortDir,
  CategorySubcategoryMap,
  ExpenseCreatePayload,
  ExpenseUpdatePayload,
  BudgetSummary,
  ExpenseBreakdown,
} from "@/types";
import {
  DEFAULT_FILTERS,
  applyDateFilter,
  buildBudgetSummaryParams,
  buildFilterParams,
  buildQueryParams,
  getInitialFilters,
  nextSortDir,
} from "@/lib/expenseFilters";

export { DEFAULT_FILTERS };

// 목록·요약 요청의 순번. 필터를 빠르게 바꾸면 요청이 여러 개 동시에 나가는데,
// 늦게 도착한 옛 응답이 최신 결과를 덮어쓰지 않도록 마지막 요청의 응답만 반영한다.
let latestExpensesRequest = 0;
let latestSummaryRequest = 0;
let latestBreakdownRequest = 0;

// 검색어는 입력창에는 바로 반영하되, 조회는 타이핑이 멈춘 뒤 한 번만 한다.
export const SEARCH_DEBOUNCE_MS = 300;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

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
  categoryOptions: OptionItem[];
  subCategoryOptions: OptionItem[];
  paymentMethodOptions: OptionItem[];
  categorySubcategoryMap: CategorySubcategoryMap;

  // Actions
  fetchExpenses: () => Promise<void>;
  createExpense: (payload: ExpenseCreatePayload) => Promise<void>;
  updateExpense: (id: number, payload: ExpenseUpdatePayload) => Promise<void>;
  deleteExpenses: (ids: number[]) => Promise<void>;
  fetchFilterOptions: () => Promise<void>;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  setSort: (key: SortKey) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  budgetSummary: BudgetSummary | null;
  fetchBudgetSummary: () => Promise<void>;

  // 차트용 집계: 현재 페이지가 아니라 필터에 맞는 전체 지출 기준
  breakdown: ExpenseBreakdown | null;
  fetchBreakdown: () => Promise<void>;
};

export const useStore = create<Store>((set, get) => ({
  expenses: [],
  pagination: { count: 0, next: null, previous: null },
  loading: false,
  error: null,
  filters: getInitialFilters(),
  page: 1,
  pageSize: 20,
  sortKey: "spent_at",
  sortDir: "desc",
  categoryOptions: [],
  subCategoryOptions: [],
  paymentMethodOptions: [],
  categorySubcategoryMap: {},
  budgetSummary: null,
  breakdown: null,

  fetchBreakdown: async () => {
    const requestId = ++latestBreakdownRequest;
    try {
      const query = buildFilterParams(get().filters).toString();
      const res = await fetch(`/api/expenses/expenses/breakdown/?${query}`);
      if (!res.ok) return;
      const breakdown = await res.json();
      if (requestId !== latestBreakdownRequest) return;
      set({ breakdown });
    } catch {}
  },

  fetchBudgetSummary: async () => {
    const requestId = ++latestSummaryRequest;
    try {
      const { filters } = get();
      const query = buildBudgetSummaryParams(filters);

      const res = await fetch(`/api/expenses/expenses/summary/?${query}`);
      if (!res.ok) return;
      const summary = await res.json();
      if (requestId !== latestSummaryRequest) return;
      set({ budgetSummary: summary });
    } catch {}
  },

  createExpense: async (payload) => {
    const res = await fetch("/api/expenses/expenses/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(JSON.stringify(data));
    }

    await get().fetchExpenses();
  },

  fetchExpenses: async () => {
    const requestId = ++latestExpensesRequest;
    try {
      set({ loading: true, error: null });
      const { filters, page, pageSize, sortKey, sortDir } = get();
      const query = buildQueryParams(filters, page, pageSize, sortKey, sortDir);
      const res = await fetch(`/api/expenses/expenses/?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (requestId !== latestExpensesRequest) return;

      set({
        expenses: data.results ?? data,
        pagination: {
          count: data.count ?? 0,
          next: data.next ?? null,
          previous: data.previous ?? null,
        },
        loading: false,
      });
      get().fetchBudgetSummary();
      get().fetchBreakdown();
    } catch (e) {
      if (requestId !== latestExpensesRequest) return;
      set({ loading: false, error: String(e) });
    }
  },

  updateExpense: async (id, payload) => {
    const res = await fetch(`/api/expenses/expenses/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      // 백엔드 validation 에러 메시지를 그대로 throw
      throw new Error(JSON.stringify(data));
    }

    await get().fetchExpenses();
  },

  deleteExpenses: async (ids) => {
    // fetch는 4xx/5xx에서도 reject하지 않으므로 응답 상태를 직접 확인한다.
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetch(`/api/expenses/expenses/${id}/`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      })
    );
    await get().fetchExpenses();

    const failed = ids.filter((_, i) => results[i].status === "rejected");
    if (failed.length) {
      throw new Error(`${failed.length}건 삭제 실패 (id: ${failed.join(", ")})`);
    }
  },

  fetchFilterOptions: async () => {
    try {
      const res = await fetch("/api/expenses/expenses/options/");
      if (!res.ok) return;
      const data = await res.json();
      set({
        categoryOptions: data.categories,
        subCategoryOptions: data.sub_categories,
        paymentMethodOptions: data.payment_methods,
        categorySubcategoryMap: data.category_subcategory_map,
      });
    } catch {}
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: applyDateFilter(state.filters, key, value),
      page: 1,
    }));
    clearTimeout(searchTimer);
    if (key === "search") {
      searchTimer = setTimeout(() => get().fetchExpenses(), SEARCH_DEBOUNCE_MS);
      return;
    }
    get().fetchExpenses();
  },

  setFilters: (patch) => {
    // 여러 필터를 한 번에 바꾸고 조회도 한 번만 한다.
    clearTimeout(searchTimer);
    set((state) => ({
      filters: (Object.keys(patch) as (keyof Filters)[]).reduce(
        (acc, key) => applyDateFilter(acc, key, patch[key] as Filters[typeof key]),
        state.filters
      ),
      page: 1,
    }));
    get().fetchExpenses();
  },

  resetFilters: () => {
    clearTimeout(searchTimer);
    set({ filters: DEFAULT_FILTERS, page: 1 });
    get().fetchExpenses();
  },

  setSort: (key) => {
    const { sortKey, sortDir } = get();
    set({ sortKey: key, sortDir: nextSortDir(sortKey, sortDir, key), page: 1 });
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
