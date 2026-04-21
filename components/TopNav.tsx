"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

export function TopNav() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href={user ? "/form" : "/login"} className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-[hsl(var(--brand-teal))]">
              ASEAN
            </span>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              Document Generator
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {!isLoading && user && (
            <>
              <Link
                href="/form"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Form
              </Link>
              <Link
                href="/history"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                History
              </Link>
              <span className="hidden md:inline text-xs text-muted-foreground px-2">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
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
  );
}
