/**
 * FILE: src/store/useStore.ts
 *
 * Global state store using Zustand.
 * Manages:
 *  - Auth slice: user identity, JWT token, login/logout
 *  - Cart slice: items, quantities, totals
 *
 * Install:  npm install zustand
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// ─── Auth Slice ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
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

// ─── Derived Selectors (use these in components) ──────────────────────────────

export const selectCartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartItemCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

// ─── Combined Store ───────────────────────────────────────────────────────────

type StoreState = AuthState & CartState;
type StoreActions = AuthActions & CartActions;

const useStore = create<StoreState & StoreActions>()(
  persist(
    (set) => ({
      // ── Auth initial state ──
      user: null,
      token: null,
      isAuthenticated: false,

      // ── Auth actions ──
      login: (user: User, token: string) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          // Clear cart on logout per security best-practice
          items: [],
        }),

      setToken: (token: string) => set({ token }),

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
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      increaseQuantity: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })),

      decreaseQuantity: (id) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0), // auto-remove when qty hits 0
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    }),
    {
      name: "ecommerce-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist auth + cart items; UI state (isCartOpen) is transient
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        items: state.items,
      }),
    }
  )
);

export default useStore;
