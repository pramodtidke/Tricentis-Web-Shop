"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import useCartStore from "@/store/cartStore";
import useStore from "@/store/useStore";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

interface SearchResult extends Product {
  score?: number;
}

function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);
  const user = useStore((s) => s.user);

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    openCart();
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      return; // not logged in — button is disabled below, this is a safety guard
    }

    setWishlistLoading(true);
    try {
      if (!wishlisted) {
        await apiClient.post(`/wishlist/${user.id}/add`, {
          productId: product.id,
        });
        setWishlisted(true);
      } else {
        await apiClient.delete(`/wishlist/${user.id}/remove/${product.id}`);
        setWishlisted(false);
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <button
          onClick={handleToggleWishlist}
          disabled={!user || wishlistLoading}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
            className={`h-4 w-4 ${wishlisted ? "text-red-500" : "text-gray-600"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {product.category}
        </p>
        <h3 className="mt-1 text-sm font-medium text-gray-900 line-clamp-1">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <button
            onClick={handleAddToCart}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (searchQuery.trim()) {
          const data = await apiClient.get<{ results: SearchResult[] }>(
            `/search?q=${encodeURIComponent(searchQuery)}`
          );
          setProducts(data.results);
        } else {
          const data = await apiClient.get<Product[]>("/products");
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchQuery]);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Shop All Products
      </h1>

      {loading && <p className="text-sm text-gray-500">Loading products...</p>}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              Category
            </h2>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`text-sm ${
                    selectedCategory === "All"
                      ? "font-medium text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  All
                </button>
              </li>
              {categories.map((category) => (
                <li key={category}>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`text-sm ${
                      selectedCategory === category
                        ? "font-medium text-blue-600"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-sm text-gray-500">
                No products found{searchQuery && ` for "${searchQuery}"`}.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}