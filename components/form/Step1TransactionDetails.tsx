"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { step1Schema } from "@/lib/schemas";
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
import { isoToOrdinal, parseOrdinalDate, parseEta, formatEta } from "@/lib/date-utils";
import { scrollToTopmost } from "@/lib/form-utils";

type Step1Input = z.input<typeof step1Schema>;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function parsePort(v: string): { name: string; country: string } {
  const idx = v.lastIndexOf(", ");
  if (idx === -1) return { name: v, country: "" };
  return { name: v.slice(0, idx), country: v.slice(idx + 2) };
}

function parseQuantity(v: string): { min: string; max: string; unit: string } {
  if (!v) return { min: "", max: "", unit: "MT" };
  const rangeMatch = v.match(/^([\d.]+)\s*[–\-]\s*([\d.]+)\s*(.+)$/);
  if (rangeMatch) return { min: rangeMatch[1], max: rangeMatch[2], unit: rangeMatch[3].trim() };
  const singleMatch = v.match(/^([\d.]+)\s+(.+)$/);
  if (singleMatch) return { min: singleMatch[1], max: "", unit: singleMatch[2].trim() };
  return { min: v, max: "", unit: "MT" };
}

function buildQuantity(min: string, max: string, unit: string): string {
  if (!min) return "";
  return max ? `${min}–${max} ${unit}` : `${min} ${unit}`;
}

function parseVesselImo(v: string): { name: string; imo: string; applicable: boolean } {
  const m = v.match(/^(.*)\s+\(IMO\s+(\d{7})\)$/);
  if (m) return { name: m[1], imo: m[2], applicable: true };
  return { name: v, imo: "", applicable: false };
}

const QUANTITY_UNITS = ["MT", "CBM", "Ltrs", "Barrels", "Drums"];

/* ── Dropdown for product count ──────────────────────────────────────────── */

function ProductCountSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value || "1"}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[48px] rounded-md border border-input bg-background px-3 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="1">1 Product</option>
      <option value="2">2 Products</option>
      <option value="3">3 Products</option>
    </select>
  );
}

/* ── Date picker (whole-field clickable) ─────────────────────────────────── */

function DateField({
  name,
  value,
  onChange,
  placeholder,
  hasError,
  min,
}: {
  name?: string;
  value: string;            // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
  placeholder: string;
  hasError?: boolean;
  min?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    // Modern browsers expose showPicker(); fall back to focus+click otherwise.
    try {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      el.focus();
      el.click();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      className={`relative flex w-full items-center justify-between rounded-md border bg-background px-3 min-h-[48px] text-sm cursor-pointer hover:border-ring ${
        hasError ? "border-destructive" : "border-input"
      }`}
    >
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={-1}
      />
      <span className={value ? "" : "text-muted-foreground"}>
        {value ? isoToOrdinal(value) : placeholder}
      </span>
      <svg className="h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    </div>
  );
}

/* ── Quantity compound input ─────────────────────────────────────────────── */

function QuantityInput({
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
  const parsed = parseQuantity(value);
  const [min, setMin] = useState(parsed.min);
  const [max, setMax] = useState(parsed.max);
  const [unit, setUnit] = useState(
    QUANTITY_UNITS.includes(parsed.unit) ? parsed.unit : "MT"
  );

  function emit(newMin: string, newMax: string, newUnit: string) {
    onChange(buildQuantity(newMin, newMax, newUnit));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 items-center gap-2 min-w-[180px]">
        <Input
          name={name}
          type="number"
          min={0}
          value={min}
          placeholder="Min"
          className={`min-h-[48px] text-base flex-1 ${hasError ? "border-destructive" : ""}`}
          onChange={(e) => {
            setMin(e.target.value);
            emit(e.target.value, max, unit);
          }}
        />
        <span className="text-muted-foreground text-sm shrink-0">–</span>
        <Input
          type="number"
          min={0}
          value={max}
          placeholder="Max (opt.)"
          className="min-h-[48px] text-base flex-1"
          onChange={(e) => {
            setMax(e.target.value);
            emit(min, e.target.value, unit);
          }}
        />
      </div>
      <select
        value={unit}
        onChange={(e) => {
          setUnit(e.target.value);
          emit(min, max, e.target.value);
        }}
        className="min-h-[48px] rounded-md border border-input bg-background px-3 text-sm shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {QUANTITY_UNITS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Extra product row ───────────────────────────────────────────────────── */

function ExtraProductRow({
  label,
  productValue,
  onProductChange,
  quantityValue,
  onQuantityChange,
}: {
  label: string;
  productValue: string;
  onProductChange: (v: string) => void;
  quantityValue: string;
  onQuantityChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div>
        <label className="text-sm font-medium">Product</label>
        <Input
          value={productValue}
          onChange={(e) => onProductChange(e.target.value)}
          placeholder="e.g. MGO DMA 0.1%"
          className="min-h-[48px] text-base mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Quantity</label>
        <div className="mt-1">
          <QuantityInput value={quantityValue} onChange={onQuantityChange} />
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

const Step1TransactionDetails = forwardRef<StepRef>(
  function Step1TransactionDetails(_props, ref) {
    const store = useFormStore();

    // ── Local state for compound fields (parsed from store on mount) ─────
    const portParsed = parsePort(store.port);
    const [portName, setPortName] = useState(portParsed.name);
    const [portCountry, setPortCountry] = useState(portParsed.country);

    const etaParsed = parseEta(store.eta);
    const [etaFrom, setEtaFrom] = useState(etaParsed.fromIso);
    const [etaTo, setEtaTo] = useState(etaParsed.toIso);

    const vesselParsed = parseVesselImo(store.vesselNameImo);
    const [vesselName, setVesselName] = useState(vesselParsed.name);
    const [imoNumber, setImoNumber] = useState(vesselParsed.imo);
    const [imoApplicable, setImoApplicable] = useState(vesselParsed.applicable);
    const [imoError, setImoError] = useState("");

    const [productCount, setProductCountState] = useState(store.productCount || "1");

    // ── RHF ──────────────────────────────────────────────────────────────
    const form = useForm<Step1Input>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        date: store.date,
        vesselNameImo: store.vesselNameImo,
        port: store.port,
        eta: store.eta,
        product: store.product,
        quantity: store.quantity,
        deliveryMode: store.deliveryMode,
        agents: store.agents,
        physicalSupplier: store.physicalSupplier,
        signatory: store.signatory,
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

    // ── Compound field helpers ────────────────────────────────────────────

    function updatePort(name: string, country: string) {
      const combined = name && country ? `${name}, ${country}` : name || country;
      form.setValue("port", combined, { shouldValidate: true });
    }

    function updateEta(fromIso: string, toIso: string) {
      const formatted = formatEta(fromIso, toIso);
      form.setValue("eta", formatted, { shouldValidate: true });
    }

    function updateVessel(name: string, imo: string, applicable: boolean) {
      if (applicable) {
        const combined = imo ? `${name} (IMO ${imo})` : name;
        form.setValue("vesselNameImo", combined, { shouldValidate: true });
      } else {
        form.setValue("vesselNameImo", name, { shouldValidate: true });
      }
    }

    function handleImoChange(val: string) {
      const digits = val.replace(/\D/g, "").slice(0, 7);
      setImoNumber(digits);
      if (digits && digits.length !== 7) {
        setImoError("IMO must be exactly 7 digits");
      } else {
        setImoError("");
      }
      updateVessel(vesselName, digits, imoApplicable);
    }

    function handleProductCountChange(count: string) {
      setProductCountState(count);
      useFormStore.getState().setField("productCount", count);
      // Clear unused extra product fields
      const state = useFormStore.getState();
      if (count === "1") {
        state.setField("product2", ""); state.setField("quantity2", "");
        state.setField("product3", ""); state.setField("quantity3", "");
        state.setField("bn_buyingPrice2", ""); state.setField("bn_buyingPrice3", "");
        state.setField("oc_sellingPrice2", ""); state.setField("oc_sellingPrice3", "");
      } else if (count === "2") {
        state.setField("product3", ""); state.setField("quantity3", "");
        state.setField("bn_buyingPrice3", ""); state.setField("oc_sellingPrice3", "");
      }
    }

    // ── Expose validate() ─────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        validate: async () => {
          // Block if IMO is applicable but invalid
          if (imoApplicable && imoNumber && imoNumber.length !== 7) {
            setImoError("IMO must be exactly 7 digits");
            scrollToTopmost(["vesselNameImo"]);
            return false;
          }
          const result = await form.trigger();
          if (!result) {
            const errorKeys = Object.keys(form.formState.errors);
            scrollToTopmost(errorKeys);
            return false;
          }
          return true;
        },
      }),
      [form, imoApplicable, imoNumber],
    );

    return (
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>

          {/* ── Product count ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Products</label>
            <ProductCountSelector
              value={productCount}
              onChange={handleProductCountChange}
            />
          </div>

          {/* ── Transaction Date ──────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Transaction Date</FormLabel>
                <FormControl>
                  <DateField
                    name="date"
                    value={parseOrdinalDate(field.value ?? "")}
                    onChange={(iso) => field.onChange(isoToOrdinal(iso) || field.value)}
                    placeholder="Select date…"
                    hasError={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Vessel Name + IMO ─────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="vesselNameImo"
            render={({ field: _field }) => (
              <FormItem>
                <FormLabel>Vessel Name & IMO</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imoApplicable}
                        onChange={(e) => {
                          setImoApplicable(e.target.checked);
                          setImoError("");
                          updateVessel(vesselName, imoNumber, e.target.checked);
                        }}
                        className="h-4 w-4 rounded border-input cursor-pointer"
                      />
                      IMO Applicable
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Input
                        name="vesselNameImo"
                        value={vesselName}
                        placeholder="e.g. LE BELLOT"
                        className="min-h-[48px] text-base flex-1 min-w-[160px]"
                        onChange={(e) => {
                          setVesselName(e.target.value);
                          updateVessel(e.target.value, imoNumber, imoApplicable);
                        }}
                      />
                      {imoApplicable && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-sm text-muted-foreground shrink-0">(IMO</span>
                          <Input
                            value={imoNumber}
                            placeholder="7 digits"
                            maxLength={7}
                            className={`min-h-[48px] text-base flex-1 sm:w-28 sm:flex-none ${imoError ? "border-destructive" : ""}`}
                            onChange={(e) => handleImoChange(e.target.value)}
                          />
                          <span className="text-sm text-muted-foreground shrink-0">)</span>
                        </div>
                      )}
                    </div>
                    {imoError && <p className="text-xs text-destructive">{imoError}</p>}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Port ──────────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="port"
            render={({ field: _field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      name="port"
                      value={portName}
                      placeholder="Port name"
                      className="min-h-[48px] text-base flex-1"
                      onChange={(e) => {
                        setPortName(e.target.value);
                        updatePort(e.target.value, portCountry);
                      }}
                    />
                    <Input
                      value={portCountry}
                      placeholder="Country"
                      className="min-h-[48px] text-base flex-1"
                      onChange={(e) => {
                        setPortCountry(e.target.value);
                        updatePort(portName, e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── ETA ───────────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="eta"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>ETA</FormLabel>
                <FormControl>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <DateField
                        name="eta"
                        value={etaFrom}
                        onChange={(iso) => {
                          setEtaFrom(iso);
                          const formatted = formatEta(iso, etaTo);
                          field.onChange(formatted || iso);
                          updateEta(iso, etaTo);
                        }}
                        placeholder="From…"
                        hasError={!!fieldState.error}
                      />
                    </div>
                    <span className="hidden sm:inline text-muted-foreground text-sm shrink-0">–</span>
                    <div className="flex-1">
                      <DateField
                        value={etaTo}
                        min={etaFrom || undefined}
                        onChange={(iso) => {
                          setEtaTo(iso);
                          updateEta(etaFrom, iso);
                        }}
                        placeholder="To (opt.)"
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Product 1 ─────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {productCount === "1" ? "Product" : "Product 1"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. VLSFO 0.5%"
                    className="min-h-[48px] text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Quantity 1 ────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {productCount === "1" ? "Quantity" : "Quantity 1"}
                </FormLabel>
                <FormControl>
                  <QuantityInput
                    name="quantity"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    hasError={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Extra product rows ────────────────────────────────────── */}
          {(productCount === "2" || productCount === "3") && (
            <ExtraProductRow
              label="Product 2"
              productValue={store.product2}
              onProductChange={(v) => useFormStore.getState().setField("product2", v)}
              quantityValue={store.quantity2}
              onQuantityChange={(v) => useFormStore.getState().setField("quantity2", v)}
            />
          )}
          {productCount === "3" && (
            <ExtraProductRow
              label="Product 3"
              productValue={store.product3}
              onProductChange={(v) => useFormStore.getState().setField("product3", v)}
              quantityValue={store.quantity3}
              onQuantityChange={(v) => useFormStore.getState().setField("quantity3", v)}
            />
          )}

          {/* ── Delivery Mode ─────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="deliveryMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Mode</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. Ship-to-Ship"
                    className="min-h-[48px] text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Agents ────────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="agents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agents</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. Gulf Agency Company"
                    className="min-h-[48px] text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Physical Supplier ─────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="physicalSupplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Physical Supplier</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. ENOC"
                    className="min-h-[48px] text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Signatory ─────────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="signatory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signatory</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Sahir Jamal"
                    className="min-h-[48px] text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </form>
      </Form>
    );
  },
);

export { Step1TransactionDetails };
