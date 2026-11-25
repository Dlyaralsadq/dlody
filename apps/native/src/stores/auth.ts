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

    // Safety net: never hang more than 6 seconds on startup
    const safetyTimer = setTimeout(() => {
      if (!get().initialized) {
        set({ loading: false, initialized: true, token: null, user: null });
      }
    }, 6_000);

    try {
      const token = await getToken();
      if (token) {
        // Verify token is still valid by fetching current user
        const user = await getMe();
        set({ token, user });
      }
    } catch {
      // Token is expired, invalid, or server unreachable — clear it
      await clearToken();
      set({ token: null, user: null });
    } finally {
      clearTimeout(safetyTimer);
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
