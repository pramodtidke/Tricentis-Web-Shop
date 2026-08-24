"use client";

import Link from "next/link";
import CartIcon from "@/components/cart/CartIcon";
import useStore from "@/store/useStore";
import useCartStore from "@/store/cartStore";
import SearchBar from "@/components/SearchBar";

export default function Navbar() {
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isHydrated = useStore((s) => s.isHydrated);
  const logout = useStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clearCart);

  const handleLogout = () => {
    logout();
    clearCart();
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-white border-b border-slate-100 h-16">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold text-slate-900 tracking-tight"
        >
          Shop<span className="text-indigo-600">Wave</span>
        </Link>

        <SearchBar />

        <div className="flex items-center gap-4">
          {!isHydrated ? (
            // Neutral placeholder — avoids confidently rendering the WRONG
            // state (logged out) before initAuth() has actually resolved.
            <div className="w-24 h-6 rounded bg-slate-100 animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-200 transition"
                >
                  Admin Panel
                </Link>
              )}
              <span className="hidden sm:block text-sm text-slate-500">
                Hi,{" "}
                <span className="font-medium text-slate-700">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
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
                className="hidden sm:block rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                Register
              </Link>
            </>
          )}

          <CartIcon />
        </div>
      </div>
    </header>
  );
}
