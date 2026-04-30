"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiLogOut, FiMenu, FiX, FiFileText, FiClock, FiDownload } from "react-icons/fi";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/form", label: "New Form", icon: FiFileText },
  { href: "/export", label: "Export", icon: FiDownload },
  { href: "/history", label: "History", icon: FiClock },
];

export function TopNav() {
  const { user, logout, isLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Left: hamburger (mobile only) + branding */}
          <div className="flex items-center gap-2">
            {!isLoading && user && (
              <button
                className="md:hidden rounded-md p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
              >
                <FiMenu className="h-5 w-5" />
              </button>
            )}
            <Link
              href={user ? "/history" : "/login"}
              className="flex items-center gap-1.5"
            >
              <span className="text-lg font-bold text-[hsl(var(--brand-teal))]">ASEAN</span>
              <span className="hidden text-sm font-medium text-foreground sm:inline">
                Document Generator
              </span>
            </Link>
          </div>

          {/* Right: desktop nav + user actions */}
          <div className="flex items-center gap-1">
            {!isLoading && user && (
              <>
                <Link
                  href="/form"
                  className={`hidden md:inline-flex rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    pathname === "/form"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Form
                </Link>
                <Link
                  href="/export"
                  className={`hidden md:inline-flex rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    pathname === "/export"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Export
                </Link>
                <Link
                  href="/history"
                  className={`hidden md:inline-flex rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    pathname === "/history"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  History
                </Link>
                <span className="hidden lg:inline text-xs text-muted-foreground px-2 max-w-[180px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden md:inline-flex rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Mobile side drawer ─────────────────────────────────────────── */}
      {drawerOpen && (
        /* Backdrop */
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background border-r shadow-xl transition-transform duration-200 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation drawer"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <span className="text-lg font-bold text-[hsl(var(--brand-teal))]">ASEAN</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer: email + settings */}
        <div className="border-t px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-9 w-9 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary uppercase">
                {user?.email?.[0] ?? "?"}
              </span>
            </div>

            {/* Email */}
            <span className="flex-1 min-w-0 text-sm text-muted-foreground truncate">
              {user?.email}
            </span>

            {/* Settings: theme + logout */}
            <div className="flex items-center gap-0.5 shrink-0">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <FiLogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
