"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e8e4dc] flex flex-col items-center justify-center">
      <div className="w-full max-w-sm px-8">
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <p className="font-serif text-xl text-[#e0ddd8] tracking-wide mb-1">
            ACCOUNT BOOK
          </p>
          <p className="text-[9px] font-mono text-[#c0bbb4] tracking-widest uppercase">
            Expense Ledger
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-[#c0bbb4] tracking-widest uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border border-[#1a1a1e] text-[#e8e4dc] text-xs font-mono px-3 py-2 focus:outline-none focus:border-[#c9a96e] transition-colors"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-[#c0bbb4] tracking-widest uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border border-[#1a1a1e] text-[#e8e4dc] text-xs font-mono px-3 py-2 focus:outline-none focus:border-[#c9a96e] transition-colors"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-[10px] font-mono text-[#884444] tracking-wide">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="mt-2 border border-[#c9a96e] text-[#c9a96e] text-[9px] font-mono tracking-widest uppercase px-4 py-2 hover:bg-[#c9a96e] hover:text-[#0e0e10] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}