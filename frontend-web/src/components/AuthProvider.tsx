/**
 * FILE: src/components/AuthProvider.tsx
 *
 * Client component that calls initAuth() once when the app first loads.
 * This rehydrates the Zustand auth state from cookie/localStorage so
 * the user remains logged in after a page refresh.
 *
 * Why a separate component?
 * layout.tsx is a Server Component — it can't use useEffect directly.
 * This thin wrapper isolates the client-side initialization.
 */

"use client";

import { useEffect } from "react";
import useStore from "@/store/useStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
