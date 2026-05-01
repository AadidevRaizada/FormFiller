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
  FiActivity,
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

interface DayEntry { date: string; transactions: number; voiceSessions: number }

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

  // Logs modal
  const [logsEmail, setLogsEmail] = useState<string | null>(null);

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

      {/* Logs modal */}
      {logsEmail && (
        <UserLogsModal email={logsEmail} token={token!} onClose={() => setLogsEmail(null)} />
      )}

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
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Logs</th>
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
                      onViewLogs={() => setLogsEmail(u.email)}
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
  onViewLogs,
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
  onViewLogs: () => void;
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

      {/* Logs */}
      <td className="px-4 py-3.5 text-center">
        <button
          onClick={onViewLogs}
          title="View activity logs"
          className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <FiActivity className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

/* ── User Logs Modal ──────────────────────────────────────────────────────── */

function UserLogsModal({ email, token, onClose }: { email: string; token: string; onClose: () => void }) {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/user-logs?email=${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as { days: DayEntry[] };
          setDays(data.days);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [email, token]);

  const totalTx = days.reduce((s, d) => s + d.transactions, 0);
  const totalVs = days.reduce((s, d) => s + d.voiceSessions, 0);

  const recentActive = [...days]
    .filter(d => d.transactions > 0 || d.voiceSessions > 0)
    .reverse()
    .slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative bg-background rounded-xl border shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Activity Logs</h2>
            <p className="text-xs text-muted-foreground truncate max-w-xs">{email}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <FiLoader className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTx}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Transactions</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalVs}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Voice sessions</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{days.filter(d => d.transactions > 0 || d.voiceSessions > 0).length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active days</p>
                </div>
              </div>

              {/* Contribution grid */}
              <div className="overflow-x-auto">
                <AdminContribGrid days={days} />
              </div>

              {/* Recent list */}
              {recentActive.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-2.5 border-b bg-muted/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</p>
                  </div>
                  <ul>
                    {recentActive.map(d => (
                      <li key={d.date} className="flex items-center gap-4 px-4 py-2 border-b last:border-0 text-sm">
                        <span className="text-muted-foreground w-24 shrink-0 text-xs">{fmtDate(d.date)}</span>
                        <div className="flex gap-3">
                          {d.transactions > 0 && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                              {d.transactions} tx
                            </span>
                          )}
                          {d.voiceSessions > 0 && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                              {d.voiceSessions} voice
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No activity in the last 365 days.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminContribGrid({ days }: { days: DayEntry[] }) {
  const firstDate = new Date(days[0]?.date ?? new Date());
  const pad = firstDate.getDay();
  const cells: (DayEntry | null)[] = [...Array(pad).fill(null), ...days];
  const weeks: (DayEntry | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day, di) => {
            if (!day) return <div key={di} style={{ width: 11, height: 11 }} />;
            const total = day.transactions + day.voiceSessions;
            let bg = "bg-muted";
            if (total === 1) bg = "bg-blue-200 dark:bg-blue-900";
            else if (total <= 3) bg = "bg-blue-400 dark:bg-blue-700";
            else if (total <= 6) bg = "bg-blue-600 dark:bg-blue-500";
            else if (total > 6) bg = "bg-blue-800 dark:bg-blue-300";
            return (
              <div
                key={di}
                style={{ width: 11, height: 11 }}
                title={`${day.date}: ${day.transactions} tx, ${day.voiceSessions} voice`}
                className={`rounded-[2px] ${bg}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
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
