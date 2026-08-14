/**
 * FILE: src/components/cart/CartDrawer.tsx  (Day 3 — rebuilt on cartStore)
 *
 * Slide-out shopping cart drawer, fully wired to `cartStore`.
 *
 * - Live quantity controls (+/-) update the total instantly
 * - Remove button per item
 * - Empty state
 * - "Proceed to Checkout" -> /checkout
 * - Closes on Escape, backdrop click, or the × button
 *
 * Mount once in the root layout: <CartDrawer />
 * Toggle from anywhere: useCartStore(s => s.toggleCart)()
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import useCartStore, {
  selectCartTotal,
  selectCartItemCount,
} from "@/store/cartStore";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCartStore((s) => s);

  const total = selectCartTotal(items);
  const itemCount = selectCartItemCount(items);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCart]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300
          ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Your Cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <EmptyCartState />
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 5h2l.4 2M7 13h10l4-8H5.4L5 5H3m4 8l-1.5 6h13L17 13M9 19a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-indigo-600 font-semibold mt-0.5">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center
                        text-slate-600 hover:bg-slate-100 active:scale-95 transition text-sm font-medium"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center
                        text-slate-600 hover:bg-slate-100 active:scale-95 transition text-sm font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remove ${item.name} from cart`}
                  className="text-slate-300 hover:text-red-400 transition mt-0.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Subtotal ({itemCount} items)
              </span>
              <span className="text-base font-semibold text-slate-900">
                ${total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Shipping and taxes calculated at checkout.
            </p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center rounded-lg bg-indigo-600 px-4 py-3
                text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition"
            >
              Proceed to Checkout →
            </Link>

            <button
              onClick={closeCart}
              className="block w-full text-center text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCartState() {
  return (
    <div className="flex flex-col items-center justify-center h-full pt-20 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-slate-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-slate-700 font-medium">Your cart is empty</p>
        <p className="text-sm text-slate-400 mt-1">
          Add some items to get started.
        </p>
      </div>
    </div>
  );
}
