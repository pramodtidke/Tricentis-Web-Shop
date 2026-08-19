/**
 * FILE: src/app/checkout/page.tsx
 *
 * Multi-step Checkout page.
 *
 * - Local React state (`useState`) tracks the current step (1, 2, 3) — no
 *   backend or URL-based routing between steps needed for Day 3.
 * - Step 1: Shipping Address
 * - Step 2: Payment Method (dummy)
 * - Step 3: Order Review (cart items + total from cartStore)
 * - "Place Order" clears the cart and shows a success screen (simulated —
 *   no real Order Service call yet, per Day 3 scope).
 * - Redirects to /cart if the cart is empty (nothing to check out).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useCartStore, { selectCartTotal } from "@/store/cartStore";
import StepIndicator from "@/components/checkout/StepIndicator";
import ShippingStep, { ShippingAddress } from "@/components/checkout/ShippingStep";
import PaymentStep, { PaymentMethod } from "@/components/checkout/PaymentStep";
import ReviewStep from "@/components/checkout/ReviewStep";
import useStore from "@/store/useStore";

const emptyAddress: ShippingAddress = {
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore((s) => s);
  const total = selectCartTotal(items);

  // ── Local state drives the whole multi-step flow ──
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const goToStep = (target: 1 | 2 | 3) => {
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Simulates placing an order — replace with a real POST /orders/checkout
  // call once the Order Service exists.
  const user = useStore((s) => s.user);
  const [orderError, setOrderError] = useState("");

  // Calls the real Order Service, then the real Payment Service, through the gateway.
  const handlePlaceOrder = async () => {
    setOrderError("");

    if (!user) {
      setOrderError("You must be signed in to place an order.");
      return;
    }

    setIsPlacingOrder(true);
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      // Step 1: create the order
      const checkoutRes = await fetch(`${BASE_URL}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          shippingAddress: {
            street: address.street,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
            fullName: address.fullName,
            phone: address.phone,
          },
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.message || "Failed to create order.");
      }

      const { orderId, totalAmount } = checkoutData;

      // Step 2: charge the order
      const chargeRes = await fetch(`${BASE_URL}/payments/charge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: totalAmount,
        }),
      });

      const chargeData = await chargeRes.json();

      if (!chargeRes.ok) {
        // Order was created but payment failed - surface this clearly rather
        // than pretending the whole thing succeeded.
        throw new Error(
          chargeData.message ||
            "Order was created, but payment failed. Please contact support."
        );
      }

      setOrderNumber(orderId);
      setOrderComplete(true);
      clearCart();
    } catch (err) {
      console.error("Checkout error:", err);
      setOrderError(
        err instanceof Error
          ? err.message
          : "Something went wrong placing your order. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ── Empty cart guard ──
  if (items.length === 0 && !orderComplete) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            Your cart is empty
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Add items to your cart before checking out.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Start shopping
        </Link>
      </main>
    );
  }

  // ── Order success screen ──
  if (orderComplete) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42L8.5 12.08l6.79-6.79a1 1 0 011.42 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Order placed successfully!
          </h1>
          <p className="text-slate-500 mt-2">
            Order number:{" "}
            <span className="font-mono font-medium text-slate-700">
              {orderNumber}
            </span>
          </p>
          <p className="text-sm text-slate-400 mt-1">
            A confirmation email will be sent to you shortly.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  // ── Main multi-step flow ──
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
          Checkout
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          Complete your purchase in a few easy steps
        </p>

        <StepIndicator currentStep={step} />

        {orderError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {orderError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {step === 1 && (
            <ShippingStep
              address={address}
              onChange={setAddress}
              onNext={() => goToStep(2)}
            />
          )}

          {step === 2 && (
            <PaymentStep
              selectedMethod={paymentMethod}
              onChange={setPaymentMethod}
              onNext={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          )}

          {step === 3 && (
            <ReviewStep
              items={items}
              total={total}
              address={address}
              paymentMethod={paymentMethod}
              onBack={() => goToStep(2)}
              onPlaceOrder={handlePlaceOrder}
              isPlacingOrder={isPlacingOrder}
            />
          )}
        </div>

        <button
          onClick={() => router.push("/cart")}
          className="w-full text-center mt-4 text-sm text-slate-400 hover:text-slate-600 transition"
        >
          ← Back to cart
        </button>
      </div>
    </main>
  );
}
