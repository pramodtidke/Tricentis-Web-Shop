"use client";

import Link from "next/link";
import Image from "next/image";
import { mockProducts } from "@/lib/mockData";
import useStore from "@/store/useStore";

export default function HomePage() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);
  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <main>
      {/* Hero */}
      <section className="bg-gray-900 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold sm:text-5xl">
            {isAuthenticated && user
              ? `Welcome back, ${user.name ?? "there"}`
              : "Welcome to ShopWave"}
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Quality goods, thoughtfully curated. Discover something new
            today.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Shop All Products
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Products
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}