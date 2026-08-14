/**
 * FILE: src/app/login/page.tsx (Day 2 - Final fixed version)
 */

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import { validateLogin, LoginFields, ValidationError } from "@/lib/validation";
import { ApiError } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

// ─── Direct fetch (bypasses apiClient to rule out wrapper issues) ─────────────

const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  console.log("Raw API response:", data);

  if (!res.ok) {
    throw new ApiError(data.message || "Login failed", res.status, data);
  }

  return data as LoginResponse;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);

  const [fields, setFields] = useState<LoginFields>({ email: "", password: "" });
  const [errors, setErrors] = useState<ValidationError>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    // 1. Client-side validation
    const validationErrors = validateLogin(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 2. Call API directly
      const data = await loginRequest(fields.email.trim(), fields.password);

      console.log("Login response:", data);
      console.log("Token received:", data.token);
      console.log("User received:", data.user);

      // 3. Validate response structure
      if (!data.token || !data.user) {
        setServerError("Invalid response from server. Please try again.");
        return;
      }

      // 4. Save token + update Zustand global state
      login(data.user, data.token);

      console.log("Login successful! Redirecting...");

      // 5. Redirect
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      router.push(redirectTo);

    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setServerError("Incorrect email or password. Please try again.");
        } else if (err.status === 400) {
          setServerError("Invalid request. Please check your details.");
        } else if (err.status >= 500) {
          setServerError("Server error. Please try again in a moment.");
        } else {
          setServerError(err.message || "Login failed. Please try again.");
        }
      } else {
        setServerError("Cannot connect to the server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Shop<span className="text-indigo-600">Wave</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Welcome back</h2>

          {/* Server error banner */}
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  ${errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={fields.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
