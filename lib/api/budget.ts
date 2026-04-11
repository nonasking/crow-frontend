import { Budget, BudgetCreatePayload, BudgetUpdatePayload, BudgetListResponse, BudgetFilters } from "@/types";

export async function fetchBudgets(filters: BudgetFilters): Promise<BudgetListResponse> {
  const params = new URLSearchParams();
  params.set("year", String(filters.year));
  params.set("month", String(filters.month));
  if (filters.category) params.set("category", filters.category);
  if (filters.sub_category) params.set("sub_category", filters.sub_category);
  if (filters.ordering) params.set("ordering", filters.ordering);
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(filters.page_size ?? 20));

  const res = await fetch(`/api/expenses/budget/?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function createBudget(payload: BudgetCreatePayload): Promise<Budget> {
  const res = await fetch("/api/expenses/budget/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function updateBudget(id: number, payload: BudgetUpdatePayload): Promise<Budget> {
  const res = await fetch(`/api/expenses/budget/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function deleteBudget(id: number): Promise<void> {
  const res = await fetch(`/api/expenses/budget/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
}

export async function fetchExpenseOptions(): Promise<{
  categories: { value: string; label: string }[];
  sub_categories: { value: string; label: string }[];
  payment_methods: { value: string; label: string }[];
  category_subcategory_map: Record<string, string[]>;
}> {
  const res = await fetch("/api/expenses/expenses/options/");
  if (!res.ok) throw new Error("Failed to fetch options");
  return res.json();
}
