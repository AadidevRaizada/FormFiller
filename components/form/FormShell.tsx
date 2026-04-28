"use client";

import { useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FiCheck, FiChevronLeft, FiChevronRight, FiSend } from "react-icons/fi";
import { Step1TransactionDetails } from "./Step1TransactionDetails";
import { Step2BunkerNomination } from "./Step2BunkerNomination";
import { Step3OrderConfirmation } from "./Step3OrderConfirmation";
import { Step4ReviewExport } from "./Step4ReviewExport";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useFormStore, type FormFieldKey } from "@/lib/store";
import { toast } from "sonner";

/**
 * Interface that each step component (Steps 1-3) must implement via
 * `forwardRef` + `useImperativeHandle`. FormShell calls `validate()`
 * when the user taps "Next". If it returns `true`, the wizard advances;
 * if `false`, the wizard stays on the current step (the step component
 * is responsible for scrolling to the first invalid field and showing
 * FormMessage errors).
 */
export interface StepRef {
  validate: () => Promise<boolean>;
}

/** Step metadata used by the progress indicator and card header. */
const STEPS = [
  { number: 1, title: "Transaction Details", description: "Enter shared transaction information" },
  { number: 2, title: "Bunker Nomination", description: "Enter supplier-specific details" },
  { number: 3, title: "Order Confirmation", description: "Enter buyer-specific details" },
  { number: 4, title: "Review & Export", description: "Review your data and generate documents" },
] as const;

const formFieldKeys: FormFieldKey[] = [
  "date",
  "vesselNameImo",
  "port",
  "eta",
  "product",
  "quantity",
  "deliveryMode",
  "agents",
  "physicalSupplier",
  "signatory",
  "bn_to",
  "bn_attn",
  "bn_sellers",
  "bn_suppliers",
  "bn_buyingPrice",
  "bn_paymentTerms",
  "bn_remarks",
  "oc_to",
  "oc_attn",
  "oc_buyers",
  "oc_sellingPrice",
  "oc_paymentTerms",
  "oc_remarks",
];

/* -------------------------------------------------------------------------- */
/*  StepProgressIndicator                                                     */
/* -------------------------------------------------------------------------- */

function StepProgressIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <nav aria-label="Form progress" className="w-full px-2 py-4 md:px-0">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isLast = idx === STEPS.length - 1;

          return (
            <li
              key={step.number}
              className={`flex items-center ${isLast ? "" : "flex-1"}`}
            >
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors
                    ${
                      isCompleted
                        ? "bg-[#1d4ed8] text-white"
                        : isActive
                          ? "border-2 border-[#1d4ed8] bg-[#1d4ed8]/10 text-[#1d4ed8]"
                          : "border-2 border-muted-foreground/30 text-muted-foreground/50"
                    }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <FiCheck className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    step.number
                  )}
                </div>
                {/* Label — hidden on mobile, shown on md+ */}
                <span
                  className={`mt-1 hidden text-xs md:block ${
                    isActive
                      ? "font-semibold text-[#1d4ed8]"
                      : isCompleted
                        ? "text-[#1d4ed8]"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {step.title}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    isCompleted ? "bg-[#1d4ed8]" : "bg-muted-foreground/20"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  StickyActionBar                                                           */
/* -------------------------------------------------------------------------- */

function StickyActionBar({
  currentStep,
  onBack,
  onNext,
  isSubmitting,
}: {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
}) {
  const showBack = currentStep > 1;
  const showNext = currentStep < 4;
  const isSubmitStep = currentStep === 3;

  // Step 4 has its own action buttons inside Step4ReviewExport — no sticky bar needed
  if (currentStep === 4 && !showBack) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
        {/* Left side — Back button */}
        <div className="order-2 md:order-1">
          {showBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full min-h-[48px] md:w-auto"
            >
              <FiChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Right side — Next / Submit button */}
        <div className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
          {showNext && (
            <Button
              onClick={onNext}
              disabled={isSubmitting}
              className="w-full min-h-[48px] md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </>
              ) : isSubmitStep ? (
                <>
                  Submit
                  <FiSend className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <FiChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FormShell                                                                 */
/* -------------------------------------------------------------------------- */

export function FormShell() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const initialStep = stepParam ? Math.min(Math.max(Number(stepParam), 1), 4) || 1 : 1;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  /**
   * Ref to the active step component's imperative handle.
   * Steps 1-3 expose a `validate()` method via `useImperativeHandle`.
   * Step 4 is read-only and has no validation, so the ref will be null.
   */
  const stepRef = useRef<StepRef>(null);

  const handleNext = useCallback(async () => {
    if (currentStep >= 4) return;

    // If the current step component exposes a validate() method, call it.
    if (stepRef.current) {
      const isValid = await stepRef.current.validate();
      if (!isValid) return;
    }

    // On step 3, save the transaction before advancing to the review page.
    if (currentStep === 3) {
      setIsSubmitting(true);
      try {
        const storeState = useFormStore.getState();
        const data = {} as Record<FormFieldKey, string>;
        for (const key of formFieldKeys) {
          data[key] = storeState[key];
        }

        const editingId = storeState.editingTransactionId;
        const url = editingId ? `/api/transactions/${editingId}` : "/api/transactions";
        const method = editingId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error || "Failed to save transaction"
          );
        }

        storeState.setEditingTransactionId(null);
        toast.success(editingId ? "Transaction updated successfully" : "Transaction saved successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save transaction"
        );
      } finally {
        setIsSubmitting(false);
      }
    }

    setCurrentStep((s) => s + 1);
  }, [currentStep, token]);

  const handleBack = useCallback(() => {
    // Back navigation never validates — data is already persisted in Zustand.
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const step = STEPS[currentStep - 1];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-4">
      {/* Progress indicator */}
      <StepProgressIndicator currentStep={currentStep} />

      {/* Step content card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <Step1TransactionDetails ref={stepRef} />
          )}
          {currentStep === 2 && (
            <Step2BunkerNomination ref={stepRef} />
          )}
          {currentStep === 3 && (
            <Step3OrderConfirmation ref={stepRef} />
          )}
          {currentStep === 4 && (
            <Step4ReviewExport />
          )}
        </CardContent>
      </Card>

      {/* Sticky action bar */}
      <StickyActionBar
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
