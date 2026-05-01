"use client";

import { useState, useEffect, useCallback } from "react";
import { FiLock, FiActivity, FiEye, FiEyeOff, FiLoader, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ── Types ── */
interface DayEntry { date: string; transactions: number; voiceSessions: number }

/* ── Page ── */
export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

type Tab = "password" | "logs";

function ProfileContent() {
  const [tab, setTab] = useState<Tab>("logs");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12">
      <h1 className="text-2xl font-bold mb-1">Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your account settings and view activity</p>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        <TabBtn active={tab === "logs"} onClick={() => setTab("logs")} icon={<FiActivity className="h-4 w-4" />} label="Activity Logs" />
        <TabBtn active={tab === "password"} onClick={() => setTab("password")} icon={<FiLock className="h-4 w-4" />} label="Change Password" />
      </div>

      {tab === "logs" ? <LogsTab /> : <PasswordTab />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{label}
    </button>
  );
}

/* ── Change Password Tab ── */
function PasswordTab() {
  const { token } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next !== confirm) { setError("New passwords don't match"); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base">Change Password</CardTitle>
        <CardDescription>Enter your current password and choose a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField label="Current password" value={current} onChange={setCurrent} show={showCurrent} toggle={() => setShowCurrent(v => !v)} />
          <PasswordField label="New password" value={next} onChange={setNext} show={showNext} toggle={() => setShowNext(v => !v)} />
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} show={showNext} toggle={() => setShowNext(v => !v)} />

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <FiCheckCircle className="h-4 w-4 shrink-0" />Password changed successfully
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <FiLoader className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordField({ label, value, onChange, show, toggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ── Activity Logs Tab ── */
function LogsTab() {
  const { token, user } = useAuth();
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ day: DayEntry; x: number; y: number } | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { days: DayEntry[] };
        setDays(data.days);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchLogs(); }, [token, fetchLogs]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <FiLoader className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading activity…</span>
      </div>
    );
  }

  const totalTx = days.reduce((s, d) => s + d.transactions, 0);
  const totalVs = days.reduce((s, d) => s + d.voiceSessions, 0);
  const activeDays = days.filter(d => d.transactions > 0 || d.voiceSessions > 0).length;

  // Build weeks grid (52 weeks + partial)
  const weeks = buildWeeks(days);

  // Recent activity list (days with activity, most recent first)
  const recentActive = [...days]
    .filter(d => d.transactions > 0 || d.voiceSessions > 0)
    .reverse()
    .slice(0, 30);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniCard label="Transactions" value={totalTx} color="text-blue-600 dark:text-blue-400" />
        <MiniCard label="Voice sessions" value={totalVs} color="text-green-600 dark:text-green-400" />
        <MiniCard label="Active days" value={activeDays} color="text-foreground" />
      </div>

      {/* Contribution grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Activity — last 365 days</CardTitle>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <div className="relative">
            <ContribGrid weeks={weeks} onHover={setTooltip} />
            {tooltip && (
              <div
                className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
                style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
              >
                <p className="font-semibold mb-1">{fmtDate(tooltip.day.date)}</p>
                <p className="text-blue-600 dark:text-blue-400">{tooltip.day.transactions} transaction{tooltip.day.transactions !== 1 ? "s" : ""}</p>
                <p className="text-green-600 dark:text-green-400">{tooltip.day.voiceSessions} voice session{tooltip.day.voiceSessions !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(l => (
              <span key={l} className={`h-3 w-3 rounded-sm inline-block ${cellColor(l)}`} />
            ))}
            <span>More</span>
            <span className="ml-4 flex items-center gap-1"><span className="h-3 w-3 rounded-sm inline-block bg-blue-300 dark:bg-blue-700" /> Transactions</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm inline-block bg-green-300 dark:bg-green-700" /> Voice</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity list */}
      {recentActive.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {recentActive.map((d) => (
                <li key={d.date} className="flex items-center gap-4 px-5 py-2.5 border-b last:border-0 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0">{fmtDate(d.date)}</span>
                  <div className="flex gap-4">
                    {d.transactions > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                        <span>{d.transactions} transaction{d.transactions !== 1 ? "s" : ""}</span>
                      </span>
                    )}
                    {d.voiceSessions > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                        <span>{d.voiceSessions} voice session{d.voiceSessions !== 1 ? "s" : ""}</span>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No activity in the last 365 days yet.</p>
      )}
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ── Contribution grid ── */

type Week = (DayEntry | null)[];

function buildWeeks(days: DayEntry[]): Week[] {
  // days is already sorted oldest→newest (365 entries)
  // pad front so first day aligns to its weekday (0=Sun)
  const firstDate = new Date(days[0]?.date ?? new Date());
  const pad = firstDate.getDay(); // 0=Sun
  const cells: (DayEntry | null)[] = [...Array(pad).fill(null), ...days];
  const weeks: Week[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7) as Week);
  }
  return weeks;
}

function cellColor(level: number) {
  switch (level) {
    case 0: return "bg-muted";
    case 1: return "bg-blue-200 dark:bg-blue-900";
    case 2: return "bg-blue-400 dark:bg-blue-700";
    case 3: return "bg-blue-600 dark:bg-blue-500";
    case 4: return "bg-blue-800 dark:bg-blue-300";
    default: return "bg-muted";
  }
}

function activityLevel(d: DayEntry | null): number {
  if (!d) return -1;
  const total = d.transactions + d.voiceSessions;
  if (total === 0) return 0;
  if (total === 1) return 1;
  if (total <= 3) return 2;
  if (total <= 6) return 3;
  return 4;
}

function ContribGrid({ weeks, onHover }: { weeks: Week[]; onHover: (v: { day: DayEntry; x: number; y: number } | null) => void }) {
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Figure out which week each month starts at
  const monthPositions: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    week.forEach((day) => {
      if (day && day.date.endsWith("-01")) {
        const m = parseInt(day.date.slice(5, 7)) - 1;
        monthPositions.push({ label: MONTH_LABELS[m], col: wi });
      }
    });
  });

  return (
    <div>
      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 ml-0 text-xs text-muted-foreground" style={{ paddingLeft: 0 }}>
        {weeks.map((_, wi) => {
          const mp = monthPositions.find(m => m.col === wi);
          return <div key={wi} style={{ width: 11 }} className="shrink-0 text-center">{mp ? mp.label : ""}</div>;
        })}
      </div>
      {/* Grid: 7 rows (days of week) × N columns (weeks) */}
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => {
              const level = activityLevel(day);
              if (level === -1) return <div key={di} style={{ width: 11, height: 11 }} />;
              return (
                <div
                  key={di}
                  style={{ width: 11, height: 11 }}
                  className={`rounded-[2px] cursor-default ${cellColor(level)}`}
                  onMouseMove={(e) => day && onHover({ day, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => onHover(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}
