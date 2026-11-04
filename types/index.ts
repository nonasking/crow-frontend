export type Expense = {
  id: number;
  spent_at: string;       // "YYYY-MM-DD"
  category: string;
  sub_category: string;
  item: string;
  payment_method: string;
  amount: number;
  memo: string;
};

export type Filters = {
  spent_at_after: string;
  spent_at_before: string;
  category: string[];
  sub_category: string[];
  payment_method: string[];
  amount_min: string;
  amount_max: string;
  search: string;
};

export type SortKey = keyof Expense;
export type SortDir = "asc" | "desc";

export type OptionItem = {
  value: string;
  label: string;
};

export type CategorySubcategoryMap = Record<string, string[]>;

export type ExpenseUpdatePayload = {
  spent_at?: string;
  category?: string;
  sub_category?: string;
  item?: string;
  payment_method?: string;
  amount?: number;
  memo?: string;
};

export type BudgetSummary = {
  year: number;
  month: number;
  total_budget: number;
  daily_budget: number;
  total_spent: number;
  count: number;
};

/** GET /expenses/expenses/breakdown/ — 필터를 적용한 전체 지출의 대분류별·월별 집계 */
export type ExpenseBreakdown = {
  total: number;
  count: number;
  by_category: { category: string; label: string; total: number; count: number }[];
  by_month: { month: string; total: number; count: number }[];
};

export type ExpenseCreatePayload = {
  spent_at: string;
  category: string;
  sub_category: string;
  item: string;
  payment_method: string;
  amount: number;
  memo: string;
};

export type Budget = {
  id: number;
  year: number;
  month: number;
  category: string;
  sub_category: string;
  amount: number;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type BudgetCreatePayload = {
  year: number;
  month: number;
  category: string;
  sub_category: string;
  amount: number;
  memo?: string;
};

export type BudgetUpdatePayload = Partial<BudgetCreatePayload>;

export type BudgetListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Budget[];
};

export type BudgetFilters = {
  year: number;
  month: number;
  category?: string;
  sub_category?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};
