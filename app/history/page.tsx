"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiRefreshCw, FiRepeat, FiLoader, FiAlertCircle } from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFormStore } from "@/lib/store";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import type { TransactionRecord } from "@/types/transaction";

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryContent />
    </AuthGuard>
  );
}

function HistoryContent() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setAllFields = useFormStore((s) => s.setAllFields);
  const { token } = useAuth();
  const router = useRouter();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data: TransactionRecord[] = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleReExport = (tx: TransactionRecord) => {
    // Populate the Zustand store with transaction data, excluding _id and createdAt
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _unusedId, createdAt: _unusedDate, ...formData } = tx;
    setAllFields(formData);
    // Navigate to form at Step 4
    router.push("/form?step=4");
  };

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FiLoader className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading transactions…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FiAlertCircle className="h-8 w-8 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={fetchTransactions} className="min-h-[48px]">
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">No transactions yet</p>
        </div>
      </div>
    );
  }

  // Transaction list
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      <div className="flex flex-col gap-3">
        {transactions.map((tx, idx) => (
          <Card key={tx._id ?? idx}>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base">
                  {tx.vesselNameImo}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[48px] w-full md:w-auto"
                  onClick={() => handleReExport(tx)}
                >
                  <FiRepeat className="mr-1.5 h-4 w-4" />
                  Re-export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Port</span>
                  <p className="font-medium">{tx.port}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{tx.date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Buyer</span>
                  <p className="font-medium">{tx.oc_to}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Supplier</span>
                  <p className="font-medium">{tx.bn_to}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
