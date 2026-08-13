/**
 * FILE: src/components/cart/CartIcon.tsx
 *
 * Cart icon button with an animated badge showing item count.
 * Place this in your Navbar. Clicking it calls toggleCart().
 *
 * Usage:
 *   import CartIcon from "@/components/cart/CartIcon";
 *   <CartIcon />
 */

"use client";

import useStore, { selectCartItemCount } from "@/store/useStore";

export default function CartIcon() {
  const toggleCart = useStore((s) => s.toggleCart);
  const items = useStore((s) => s.items);
  const count = selectCartItemCount(items);

  return (
    <button
      onClick={toggleCart}
      aria-label={`Open cart, ${count} item${count !== 1 ? "s" : ""}`}
      className="relative p-2 text-slate-600 hover:text-indigo-600 transition"
    >
      {/* Bag icon */}
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>

      {/* Badge */}
      {count > 0 && (
        <span
          key={count}             /* re-key so the animation fires on count change */
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full
            bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center
            px-1 animate-bounce-once"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
