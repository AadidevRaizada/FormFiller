"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiFileText,
  FiMic,
  FiRefreshCw,
  FiAlertCircle,
  FiLoader,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface UserRow {
  email: string;
  createdAt: string | null;
  transactionCount: number;
  voiceSessionCount: number;
  lastActivity: string | null;
  lastPayment: string;
}

interface StatsData {
  totalUsers: number;
  totalTransactions: number;
  totalVoiceSessions: number;
  users: UserRow[];
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/* ── Page shell ───────────────────────────────────────────────────────────── */

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminContent />
    </AuthGuard>
  );
}

/* ── Main content ─────────────────────────────────────────────────────────── */

function AdminContent() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Per-row last payment saving state
  const [savingPayment, setSavingPayment] = useState<string | null>(null);

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token],
  );

  /* ── Fetch stats ──────────────────────────────────────────────────────── */

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) { setError("forbidden"); return; }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: res.statusText }))) as { error: string };
        throw new Error(body.error);
      }
      setData(await res.json() as StatsData);
    } catch (err) {
      if ((err as { message?: string }).message !== "forbidden")
        setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchStats(); }, [token, fetchStats]);

  /* ── Delete user ──────────────────────────────────────────────────────── */

  async function handleDelete(email: string) {
    setDeletingEmail(email);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: authHeader(),
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: "Delete failed" }))) as { error: string };
        throw new Error(body.error);
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              totalUsers: prev.totalUsers - 1,
              users: prev.users.filter((u) => u.email !== email),
            }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingEmail(null);
      setConfirmDelete(null);
    }
  }

  /* ── Save last payment ────────────────────────────────────────────────── */

  async function handleSavePayment(email: string, value: string) {
    setSavingPayment(email);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ email, lastPayment: value }),
      });
      // Update local state
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) =>
                u.email === email ? { ...u, lastPayment: value } : u,
              ),
            }
          : prev,
      );
    } finally {
      setSavingPayment(null);
    }
  }

  /* ── States ───────────────────────────────────────────────────────────── */

  if (!loading && error === "forbidden") {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-16 flex flex-col items-center gap-4 text-center">
        <FiAlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">This page is restricted to the admin account.</p>
        <Button variant="outline" onClick={() => router.push("/history")}>Go to History</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-16 flex flex-col items-center gap-3 text-muted-foreground">
        <FiLoader className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading admin stats…</p>
      </div>
    );
  }

  if (error && error !== "forbidden") {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-16 flex flex-col items-center gap-4">
        <FiAlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchStats}>
          <FiRefreshCw className="mr-2 h-4 w-4" />Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  /* ── Dashboard ────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Signed in as {user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="min-h-[40px]">
          <FiRefreshCw className="mr-2 h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard icon={<FiUsers className="h-6 w-6 text-primary" />} bg="bg-primary/10" value={data.totalUsers} label="Total users" />
        <StatCard icon={<FiFileText className="h-6 w-6 text-blue-500" />} bg="bg-blue-500/10" value={data.totalTransactions} label="Total transactions" />
        <StatCard icon={<FiMic className="h-6 w-6 text-green-500" />} bg="bg-green-500/10" value={data.totalVoiceSessions} label="Voice sessions" />
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            {data.totalUsers} registered account{data.totalUsers !== 1 ? "s" : ""} — click Last Payment to edit
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.users.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Joined</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Transactions</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Voice</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Last active</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Last payment</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u, i) => (
                    <UserTableRow
                      key={u.email}
                      user={u}
                      striped={i % 2 !== 0}
                      confirmingDelete={confirmDelete === u.email}
                      deleting={deletingEmail === u.email}
                      savingPayment={savingPayment === u.email}
                      onRequestDelete={() => setConfirmDelete(u.email)}
                      onCancelDelete={() => setConfirmDelete(null)}
                      onConfirmDelete={() => handleDelete(u.email)}
                      onSavePayment={(v) => handleSavePayment(u.email, v)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────────── */

function StatCard({
  icon,
  bg,
  value,
  label,
}: {
  icon: React.ReactNode;
  bg: string;
  value: number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bg}`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── User table row ───────────────────────────────────────────────────────── */

function UserTableRow({
  user,
  striped,
  confirmingDelete,
  deleting,
  savingPayment,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onSavePayment,
}: {
  user: UserRow;
  striped: boolean;
  confirmingDelete: boolean;
  deleting: boolean;
  savingPayment: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onSavePayment: (v: string) => void;
}) {
  const [paymentDraft, setPaymentDraft] = useState(user.lastPayment ?? "");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync if parent refreshes
  useEffect(() => {
    if (!editing) setPaymentDraft(user.lastPayment ?? "");
  }, [user.lastPayment, editing]);

  function handlePaymentBlur() {
    setEditing(false);
    if (paymentDraft !== (user.lastPayment ?? "")) {
      onSavePayment(paymentDraft);
    }
  }

  function handlePaymentKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.currentTarget.blur(); }
    if (e.key === "Escape") { setPaymentDraft(user.lastPayment ?? ""); setEditing(false); }
  }

  return (
    <tr className={`border-b last:border-0 ${striped ? "bg-muted/20" : ""}`}>
      {/* Email */}
      <td className="px-6 py-3.5 font-medium">{user.email}</td>

      {/* Joined */}
      <td className="px-4 py-3.5 text-right text-muted-foreground whitespace-nowrap">
        {fmt(user.createdAt)}
      </td>

      {/* Transactions */}
      <td className="px-4 py-3.5 text-right">
        <Badge value={user.transactionCount} color="blue" />
      </td>

      {/* Voice */}
      <td className="px-4 py-3.5 text-right">
        <Badge value={user.voiceSessionCount} color="green" />
      </td>

      {/* Last active */}
      <td className="px-4 py-3.5 text-right text-muted-foreground whitespace-nowrap">
        {fmtRelative(user.lastActivity)}
      </td>

      {/* Last payment — inline editable */}
      <td className="px-4 py-3.5">
        <div className="relative flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={paymentDraft}
            placeholder="Click to add…"
            onFocus={() => setEditing(true)}
            onBlur={handlePaymentBlur}
            onChange={(e) => setPaymentDraft(e.target.value)}
            onKeyDown={handlePaymentKeyDown}
            className={`w-full min-w-[130px] rounded border bg-transparent px-2 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 ${
              editing
                ? "border-ring ring-1 ring-ring"
                : "border-transparent hover:border-input cursor-pointer"
            }`}
          />
          {savingPayment && (
            <FiLoader className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
          )}
          {!savingPayment && paymentDraft && (
            <FiCheck className="h-3 w-3 shrink-0 text-green-500 opacity-0 group-focus-within:opacity-100" />
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-center">
        {confirmingDelete ? (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Sure?</span>
            <button
              onClick={onConfirmDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? (
                <FiLoader className="h-3 w-3 animate-spin" />
              ) : (
                <FiTrash2 className="h-3 w-3" />
              )}
              Delete
            </button>
            <button
              onClick={onCancelDelete}
              className="rounded border border-input px-2 py-1 text-xs hover:bg-muted"
            >
              <FiX className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestDelete}
            title="Delete user"
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────────── */

function Badge({ value, color }: { value: number; color: "blue" | "green" }) {
  const styles =
    color === "blue"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  return (
    <span
      className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
        value > 0 ? styles : "bg-muted text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}
