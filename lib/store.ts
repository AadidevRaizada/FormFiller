import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Initial (empty) values for every form field. */
const initialFields = {
  // Step 1 — Transaction Details
  date: "",
  vesselNameImo: "",
  port: "",
  eta: "",
  product: "",
  quantity: "",
  deliveryMode: "",
  agents: "",
  physicalSupplier: "",
  signatory: "",

  // Step 2 — Bunker Nomination
  bn_to: "",
  bn_attn: "",
  bn_sellers: "",
  bn_suppliers: "",
  bn_buyingPrice: "",
  bn_paymentTerms: "",
  bn_remarks: "",

  // Step 3 — Order Confirmation
  oc_to: "",
  oc_attn: "",
  oc_buyers: "",
  oc_sellingPrice: "",
  oc_paymentTerms: "",
  oc_remarks: "",
} as const;

/** The keys that represent form data (excludes actions). */
export type FormFieldKey = keyof typeof initialFields;

export interface FormState {
  // Step 1 — Transaction Details
  date: string;
  vesselNameImo: string;
  port: string;
  eta: string;
  product: string;
  quantity: string;
  deliveryMode: string;
  agents: string;
  physicalSupplier: string;
  signatory: string;

  // Step 2 — Bunker Nomination
  bn_to: string;
  bn_attn: string;
  bn_sellers: string;
  bn_suppliers: string;
  bn_buyingPrice: string;
  bn_paymentTerms: string;
  bn_remarks: string;

  // Step 3 — Order Confirmation
  oc_to: string;
  oc_attn: string;
  oc_buyers: string;
  oc_sellingPrice: string;
  oc_paymentTerms: string;
  oc_remarks: string;

  // Actions
  setField: (field: FormFieldKey, value: string) => void;
  setAllFields: (data: Partial<Record<FormFieldKey, string>>) => void;
  resetForm: () => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...initialFields,

      setField: (field, value) => set({ [field]: value }),

      setAllFields: (data) => set((state) => ({ ...state, ...data })),

      resetForm: () => set(initialFields),
    }),
    {
      name: "asean-form-store",
    },
  ),
);
