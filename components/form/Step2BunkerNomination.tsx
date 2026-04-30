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
import { step2Schema } from "@/lib/schemas";
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

type Step2Input = z.input<typeof step2Schema>;

const PRICE_UNITS = ["PMT", "PCBM", "PLtrs", "Per Barrel", "Per Drum"];

/* ── Price compound input ────────────────────────────────────────────────── */

function parsePrice(v: string): { amount: string; unit: string } {
  if (!v) return { amount: "", unit: "PMT" };
  const m = v.match(/^USD\s+([\d.,]+)\s+(.+)$/i);
  if (m) return { amount: m[1], unit: m[2].trim() };
  // Fallback: strip USD prefix
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
  storeKey: "bn_buyingPrice2" | "bn_buyingPrice3";
}) {
  const value = useFormStore((s) => s[storeKey]);
  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <label className="text-sm font-medium">Buying Price</label>
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

const Step2BunkerNomination = forwardRef<StepRef>(
  function Step2BunkerNomination(_props, ref) {
    const store = useFormStore();
    const productCount = store.productCount || "1";

    const form = useForm<Step2Input>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        bn_to: store.bn_to,
        bn_attn: store.bn_attn,
        bn_sellers: store.bn_sellers,
        bn_suppliers: store.bn_suppliers,
        bn_buyingPrice: store.bn_buyingPrice,
        bn_paymentTerms: store.bn_paymentTerms,
        bn_remarks: store.bn_remarks,
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
          <FormField control={form.control} name="bn_to" render={({ field }) => (
            <FormItem>
              <FormLabel>To</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. Vitol Asia Pte Ltd" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Attn */}
          <FormField control={form.control} name="bn_attn" render={({ field }) => (
            <FormItem>
              <FormLabel>Attn</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. John Smith" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Sellers */}
          <FormField control={form.control} name="bn_sellers" render={({ field }) => (
            <FormItem>
              <FormLabel>Sellers</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. Vitol Asia Pte Ltd" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Suppliers */}
          <FormField control={form.control} name="bn_suppliers" render={({ field }) => (
            <FormItem>
              <FormLabel>Suppliers</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. ENOC" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Buying Price 1 */}
          <FormField
            control={form.control}
            name="bn_buyingPrice"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {productCount === "1" ? "Buying Price" : "Buying Price (Product 1)"}
                </FormLabel>
                <FormControl>
                  <PriceInput
                    name="bn_buyingPrice"
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
            <ExtraPriceRow label="Product 2 — Buying Price" storeKey="bn_buyingPrice2" />
          )}
          {productCount === "3" && (
            <ExtraPriceRow label="Product 3 — Buying Price" storeKey="bn_buyingPrice3" />
          )}

          {/* Payment Terms */}
          <FormField control={form.control} name="bn_paymentTerms" render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Payment Terms</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="e.g. 30 days after BDN date" className="min-h-[48px] text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Remarks */}
          <FormField control={form.control} name="bn_remarks" render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Remarks</FormLabel>
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

export { Step2BunkerNomination };
