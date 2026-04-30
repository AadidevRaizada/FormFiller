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

  // Step 1 — Multi-product
  productCount: "1",
  product2: "",
  quantity2: "",
  product3: "",
  quantity3: "",

  // Step 2 — Bunker Nomination
  bn_to: "",
  bn_attn: "",
  bn_sellers: "",
  bn_suppliers: "",
  bn_buyingPrice: "",
  bn_paymentTerms: "",
  bn_remarks: "",

  // Step 2 — Multi-product buying prices
  bn_buyingPrice2: "",
  bn_buyingPrice3: "",

  // Step 3 — Order Confirmation
  oc_to: "",
  oc_attn: "",
  oc_buyers: "",
  oc_sellingPrice: "",
  oc_paymentTerms: "",
  oc_remarks: "",

  // Step 3 — Multi-product selling prices
  oc_sellingPrice2: "",
  oc_sellingPrice3: "",
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

  // Step 1 — Multi-product
  productCount: string;
  product2: string;
  quantity2: string;
  product3: string;
  quantity3: string;

  // Step 2 — Bunker Nomination
  bn_to: string;
  bn_attn: string;
  bn_sellers: string;
  bn_suppliers: string;
  bn_buyingPrice: string;
  bn_paymentTerms: string;
  bn_remarks: string;

  // Step 2 — Multi-product buying prices
  bn_buyingPrice2: string;
  bn_buyingPrice3: string;

  // Step 3 — Order Confirmation
  oc_to: string;
  oc_attn: string;
  oc_buyers: string;
  oc_sellingPrice: string;
  oc_paymentTerms: string;
  oc_remarks: string;

  // Step 3 — Multi-product selling prices
  oc_sellingPrice2: string;
  oc_sellingPrice3: string;

  // Editing context (not persisted — resets on page reload)
  editingTransactionId: string | null;

  // Actions
  setField: (field: FormFieldKey, value: string) => void;
  setAllFields: (data: Partial<Record<FormFieldKey, string>>) => void;
  setEditingTransactionId: (id: string | null) => void;
  resetForm: () => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...initialFields,
      editingTransactionId: null,

      setField: (field, value) => set({ [field]: value }),

      setAllFields: (data) => set((state) => ({ ...state, ...data })),

      setEditingTransactionId: (id) => set({ editingTransactionId: id }),

      resetForm: () => set(initialFields),
    }),
    {
      name: "asean-form-store",
      partialize: (state) => {
        // Exclude editingTransactionId and actions from persistence
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { editingTransactionId, setField, setAllFields, setEditingTransactionId, resetForm, ...persisted } = state;
        return persisted;
      },
    },
  ),
);
