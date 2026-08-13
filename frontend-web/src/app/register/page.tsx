/**
 * FILE: src/app/register/page.tsx
 *
 * Next.js App Router registration page.
 *
 * - TailwindCSS styling
 * - Client-side form validation (no external library)
 * - On submit: mocks a successful API response, then updates Zustand global state
 * - Redirects to "/" after registration
 */

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import { validateRegister, RegisterFields, ValidationError } from "@/lib/validation";

// ─── Mock API ─────────────────────────────────────────────────────────────────
// Replace with real fetch() to POST /users/register when the backend is ready.
const mockRegisterAPI = async (
  fields: RegisterFields
): Promise<{ user: { id: string; name: string; email: string }; token: string }> => {
  await new Promise((res) => setTimeout(res, 900));
  return {
    user: {
      id: "usr_" + Math.random().toString(36).slice(2, 8),
      name: fields.name.trim(),
      email: fields.email.trim(),
    },
    token: "mock-jwt-token-" + Math.random().toString(36).slice(2),
  };
};

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const strength =
    password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
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
            className={`h-1 flex-1 rounded-full transition-all ${n <= strength ? colors[strength] : "bg-slate-200"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 1 ? "text-red-500" : strength === 2 ? "text-orange-500" : strength === 3 ? "text-yellow-600" : "text-emerald-600"}`}>
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
      const { user, token } = await mockRegisterAPI(fields);
      login(user, token); // log the user in immediately after registration
      router.push("/");
    } catch {
      setServerError("Registration failed. Please try again.");
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
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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

            {/* Terms notice */}
            <p className="text-xs text-slate-500">
              By registering you agree to our{" "}
              <Link href="/terms" className="underline hover:text-slate-700">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>.
            </p>

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
