/**
 * FILE: src/app/register/page.tsx  (Day 4 — real API integration)
 *
 * Changes from the mock version:
 *  - Removed mockRegisterAPI()
 *  - Now calls real POST /users/register through the API Gateway
 *  - Gateway routes /users/* to the User Service on port 3004
 *  - After successful registration, automatically logs in via
 *    POST /auth/login so the user doesn't have to sign in twice
 *
 * Backend contract (User Service via API Gateway):
 *   POST /users/register
 *   Body:    { name: string, email: string, password: string }
 *   Returns: { message: string, user: { id, name, email } }
 *   Errors:  { message: string } with status 400 / 409
 *
 * Note: registration does NOT return a token (per the System Design Doc,
 * only the Auth Service issues JWTs). So after registering, we chain a
 * call to POST /auth/login to get the token and log the user in.
 */

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import {
  validateRegister,
  RegisterFields,
  ValidationError,
} from "@/lib/validation";
import { apiClient, ApiError } from "@/lib/apiClient";
import { StoredUser } from "@/lib/tokenStorage";

// ─── API response types ───────────────────────────────────────────────────────

interface RegisterResponse {
  message: string;
  user: StoredUser;
}

interface LoginResponse {
  user: StoredUser;
  token: string;
}

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const strength =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : password.length < 8
      ? 2
      : /[A-Z]/.test(password) && /[0-9]/.test(password)
      ? 4
      : 3;

  const labels = ["", "Too short", "Weak", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-all ${
              n <= strength ? colors[strength] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${
          strength <= 1
            ? "text-red-500"
            : strength === 2
            ? "text-orange-500"
            : strength === 3
            ? "text-yellow-600"
            : "text-emerald-600"
        }`}
      >
        {labels[strength]}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);

  const [fields, setFields] = useState<RegisterFields>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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

    const validationErrors = validateRegister(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Register the account — routed by the Gateway to the User Service
      await apiClient.post<RegisterResponse>("/users/register", {
        name: fields.name.trim(),
        email: fields.email.trim(),
        password: fields.password,
      });

      // 2. Immediately log in to get a JWT — routed to the Auth Service
      const { user, token } = await apiClient.post<LoginResponse>(
        "/auth/login",
        {
          email: fields.email.trim(),
          password: fields.password,
        }
      );

      // 3. Store token + update global state
      login(user, token);

      // 4. Redirect
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setServerError("An account with this email already exists.");
        } else if (err.status === 400) {
          setServerError(err.message || "Please check your details and try again.");
        } else if (err.status >= 500) {
          setServerError("Server error. Please try again in a moment.");
        } else {
          setServerError(err.message || "Registration failed. Please try again.");
        }
      } else {
        setServerError("Cannot connect to the server. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition
    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
    ${errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Shop<span className="text-indigo-600">Wave</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Get started</h2>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={fields.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={inputClass("name")}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
            </div>

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
                className={inputClass("email")}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={fields.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className={inputClass("password")}
              />
              <PasswordStrength password={fields.password} />
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={fields.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={inputClass("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <p className="text-xs text-slate-500">
              By registering you agree to our{" "}
              <Link href="/terms" className="underline hover:text-slate-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-slate-700">
                Privacy Policy
              </Link>
              .
            </p>

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
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
