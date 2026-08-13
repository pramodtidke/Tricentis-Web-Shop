"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { mockProducts, Product } from "@/lib/mockData";
import useStore from "@/store/useStore";

function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useStore((s) => s);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image,
    });
    openCart();
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
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

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() ?? "";

  const categories = Array.from(new Set(mockProducts.map((p) => p.category)));

  const filteredProducts = searchQuery
    ? mockProducts.filter((p) => p.name.toLowerCase().includes(searchQuery))
    : mockProducts;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Shop All Products
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Category
          </h2>
          <ul className="space-y-2">
            <li>
              <button className="text-sm font-medium text-blue-600">
                All
              </button>
            </li>
            {categories.map((category) => (
              <li key={category}>
                <button className="text-sm text-gray-600 hover:text-blue-600">
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
              No products found for &quot;{searchQuery}&quot;.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}