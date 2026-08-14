/**
 * FILE: src/store/useStore.ts  (Day 2 — updated)
 *
 * Changes from Day 1:
 *  - `login()` now also calls tokenStorage + userStorage to persist across refreshes
 *  - `logout()` now calls clearAuthStorage() to wipe cookie + localStorage
 *  - Added `initAuth()` action — call once on app mount to rehydrate state
 *    from storage (handles page refresh without losing login session)
 *  - Added `isHydrated` flag so components can wait before rendering auth-gated UI
 */

import { create } from "zustand";
import {
  tokenStorage,
  userStorage,
  clearAuthStorage,
  StoredUser,
} from "@/lib/tokenStorage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

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

// ─── Cart Slice ───────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartItemCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

// ─── Store ────────────────────────────────────────────────────────────────────

type Store = AuthState & AuthActions & CartState & CartActions;

const useStore = create<Store>((set) => ({
  // ── Auth initial state ──
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  // ── Auth actions ──

  /**
   * Call after a successful /auth/login API response.
   * Persists token + user to cookie/localStorage AND updates in-memory state.
   */
  login: (user, token) => {
    tokenStorage.setToken(token);
    userStorage.setUser(user);
    set({ user, token, isAuthenticated: true });
  },

  /**
   * Clears all auth data from storage and resets state.
   * Cart is also cleared on logout for security.
   */
  logout: () => {
    clearAuthStorage();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      items: [],
    });
  },

  /**
   * Rehydrates auth state from storage on page refresh.
   * Call this once in your root layout inside a useEffect.
   *
   * Example:
   *   const initAuth = useStore(s => s.initAuth);
   *   useEffect(() => { initAuth(); }, [initAuth]);
   */
  initAuth: () => {
    const token = tokenStorage.getToken();
    const user = userStorage.getUser();
    if (token && user) {
      set({ token, user, isAuthenticated: true, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },

  // ── Cart initial state ──
  items: [],
  isCartOpen: false,

  // ── Cart actions ──
  addItem: (newItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === newItem.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...newItem, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  increaseQuantity: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),

  decreaseQuantity: (id) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    })),

  clearCart: () => set({ items: [] }),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
}));

export default useStore;
