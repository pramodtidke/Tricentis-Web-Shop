/**
 * FILE: src/app/profile/page.tsx
 *
 * Protected user profile page.
 *
 * - Uses useAuth({ required: true }) to guard the route
 * - If user is NOT logged in → automatically redirected to /login
 * - If user IS logged in → fetches full profile from GET /users/{id}/profile
 *   via the API Gateway (User Service)
 * - Shows a loading skeleton while data is fetching
 * - Shows an error state if the API call fails
 *
 * Backend contract (User Service via API Gateway):
 *   GET /users/{id}/profile
 *   Headers: Authorization: Bearer <token>
 *   Returns: { id, name, email, createdAt, address? }
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, ApiError } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  address?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-56 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="h-px bg-slate-100" />
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-4">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-48 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  // Guard: redirects to /login if not authenticated
  const { user, isAuthenticated, isHydrated } = useAuth({ required: true });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Fetch full profile from User Service once we know the user's ID
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setFetchError("");
      try {
        const data = await apiClient.get<UserProfile>(
          `/users/${user.id}/profile`
        );
        setProfile(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setFetchError(
            err.status === 401
              ? "Your session has expired. Please sign in again."
              : "Failed to load profile. Please try again."
          );
        } else {
          setFetchError("Cannot connect to the server.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user?.id]);

  // ── Rehydrating (first render) ──
  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </main>
    );
  }

  // ── Not authenticated (briefly visible before redirect fires) ──
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account information
          </p>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

          {isLoading ? (
            <ProfileSkeleton />
          ) : fetchError ? (
            /* Error state */
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {fetchError}
            </div>
          ) : profile ? (
            /* Profile data */
            <div className="space-y-6">

              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold flex-shrink-0">
                  {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{profile?.name ?? "Unknown"}</h2>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Details */}
              <dl className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <dt className="w-28 font-medium text-slate-500 flex-shrink-0">Full name</dt>
                  <dd className="text-slate-900">{profile.name}</dd>
                </div>
                <div className="flex gap-4 text-sm">
                  <dt className="w-28 font-medium text-slate-500 flex-shrink-0">Email</dt>
                  <dd className="text-slate-900">{profile.email}</dd>
                </div>
                <div className="flex gap-4 text-sm">
                  <dt className="w-28 font-medium text-slate-500 flex-shrink-0">Member since</dt>
                  <dd className="text-slate-900">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
                {profile.address && (
                  <div className="flex gap-4 text-sm">
                    <dt className="w-28 font-medium text-slate-500 flex-shrink-0">Address</dt>
                    <dd className="text-slate-900">
                      {profile.address.street}, {profile.address.city},{" "}
                      {profile.address.postalCode}, {profile.address.country}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="h-px bg-slate-100" />

              {/* Actions */}
              <div className="flex gap-3">
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                  Edit Profile
                </button>
                <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  Change Password
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Order history card — placeholder for next task */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Order History</h3>
          <p className="text-sm text-slate-400">Your past orders will appear here.</p>
        </div>
      </div>
    </main>
  );
}


