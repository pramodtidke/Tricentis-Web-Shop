/**
 * FILE: src/store/cartStore.ts
 *
 * Dedicated Zustand store for the Shopping Cart.
 *
 * This is separate from the auth store (useStore.ts) so the cart logic
 * is self-contained and easy to reason about. Everything is local state +
 * localStorage persistence — no backend calls yet (per Day 3 scope).
 *
 * Actions:
 *   addToCart(product)              - adds item, or increments qty if it exists
 *   removeFromCart(productId)       - removes an item completely
 *   updateQuantity(productId, qty)  - sets exact quantity (auto-removes at 0)
 *   clearCart()                     - empties the cart
 *   openCart() / closeCart() / toggleCart() - drawer visibility
 *
 * Derived values (selectors, not stored state — always fresh):
 *   selectCartTotal(items)      -> number
 *   selectCartItemCount(items)  -> number
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
}

interface CartActions {
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

type CartStore = CartState & CartActions;

// ─── Selectors ────────────────────────────────────────────────────────────────
// Pure functions — call these with the current `items` array from the store.
// Kept outside the store so they're trivially testable and reusable in the
// Checkout page without subscribing to the whole store.

export const selectCartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartItemCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

// ─── Store ────────────────────────────────────────────────────────────────────

const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isCartOpen: false,

      /**
       * Adds a product to the cart. If it already exists, increments its
       * quantity instead of creating a duplicate line item.
       */
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, { ...product, quantity }],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        })),

      /**
       * Sets the exact quantity for an item. Clamps at 0 — a quantity of 0
       * or less removes the item entirely, matching typical cart UX.
       */
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.id === productId ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    }),
    {
      name: "shopwave-cart", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Don't persist the transient drawer-open flag
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
