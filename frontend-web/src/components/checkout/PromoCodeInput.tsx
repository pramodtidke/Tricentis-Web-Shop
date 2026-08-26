"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

interface PromoCodeInputProps {
  onApply?: (discountPercentage: number, code: string) => void;
}

export default function PromoCodeInput({ onApply }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setDiscountPercentage(null);

    try {
      const data = await apiClient.post<{ discountPercentage: number }>(
        "/discounts/validate",
        { code: trimmed }
      );
      setDiscountPercentage(data.discountPercentage);
      onApply?.(data.discountPercentage, trimmed);
    } catch (err) {
      console.error("Failed to validate promo code:", err);
      setError("Invalid or expired promo code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm">
      <label className="block text-sm font-medium text-gray-700">Promo Code</label>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
            setDiscountPercentage(null);
          }}
          placeholder="Enter code"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "..." : "Apply"}
        </button>
      </div>

      {discountPercentage !== null && (
        <p className="mt-2 text-sm font-medium text-green-600">
          {discountPercentage}% discount applied!
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}