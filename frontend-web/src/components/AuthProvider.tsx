"use client";

import { useEffect } from "react";
import useStore from "@/store/useStore";
import useCartStore from "@/store/cartStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useStore((s) => s.initAuth);
  const user = useStore((s) => s.user);
  const isHydrated = useStore((s) => s.isHydrated);
  const fetchCart = useCartStore((s) => s.fetchCart);

  // Rehydrate auth state on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Once auth has rehydrated AND we know there's a logged-in user,
  // load their cart from the backend. Waiting on isHydrated avoids
  // firing fetchCart() before initAuth() has actually resolved.
  useEffect(() => {
    if (isHydrated && user) {
      fetchCart();
    }
  }, [isHydrated, user, fetchCart]);

  return <>{children}</>;
}