"use client";

import { useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
}: {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const showBack = currentStep > 1;
  const showNext = currentStep < 4;

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
              className="w-full min-h-[48px] md:w-auto"
            >
              <FiChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Right side — Next button */}
        <div className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
          {showNext && (
            <Button
              onClick={onNext}
              className="w-full min-h-[48px] md:w-auto"
            >
              Next
              <FiChevronRight className="ml-1 h-4 w-4" />
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

  /**
   * Ref to the active step component's imperative handle.
   * Steps 1-3 expose a `validate()` method via `useImperativeHandle`.
   * Step 4 is read-only and has no validation, so the ref will be null.
   */
  const stepRef = useRef<StepRef>(null);

  const handleNext = useCallback(async () => {
    if (currentStep >= 4) return;

    // If the current step component exposes a validate() method, call it.
    // Validation failure means the step component has already scrolled to
    // the first invalid field and shown FormMessage errors — we just stay put.
    if (stepRef.current) {
      const isValid = await stepRef.current.validate();
      if (!isValid) return;
    }

    setCurrentStep((s) => s + 1);
  }, [currentStep]);

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
          {/*
           * Placeholder content — real step components (Task 7) will replace
           * these and receive `ref={stepRef}` so FormShell can call validate().
           *
           * Example future usage:
           *   {currentStep === 1 && <Step1TransactionDetails ref={stepRef} />}
           */}
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
      />
    </div>
  );
}
