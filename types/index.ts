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

export type DateMode = "range" | "before" | "after";

export type Filters = {
  dateFrom: string;
  dateTo: string;
  dateMode: DateMode;
  categories: string[];
  subCategories: string[];
  paymentMethods: string[];
  amountMin: string;
  amountMax: string;
  search: string;
};

export type SortKey = keyof Expense;
export type SortDir = "asc" | "desc";