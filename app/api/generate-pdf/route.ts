import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import BunkerNominationDocument from "@/components/pdf/BunkerNominationDocument";
import OrderConfirmationDocument from "@/components/pdf/OrderConfirmationDocument";
import type { BunkerNominationDocumentProps } from "@/components/pdf/BunkerNominationDocument";
import type { OrderConfirmationDocumentProps } from "@/components/pdf/OrderConfirmationDocument";

/**
 * Sanitize a string for use in a filename.
 * Extracts the first word and removes non-alphanumeric characters.
 */
function sanitizeForFilename(value: string): string {
  const firstWord = value.trim().split(/\s+/)[0] || "Unknown";
  return firstWord.replace(/[^a-zA-Z0-9_-]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body as {
      type: "bn" | "oc";
      data: BunkerNominationDocumentProps & OrderConfirmationDocumentProps;
    };

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type and data" },
        { status: 400 }
      );
    }

    if (type !== "bn" && type !== "oc") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'bn' or 'oc'" },
        { status: 400 }
      );
    }

    const vesselName = sanitizeForFilename(data.vesselNameImo || "Unknown");

    let pdfBuffer: Buffer;
    let filename: string;

    if (type === "bn") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(BunkerNominationDocument(data) as any);
      filename = `BunkerNomination_${vesselName}.pdf`;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(OrderConfirmationDocument(data) as any);
      filename = `OrderConfirmation_${vesselName}.pdf`;
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
