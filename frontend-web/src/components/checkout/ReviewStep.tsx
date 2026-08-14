/**
 * FILE: src/components/checkout/ReviewStep.tsx
 *
 * Checkout Step 3 — Order Review.
 * Shows a read-only summary of cart items, shipping address, and payment
 * method chosen in the previous steps, plus the final total.
 *
 * "Place Order" is a dummy action for Day 3 — no backend call yet. It just
 * shows a success state and clears the cart (simulating a completed order).
 */

"use client";

import Image from "next/image";
import { CartItem } from "@/store/cartStore";
import { ShippingAddress } from "./ShippingStep";
import { PaymentMethod } from "./PaymentStep";

const paymentLabels: Record<PaymentMethod, string> = {
  card: "Credit / Debit Card",
  upi: "UPI",
  cod: "Cash on Delivery",
};

interface ReviewStepProps {
  items: CartItem[];
  total: number;
  address: ShippingAddress;
  paymentMethod: PaymentMethod;
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacingOrder: boolean;
}

export default function ReviewStep({
  items,
  total,
  address,
  paymentMethod,
  onBack,
  onPlaceOrder,
  isPlacingOrder,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Review Your Order
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Double-check everything before placing your order.
        </p>
      </div>

      {/* Cart items */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-700">Items</h3>
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 5h2l.4 2M7 13h10l4-8H5.4L5 5H3m4 8l-1.5 6h13L17 13M9 19a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping address */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">
            Shipping Address
          </h3>
          <button
            onClick={onBack}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </button>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 space-y-0.5">
          <p className="font-medium text-slate-900">{address.fullName}</p>
          <p>{address.street}</p>
          <p>
            {address.city}, {address.postalCode}
          </p>
          <p>{address.country}</p>
          <p className="text-slate-400 mt-1">{address.phone}</p>
        </div>
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-700">Payment Method</h3>
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-800 font-medium">
          {paymentLabels[paymentMethod]}
        </div>
      </div>

      {/* Total */}
      <div className="rounded-xl bg-slate-50 p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span className="text-emerald-600">Free</span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPlacingOrder}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600
            hover:bg-slate-50 transition disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={isPlacingOrder}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white
            hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-60"
        >
          {isPlacingOrder ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Placing order…
            </span>
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </div>
  );
}
