/**
 * A snapshot of form data captured at the time of a version save.
 * Excludes MongoDB/server metadata.
 */
export interface TransactionVersion {
  versionNumber: number;
  savedAt: Date;
  snapshot: Omit<TransactionRecord, "_id" | "versions" | "createdAt" | "updatedAt" | "userEmail">;
}

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

  // Step 1 — Multi-product
  productCount?: string;
  product2?: string;
  quantity2?: string;
  product3?: string;
  quantity3?: string;

  // Step 2 — Bunker Nomination
  bn_to: string;
  bn_attn: string;
  bn_sellers: string;
  bn_suppliers: string;
  bn_buyingPrice: string;
  bn_paymentTerms: string;
  bn_remarks: string;

  // Step 2 — Multi-product buying prices
  bn_buyingPrice2?: string;
  bn_buyingPrice3?: string;

  // Step 3 — Order Confirmation
  oc_to: string;
  oc_attn: string;
  oc_buyers: string;
  oc_sellingPrice: string;
  oc_paymentTerms: string;
  oc_remarks: string;

  // Step 3 — Multi-product selling prices
  oc_sellingPrice2?: string;
  oc_sellingPrice3?: string;

  // Version history
  versionNumber?: number;
  versions?: TransactionVersion[];

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}
