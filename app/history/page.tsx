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
} from "react-icons/fi";
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

  // Search & filter state
  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);

  const setAllFields = useFormStore((s) => s.setAllFields);
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
      if (e.key === "Escape") setFilterOpen(false);
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
      // Text search across key fields
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

      // Date range filter
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

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  const clearAll = () => {
    setSearchText("");
    setDateFrom("");
    setDateTo("");
  };

  const handleReExport = (tx: TransactionRecord) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _unusedId, createdAt: _unusedDate, ...formData } = tx;
    setAllFields(formData);
    router.push("/form?step=4");
  };

  // ── Shared header (search bar) ─────────────────────────────────────────────
  const SearchBar = (
    <div className="mb-6 flex flex-col gap-3">
      {/* Input row */}
      <div className="flex gap-2">
        {/* Text search */}
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

        {/* Filter button + dropdown */}
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

          {/* Dropdown panel */}
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

              {/* Date filter option */}
              <div>
                <button
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                  onClick={() => setDateExpanded((d) => !d)}
                >
                  <span className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 text-muted-foreground" />
                    Date
                    {hasDateFilter && (
                      <FiCheck className="h-3.5 w-3.5 text-primary" />
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {dateExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {dateExpanded && (
                  <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                        From
                      </Label>
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
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                        To
                      </Label>
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

      {/* Active filter chips */}
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
              <button
                onClick={clearDateFilter}
                aria-label="Remove date filter"
                className="ml-0.5 hover:text-primary/70 transition-colors"
              >
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredTransactions.length} of {transactions.length} result
            {transactions.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Error ──────────────────────────────────────────────────────────────────
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

  // ── Empty (no transactions at all) ────────────────────────────────────────
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

  // ── Transaction list ───────────────────────────────────────────────────────
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
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-base">{tx.vesselNameImo}</CardTitle>
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
      )}
    </div>
  );
}
