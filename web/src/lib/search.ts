import { format, isValid, parseISO } from 'date-fns';

export type Range = { check_in: string; check_out: string };

/** Half-open overlap: touching ranges (checkout == check-in) do not overlap. */
export const overlaps = (r: Range, checkIn: string, checkOut: string) =>
  r.check_in < checkOut && r.check_out > checkIn;

/** Strict yyyy-MM-dd that is a real calendar date (rejects 2027-02-30, 2027-13-01). */
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISO(s);
  return isValid(d) && format(d, 'yyyy-MM-dd') === s;
}

export type DateRangeResult = {
  range: { checkIn: string; checkOut: string } | null;
  /** true when some date input was given but no usable range came out of it. */
  partial: boolean;
};

export function parseDateRange(checkIn: string, checkOut: string): DateRangeResult {
  if (isIsoDate(checkIn) && isIsoDate(checkOut) && checkIn < checkOut) {
    return { range: { checkIn, checkOut }, partial: false };
  }
  return { range: null, partial: Boolean(checkIn || checkOut) };
}

/** Non-negative finite number, else null (filter ignored). */
export function parsePrice(s: string | null | undefined): number | null {
  if (s == null || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Positive integer guest count, else 0 (no guest filter). */
export function parseGuests(s: string | null | undefined): number {
  const n = Number(s ?? 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
