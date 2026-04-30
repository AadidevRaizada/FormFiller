import { z } from "zod";

// Step 1 — Transaction Details
export const step1Schema = z.object({
  date: z.string().min(1, "Date is required"),
  vesselNameImo: z.string().min(1, "Vessel name is required"),
  port: z
    .string()
    .min(1, "Port is required")
    .refine((v) => v.includes(","), "Both port name and country are required"),
  eta: z.string().min(1, "ETA is required"),
  product: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
  deliveryMode: z.string().min(1, "Delivery Mode is required"),
  agents: z.string().min(1, "Agents is required"),
  physicalSupplier: z.string().min(1, "Physical Supplier is required"),
  signatory: z.string().optional().default("Sahir Jamal"),
});

// Step 2 — Bunker Nomination (all fields optional)
export const step2Schema = z.object({
  bn_to: z.string().optional(),
  bn_attn: z.string().optional(),
  bn_sellers: z.string().optional(),
  bn_suppliers: z.string().optional(),
  bn_buyingPrice: z.string().optional(),
  bn_paymentTerms: z.string().optional(),
  bn_remarks: z.string().optional(),
});

// Step 3 — Order Confirmation (all fields optional)
export const step3Schema = z.object({
  oc_to: z.string().optional(),
  oc_attn: z.string().optional(),
  oc_buyers: z.string().optional(),
  oc_sellingPrice: z.string().optional(),
  oc_paymentTerms: z.string().optional(),
  oc_remarks: z.string().optional(),
});

// Step 4 has no validation — it's read-only

// Inferred types for use with React Hook Form
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
