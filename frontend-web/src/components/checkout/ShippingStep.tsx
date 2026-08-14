/**
 * FILE: src/components/checkout/ShippingStep.tsx
 *
 * Checkout Step 1 — Shipping Address form.
 * Local validation only (no backend). Lifts form state up to the parent
 * /checkout page via props so it survives step navigation.
 */

"use client";

import { FormEvent } from "react";

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface ShippingStepProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  onNext: () => void;
}

export default function ShippingStep({
  address,
  onChange,
  onNext,
}: ShippingStepProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 " +
    "placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Shipping Address
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Where should we send your order?
        </p>
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={address.fullName}
          onChange={handleChange}
          placeholder="Jane Doe"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="street"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Street address
        </label>
        <input
          id="street"
          name="street"
          type="text"
          required
          value={address.street}
          onChange={handleChange}
          placeholder="123 Main Street"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            value={address.city}
            onChange={handleChange}
            placeholder="Pune"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Postal code
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            required
            value={address.postalCode}
            onChange={handleChange}
            placeholder="411001"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            value={address.country}
            onChange={handleChange}
            placeholder="India"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={address.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white
          hover:bg-indigo-700 active:scale-[0.98] transition"
      >
        Continue to Payment →
      </button>
    </form>
  );
}
