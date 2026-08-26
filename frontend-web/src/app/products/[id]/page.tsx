"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

interface Review {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsResponse {
  productId: string;
  count: number;
  averageRating: number;
  reviews: Review[];
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);
  const user = useStore((s) => s.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await apiClient.get<Product>(`/products/${params.id}`);
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProduct();
  }, [params.id]);

  async function fetchReviews() {
    try {
      setReviewsLoading(true);
      const data = await apiClient.get<ReviewsResponse>(`/reviews/${params.id}`);
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
      setReviewCount(data.count);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) fetchReviews();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    openCart();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newComment.trim()) {
      setSubmitError("Please write a comment before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiClient.post(`/reviews/${params.id}`, {
        userId: user.id,
        rating: newRating,
        comment: newComment.trim(),
      });
      setNewComment("");
      setNewRating(5);
      await fetchReviews(); // refresh the list + average after a successful submit
    } catch (err) {
      console.error("Failed to submit review:", err);
      setSubmitError("Failed to submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500">Loading product...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
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
            src={product.imageUrl}
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
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>

          {!reviewsLoading && reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    viewBox="0 0 20 20"
                    fill={star <= Math.round(averageRating) ? "#f59e0b" : "#e5e7eb"}
                    className="h-4 w-4"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.83 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <p className="mt-4 text-2xl font-semibold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <p className="mt-6 leading-relaxed text-gray-600">{product.description}</p>

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

      {/* Reviews section */}
      <section className="mt-16 border-t border-gray-200 pt-10">
        <h2 className="text-xl font-bold text-gray-900">
          Reviews {reviewCount > 0 && `(${reviewCount})`}
        </h2>

        {/* Submit a review */}
        <div className="mt-6 max-w-lg">
          {user ? (
            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your review
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts about this product..."
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Sign in
              </a>{" "}
              to leave a review.
            </p>
          )}
        </div>

        {/* Review list */}
        <div className="mt-8 space-y-6">
          {reviewsLoading && (
            <p className="text-sm text-gray-500">Loading reviews...</p>
          )}
          {!reviewsLoading && reviews.length === 0 && (
            <p className="text-sm text-gray-500">
              No reviews yet. Be the first to review this product.
            </p>
          )}
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-100 pb-6">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    viewBox="0 0 20 20"
                    fill={star <= review.rating ? "#f59e0b" : "#e5e7eb"}
                    className="h-3.5 w-3.5"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.83 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
                  </svg>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}