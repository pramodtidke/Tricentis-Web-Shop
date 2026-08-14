/**
 * FILE: src/hooks/useAuth.ts
 *
 * Reusable hook for protected pages.
 *
 * Usage on any page that requires login:
 *
 *   const { user, isAuthenticated, isHydrated } = useAuth({ required: true });
 *
 * - If `required: true` and the user is NOT logged in → redirects to /login
 * - Passes the current page URL as ?redirect= so the user lands back here after login
 * - `isHydrated` is false during the first render (storage rehydration in progress).
 *   Use it to show a loading spinner instead of a flash of wrong content.
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useStore from "@/store/useStore";

interface UseAuthOptions {
  required?: boolean; // if true, redirect to /login when not authenticated
}

interface UseAuthReturn {
  user: ReturnType<typeof useStore>["user"] extends infer U ? U : never;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { required = false } = options;
  const router = useRouter();
  const pathname = usePathname();

  const { user, token, isAuthenticated, isHydrated, initAuth } = useStore(
    (s) => s
  );

  // Rehydrate auth state from cookie/localStorage on first mount
  useEffect(() => {
    if (!isHydrated) {
      initAuth();
    }
  }, [isHydrated, initAuth]);

  // Redirect to /login if auth is required and user is not logged in
  useEffect(() => {
    if (!isHydrated) return; // wait for rehydration to complete
    if (required && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isAuthenticated, required, router, pathname]);

  return { user, token, isAuthenticated, isHydrated };
}
