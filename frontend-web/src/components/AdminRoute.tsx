"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isHydrated = useStore((state) => state.isHydrated);

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait for initAuth() to finish reading cookies/localStorage before
    // making any redirect decision — otherwise every page refresh would
    // briefly look "logged out" and bounce a real admin to "/".
    if (!isHydrated) return;

    if (!isAuthenticated || !token || !user) {
      router.replace("/");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/403");
      return;
    }

    setIsAuthorized(true);
  }, [isHydrated, isAuthenticated, token, user, router]);

  if (!isHydrated || !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-gray-500">Checking access…</div>
      </div>
    );
  }

  return <>{children}</>;
}