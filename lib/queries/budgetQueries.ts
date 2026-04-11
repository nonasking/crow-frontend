import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  fetchExpenseOptions,
} from "@/lib/api/budget";
import { BudgetCreatePayload, BudgetUpdatePayload } from "@/types";

export function useBudgets(year: number, month: number, page: number = 1, ordering?: string) {
  return useQuery({
    queryKey: ["budgets", year, month, page, ordering],
    queryFn: () => fetchBudgets({ year, month, page, page_size: 20, ordering }),
  });
}

export function useExpenseOptions() {
  return useQuery({
    queryKey: ["expense-options"],
    queryFn: fetchExpenseOptions,
    staleTime: Infinity,
  });
}

export function useBudgetMutations(year: number, month: number, page: number) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["budgets", year, month] });

  const create = useMutation({
    mutationFn: (payload: BudgetCreatePayload) => createBudget(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BudgetUpdatePayload }) =>
      updateBudget(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(deleteBudget)),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
