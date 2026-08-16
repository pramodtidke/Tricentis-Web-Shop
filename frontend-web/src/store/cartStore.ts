/**
 * FILE: src/store/cartStore.ts
 *
 * Dedicated Zustand store for the Shopping Cart.
 *
 * Day 6 update: cart state now lives in the backend Cart Service (Redis),
 * accessed via the API Gateway. This store is a thin async wrapper around
 * that API — no more localStorage persistence of items, since the backend
 * is now the source of truth per user.
 *
 * Actions:
 *   fetchCart()                     - loads the cart from the backend
 *   addToCart(product, quantity)    - POSTs to the backend, adds or increments
 *   removeFromCart(productId)       - DELETEs from the backend
 *   updateQuantity(productId, qty)  - workaround: remove + re-add with new qty
 *                                      (no dedicated backend endpoint yet)
 *   clearCart()                     - clears local state only (see note)
 *   openCart() / closeCart() / toggleCart() - drawer visibility (unchanged)
 */

import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import useStore from "@/store/useStore"; // ASSUMPTION: default export, user.id field — confirm this

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

// Shape returned by the Cart Service — note productId, not id
interface BackendCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface BackendCartResponse {
  userId: string;
  items: BackendCartItem[];
}

function toCartItems(backendItems: BackendCartItem[]): CartItem[] {
  return backendItems.map((i) => ({
    id: i.productId,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
  }));
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

type CartStore = CartState & CartActions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartItemCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

// ─── Helper ───────────────────────────────────────────────────────────────────

function getUserId(): string | null {
  const { user } = useStore.getState();
  return user?.id ?? null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isCartOpen: false,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    const userId = getUserId();
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get<BackendCartResponse>(`/cart/${userId}`);
      set({ items: toCartItems(res.items), isLoading: false });
    } catch (err) {
      console.error("fetchCart error:", err);
      set({ error: "Failed to load cart", isLoading: false });
    }
  },

  addToCart: async (product, quantity = 1) => {
    const userId = getUserId();
    if (!userId) {
      set({ error: "You must be logged in to add items to your cart" });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<BackendCartResponse>(
        `/cart/${userId}/items`,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
        }
      );
      set({ items: toCartItems(res.items), isLoading: false });
    } catch (err) {
      console.error("addToCart error:", err);
      set({ error: "Failed to add item to cart", isLoading: false });
    }
  },

  removeFromCart: async (productId) => {
    const userId = getUserId();
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.delete<BackendCartResponse>(
        `/cart/${userId}/items/${productId}`
      );
      set({ items: toCartItems(res.items), isLoading: false });
    } catch (err) {
      console.error("removeFromCart error:", err);
      set({ error: "Failed to remove item from cart", isLoading: false });
    }
  },

  /**
   * WORKAROUND: the Cart Service has no "set exact quantity" endpoint —
   * only add (which increments) and remove. So this removes the item,
   * then re-adds it at the desired quantity. Two network calls instead
   * of one; fine for now, but worth adding a dedicated PATCH endpoint
   * to the Cart Service later if this gets used a lot (e.g. from a
   * quantity stepper in the cart drawer).
   */
updateQuantity: async (productId, quantity) => {
  const userId = getUserId();
  if (!userId) return;

  set({ isLoading: true, error: null });
  try {
    const res = await apiClient.patch<BackendCartResponse>(
      `/cart/${userId}/update`,
      { productId, quantity }
    );
    set({ items: toCartItems(res.items), isLoading: false });
  } catch (err) {
    console.error("updateQuantity error:", err);
    set({ error: "Failed to update quantity", isLoading: false });
  }
},

  // Clears local UI state only. Does NOT clear the backend cart —
  // there's no DELETE /cart/:userId (clear-all) endpoint yet. If you
  // need "empty the whole cart" (e.g. after checkout), that's a 4th
  // route worth adding to the Cart Service.
  clearCart: () => set({ items: [] }),

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
}));

export default useCartStore;