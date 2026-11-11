import { differenceInCalendarDays, parseISO } from 'date-fns';
import { SERVICE_FEE_RATE, type Listing } from '../types/db';

export function formatPrice(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** Nights between two dates ('YYYY-MM-DD' strings or Date). Never negative. */
export function nightsBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === 'string' ? parseISO(a) : a;
  const db = typeof b === 'string' ? parseISO(b) : b;
  return Math.max(0, differenceInCalendarDays(db, da));
}

export function priceBreakdown(listing: Pick<Listing, 'price_per_night' | 'cleaning_fee'>, nights: number) {
  const subtotal = nights * listing.price_per_night;
  const cleaning = nights > 0 ? listing.cleaning_fee : 0;
  const service = Math.round(subtotal * SERVICE_FEE_RATE);
  return { subtotal, cleaning, service, total: subtotal + cleaning + service };
}
