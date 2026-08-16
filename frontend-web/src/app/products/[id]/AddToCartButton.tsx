"use client";

import useCartStore from "@/store/cartStore";
import { Product } from "@/lib/mockData";

export default function AddToCartButton({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image,
    });
    openCart();
  };

  return (
    <button
      onClick={handleAddToCart}
      className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 md:w-auto"
    >
      Add to Cart
    </button>
  );
}