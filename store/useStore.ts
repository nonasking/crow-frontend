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
} from "@/types";
import {
  DEFAULT_FILTERS,
  applyDateFilter,
  buildBudgetSummaryParams,
  buildQueryParams,
  getInitialFilters,
  nextSortDir,
} from "@/lib/expenseFilters";

export { DEFAULT_FILTERS };

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
  resetFilters: () => void;
  setSort: (key: SortKey) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  budgetSummary: BudgetSummary | null;
  fetchBudgetSummary: () => Promise<void>;
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

  fetchBudgetSummary: async () => {
    try {
      const { filters } = get();
      const query = buildBudgetSummaryParams(filters);

      const res = await fetch(`/api/expenses/expenses/summary/?${query}`);
      if (!res.ok) return;
      set({ budgetSummary: await res.json() });
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
    try {
      set({ loading: true, error: null });
      const { filters, page, pageSize, sortKey, sortDir } = get();
      const query = buildQueryParams(filters, page, pageSize, sortKey, sortDir);
      const res = await fetch(`/api/expenses/expenses/?${query}`);
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
      get().fetchBudgetSummary();
    } catch (e) {
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
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/expenses/expenses/${id}/`, { method: "DELETE" })
      )
    );
    await get().fetchExpenses();
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
    get().fetchExpenses();
  },

  resetFilters: () => {
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
