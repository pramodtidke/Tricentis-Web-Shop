"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { mockProducts } from "@/lib/mockData";
import useCartStore from "@/store/cartStore";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product = mockProducts.find((p) => p.id === params.id);

  const { addToCart, openCart } = useCartStore((s) => s);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image,
    });
    openCart();
  };

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Product Not Found
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          We couldn&apos;t find a product with that ID.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {product.category}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <p className="mt-6 leading-relaxed text-gray-600">
            {product.description}
          </p>

          <div className="mt-8">
            <button
              onClick={handleAddToCart}
              className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 md:w-auto"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}