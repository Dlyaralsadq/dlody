import { create } from "zustand";
import { getToken, setToken, clearToken } from "@/api/client";
import { getMe, type AuthUser } from "@/api/auth";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: AuthUser) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  login: async (token, user) => {
    await setToken(token);
    set({ token, user });
  },

  logout: async () => {
    await clearToken();
    set({ token: null, user: null });
  },

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const token = await getToken();
      if (token) {
        // Verify token is still valid by fetching current user
        const user = await getMe();
        set({ token, user });
      }
    } catch {
      // Token is expired or invalid — clear it
      await clearToken();
      set({ token: null, user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  setUser: (user) => set({ user }),
}));

// ── Selectors ─────────────────────────────────────────────────────────────────
export const useUser = () => useAuthStore((s) => s.user);
export const useIsLoggedIn = () => useAuthStore((s) => s.user !== null);
export const useRole = () => useAuthStore((s) => s.user?.role ?? null);
export const useAuthLoading = () => useAuthStore((s) => s.loading);
export const useAuthInitialized = () => useAuthStore((s) => s.initialized);
