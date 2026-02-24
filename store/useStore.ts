import { create } from "zustand";
import { Expense, Filters, SortKey, SortDir } from "@/types";

export const DEFAULT_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  dateMode: "range",
  categories: [],
  subCategories: [],
  paymentMethods: [],
  amountMin: "",
  amountMax: "",
  search: "",
};

function applyFilters(expenses: Expense[], f: Filters): Expense[] {
  return expenses.filter((e) => {
    const date = e.spent_at;
    if (f.dateMode === "range") {
      if (f.dateFrom && date < f.dateFrom) return false;
      if (f.dateTo && date > f.dateTo) return false;
    } else if (f.dateMode === "before") {
      if (f.dateTo && date >= f.dateTo) return false;
    } else if (f.dateMode === "after") {
      if (f.dateFrom && date <= f.dateFrom) return false;
    }
    if (f.categories.length && !f.categories.includes(e.category)) return false;
    if (f.subCategories.length && !f.subCategories.includes(e.sub_category)) return false;
    if (f.paymentMethods.length && !f.paymentMethods.includes(e.payment_method)) return false;
    if (f.amountMin && e.amount < Number(f.amountMin)) return false;
    if (f.amountMax && e.amount > Number(f.amountMax)) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!e.item.toLowerCase().includes(q) && !e.memo.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

type Store = {
  // Data
  allExpenses: Expense[];
  filteredExpenses: Expense[];
  loading: boolean;
  error: string | null;

  // Filters
  filters: Filters;

  // Table sort
  sortKey: SortKey;
  sortDir: SortDir;

  // Actions
  fetchExpenses: () => Promise<void>;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  setSort: (key: SortKey) => void;

  // Derived options
  categoryOptions: string[];
  subCategoryOptions: string[];
  paymentMethodOptions: string[];
};

export const useStore = create<Store>((set, get) => ({
  allExpenses: [],
  filteredExpenses: [],
  loading: true,
  error: null,
  filters: DEFAULT_FILTERS,
  sortKey: "spent_at",
  sortDir: "desc",
  categoryOptions: [],
  subCategoryOptions: [],
  paymentMethodOptions: [],

  fetchExpenses: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/expenses");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const expenses: Expense[] = data.results ?? data;

      const categoryOptions = [...new Set(expenses.map((e) => e.category))].sort();
      const subCategoryOptions = [...new Set(expenses.map((e) => e.sub_category))].sort();
      const paymentMethodOptions = [...new Set(expenses.map((e) => e.payment_method))].sort();

      set({
        allExpenses: expenses,
        filteredExpenses: applyFilters(expenses, get().filters),
        loading: false,
        categoryOptions,
        subCategoryOptions,
        paymentMethodOptions,
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  setFilter: (key, value) => {
    const filters = { ...get().filters, [key]: value };
    set({ filters, filteredExpenses: applyFilters(get().allExpenses, filters) });
  },

  resetFilters: () => {
    set({
      filters: DEFAULT_FILTERS,
      filteredExpenses: get().allExpenses,
    });
  },

  setSort: (key) => {
    const prev = get().sortKey;
    const dir = prev === key ? (get().sortDir === "asc" ? "desc" : "asc") : "asc";
    set({ sortKey: key, sortDir: dir });
  },
}));