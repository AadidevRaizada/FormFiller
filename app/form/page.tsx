"use client";

import { Suspense } from "react";
import { FormShell } from "@/components/form/FormShell";
import { AuthGuard } from "@/components/AuthGuard";

export default function FormPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="mx-auto max-w-5xl px-4 pt-8 text-center text-muted-foreground">Loading form…</div>}>
        <FormShell />
      </Suspense>
    </AuthGuard>
  );
}
