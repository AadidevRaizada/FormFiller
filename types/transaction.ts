/**
 * TransactionRecord represents a complete transaction document
 * stored in the MongoDB `transactions` collection.
 */
export interface TransactionRecord {
  _id?: string;

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

  // Metadata
  createdAt: Date;
}
