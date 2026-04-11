"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import BudgetStatsCards from "@/components/budget/BudgetStatsCards";
import BudgetTable from "@/components/budget/BudgetTable";

export default function BudgetPageClient() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  const selectClass =
    "text-[9px] font-mono bg-transparent border border-[#1a1a1e] text-[#c0bbb4] px-2 py-1 focus:outline-none";

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e8e4dc] flex flex-col">
      {/* Top bar */}
      <header className="flex-shrink-0 border-b border-[#1a1a1e] flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-4">
          <span className="font-serif text-base text-[#e0ddd8] tracking-wide">
            ACCOUNT BOOK
          </span>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
                pathname === "/"
                  ? "border-[#c9a96e] text-[#c9a96e]"
                  : "border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555]"
              }`}
            >
              EXPENSE
            </Link>
            <Link
              href="/budget"
              className={`text-[9px] font-mono px-3 py-1.5 border tracking-widest uppercase transition-all ${
                pathname === "/budget"
                  ? "border-[#c9a96e] text-[#c9a96e]"
                  : "border-[#1a1a1e] text-[#c0bbb4] hover:border-[#2a2a2e] hover:text-[#555]"
              }`}
            >
              BUDGET
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 연도/월 드롭다운 */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={selectClass}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={selectClass}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>

          {/* 구분선 + 유저 정보 + 로그아웃 */}
          <div className="h-4 w-px bg-[#2a2a2e]" />
          {user && (
            <span className="text-[9px] font-mono text-[#555] tracking-widest hidden sm:block">
              {user.username}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-[9px] font-mono text-[#c0bbb4] hover:text-[#c9a96e] tracking-widest uppercase transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="flex-shrink-0">
        <BudgetStatsCards year={year} month={month} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <BudgetTable year={year} month={month} />
      </main>
    </div>
  );
}
