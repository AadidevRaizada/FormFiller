import { z } from "zod";

// Step 1 — Transaction Details
export const step1Schema = z.object({
  date: z.string().min(1, "Date is required"),
  vesselNameImo: z.string().min(1, "Vessel Name & IMO is required"),
  port: z.string().min(1, "Port is required"),
  eta: z.string().min(1, "ETA is required"),
  product: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
  deliveryMode: z.string().min(1, "Delivery Mode is required"),
  agents: z.string().min(1, "Agents is required"),
  physicalSupplier: z.string().min(1, "Physical Supplier is required"),
  signatory: z.string().optional().default("Sahir Jamal"),
});

// Step 2 — Bunker Nomination
export const step2Schema = z.object({
  bn_to: z.string().min(1, "To is required"),
  bn_attn: z.string().min(1, "Attn is required"),
  bn_sellers: z.string().min(1, "Sellers is required"),
  bn_suppliers: z.string().optional(),
  bn_buyingPrice: z.string().min(1, "Buying Price is required"),
  bn_paymentTerms: z.string().optional(),
  bn_remarks: z.string().optional(),
});

// Step 3 — Order Confirmation
export const step3Schema = z.object({
  oc_to: z.string().min(1, "To is required"),
  oc_attn: z.string().min(1, "Attn is required"),
  oc_buyers: z.string().min(1, "Buyers is required"),
  oc_sellingPrice: z.string().min(1, "Selling Price is required"),
  oc_paymentTerms: z.string().optional(),
  oc_remarks: z.string().optional(),
});

// Step 4 has no validation — it's read-only

// Inferred types for use with React Hook Form
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
