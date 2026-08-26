"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/apiClient";
import useStore from "@/store/useStore";
import useCartStore from "@/store/cartStore";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

export default function WishlistPage() {
  const user = useStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWishlist() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const wishlistData = await apiClient.get<{ productIds: string[] }>(
          `/wishlist/${user.id}`
        );

        if (wishlistData.productIds.length === 0) {
          setProducts([]);
          return;
        }

        // Fetch full product details for each wishlisted product ID
        const productResults = await Promise.allSettled(
          wishlistData.productIds.map((id) =>
            apiClient.get<Product>(`/products/${id}`)
          )
        );

        const loadedProducts = productResults
          .filter(
            (r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled"
          )
          .map((r) => r.value);

        setProducts(loadedProducts);
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
        setError("Failed to load your wishlist. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchWishlist();
  }, [user]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    try {
      await apiClient.delete(`/wishlist/${user.id}/remove/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    openCart();
  };

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <p className="mt-4 text-sm text-gray-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>{" "}
          to view your saved items.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Wishlist</h1>

      {loading && <p className="text-sm text-gray-500">Loading your wishlist...</p>}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-sm text-gray-500">
          Your wishlist is empty.{" "}
          <Link href="/products" className="font-medium text-indigo-600 hover:text-indigo-700">
            Browse products
          </Link>{" "}
          to add some.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <Link href={`/products/${product.id}`}>
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
              </Link>
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {product.category}
                </p>
                <h3 className="mt-1 text-sm font-medium text-gray-900 line-clamp-1">
                  {product.name}
                </h3>
                <p className="mt-2 text-base font-semibold text-gray-900">
                  ${product.price.toFixed(2)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(product.id)}
                    aria-label="Remove from wishlist"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}