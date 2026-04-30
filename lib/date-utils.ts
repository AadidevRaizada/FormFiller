const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Ordinal suffix for a day number (handles 11th, 12th, 13th correctly). */
function ordinalSuffix(day: number): string {
  const n = day % 100;
  if (n >= 11 && n <= 13) return "th";
  return ["th", "st", "nd", "rd"][day % 10] ?? "th";
}

/** Format a Date as "29th January 2026" */
export function formatOrdinal(d: Date): string {
  const day = d.getDate();
  return `${day}${ordinalSuffix(day)} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Parse an ordinal date string ("29th January 2026") back to ISO "YYYY-MM-DD".
 * Returns "" if unparseable.
 */
export function parseOrdinalDate(s: string): string {
  if (!s) return "";
  const m = s.match(/(\d+)\w{0,2}\s+(\w+)\s+(\d{4})/);
  if (!m) return "";
  const day = parseInt(m[1], 10);
  const monthIdx = MONTHS_LONG.findIndex((mo) =>
    mo.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3))
  );
  if (monthIdx === -1) return "";
  return `${m[3]}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Format an ISO date string "YYYY-MM-DD" to "29th January 2026".
 * Returns "" if empty/invalid.
 */
export function isoToOrdinal(iso: string): string {
  if (!iso) return "";
  const [y, mo, d] = iso.split("-").map(Number);
  if (!y || !mo || !d) return "";
  return formatOrdinal(new Date(y, mo - 1, d));
}

/**
 * Format an ETA value that may be a range.
 * Single: "14th Feb 2026"  (we keep whatever format was stored)
 * Range:  "30th Apr – 2nd May 2026"
 *
 * Given two ISO strings (fromIso, toIso), returns the combined ordinal string.
 * If toIso is empty, returns just the from date.
 */
export function formatEta(fromIso: string, toIso: string): string {
  const from = isoToOrdinal(fromIso);
  if (!from) return "";
  if (!toIso) return from;
  const to = isoToOrdinal(toIso);
  return to ? `${from} – ${to}` : from;
}

/**
 * Parse a stored ETA string back to { fromIso, toIso }.
 * Handles single dates and ranges split by " – ".
 */
export function parseEta(eta: string): { fromIso: string; toIso: string } {
  if (!eta) return { fromIso: "", toIso: "" };
  const parts = eta.split(" – ");
  return {
    fromIso: parseOrdinalDate(parts[0] ?? ""),
    toIso: parseOrdinalDate(parts[1] ?? ""),
  };
}
