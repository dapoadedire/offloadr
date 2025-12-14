import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // Start as true to prevent redirect before hydration

      setAuth: (user, token) => {
        // Store token in localStorage for axios interceptor
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", token);
        }
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        // Remove token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after hydration completes
        state?.setLoading(false);
      },
    }
  )
);
