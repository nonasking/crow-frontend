"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import FilterPanel from "@/components/filters/FilterPanel";
import ExpenseTable from "@/components/table/ExpenseTable";
import StatsCards from "@/components/ui/StatsCards";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import MonthlyBarChart from "@/components/charts/MonthlyBarChart";

export default function Home() {
  const { fetchExpenses, loading, error } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<"table" | "charts">("table");

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e8e4dc] flex flex-col">
      {/* Top bar */}
      <header className="flex-shrink-0 border-b border-[#1a1a1e] flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="text-[#c0bbb4] hover:text-[#666] transition-colors font-mono text-sm"
            title="필터 토글"
          >
            ☰
          </button>
          <span className="font-serif text-base text-[#e0ddd8] tracking-wide">
            ACCOUNT BOOK
          </span>
          <span className="text-[9px] font-mono text-[#c0bbb4] tracking-widest uppercase hidden sm:block">
            Expense Ledger
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("table")}
            className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
              view === "table"
                ? "border-[#c9a96e] text-[#c9a96e]"
                : "border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555]"
            }`}
          >
            표
          </button>
          <button
            onClick={() => setView("charts")}
            className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
              view === "charts"
                ? "border-[#c9a96e] text-[#c9a96e]"
                : "border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555]"
            }`}
          >
            차트
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="flex-shrink-0">
        <StatsCards />
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 flex-shrink-0 border-r border-[#1a1a1e] overflow-hidden flex flex-col">
            <FilterPanel />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[#222] text-[9px] font-mono tracking-widest uppercase mb-4">
                  Loading
                </div>
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-[#c9a96e] opacity-40 animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-[#553333] text-xs font-mono">
              백엔드 연결 오류: {error}
            </div>
          ) : view === "table" ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <ExpenseTable />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-[#1a1a1e] h-full min-h-[600px]">
                <div className="bg-[#0e0e10] p-6 flex flex-col min-h-[300px]">
                  <CategoryPieChart />
                </div>
                <div className="bg-[#0e0e10] p-6 flex flex-col min-h-[300px]">
                  <MonthlyBarChart />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}