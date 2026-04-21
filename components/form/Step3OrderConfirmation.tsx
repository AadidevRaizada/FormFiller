"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
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

/** Input type for the form — uses z.input so optional fields are `string | undefined`. */
type Step3Input = z.input<typeof step3Schema>;

/** Field definitions for Step 3 in display order. */
const STEP3_FIELDS: {
  name: keyof Step3Input;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  { name: "oc_to", label: "To", placeholder: "e.g. Marine Fuel Corp" },
  { name: "oc_attn", label: "Attn", placeholder: "e.g. Jane Doe" },
  { name: "oc_buyers", label: "Buyers", placeholder: "e.g. Marine Fuel Corp" },
  { name: "oc_sellingPrice", label: "Selling Price", placeholder: "e.g. USD 600.00 PMT" },
  { name: "oc_paymentTerms", label: "Buyer Payment Terms", placeholder: "e.g. 30 days after BDN date" },
  { name: "oc_remarks", label: "Buyer Remarks", placeholder: "Enter any additional remarks…", multiline: true },
];

const Step3OrderConfirmation = forwardRef<StepRef>(
  function Step3OrderConfirmation(_props, ref) {
    const store = useFormStore();

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
          {STEP3_FIELDS.map((fieldDef) => (
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

export { Step3OrderConfirmation };
