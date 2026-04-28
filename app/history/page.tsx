"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiRefreshCw,
  FiRepeat,
  FiLoader,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiX,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStore } from "@/lib/store";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
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

  // Search & filter state
  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Re-export dialog state
  const [reexportEntry, setReexportEntry] = useState<TransactionRecord | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  const setAllFields = useFormStore((s) => s.setAllFields);
  const setEditingTransactionId = useFormStore((s) => s.setEditingTransactionId);
  const { token } = useAuth();
  const router = useRouter();

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFilterOpen(false);
        setReexportEntry(null);
        setDeletingId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
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
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const matches =
          tx.vesselNameImo?.toLowerCase().includes(q) ||
          tx.port?.toLowerCase().includes(q) ||
          tx.oc_to?.toLowerCase().includes(q) ||
          tx.bn_to?.toLowerCase().includes(q) ||
          tx.product?.toLowerCase().includes(q) ||
          tx.date?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (dateFrom || dateTo) {
        const txDate = tx.date ? new Date(tx.date) : null;
        if (!txDate) return false;
        if (dateFrom && txDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (txDate > to) return false;
        }
      }

      return true;
    });
  }, [transactions, searchText, dateFrom, dateTo]);

  const hasDateFilter = dateFrom !== "" || dateTo !== "";
  const hasAnyFilter = searchText !== "" || hasDateFilter;

  const clearDateFilter = () => { setDateFrom(""); setDateTo(""); };
  const clearAll = () => { setSearchText(""); setDateFrom(""); setDateTo(""); };

  // ── Delete handlers ────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!deletingId) return;
    setDeleteInProgress(true);
    try {
      const res = await fetch(`/api/transactions/${deletingId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to delete");
      setTransactions((prev) => prev.filter((tx) => tx._id !== deletingId));
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    } finally {
      setDeleteInProgress(false);
      setDeletingId(null);
    }
  }

  // ── Re-export handlers ─────────────────────────────────────────────────────
  function populateStore(tx: TransactionRecord) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _unusedId, createdAt: _unusedDate, ...formData } = tx;
    setAllFields(formData);
  }

  function handleReexportAsIs(tx: TransactionRecord) {
    populateStore(tx);
    if (tx._id) setEditingTransactionId(tx._id);
    setReexportEntry(null);
    router.push("/form?step=4");
  }

  function handleReexportWithChanges(tx: TransactionRecord) {
    populateStore(tx);
    if (tx._id) setEditingTransactionId(tx._id);
    setReexportEntry(null);
    router.push("/form?step=1");
  }

  // ── Search bar ─────────────────────────────────────────────────────────────
  const SearchBar = (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by vessel, port, buyer, supplier…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 pr-9 min-h-[44px]"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative" ref={filterRef}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterOpen((o) => !o)}
            aria-label="Open filters"
            aria-expanded={filterOpen}
            className={`min-h-[44px] min-w-[44px] relative ${hasDateFilter ? "border-primary text-primary" : ""}`}
          >
            <FiFilter className="h-4 w-4" />
            {hasDateFilter && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>

          {filterOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-lg border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-sm font-medium">Filters</span>
                {hasDateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div>
                <button
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                  onClick={() => setDateExpanded((d) => !d)}
                >
                  <span className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 text-muted-foreground" />
                    Date
                    {hasDateFilter && <FiCheck className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  <span className="text-muted-foreground text-xs">{dateExpanded ? "▲" : "▼"}</span>
                </button>

                {dateExpanded && (
                  <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        max={dateTo || undefined}
                        className="min-h-[40px] text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom || undefined}
                        className="min-h-[40px] text-sm"
                      />
                    </div>
                    {hasDateFilter && (
                      <button
                        onClick={clearDateFilter}
                        className="text-xs text-muted-foreground hover:text-foreground self-start transition-colors"
                      >
                        Clear dates
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2">
          {hasDateFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <FiCalendar className="h-3 w-3" />
              {dateFrom && dateTo
                ? `${dateFrom} → ${dateTo}`
                : dateFrom
                ? `From ${dateFrom}`
                : `Until ${dateTo}`}
              <button onClick={clearDateFilter} aria-label="Remove date filter" className="ml-0.5 hover:text-primary/70 transition-colors">
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredTransactions.length} of {transactions.length} result{transactions.length !== 1 ? "s" : ""}
          </span>
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
            Clear all
          </button>
        </div>
      )}
    </div>
  );

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

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      {SearchBar}

      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">No transactions match your search.</p>
          <Button variant="ghost" size="sm" onClick={clearAll} className="mt-3 min-h-[44px]">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((tx, idx) => (
            <Card key={tx._id ?? idx}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">{tx.vesselNameImo}</CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[48px] w-full sm:w-auto"
                      onClick={() => setReexportEntry(tx)}
                    >
                      <FiRepeat className="mr-1.5 h-4 w-4" />
                      Re-export
                    </Button>
                    {deletingId === tx._id ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <span className="self-center text-sm text-muted-foreground whitespace-nowrap">Delete this entry?</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[48px] flex-1 sm:flex-none"
                            onClick={() => setDeletingId(null)}
                            disabled={deleteInProgress}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="min-h-[48px] flex-1 sm:flex-none"
                            onClick={handleDeleteConfirm}
                            disabled={deleteInProgress}
                          >
                            {deleteInProgress ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[48px] w-full sm:w-auto text-destructive hover:text-destructive hover:border-destructive"
                        onClick={() => setDeletingId(tx._id ?? null)}
                      >
                        <FiTrash2 className="mr-1.5 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
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
      )}

      {/* Re-export dialog */}
      {reexportEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setReexportEntry(null); }}
        >
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Re-export this entry?</CardTitle>
              <p className="text-sm text-muted-foreground">{reexportEntry.vesselNameImo}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                className="w-full min-h-[48px]"
                onClick={() => handleReexportAsIs(reexportEntry)}
              >
                Re-export as-is
              </Button>
              <Button
                variant="outline"
                className="w-full min-h-[48px]"
                onClick={() => handleReexportWithChanges(reexportEntry)}
              >
                Make changes first
              </Button>
              <Button
                variant="ghost"
                className="w-full min-h-[44px]"
                onClick={() => setReexportEntry(null)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
