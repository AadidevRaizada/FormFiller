import {
  SHARED_CSS,
  GOOGLE_FONTS_LINK,
  getLogoBase64,
  headerHtml,
  type PdfTemplateData,
} from "./shared";

function fr(label: string, value: string): string {
  return `<div class="fr"><div class="fi"></div><div class="fl">${label}</div><div class="fc">:</div><div class="fv">${value || ""}</div></div>`;
}

function bnPage1(data: PdfTemplateData, logoSrc: string): string {
  const {
    date, vesselNameImo, port, eta, product, quantity, deliveryMode,
    agents, physicalSupplier, bn_to, bn_attn, bn_sellers, bn_suppliers,
    bn_buyingPrice, bn_paymentTerms, bn_remarks, signatory,
  } = data;

  return `<div class="page">
    ${headerHtml(logoSrc, "EMAIL: bunkers@asean.ae")}

    <!-- Rows 1–13: logo floats over these. Gap to row 14 ≈ 2 blank rows. -->
    <div class="r"></div><div class="r"></div>

    <!-- Row 14: Title -->
    <div class="title">Bunker Nomination</div>

    <!-- Row 15: blank -->
    <div class="r"></div>

    <!-- Rows 16–18: To / Attn / Date -->
    ${fr("To", bn_to)}
    ${fr("Attn", bn_attn)}
    ${fr("Date", date)}

    <!-- Row 19: blank -->
    <div class="r"></div>

    <!-- Row 20: Tagline -->
    <div class="tagline">We are pleased to place the following order confirmation with you:</div>

    <!-- Row 21: blank -->
    <div class="r"></div>

    <!-- Row 22: Vessel (label has colon already in spec) -->
    <div class="fr"><div class="fi"></div><div class="fl">Vessel:</div><div class="fc">:</div><div class="fv">${vesselNameImo || ""}</div></div>

    <!-- Row 23: AND/OR subtext -->
    <div class="subtext">AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR</div>

    <!-- Row 24: ASEAN as buyer -->
    <div class="subtext">ASEAN INTERNATIONAL DMCC</div>

    <!-- Row 25: blank -->
    <div class="r"></div>

    <!-- Rows 26–27: Port / ETA -->
    ${fr("Port", port)}
    ${fr("ETA", eta)}

    <!-- Row 28: blank -->
    <div class="r"></div>

    <!-- Rows 29–32: Product / Quantity / Price / Delivery mode (lowercase 'm') -->
    ${fr("Product", product)}
    ${fr("Quantity", quantity)}
    ${fr("Price", bn_buyingPrice)}
    ${fr("Delivery mode", deliveryMode)}

    <!-- Row 33: blank -->
    <div class="r"></div>

    <!-- Rows 34–36: Sellers / Buyers / Suppliers -->
    ${fr("Sellers", bn_sellers)}
    ${fr("Buyers", "Asean International DMCC")}
    ${fr("Suppliers", bn_suppliers || physicalSupplier)}

    <!-- Row 37: blank -->
    <div class="r"></div>

    <!-- Row 38: Agents -->
    ${fr("Agents", agents)}

    <!-- Row 39: blank -->
    <div class="r"></div>

    <!-- Row 40: Payment (BN has Payment BEFORE Remarks) -->
    ${fr("Payment", bn_paymentTerms)}

    <!-- Row 41: blank -->
    <div class="r"></div>

    <!-- Row 42: Remarks -->
    ${fr("Remarks", bn_remarks || "-")}

    <!-- Rows 43–44: blank -->
    <div class="r"></div><div class="r"></div>

    <!-- Row 45: Kind regards (Bold per spec) -->
    <div class="regards">Kind regards</div>

    <!-- Row 46: blank -->
    <div class="r"></div>

    <!-- Row 47: Signatory (Regular per spec) -->
    <div class="signatory">${signatory || "Sahir Jamal"}</div>

    <!-- Rows 48–51: blank -->
    <div class="r"></div><div class="r"></div><div class="r"></div><div class="r"></div>
  </div>`;
}

function bnPage2(logoSrc: string): string {
  return `<div class="page">
    ${headerHtml(logoSrc, "EMAIL: bunkers@asean.ae")}

    <div class="p2-gap"></div>

    <div class="p2-textbox">
      <div class="p2-notes-title">NOTES</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Asean Operations contact (e-mail):&nbsp;&nbsp;&nbsp;&nbsp;<strong>Bunkers@asean.ae</strong></div>
      <div class="p2-blank"></div>

      <div class="p2-note">Please hand over the MSDS Sheet to the receving Vessel before bunkering</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Please confirm the good receipt of above email and immediately identify us of any errors else the same will be treated as correct &amp; accepted by you</div>
      <div class="p2-blank"></div>

      <div class="p2-note">The Seller/ Supplier warrants that the bunker to be supplied and / or the crude oil from which it is produced does not originate from Iran.</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Physical supplier to carry out a representative drip sampling into minimum 2 samples; One for the vessel and one for the supplier. In presence of representatives from both the supplier and vessel the sampling and the sealing has to be carried out and signed for</div>
      <div class="p2-blank"></div>

      <div class="p2-note">The fuel oil must not contain any chemical waste and / or used marine - or automotive lubricants.<br>The fuel must be proven to be homogeneous.</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Supplier is to keep close contact with the agents.</div>
      <div class="p2-blank"></div>

      <div class="p2-note">Please forward your invoice and BDR not later then 05 working days from date of supply.</div>
      <div class="p2-blank"></div>

      <div class="p2-note">All invoices and supporting receipts are to be emailed to the below given e-mail addresses:</div>

      <div class="p2-note">accounts@asean.ae and admin@asean.ae</div>

      <div class="p2-remarks-title">REMARKS</div>
      <div class="p2-blank"></div>

      <div class="p2-remark">-Sale is subject to BIMCO 2018 terms and conditions.</div>
    </div>

    <!-- Row 95: Footer (*asterisk for BN) -->
    <div class="footer">*Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com</div>
  </div>`;
}

export function buildBNHtml(data: PdfTemplateData): string {
  const logoSrc = getLogoBase64();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  ${GOOGLE_FONTS_LINK}
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${bnPage1(data, logoSrc)}
  ${bnPage2(logoSrc)}
</body>
</html>`;
}
