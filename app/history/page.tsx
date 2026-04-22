"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiRefreshCw, FiRepeat, FiLoader, FiAlertCircle, FiSearch, FiX } from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // tx.date is stored as a string like "YYYY-MM-DD" or similar
      const txDate = tx.date ? new Date(tx.date) : null;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!txDate || txDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        // include the full end day
        to.setHours(23, 59, 59, 999);
        if (!txDate || txDate > to) return false;
      }
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  const hasActiveFilter = dateFrom !== "" || dateTo !== "";

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

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

      {/* Filter bar */}
      <div className="mb-6 rounded-lg border border-input bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <FiSearch className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by date</span>
          </div>
          <div className="flex flex-col gap-3 flex-1 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="min-h-[44px]"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="min-h-[44px]"
              />
            </div>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="min-h-[44px] gap-1.5 text-muted-foreground hover:text-foreground sm:self-end"
              >
                <FiX className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
        {hasActiveFilter && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Empty filtered state */}
      {filteredTransactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">No transactions match the selected date range.</p>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 min-h-[44px]">
            Clear filters
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filteredTransactions.map((tx, idx) => (
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
