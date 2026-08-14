/**
 * FILE: src/app/layout.tsx  (Day 2 — updated)
 *
 * Added AuthProvider client component to call initAuth() on mount.
 * This rehydrates the Zustand store from cookie/localStorage on every
 * page refresh so the user stays logged in.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/cart/CartDrawer";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopWave",
  description: "A production-grade e-commerce experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {/*
          AuthProvider runs initAuth() on mount — must wrap everything
          so Zustand is rehydrated before any child renders
        */}
        <AuthProvider>
          <Navbar />
          <div className="pt-16">{children}</div>
          <CartDrawer />
        </AuthProvider>
      </body>
    </html>
  );
}
