/**
 * FILE: src/components/Navbar.tsx
 *
 * Responsive top navigation bar.
 *
 * - Shows user name + logout button when authenticated (reads Zustand)
 * - Shows Login / Register links when logged out
 * - CartIcon with live badge
 */

"use client";

import Link from "next/link";
import CartIcon from "@/components/cart/CartIcon";
import useStore from "@/store/useStore";
// add to the imports at the top
import SearchBar from "@/components/SearchBar";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useStore((s) => s);

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-100 h-16">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">

        {/* Brand */}
        <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
          Shop<span className="text-indigo-600">Wave</span>
        </Link>

        {/* Search */}
        <SearchBar />

        {/* Actions */}
        <div className="flex items-center gap-4">

          {isAuthenticated && user ? (
            <>
              <span className="hidden sm:block text-sm text-slate-500">
                Hi, <span className="font-medium text-slate-700">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="text-sm text-slate-500 hover:text-slate-800 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="hidden sm:block rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold
                  text-white hover:bg-indigo-700 transition"
              >
                Register
              </Link>
            </>
          )}

          {/* Cart */}
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
