/**
 * FILE: src/components/checkout/PaymentStep.tsx
 *
 * Checkout Step 2 — Payment method selection.
 * Dummy radio buttons only — no real payment integration (Day 3 scope).
 * The parent /checkout page owns the selected method so it survives
 * navigating back and forth between steps.
 */

"use client";

export type PaymentMethod = "card" | "upi" | "cod";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const paymentOptions: PaymentOption[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path strokeLinecap="round" d="M2 10h20" />
      </svg>
    ),
  },
  {
    id: "upi",
    label: "UPI",
    description: "Pay via Google Pay, PhonePe, Paytm",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m9-8a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

interface PaymentStepProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PaymentStep({
  selectedMethod,
  onChange,
  onNext,
  onBack,
}: PaymentStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Payment Method
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose how you&apos;d like to pay.
        </p>
      </div>

      <div className="space-y-3">
        {paymentOptions.map((option) => {
          const isSelected = selectedMethod === option.id;
          return (
            <label
              key={option.id}
              className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition
                ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={isSelected}
                onChange={() => onChange(option.id)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />

              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}
              >
                {option.icon}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {option.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Dummy card fields — only shown for card, purely cosmetic */}
      {selectedMethod === "card" && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Card number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900
                placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expiry
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900
                placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CVV
            </label>
            <input
              type="text"
              placeholder="123"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900
                placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600
            hover:bg-slate-50 transition"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white
            hover:bg-indigo-700 active:scale-[0.98] transition"
        >
          Review Order →
        </button>
      </div>
    </div>
  );
}
