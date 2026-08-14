/**
 * FILE: src/components/checkout/StepIndicator.tsx
 *
 * Visual progress indicator for the multi-step checkout flow.
 * Shows 3 steps with connecting lines; highlights current + completed steps.
 */

"use client";

interface StepIndicatorProps {
  currentStep: number; // 1, 2, or 3
}

const steps = [
  { number: 1, label: "Shipping" },
  { number: 2, label: "Payment" },
  { number: 3, label: "Review" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center">
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition
                  ${
                    isCompleted
                      ? "bg-indigo-600 text-white"
                      : isActive
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42L8.5 12.08l6.79-6.79a1 1 0 011.42 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  isActive ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition ${
                  isCompleted ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
