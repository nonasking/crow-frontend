import ExpenseFormModal from "@/components/table/ExpenseFormModal";
import { Expense } from "@/types";

export default function EditExpenseModal({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  return <ExpenseFormModal mode="edit" expense={expense} onClose={onClose} />;
}