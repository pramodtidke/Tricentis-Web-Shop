/**
 * FILE: src/lib/apiClient.ts
 *
 * Centralized API client for all backend calls via the API Gateway.
 *
 * - Base URL reads from NEXT_PUBLIC_API_URL env variable
 * - Automatically attaches the JWT token from cookies to every request
 * - Throws a typed ApiError on non-2xx responses so callers can handle cleanly
 *
 * Usage:
 *   import { apiClient } from "@/lib/apiClient";
 *   const data = await apiClient.post("/auth/login", { email, password });
 */

import Cookies from "js-cookie";

// TEMPORARY: routes requests to the correct service port until a real
// API Gateway exists. Replace this with a single Gateway URL later.
function resolveBaseUrl(path: string): string {
  if (path.startsWith("/auth")) {
    return process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:3001";
  }
  if (path.startsWith("/users")) {
    return process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3004";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

// ─── Typed API Error ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ─── Response handler ─────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? (data as { message: string }).message
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

// ─── Build headers ────────────────────────────────────────────────────────────

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const token = Cookies.get("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const apiClient = {
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${resolveBaseUrl(path)}${path}`, {
      method: "GET",
      headers: buildHeaders(options?.headers),
      ...options,
    });
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const res = await fetch(`${resolveBaseUrl(path)}${path}`, {
      method: "POST",
      headers: buildHeaders(options?.headers),
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(res);
  },

  async put<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const res = await fetch(`${resolveBaseUrl(path)}${path}`, {
      method: "PUT",
      headers: buildHeaders(options?.headers),
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${resolveBaseUrl(path)}${path}`, {
      method: "DELETE",
      headers: buildHeaders(options?.headers),
      ...options,
    });
    return handleResponse<T>(res);
  },
};
