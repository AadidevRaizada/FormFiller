import fs from "fs";
import path from "path";

export interface PdfTemplateData {
  date: string;
  vesselNameImo: string;
  port: string;
  eta: string;
  product: string;
  quantity: string;
  deliveryMode: string;
  agents: string;
  physicalSupplier: string;
  signatory: string;
  bn_to: string;
  bn_attn: string;
  bn_sellers: string;
  bn_suppliers: string;
  bn_buyingPrice: string;
  bn_paymentTerms: string;
  bn_remarks: string;
  oc_to: string;
  oc_attn: string;
  oc_buyers: string;
  oc_sellingPrice: string;
  oc_paymentTerms: string;
  oc_remarks: string;
}

export function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "Public", "Images", "asean-logo.png");
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

// ─── Page spec ────────────────────────────────────────────────────────────────
// Paper:   US Letter (8.5" × 11")
// Margins: top/bottom 0.75" (54pt) | left 1.09" (78.48pt) | right 0.70" (50.4pt)
// Font:    Calibri 11pt body
// Grid:    col A 36pt spacer | col B 56.25pt label | col C 36pt colon | col D+ value
// Row height: 14.5pt (uniform Excel default)
// ──────────────────────────────────────────────────────────────────────────────

export const SHARED_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: letter portrait;
    margin: 0.75in 0.70in 0.75in 1.09in;
  }

  body {
    font-family: 'Carlito', Calibri, Arial, sans-serif;
    font-size: 11pt;
    color: #000000;
    background: #ffffff;
    /* Replicate Excel's 80% print scale — 51 rows × 14.5pt = 739.5pt → 591.6pt at 80%, fits 684pt content area */
    zoom: 0.8;
  }

  /* Each logical page; page-break-after forces the PDF page split */
  .page {
    width: 100%;
    display: flex;
    flex-direction: column;
    page-break-after: always;
  }

  /* ── Header (logo left, address right) ───────────────────────────── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  /* Logo: 114.76pt × 135.69pt from spec */
  .logo {
    width: 114.76pt;
    height: 135.69pt;
    object-fit: contain;
    object-position: left top;
  }

  /* Address text-box: ~9-10pt, right-aligned, no border */
  .address {
    font-size: 9.5pt;
    line-height: 1.45;
    text-align: right;
  }

  /* ── Row primitives ──────────────────────────────────────────────── */
  /* Blank spacer row matching Excel 14.5pt row height */
  .r { height: 14.5pt; flex-shrink: 0; }

  /* Title row (A14): centred, 11pt regular */
  .title {
    text-align: center;
    font-size: 11pt;
    font-weight: normal;
    line-height: 14.5pt;
    height: 14.5pt;
  }

  /* Field row: indent(36pt) | label(56.25pt) | colon(36pt) | value(flex) */
  .fr {
    display: flex;
    line-height: 14.5pt;
    min-height: 14.5pt;
  }
  .fi { width: 36pt;    flex-shrink: 0; }                       /* col A — indent   */
  .fl { min-width: 56.25pt; flex-shrink: 0; font-weight: bold;
        white-space: nowrap; padding-right: 4pt; }              /* col B — label    */
  .fc { width: 36pt;    flex-shrink: 0; text-align: right; padding-right: 3pt; }  /* col C — colon    */
  .fv { flex: 1; }                                  /* col D+ — value   */

  /* Tagline (B20): bold full-width */
  .tagline { font-weight: bold; line-height: 14.5pt; height: 14.5pt; }

  /* Sub-text under vessel (D23): 9pt, indented to col D */
  .subtext {
    font-size: 9pt;
    padding-left: 128.25pt;   /* A(36) + B(56.25) + C(36) = 128.25pt */
    line-height: 14.5pt;
    height: 14.5pt;
  }

  /* Sign-off */
  .regards   { font-weight: bold; line-height: 14.5pt; height: 14.5pt; }
  .signatory { font-weight: normal; line-height: 14.5pt; height: 14.5pt; }

  /* ── Page 2 – Notes / Remarks text-box ─────────────────────────── */
  /* TextBox 5: width 479.83pt, starts ~25pt below the logo bottom    */
  .p2-gap { flex-shrink: 0; height: 25.6pt; }

  .p2-textbox {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .p2-notes-title {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    line-height: 14.5pt;
    height: 14.5pt;
  }

  /* blank line inside text-box */
  .p2-blank { height: 14.5pt; flex-shrink: 0; }

  .p2-note {
    font-size: 10.5pt;
    font-style: italic;
    line-height: 14.5pt;
  }

  .p2-remarks-title {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    line-height: 14.5pt;
    height: 14.5pt;
    margin-top: 14.5pt;
  }

  .p2-remark {
    font-size: 10.5pt;
    font-style: italic;
    line-height: 14.5pt;
  }

  /* Footer (A95): 10.5pt italic, left-aligned, pushed to bottom */
  .footer {
    font-size: 10.5pt;
    font-style: italic;
    margin-top: auto;
    padding-top: 9pt;
    text-align: left;
  }
`;

export const GOOGLE_FONTS_LINK = `<link href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">`;

/** Shared header: logo (left) + address block (right) */
export function headerHtml(logoSrc: string, emailLine: string): string {
  return `
    <div class="header">
      <img class="logo" src="${logoSrc}" alt="ASEAN logo" />
      <div class="address">
        ASEAN INTERNATIONAL DMCC<br>
        Unit No 2909<br>
        JBC 1, Cluster G,<br>
        Jumeirah Lake Towers,<br>
        Dubai, U.A.E.<br>
        ${emailLine}
      </div>
    </div>`;
}
