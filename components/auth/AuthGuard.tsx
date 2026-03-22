"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const PUBLIC_PATHS = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isPublic) {
      fetchMe();
    }
  }, [pathname]);

  useEffect(() => {
    if (!isPublic && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, pathname]);

  // 공개 페이지는 그냥 렌더
  if (isPublic) return <>{children}</>;

  // 인증 확인 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-4 bg-[#c9a96e] opacity-40 animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 미인증 상태면 아무것도 렌더하지 않음 (redirect 진행 중)
  if (!isAuthenticated) return null;

  return <>{children}</>;
}