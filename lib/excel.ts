import { toast } from "sonner";

/**
 * Input shape for the Excel export — all form fields from the Zustand store.
 */
export interface ExcelExportInput {
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

/* ── Shared font helpers ─────────────────────────────────────────────────── */
const FONT_BOLD_11 = { name: "Calibri", size: 11, bold: true };
const FONT_11 = { name: "Calibri", size: 11, bold: false };
const FONT_9 = { name: "Calibri", size: 9, bold: false };
const FONT_10_5 = { name: "Calibri", size: 10.5, bold: false };
const FONT_10_5_BOLD_UL = { name: "Calibri", size: 10.5, bold: true, underline: true as const };
const FONT_10_5_ITALIC = { name: "Calibri", size: 10.5, bold: false, italic: true };
const ALIGN_RIGHT = { horizontal: "right" as const };
const ALIGN_CENTER = { horizontal: "center" as const };
const WHITE_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFFF" } };

/**
 * Generates a Bunker Nomination Excel workbook matching the reference format
 * pixel-for-pixel, then triggers a browser download.
 */
export async function generateExcel(data: ExcelExportInput): Promise<void> {
  try {
    // Dynamic import to avoid SSR issues — exceljs is browser-only here
    const ExcelJS = (await import("exceljs")).default;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    wb.addWorksheet("Sheet2");
    wb.addWorksheet("Sheet3");

    /* ── Column widths ──────────────────────────────────────────────────── */
    ws.columns = [
      { width: 13.0 },       // A
      { width: 15.109375 },  // B
      { width: 13.0 },       // C
      { width: 9.44140625 }, // D
      { width: 13.0 },       // E
      { width: 13.0 },       // F
      { width: 13.0 },       // G
      { width: 13.0 },       // H
      { width: 13.0 },       // I
      { width: 13.0 },       // J
      { width: 13.0 },       // K
    ];

    /* ── Row heights ────────────────────────────────────────────────────── */
    ws.getRow(91).height = 14.4;
    ws.getRow(92).height = 14.4;
    ws.getRow(94).height = 144.0;

    /* ── Helper: set a cell with font + optional alignment ──────────────── */
    const setCell = (
      row: number,
      col: number,
      value: string,
      font: Record<string, unknown>,
      alignment?: Record<string, unknown>,
      fill?: Record<string, unknown>,
    ) => {
      const cell = ws.getCell(row, col);
      cell.value = value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.font = font as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (alignment) cell.alignment = alignment as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (fill) cell.fill = fill as any;
    }

    /** Set a label row: B=label(bold), C=':'(right), D=value */
    const setFieldRow = (row: number, label: string, value: string) => {
      setCell(row, 2, label, FONT_BOLD_11);
      setCell(row, 3, ":", FONT_11, ALIGN_RIGHT);
      setCell(row, 4, value, FONT_11);
    }

    /** Merge B:J for a notes row and set content */
    const setNotesRow = (
      row: number,
      value: string,
      font: Record<string, unknown>,
      wrap = false,
    ) => {
      ws.mergeCells(row, 2, row, 10);
      const cell = ws.getCell(row, 2);
      cell.value = value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.font = font as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (wrap) cell.alignment = { wrapText: true } as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.fill = WHITE_FILL as any;
      // Fill the rest of the merged range with white background
      for (let c = 3; c <= 10; c++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ws.getCell(row, c).fill = WHITE_FILL as any;
      }
    }

    /** Set address block: merge G:K per row, right-aligned */
    const setAddressRow = (row: number, value: string) => {
      ws.mergeCells(row, 7, row, 11);
      setCell(row, 7, value, FONT_11, ALIGN_RIGHT);
    }

    /* ── LOGO ───────────────────────────────────────────────────────────── */
    try {
      const logoRes = await fetch("/Images/asean-logo.png");
      const logoBuf = await logoRes.arrayBuffer();
      const logoId = wb.addImage({
        buffer: logoBuf,
        extension: "png",
      });

      // Logo instance 1 — page 1
      ws.addImage(logoId, {
        tl: { col: 0.55, row: 1.04 },
        ext: { width: 1485899 / 9525, height: 1703721 / 9525 },
        editAs: "absolute",
      });

      // Logo instance 2 — page 2
      ws.addImage(logoId, {
        tl: { col: 0.55, row: 49.2 },
        ext: { width: 1485899 / 9525, height: 1703721 / 9525 },
        editAs: "absolute",
      });
    } catch {
      console.warn("Could not load logo for Excel export");
    }

    /* ── PAGE 1: Company address (G3:K8) ────────────────────────────────── */
    setAddressRow(3, "ASEAN INTERNATIONAL DMCC");
    setAddressRow(4, "Unit No 2909");
    setAddressRow(5, "JBC 1, Cluster G,");
    setAddressRow(6, "Jumeirah Lake Towers,");
    setAddressRow(7, "Dubai, U.A.E.");
    setAddressRow(8, "EMAIL: bunkers@asean.ae");

    /* ── Row 13: Title ──────────────────────────────────────────────────── */
    ws.mergeCells("A13:K13");
    setCell(13, 1, "Bunker Nomination", FONT_11, ALIGN_CENTER);

    /* ── Rows 15–17: To / Attn / Date ───────────────────────────────────── */
    setFieldRow(15, "To", data.bn_to);
    setFieldRow(16, "Attn", data.bn_attn);
    setFieldRow(17, "Date", data.date);

    /* ── Row 19: Tagline ────────────────────────────────────────────────── */
    setCell(19, 2, "We are pleased to place the following order confirmation with you:", FONT_BOLD_11);

    /* ── Row 21: Vessel ─────────────────────────────────────────────────── */
    setCell(21, 2, "Vessel:", FONT_BOLD_11);
    setCell(21, 3, ":", FONT_11, ALIGN_RIGHT);
    setCell(21, 4, data.vesselNameImo, FONT_11);

    /* ── Row 22: Sub-text ───────────────────────────────────────────────── */
    setCell(22, 4, "AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR ", FONT_9);

    /* ── Rows 25–26: Port / ETA ─────────────────────────────────────────── */
    setFieldRow(25, "Port", data.port);
    setFieldRow(26, "ETA", data.eta);

    /* ── Rows 28–31: Product / Quantity / Price / Delivery mode ──────────── */
    setFieldRow(28, "Product", data.product);
    setFieldRow(29, "Quantity", data.quantity);
    setFieldRow(30, "Price", data.bn_buyingPrice);
    setFieldRow(31, "Delivery mode", data.deliveryMode);

    /* ── Rows 33–35: Sellers / Buyers / Suppliers ───────────────────────── */
    setFieldRow(33, "Sellers", data.bn_sellers);
    setFieldRow(34, "Buyers", "Asean International DMCC");
    setFieldRow(35, "Suppliers", data.bn_suppliers);

    /* ── Row 37: Agents ─────────────────────────────────────────────────── */
    setFieldRow(37, "Agents", data.agents);

    /* ── Row 39: Payment ────────────────────────────────────────────────── */
    setFieldRow(39, "Payment", data.bn_paymentTerms);

    /* ── Row 41: Remarks ────────────────────────────────────────────────── */
    setFieldRow(41, "Remarks", data.bn_remarks || "-");

    /* ── Row 43: Kind regards ───────────────────────────────────────────── */
    setCell(43, 2, "Kind regards", FONT_11);

    /* ── Row 45: Signatory ──────────────────────────────────────────────── */
    setCell(45, 2, data.signatory || "Sahir Jamal", FONT_11);

    /* ── PAGE 2: Company address (G52:K57) ──────────────────────────────── */
    setAddressRow(52, "ASEAN INTERNATIONAL DMCC");
    setAddressRow(53, "Unit No 2909");
    setAddressRow(54, "JBC 1, Cluster G,");
    setAddressRow(55, "Jumeirah Lake Towers,");
    setAddressRow(56, "Dubai, U.A.E.");
    setAddressRow(57, "EMAIL: bunkers@asean.ae");

    /* ── PAGE 2: NOTES block (rows 63–84) ───────────────────────────────── */
    setNotesRow(63, "NOTES", FONT_10_5_BOLD_UL);
    // row 64 empty
    setNotesRow(65, "Asean Operations contact (e-mail):     Bunkers@asean.ae", FONT_10_5);
    // row 66 empty
    setNotesRow(67, "Please hand over the MSDS Sheet to the receving Vessel before bunkering", FONT_10_5, true);
    setNotesRow(68, "Please confirm the good receipt of above email and immediately identify us of any errors else the same will be treated as correct & accepted by you", FONT_10_5, true);
    setNotesRow(69, "The Seller/ Supplier warrants that the bunker to be supplied and / or the crude oil from which it is produced does not originate from Iran.", FONT_10_5, true);
    setNotesRow(70, "Physical supplier to carry out a representative drip sampling into minimum 2 samples; One for the vessel and one for the supplier. In presence of representatives from both the supplier and vessel the sampling and the sealing has to be carried out and signed for", FONT_10_5, true);
    // row 71 empty
    setNotesRow(72, "The fuel oil must not contain any chemical waste and / or used marine - or automotive lubricants.", FONT_10_5, true);
    setNotesRow(73, "The fuel must be proven to be homogeneous.", FONT_10_5);
    // row 74 empty
    setNotesRow(75, "Supplier is to keep close contact with the agents.", FONT_10_5);
    // row 76 empty
    setNotesRow(77, "Please forward your invoice and BDR not later then 05 working days from date of supply.", FONT_10_5);
    // row 78 empty
    setNotesRow(79, "All invoices and supporting receipts are to be emailed to the below given e-mail addresses:", FONT_10_5);
    setNotesRow(80, "accounts@asean.ae and admin@asean.ae", FONT_10_5);
    // row 81 empty
    setNotesRow(82, "REMARKS", FONT_10_5_BOLD_UL);
    // row 83 empty
    setNotesRow(84, "-Sale is subject to BIMCO 2018 terms and conditions.", FONT_10_5_ITALIC);

    // Fill empty rows in the notes block with white background
    for (const emptyRow of [64, 66, 71, 74, 76, 78, 81, 83]) {
      ws.mergeCells(emptyRow, 2, emptyRow, 10);
      for (let c = 2; c <= 10; c++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ws.getCell(emptyRow, c).fill = WHITE_FILL as any;
      }
    }

    /* ── Row 91–92: Footer (merged B91:J92) ─────────────────────────────── */
    ws.mergeCells("B91:J92");
    const footerCell = ws.getCell("B91");
    footerCell.value = "*Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com";
    footerCell.font = {
      name: "Calibri",
      size: 10.5,
      bold: false,
      italic: true,
      color: { argb: "FF000000" },
    };
    footerCell.alignment = { horizontal: "center", wrapText: true };

    /* ── Generate and download ──────────────────────────────────────────── */
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const vesselFirst = (data.vesselNameImo || "Vessel").split(/\s+/)[0];
    const portFirst = (data.port || "Port").split(/[,\s]+/)[0];
    const dateStr = data.date || "NoDate";
    a.download = `Bunker_Nomination_${vesselFirst}_${portFirst}_${dateStr}.xlsx`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Excel generation failed:", err);
    toast.error("Failed to generate Excel file");
  }
}

/**
 * Generates an Order Confirmation Excel workbook matching the reference format,
 * then triggers a browser download.
 */
export async function generateOCExcel(data: ExcelExportInput): Promise<void> {
  try {
    const ExcelJS = (await import("exceljs")).default;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    wb.addWorksheet("Sheet2");
    wb.addWorksheet("Sheet3");

    /* ── Column widths (same as BN) ─────────────────────────────────────── */
    ws.columns = [
      { width: 13.0 },
      { width: 15.109375 },
      { width: 13.0 },
      { width: 9.44140625 },
      { width: 13.0 },
      { width: 13.0 },
      { width: 13.0 },
      { width: 13.0 },
      { width: 13.0 },
      { width: 13.0 },
      { width: 13.0 },
    ];

    ws.getRow(91).height = 14.4;
    ws.getRow(92).height = 14.4;
    ws.getRow(94).height = 144.0;

    const setCell = (
      row: number,
      col: number,
      value: string,
      font: Record<string, unknown>,
      alignment?: Record<string, unknown>,
      fill?: Record<string, unknown>,
    ) => {
      const cell = ws.getCell(row, col);
      cell.value = value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.font = font as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (alignment) cell.alignment = alignment as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (fill) cell.fill = fill as any;
    };

    const setFieldRow = (row: number, label: string, value: string) => {
      setCell(row, 2, label, FONT_BOLD_11);
      setCell(row, 3, ":", FONT_11, ALIGN_RIGHT);
      setCell(row, 4, value, FONT_11);
    };

    const setNotesRow = (
      row: number,
      value: string,
      font: Record<string, unknown>,
      wrap = false,
    ) => {
      ws.mergeCells(row, 2, row, 10);
      const cell = ws.getCell(row, 2);
      cell.value = value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.font = font as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (wrap) cell.alignment = { wrapText: true } as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.fill = WHITE_FILL as any;
      for (let c = 3; c <= 10; c++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ws.getCell(row, c).fill = WHITE_FILL as any;
      }
    };

    const setAddressRow = (row: number, value: string) => {
      ws.mergeCells(row, 7, row, 11);
      setCell(row, 7, value, FONT_11, ALIGN_RIGHT);
    };

    /* ── LOGO ───────────────────────────────────────────────────────────── */
    try {
      const logoRes = await fetch("/Images/asean-logo.png");
      const logoBuf = await logoRes.arrayBuffer();
      const logoId = wb.addImage({ buffer: logoBuf, extension: "png" });

      ws.addImage(logoId, {
        tl: { col: 0.55, row: 1.04 },
        ext: { width: 152, height: 181 },
        editAs: "absolute",
      });

      ws.addImage(logoId, {
        tl: { col: 0.55, row: 49.2 },
        ext: { width: 152, height: 181 },
        editAs: "absolute",
      });
    } catch {
      console.warn("Could not load logo for OC Excel export");
    }

    /* ── PAGE 1: Company address (G3:K8) ────────────────────────────────── */
    setAddressRow(3, "ASEAN INTERNATIONAL DMCC");
    setAddressRow(4, "Unit No 2909");
    setAddressRow(5, "JBC 1, Cluster G,");
    setAddressRow(6, "Jumeirah Lake Towers,");
    setAddressRow(7, "Dubai, U.A.E.");
    setAddressRow(8, "bunkers@asean.ae");

    /* ── Row 13: Title ──────────────────────────────────────────────────── */
    ws.mergeCells("A13:K13");
    setCell(13, 1, "ORDER CONFIRMATION", FONT_11, ALIGN_CENTER);

    /* ── Rows 15–17: To / Attn / Date ───────────────────────────────────── */
    setFieldRow(15, "To", data.oc_to);
    setFieldRow(16, "Attn", data.oc_attn);
    setFieldRow(17, "Date", data.date);

    /* ── Row 19: Tagline ────────────────────────────────────────────────── */
    setCell(19, 2, "We are pleased to confirm the following nomination with you:", FONT_BOLD_11);

    /* ── Row 21: Vessel ─────────────────────────────────────────────────── */
    setCell(21, 2, "Vessel", FONT_BOLD_11);
    setCell(21, 3, ":", FONT_11, ALIGN_RIGHT);
    setCell(21, 4, data.vesselNameImo, FONT_11);

    /* ── Row 22: Sub-text ───────────────────────────────────────────────── */
    setCell(22, 4, "AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR", FONT_9);
    setCell(23, 4, data.oc_buyers, FONT_9);

    /* ── Rows 25–26: Port / ETA ─────────────────────────────────────────── */
    setFieldRow(25, "Port", data.port);
    setFieldRow(26, "ETA", data.eta);

    /* ── Rows 28–31: Product / Quantity / Price / Delivery Mode ─────────── */
    setFieldRow(28, "Product", data.product);
    setFieldRow(29, "Quantity", data.quantity);
    setFieldRow(30, "Price", data.oc_sellingPrice);
    setFieldRow(31, "Delivery Mode", data.deliveryMode);

    /* ── Rows 33–35: Sellers / Buyers / Supplier ────────────────────────── */
    setFieldRow(33, "Sellers", "Asean International DMCC");
    setFieldRow(34, "Buyers", data.oc_buyers);
    setFieldRow(35, "Supplier", data.physicalSupplier);

    /* ── Row 37: Agents ─────────────────────────────────────────────────── */
    setFieldRow(37, "Agents", data.agents);

    /* ── Row 39: Remarks (OC has Remarks before Payment) ───────────────── */
    setFieldRow(39, "Remarks:", data.oc_remarks || "-");

    /* ── Row 41: Payment ────────────────────────────────────────────────── */
    setFieldRow(41, "Payment", data.oc_paymentTerms);

    /* ── Row 43: Kind regards ───────────────────────────────────────────── */
    setCell(43, 2, "Kind regards", FONT_11);

    /* ── Row 45: Signatory ──────────────────────────────────────────────── */
    setCell(45, 2, data.signatory || "Sahir Jamal", FONT_11);

    /* ── PAGE 2: Company address (G52:K57) ──────────────────────────────── */
    setAddressRow(52, "ASEAN INTERNATIONAL DMCC");
    setAddressRow(53, "Unit No 2909");
    setAddressRow(54, "JBC 1, Cluster G,");
    setAddressRow(55, "Jumeirah Lake Towers,");
    setAddressRow(56, "Dubai, U.A.E.");
    setAddressRow(57, "bunkers@asean.ae");

    /* ── PAGE 2: NOTES block (rows 63–70) ───────────────────────────────── */
    setNotesRow(63, "NOTES", FONT_10_5_BOLD_UL);
    setNotesRow(65, "Asean operations (e-mail):     bunkers@asean.ae", FONT_10_5);
    setNotesRow(67, "Please confirm the good receipt of above email and immediately identify us of any errors else the same will be treated as correct & accepted by you", FONT_10_5, true);

    for (const emptyRow of [64, 66, 68]) {
      ws.mergeCells(emptyRow, 2, emptyRow, 10);
      for (let c = 2; c <= 10; c++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ws.getCell(emptyRow, c).fill = WHITE_FILL as any;
      }
    }

    /* ── PAGE 2: REMARKS block ──────────────────────────────────────────── */
    setNotesRow(70, "REMARKS", FONT_10_5_BOLD_UL);
    setNotesRow(72, "-Sale is subject to BIMCO 2018 terms and conditions", FONT_10_5_ITALIC);
    setNotesRow(73, "-Supply by barge is subject to weather condition.", FONT_10_5_ITALIC);
    setNotesRow(74, "-Supply barge sounding are final & binding to both parties.", FONT_10_5_ITALIC);
    setNotesRow(75, "-Cancellation charges applicable if the order is cancelled or reduction in Qty", FONT_10_5_ITALIC);
    setNotesRow(76, "-Kindly note for delay in payments received an Interest at 2% per calendar month or pro rata shall be levied from due-date", FONT_10_5_ITALIC, true);
    setNotesRow(77, "-The Seller/ Supplier warrants that the bunker to be supplied and / or the crude oil from which it is produced is not originating from Iran.", FONT_10_5_ITALIC, true);

    for (const emptyRow of [69, 71]) {
      ws.mergeCells(emptyRow, 2, emptyRow, 10);
      for (let c = 2; c <= 10; c++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ws.getCell(emptyRow, c).fill = WHITE_FILL as any;
      }
    }

    /* ── Row 91–92: Footer ──────────────────────────────────────────────── */
    ws.mergeCells("B91:J92");
    const footerCell = ws.getCell("B91");
    footerCell.value = "Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com";
    footerCell.font = {
      name: "Calibri",
      size: 10.5,
      bold: false,
      italic: true,
      color: { argb: "FF000000" },
    };
    footerCell.alignment = { horizontal: "center", wrapText: true };

    /* ── Generate and download ──────────────────────────────────────────── */
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const vesselFirst = (data.vesselNameImo || "Vessel").split(/\s+/)[0];
    const portFirst = (data.port || "Port").split(/[,\s]+/)[0];
    const dateStr = data.date || "NoDate";
    a.download = `Order_Confirmation_${vesselFirst}_${portFirst}_${dateStr}.xlsx`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("OC Excel generation failed:", err);
    toast.error("Failed to generate OC Excel file");
  }
}
