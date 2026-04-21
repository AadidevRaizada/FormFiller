"use client";

import { useState } from "react";
import { useFormStore, type FormFieldKey } from "@/lib/store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiFileText, FiFile, FiGrid } from "react-icons/fi";
import { generateExcel } from "@/lib/excel";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Field row helper                                                          */
/* -------------------------------------------------------------------------- */

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-border/40 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground break-words">
        {value || "—"}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper: extract plain form data (no actions) from the store               */
/* -------------------------------------------------------------------------- */

const formFieldKeys: FormFieldKey[] = [
  "date",
  "vesselNameImo",
  "port",
  "eta",
  "product",
  "quantity",
  "deliveryMode",
  "agents",
  "physicalSupplier",
  "signatory",
  "bn_to",
  "bn_attn",
  "bn_sellers",
  "bn_suppliers",
  "bn_buyingPrice",
  "bn_paymentTerms",
  "bn_remarks",
  "oc_to",
  "oc_attn",
  "oc_buyers",
  "oc_sellingPrice",
  "oc_paymentTerms",
  "oc_remarks",
];

/* -------------------------------------------------------------------------- */
/*  Step4ReviewExport                                                         */
/* -------------------------------------------------------------------------- */

export function Step4ReviewExport() {
  const store = useFormStore();
  const { token } = useAuth();

  const [loadingBnPdf, setLoadingBnPdf] = useState(false);
  const [loadingOcPdf, setLoadingOcPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  /** Build a plain data object from the store (excludes actions). */
  function getFormData(): Record<FormFieldKey, string> {
    const data = {} as Record<FormFieldKey, string>;
    for (const key of formFieldKeys) {
      data[key] = store[key];
    }
    return data;
  }

  /** Download a PDF by POSTing to /api/generate-pdf. */
  async function handleDownloadPdf(type: "bn" | "oc") {
    const setLoading = type === "bn" ? setLoadingBnPdf : setLoadingOcPdf;
    setLoading(true);
    try {
      const data = getFormData();
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || "Failed to generate PDF"
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition header or use a default
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      a.download =
        filenameMatch?.[1] ||
        (type === "bn"
          ? "BunkerNomination.pdf"
          : "OrderConfirmation.pdf");

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        type === "bn"
          ? "Bunker Nomination PDF downloaded"
          : "Order Confirmation PDF downloaded"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate PDF"
      );
    } finally {
      setLoading(false);
    }
  }

  /** Download Excel export. */
  async function handleDownloadExcel() {
    setLoadingExcel(true);
    try {
      const data = getFormData();
      await generateExcel(data);
      toast.success("Excel file downloaded");
    } catch {
      toast.error("Failed to generate Excel file");
    } finally {
      setLoadingExcel(false);
    }
  }

  const anyLoading = loadingBnPdf || loadingOcPdf || loadingExcel;

  return (
    <div className="space-y-6">
      {/* Summary cards — side-by-side at md+, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bunker Nomination Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Bunker Nomination Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <FieldRow label="Date" value={store.date} />
              <FieldRow label="Vessel" value={store.vesselNameImo} />
              <FieldRow label="Port" value={store.port} />
              <FieldRow label="ETA" value={store.eta} />
              <FieldRow label="Product" value={store.product} />
              <FieldRow label="Quantity" value={store.quantity} />
              <FieldRow label="Delivery Mode" value={store.deliveryMode} />
              <FieldRow label="Agents" value={store.agents} />
              <FieldRow label="Physical Supplier" value={store.physicalSupplier} />
              <FieldRow label="Signatory" value={store.signatory || "Sahir Jamal"} />
              <FieldRow label="To" value={store.bn_to} />
              <FieldRow label="Attn" value={store.bn_attn} />
              <FieldRow label="Sellers" value={store.bn_sellers} />
              <FieldRow label="Suppliers" value={store.bn_suppliers} />
              <FieldRow label="Buying Price" value={store.bn_buyingPrice} />
              <FieldRow label="Payment Terms" value={store.bn_paymentTerms} />
              <FieldRow label="Remarks" value={store.bn_remarks} />
            </div>
          </CardContent>
        </Card>

        {/* Order Confirmation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Confirmation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <FieldRow label="Date" value={store.date} />
              <FieldRow label="Vessel" value={store.vesselNameImo} />
              <FieldRow label="Port" value={store.port} />
              <FieldRow label="ETA" value={store.eta} />
              <FieldRow label="Product" value={store.product} />
              <FieldRow label="Quantity" value={store.quantity} />
              <FieldRow label="Delivery Mode" value={store.deliveryMode} />
              <FieldRow label="Agents" value={store.agents} />
              <FieldRow label="Physical Supplier" value={store.physicalSupplier} />
              <FieldRow label="Signatory" value={store.signatory || "Sahir Jamal"} />
              <FieldRow label="To" value={store.oc_to} />
              <FieldRow label="Attn" value={store.oc_attn} />
              <FieldRow label="Buyers" value={store.oc_buyers} />
              <FieldRow label="Selling Price" value={store.oc_sellingPrice} />
              <FieldRow label="Payment Terms" value={store.oc_paymentTerms} />
              <FieldRow label="Remarks" value={store.oc_remarks} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons — horizontal row at md+, stacked full-width on mobile */}
      <div className="flex flex-col gap-2 md:flex-row md:gap-3">
        <Button
          className="w-full min-h-[48px] md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
          disabled={anyLoading}
          onClick={() => handleDownloadPdf("bn")}
        >
          {loadingBnPdf ? (
            <span className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FiFileText className="mr-1.5 h-4 w-4" />
          )}
          Download BN PDF
        </Button>
        <Button
          className="w-full min-h-[48px] md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          disabled={anyLoading}
          onClick={() => handleDownloadPdf("oc")}
        >
          {loadingOcPdf ? (
            <span className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FiFile className="mr-1.5 h-4 w-4" />
          )}
          Download OC PDF
        </Button>
        <Button
          className="w-full min-h-[48px] md:w-auto bg-green-600 hover:bg-green-700 text-white"
          disabled={anyLoading}
          onClick={handleDownloadExcel}
        >
          {loadingExcel ? (
            <span className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FiGrid className="mr-1.5 h-4 w-4" />
          )}
          Download Excel
        </Button>
      </div>
    </div>
  );
}
