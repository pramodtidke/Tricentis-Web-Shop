/**
 * FILE: src/app/layout.tsx
 *
 * Root layout — wires together:
 *   - CartDrawer (global slide-out panel, rendered once)
 *   - CartIcon in the Navbar (badge driven by Zustand)
 *   - Auth-aware user greeting / logout button
 *
 * This file is the integration point for Person A's modules.
 * Person B's catalog / search UI fits inside {children}.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/cart/CartDrawer";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopWave",
  description: "A production-grade e-commerce experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {/* Global nav — includes CartIcon */}
        <Navbar />

        {/* Page content */}
        <div className="pt-16">{children}</div>

        {/* Slide-out cart — rendered once at the root */}
        <CartDrawer />
      </body>
    </html>
  );
}
