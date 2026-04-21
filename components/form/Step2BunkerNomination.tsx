"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
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

/** Input type for the form — uses z.input so optional fields are `string | undefined`. */
type Step2Input = z.input<typeof step2Schema>;

/** Field definitions for Step 2 in display order. */
const STEP2_FIELDS: {
  name: keyof Step2Input;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  { name: "bn_to", label: "To", placeholder: "e.g. Vitol Asia Pte Ltd" },
  { name: "bn_attn", label: "Attn", placeholder: "e.g. John Smith" },
  { name: "bn_sellers", label: "Sellers", placeholder: "e.g. Vitol Asia Pte Ltd" },
  { name: "bn_suppliers", label: "Suppliers", placeholder: "e.g. ENOC" },
  { name: "bn_buyingPrice", label: "Buying Price", placeholder: "e.g. USD 550.00 PMT" },
  { name: "bn_paymentTerms", label: "Supplier Payment Terms", placeholder: "e.g. 30 days after BDN date" },
  { name: "bn_remarks", label: "Supplier Remarks", placeholder: "Enter any additional remarks…", multiline: true },
];

const Step2BunkerNomination = forwardRef<StepRef>(
  function Step2BunkerNomination(_props, ref) {
    const store = useFormStore();

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
          {STEP2_FIELDS.map((fieldDef) => (
            <FormField
              key={fieldDef.name}
              control={form.control}
              name={fieldDef.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fieldDef.label}</FormLabel>
                  <FormControl>
                    {fieldDef.multiline ? (
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder={fieldDef.placeholder}
                        className="min-h-[48px] text-base"
                      />
                    ) : (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder={fieldDef.placeholder}
                        className="min-h-[48px] text-base"
                      />
                    )}
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

export { Step2BunkerNomination };
