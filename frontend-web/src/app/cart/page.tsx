/**
 * FILE: src/app/cart/page.tsx  (Day 3 — rebuilt on cartStore)
 *
 * Dedicated full-page cart view. Same data as the drawer, laid out for
 * a standalone page — two-column on desktop (items + order summary).
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import useCartStore, {
  selectCartTotal,
  selectCartItemCount,
} from "@/store/cartStore";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCartStore(
    (s) => s
  );

  const total = selectCartTotal(items);
  const itemCount = selectCartItemCount(items);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-slate-300"
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
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            Your cart is empty
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Looks like you haven&apos;t added anything yet.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Start shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Shopping Cart
            <span className="ml-2 text-base font-normal text-slate-400">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-slate-400 hover:text-red-500 transition"
          >
            Clear cart
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Item list */}
          <section className="flex-1 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4"
              >
                {/* Image */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 5h2l.4 2M7 13h10l4-8H5.4L5 5H3m4 8l-1.5 6h13L17 13M9 19a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    ${item.price.toFixed(2)} each
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease ${item.name}`}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center
                          text-slate-600 hover:bg-slate-100 active:scale-95 transition font-medium"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase ${item.name}`}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center
                          text-slate-600 hover:bg-slate-100 active:scale-95 transition font-medium"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total + remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-indigo-600">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-slate-300 hover:text-red-400 transition"
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
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Order summary */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                Order summary
              </h2>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-slate-800">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between text-base font-semibold text-slate-900 mb-6">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center rounded-xl bg-indigo-600 px-4 py-3
                  text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition"
              >
                Proceed to Checkout →
              </Link>

              <Link
                href="/"
                className="block w-full text-center mt-3 text-sm text-slate-400 hover:text-slate-600 transition"
              >
                ← Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
