"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
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

/** Input type for the form — uses z.input so optional fields are `string | undefined`. */
type Step1Input = z.input<typeof step1Schema>;

/** Field definitions for Step 1 in display order. */
const STEP1_FIELDS: {
  name: keyof Step1Input;
  label: string;
  placeholder: string;
}[] = [
  { name: "date", label: "Date", placeholder: "e.g. 15 January 2025" },
  { name: "vesselNameImo", label: "Vessel Name & IMO", placeholder: "e.g. MT Ocean Star / 1234567" },
  { name: "port", label: "Port", placeholder: "e.g. Fujairah" },
  { name: "eta", label: "ETA", placeholder: "e.g. 20 January 2025" },
  { name: "product", label: "Product", placeholder: "e.g. VLSFO 0.5%" },
  { name: "quantity", label: "Quantity", placeholder: "e.g. 500 MT" },
  { name: "deliveryMode", label: "Delivery Mode", placeholder: "e.g. Ship-to-Ship" },
  { name: "agents", label: "Agents", placeholder: "e.g. Gulf Agency Company" },
  { name: "physicalSupplier", label: "Physical Supplier", placeholder: "e.g. ENOC" },
  { name: "signatory", label: "Signatory", placeholder: "Sahir Jamal" },
];

const Step1TransactionDetails = forwardRef<StepRef>(
  function Step1TransactionDetails(_props, ref) {
    const store = useFormStore();

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

    // Sync every field change back to the Zustand store
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

    // Expose validate() to FormShell via ref
    useImperativeHandle(
      ref,
      () => ({
        validate: async () => {
          const result = await form.trigger();
          if (!result) {
            // Scroll to the first error field
            const firstErrorKey = Object.keys(form.formState.errors)[0];
            if (firstErrorKey) {
              const el = document.querySelector(`[name="${firstErrorKey}"]`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                (el as HTMLElement).focus();
              }
            }
            return false;
          }
          return true;
        },
      }),
      [form],
    );

    return (
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          {STEP1_FIELDS.map((fieldDef) => (
            <FormField
              key={fieldDef.name}
              control={form.control}
              name={fieldDef.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fieldDef.label}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={fieldDef.placeholder}
                      className="min-h-[48px] text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </form>
      </Form>
    );
  },
);

export { Step1TransactionDetails };
