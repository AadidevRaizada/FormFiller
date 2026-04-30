"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiFileText,
  FiMic,
  FiRefreshCw,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError("forbidden");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: res.statusText }))) as {
          error: string;
        };
        throw new Error(body.error);
      }
      const json = (await res.json()) as StatsData;
      setData(json);
    } catch (err) {
      if ((err as { message?: string }).message !== "forbidden") {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ── Forbidden ─────────────────────────────────────────────────────────── */
  if (!loading && error === "forbidden") {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-16 flex flex-col items-center gap-4 text-center">
        <FiAlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          This page is restricted to the admin account.
        </p>
        <Button variant="outline" onClick={() => router.push("/history")}>
          Go to History
        </Button>
      </div>
    );
  }

  /* ── Loading ───────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-16 flex flex-col items-center gap-3 text-muted-foreground">
        <FiLoader className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading admin stats…</p>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────────────────────── */
  if (error && error !== "forbidden") {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-16 flex flex-col items-center gap-4">
        <FiAlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchStats}>
          <FiRefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  /* ── Dashboard ─────────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Signed in as {user?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="min-h-[40px]">
          <FiRefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FiUsers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{data.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <FiFileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{data.totalTransactions}</p>
              <p className="text-sm text-muted-foreground">Total transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <FiMic className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{data.totalVoiceSessions}</p>
              <p className="text-sm text-muted-foreground">Voice sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            {data.totalUsers} registered account{data.totalUsers !== 1 ? "s" : ""}
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
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                      Transactions
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                      Voice sessions
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                      Last active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u, i) => (
                    <tr
                      key={u.email}
                      className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    >
                      <td className="px-6 py-3.5 font-medium">{u.email}</td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground">
                        {fmt(u.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                            u.transactionCount > 0
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.transactionCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                            u.voiceSessionCount > 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.voiceSessionCount}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-muted-foreground">
                        {fmtRelative(u.lastActivity)}
                      </td>
                    </tr>
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
