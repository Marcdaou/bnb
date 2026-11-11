import { SERVICE_FEE_RATE, type Listing } from '../../types/db';

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function breakdown(listing: Pick<Listing, 'price_per_night' | 'cleaning_fee'>, nights: number) {
  const subtotal = nights * listing.price_per_night;
  const service = Math.round(subtotal * SERVICE_FEE_RATE);
  const cleaning = nights > 0 ? listing.cleaning_fee : 0;
  return { subtotal, cleaning, service, total: subtotal + cleaning + service };
}
