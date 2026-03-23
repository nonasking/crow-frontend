import { create } from "zustand";

type User = {
  id: number;
  username: string;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  fetchMe: async () => {
    try {
      const res = await fetch("/api/auth/me/");
      if (!res.ok) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await res.json();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (username, password) => {
    const res = await fetch("/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail ?? "로그인에 실패했습니다.");
    }

    const data = await res.json();

    // 토큰을 HttpOnly 쿠키로 저장하는 별도 엔드포인트 호출
    await fetch("/api/auth/set-cookie/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: data.access,
        refresh_token: data.refresh,
      }),
    });

    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await fetch("/api/auth/logout/", { method: "POST" });
    // 쿠키 삭제 엔드포인트
    await fetch("/api/auth/clear-cookie/", { method: "POST" });
    set({ user: null, isAuthenticated: false });
  },
}));