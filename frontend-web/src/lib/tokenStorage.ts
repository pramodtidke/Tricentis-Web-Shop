/**
 * FILE: src/lib/tokenStorage.ts
 *
 * Secure token storage utilities.
 *
 * Strategy:
 *  - Primary:  js-cookie (survives page refresh, sent with requests,
 *              can be upgraded to HttpOnly on the backend later)
 *  - Fallback: localStorage (for environments where cookies are blocked)
 *
 * Install:  npm install js-cookie
 *           npm install -D @types/js-cookie
 *
 * ⚠️  Production note: Once the backend is fully set up, migrate to
 *    HttpOnly cookies (set by the server on /auth/login response).
 *    That removes the XSS attack surface entirely. This file becomes a
 *    thin wrapper that just reads the cookie (never writes it).
 */

import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Cookie options — 7-day expiry, strict same-site
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: "Strict",
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
};

// ─── Token ────────────────────────────────────────────────────────────────────

export const tokenStorage = {
  setToken(token: string): void {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
    // Fallback for environments where cookies may be blocked
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // localStorage not available (SSR / private browsing)
    }
  },

  getToken(): string | null {
    return (
      Cookies.get(TOKEN_KEY) ||
      (() => {
        try {
          return localStorage.getItem(TOKEN_KEY);
        } catch {
          return null;
        }
      })()
    );
  },

  removeToken(): void {
    Cookies.remove(TOKEN_KEY);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

// ─── User ─────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  name: string;
  email: string;
}

export const userStorage = {
  setUser(user: StoredUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  getUser(): StoredUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  },

  removeUser(): void {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  },
};

// ─── Clear all auth data ─────────────────────────────────────────────────────

export const clearAuthStorage = (): void => {
  tokenStorage.removeToken();
  userStorage.removeUser();
};
