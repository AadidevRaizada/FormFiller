import {
  SHARED_CSS,
  GOOGLE_FONTS_LINK,
  getLogoBase64,
  headerHtml,
  type PdfTemplateData,
} from "./shared";

// Row numbers from spec (rows 16–47, page 1 = rows 1–51)
// Each blank row = <div class="r"></div> (14.5pt)

function fr(label: string, value: string): string {
  return `<div class="fr"><div class="fi"></div><div class="fl">${label}</div><div class="fc">:</div><div class="fv">${value || ""}</div></div>`;
}

function buildOcRemarks(base: string, data: PdfTemplateData): string {
  const extras: string[] = [];
  if (data.product2) {
    extras.push(`Product 2: ${data.product2} | Qty: ${data.quantity2 || ""} | Price: ${data.oc_sellingPrice2 || ""}`);
  }
  if (data.product3) {
    extras.push(`Product 3: ${data.product3} | Qty: ${data.quantity3 || ""} | Price: ${data.oc_sellingPrice3 || ""}`);
  }
  if (!extras.length) return base || "-";
  return [base || "-", ...extras].join("<br>");
}

function ocPage1(data: PdfTemplateData, logoSrc: string): string {
  const {
    date, vesselNameImo, port, eta, product, quantity, deliveryMode,
    agents, physicalSupplier, oc_to, oc_attn, oc_buyers, oc_sellingPrice,
    oc_paymentTerms, oc_remarks, signatory,
  } = data;

  return `<div class="page">
    ${headerHtml(logoSrc, "bunkers@asean.ae")}

    <!-- Rows 1–13: logo floats over these. Logo height 135.69pt covers ~9.4 rows.
         Remaining gap to row 14 ≈ 28pt ≈ 2 blank rows. -->
    <div class="r"></div><div class="r"></div>

    <!-- Row 14: Title -->
    <div class="title">ORDER CONFIRMATION</div>

    <!-- Row 15: blank -->
    <div class="r"></div>

    <!-- Rows 16–18: To / Attn / Date -->
    ${fr("To", oc_to)}
    ${fr("Attn", oc_attn)}
    ${fr("Date", date)}

    <!-- Row 19: blank -->
    <div class="r"></div>

    <!-- Row 20: Tagline -->
    <div class="tagline">We are pleased to confirm the following nomination with you:</div>

    <!-- Row 21: blank -->
    <div class="r"></div>

    <!-- Row 22: Vessel -->
    ${fr("Vessel", vesselNameImo)}

    <!-- Row 23: AND/OR subtext (9pt, D23) -->
    <div class="subtext">AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR</div>

    <!-- Row 24: Buyer name beneath vessel -->
    <div class="subtext">${oc_buyers || ""}</div>

    <!-- Row 25: blank -->
    <div class="r"></div>

    <!-- Rows 26–27: Port / ETA -->
    ${fr("Port", port)}
    ${fr("ETA", eta)}

    <!-- Row 28: blank -->
    <div class="r"></div>

    <!-- Rows 29–32: Product / Quantity / Price / Delivery Mode -->
    ${fr("Product", product)}
    ${fr("Quantity", quantity)}
    ${fr("Price", oc_sellingPrice)}
    ${fr("Delivery Mode", deliveryMode)}

    <!-- Row 33: blank -->
    <div class="r"></div>

    <!-- Rows 34–36: Sellers / Buyers / Supplier -->
    ${fr("Sellers", "Asean International DMCC")}
    ${fr("Buyers", oc_buyers)}
    ${fr("Supplier", physicalSupplier)}

    <!-- Row 37: blank -->
    <div class="r"></div>

    <!-- Row 38: Agents -->
    ${fr("Agents", agents)}

    <!-- Row 39: blank -->
    <div class="r"></div>

    <!-- Row 40: Remarks -->
    ${fr("Remarks:", buildOcRemarks(oc_remarks, data))}

    <!-- Row 41: blank -->
    <div class="r"></div>

    <!-- Row 42: Payment -->
    ${fr("Payment", oc_paymentTerms)}

    <!-- Rows 43–44: blank -->
    <div class="r"></div><div class="r"></div>

    <!-- Row 45: Kind regards (Bold per spec) -->
    <div class="regards">Kind regards</div>

    <!-- Row 46: blank -->
    <div class="r"></div>

    <!-- Row 47: Signatory (Regular per spec) -->
    <div class="signatory">${signatory || "Sahir Jamal"}</div>

    <!-- Rows 48–51: blank (end of page 1) -->
    <div class="r"></div><div class="r"></div><div class="r"></div><div class="r"></div>
  </div>`;
}

function ocPage2(logoSrc: string): string {
  return `<div class="page">
    ${headerHtml(logoSrc, "bunkers@asean.ae")}

    <!-- Gap between logo bottom and TextBox 5 start (~25.6pt per spec) -->
    <div class="p2-gap"></div>

    <!-- TextBox 5: NOTES & REMARKS (479.83pt wide, 413.7pt tall) -->
    <div class="p2-textbox">
      <div class="p2-notes-title">NOTES</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Asean operations (e-mail):&nbsp;&nbsp;&nbsp;&nbsp;bunkers@asean.ae</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Please confirm the good receipt of above email and immediately identify us of any errors else the same will be treated as correct &amp; accepted by you</div>
      <div class="p2-blank"></div>
      <div class="p2-blank"></div>

      <div class="p2-remarks-title">REMARKS</div>
      <div class="p2-blank"></div>

      <div class="p2-remark">-Sale is subject to BIMCO 2018 terms and conditions</div>
      <div class="p2-remark">-Supply by barge is subject to weather condition.</div>
      <div class="p2-remark">-Supply barge sounding are final &amp; binding to both parties.</div>
      <div class="p2-remark">-Cancellation charges applicable if the order is cancelled or reduction in Qty</div>
      <div class="p2-remark">-Kindly note for delay in payments received an Interest at 2% per calendar month or pro rata shall be levied from due-date</div>
      <div class="p2-remark">-The Seller/ Supplier warrants that the bunker to be supplied and / or the crude oil from which it is produced is not originating from Iran.</div>
    </div>

    <!-- Row 95: Footer (10.5pt italic, left-aligned) -->
    <div class="footer">Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com</div>
  </div>`;
}

export function buildOCHtml(data: PdfTemplateData): string {
  const logoSrc = getLogoBase64();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  ${GOOGLE_FONTS_LINK}
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${ocPage1(data, logoSrc)}
  ${ocPage2(logoSrc)}
</body>
</html>`;
}
