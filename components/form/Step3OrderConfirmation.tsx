"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { step3Schema } from "@/lib/schemas";
import { useFormStore, type FormFieldKey } from "@/lib/store";
import { type StepRef } from "./FormShell";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { scrollToTopmost } from "@/lib/form-utils";

type Step3Input = z.input<typeof step3Schema>;

const PRICE_UNITS = ["PMT", "PCBM", "PLtrs", "Per Barrel", "Per Drum"];

/* ── Price compound input ────────────────────────────────────────────────── */

function parsePrice(v: string): { amount: string; unit: string } {
  if (!v) return { amount: "", unit: "PMT" };
  const m = v.match(/^USD\s+([\d.,]+)\s+(.+)$/i);
  if (m) return { amount: m[1], unit: m[2].trim() };
  return { amount: v.replace(/^USD\s*/i, "").replace(/\s+\S+$/, ""), unit: "PMT" };
}

function PriceInput({
  value,
  onChange,
  name,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  hasError?: boolean;
}) {
  const parsed = parsePrice(value);
  const [amount, setAmount] = useState(parsed.amount);
  const [unit, setUnit] = useState(
    PRICE_UNITS.includes(parsed.unit) ? parsed.unit : "PMT"
  );

  function emit(amt: string, u: string) {
    onChange(amt ? `USD ${amt} ${u}` : "");
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">
          USD
        </span>
        <Input
          name={name}
          type="text"
          inputMode="decimal"
          value={amount}
          placeholder="0.00"
          className={`min-h-[48px] text-base pl-12 ${hasError ? "border-destructive" : ""}`}
          onChange={(e) => {
            setAmount(e.target.value);
            emit(e.target.value, unit);
          }}
        />
      </div>
      <select
        value={unit}
        onChange={(e) => {
          setUnit(e.target.value);
          emit(amount, e.target.value);
        }}
        className="min-h-[48px] rounded-md border border-input bg-background px-3 text-sm shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {PRICE_UNITS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Extra product price row ─────────────────────────────────────────────── */

function ExtraPriceRow({
  label,
  storeKey,
}: {
  label: string;
  storeKey: "oc_sellingPrice2" | "oc_sellingPrice3";
}) {
  const value = useFormStore((s) => s[storeKey]);
  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <label className="text-sm font-medium">Selling Price</label>
      <div className="mt-1">
        <PriceInput
          value={value}
          onChange={(v) => useFormStore.getState().setField(storeKey, v)}
        />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

const Step3OrderConfirmation = forwardRef<StepRef>(
  function Step3OrderConfirmation(_props, ref) {
    const store = useFormStore();
    const productCount = store.productCount || "1";

    const form = useForm<Step3Input>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        oc_to: store.oc_to,
        oc_attn: store.oc_attn,
        oc_buyers: store.oc_buyers,
        oc_sellingPrice: store.oc_sellingPrice,
        oc_paymentTerms: store.oc_paymentTerms,
        oc_remarks: store.oc_remarks,
      },
    });

    // Sync every RHF field change → Zustand store
    useEffect(() => {
      const subscription = form.watch((values) => {
        const setField = useFormStore.getState().setField;
        for (const [key, value] of Object.entries(values)) {
          if (value !== undefined) {
            setField(key as FormFieldKey, value);
          }
        }
      });
      return () => subscription.unsubscribe();
    }, [form]);

    // Expose validate() to FormShell
    useImperativeHandle(
      ref,
      () => ({
        validate: async () => {
          const result = await form.trigger();
          if (!result) {
            scrollToTopmost(Object.keys(form.formState.errors));
            return false;
          }
          return true;
        },
      }),
      [form],
    );

    return (
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>

          {/* To */}
          <FormField control={form.control} name="oc_to" render={({ field }) => (
            <FormItem>
              <FormLabel>To</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. Marine Fuel Corp" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Attn */}
          <FormField control={form.control} name="oc_attn" render={({ field }) => (
            <FormItem>
              <FormLabel>Attn</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. Jane Doe" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Buyers */}
          <FormField control={form.control} name="oc_buyers" render={({ field }) => (
            <FormItem>
              <FormLabel>Buyers</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. Marine Fuel Corp" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Selling Price 1 */}
          <FormField
            control={form.control}
            name="oc_sellingPrice"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {productCount === "1" ? "Selling Price" : "Selling Price (Product 1)"}
                </FormLabel>
                <FormControl>
                  <PriceInput
                    name="oc_sellingPrice"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    hasError={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Extra product prices */}
          {(productCount === "2" || productCount === "3") && (
            <ExtraPriceRow label="Product 2 — Selling Price" storeKey="oc_sellingPrice2" />
          )}
          {productCount === "3" && (
            <ExtraPriceRow label="Product 3 — Selling Price" storeKey="oc_sellingPrice3" />
          )}

          {/* Payment Terms */}
          <FormField control={form.control} name="oc_paymentTerms" render={({ field }) => (
            <FormItem>
              <FormLabel>Buyer Payment Terms</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. 30 days after BDN date" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Remarks */}
          <FormField control={form.control} name="oc_remarks" render={({ field }) => (
            <FormItem>
              <FormLabel>Buyer Remarks</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} placeholder="Enter any additional remarks…" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

        </form>
      </Form>
    );
  },
);

export { Step3OrderConfirmation };
