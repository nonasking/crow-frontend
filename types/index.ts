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