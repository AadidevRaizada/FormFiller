"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";
import { AuthGuard } from "@/components/AuthGuard";
import { Step4ReviewExport } from "@/components/form/Step4ReviewExport";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useFormStore } from "@/lib/store";

export default function ExportPage() {
  return (
    <AuthGuard>
      <ExportContent />
    </AuthGuard>
  );
}

function ExportContent() {
  const router = useRouter();
  const vesselNameImo = useFormStore((s) => s.vesselNameImo);

  // If the user lands on /export with no form data loaded, send them
  // back to the form so they don't see an empty review.
  useEffect(() => {
    if (!vesselNameImo) {
      router.replace("/form?step=1");
    }
  }, [vesselNameImo, router]);

  if (!vesselNameImo) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/history">
          <Button variant="ghost" size="sm" className="min-h-[40px]">
            <FiChevronLeft className="mr-1 h-4 w-4" />
            Back to History
          </Button>
        </Link>
      </div>

      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-lg">Review &amp; Export</CardTitle>
          <CardDescription>
            Review your data and generate documents for {vesselNameImo}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Step4ReviewExport />
        </CardContent>
      </Card>
    </div>
  );
}
