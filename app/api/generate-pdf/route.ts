import { NextRequest, NextResponse } from "next/server";
import { buildOCHtml } from "@/lib/pdf-templates/oc";
import { buildBNHtml } from "@/lib/pdf-templates/bn";
import type { PdfTemplateData } from "@/lib/pdf-templates/shared";

export const maxDuration = 30;

function sanitizeForFilename(value: string): string {
  const firstWord = value.trim().split(/\s+/)[0] || "Unknown";
  return firstWord.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function launchBrowser() {
  // On Vercel (Lambda), use @sparticuz/chromium to get the executable path.
  // Locally, puppeteer-core finds the system/bundled Chromium automatically.
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local development — use the system Chrome/Chromium or bundled Chromium
  const puppeteer = (await import("puppeteer-core")).default;
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/google-chrome");

  return puppeteer.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
}

export async function POST(request: NextRequest) {
  let browser;
  try {
    const body = await request.json();
    const { type, data } = body as { type: "bn" | "oc"; data: PdfTemplateData };

    if (!type || !data || (type !== "bn" && type !== "oc")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const html = type === "oc" ? buildOCHtml(data) : buildBNHtml(data);
    const vesselName = sanitizeForFilename(data.vesselNameImo || "Unknown");
    const filename =
      type === "oc"
        ? `OrderConfirmation_${vesselName}.pdf`
        : `BunkerNomination_${vesselName}.pdf`;

    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 20000 });

    // Margins and paper size are controlled by @page CSS in the templates.
    // Puppeteer margin must be 0 to avoid double-applying margins.
    const pdfBuffer = await page.pdf({
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      preferCSSPageSize: true,
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
