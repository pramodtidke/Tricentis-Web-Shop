/**
 * FILE: src/store/useStore.ts
 *
 * Auth-only store. Cart state now lives in src/store/cartStore.ts,
 * wired to the backend Cart Service (Day 6). The cart slice that used
 * to live here (items, addItem, removeItem, etc.) was dead code —
 * confirmed unused anywhere in the app — and has been removed.
 */

import { create } from "zustand";
import {
  tokenStorage,
  userStorage,
  clearAuthStorage,
  StoredUser,
} from "@/lib/tokenStorage";

// ─── Auth Slice ───────────────────────────────────────────────────────────────

interface AuthState {
  user: StoredUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean; // true once initAuth() has run
}

interface AuthActions {
  login: (user: StoredUser, token: string) => void;
  logout: () => void;
  initAuth: () => void; // call in root layout on mount
}

// ─── Store ────────────────────────────────────────────────────────────────────

type Store = AuthState & AuthActions;

const useStore = create<Store>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  login: (user, token) => {
    tokenStorage.setToken(token);
    userStorage.setUser(user);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    clearAuthStorage();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  initAuth: () => {
    const token = tokenStorage.getToken();
    const user = userStorage.getUser();
    if (token && user) {
      set({ token, user, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));

export default useStore;