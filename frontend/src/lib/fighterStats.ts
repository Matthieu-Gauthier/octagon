/** Strip trailing .0 / .00 from a numeric string */
function stripZeroDecimals(s: string): string {
  return s.replace(/\.0+(?!\d)/g, '');
}

/** Height: "6' 2\"" or raw inches like "74.0" → 6'2" */
export function fmtHeight(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.includes("'")) {
    return raw.replace(/'\s*/g, "'").replace(/"\s*/g, '"').replace(/\s+/g, '').replace(/\.0+"/g, '"');
  }
  const inches = parseFloat(raw);
  if (isNaN(inches)) return raw;
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return `${ft}'${inch}"`;
}

/** Reach: "74.0\"" or "74.0 in." or plain "74.0" → 74" */
export function fmtReach(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return undefined;
  return `${stripZeroDecimals(String(Math.round(num * 10) / 10))}"`;
}

/** Weight: "170.5 lbs." or "170" → 170 lbs */
export function fmtWeight(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return undefined;
  return `${stripZeroDecimals(String(Math.round(num * 10) / 10))} lbs`;
}
