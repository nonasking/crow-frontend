import type { Metadata } from "next";
import BudgetPageClient from "@/components/budget/BudgetPageClient";

export const metadata: Metadata = {
  title: "Budget | Account Book",
};

export default function BudgetPage() {
  return <BudgetPageClient />;
}
