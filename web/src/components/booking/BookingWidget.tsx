import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DayPicker, type DateRange, type Matcher } from 'react-day-picker';
import 'react-day-picker/style.css';
import { addDays, differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import { Minus, Plus, Star, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Listing } from '../../types/db';
import { breakdown, usd } from './money';

type Range = { check_in: string; check_out: string };

export default function BookingWidget({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [blocked, setBlocked] = useState<Range[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('get_unavailable_ranges', { p_listing_id: listing.id }).then(({ data }) => {
      if (data) setBlocked(data as Range[]);
    });
  }, [listing.id]);

  // A booked stay blocks nights check_in .. check_out-1
  const disabled: Matcher[] = useMemo(
    () => [
      { before: startOfToday() },
      ...blocked.map((r) => ({ from: parseISO(r.check_in), to: addDays(parseISO(r.check_out), -1) })),
    ],
    [blocked],
  );

  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const b = breakdown(listing, nights);

  async function reserve() {
    setError(null);
    if (!range?.from || !range?.to || nights < 1) return setError('Select check-in and check-out dates.');
    if (!user) return navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    setBusy(true);
    const { data, error: err } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        listing_id: listing.id,
        check_in: format(range.from, 'yyyy-MM-dd'),
        check_out: format(range.to, 'yyyy-MM-dd'),
        guests,
      },
    });
    if (err || !data?.url) {
      const status = (err as { context?: Response } | null)?.context?.status;
      let msg = data?.error ?? err?.message ?? 'Something went wrong.';
      try {
        const body = await (err as { context?: Response })?.context?.clone().json();
        if (body?.error) msg = body.error;
      } catch { /* ignore */ }
      setError(status === 409 ? 'Those dates are no longer available. Please pick different dates.' : msg);
      setBusy(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-baseline justify-between">
        <p>
          <span className="text-2xl font-semibold">{usd(listing.price_per_night)}</span>
          <span className="text-gray-600"> night</span>
        </p>
        <p className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-current" /> {Number(listing.rating).toFixed(2)}
          <span className="text-gray-500">· {listing.review_count} reviews</span>
        </p>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-400 text-xs">
        <div className="border-r border-gray-400 p-3">
          <p className="font-bold uppercase">Check-in</p>
          <p className="text-sm">{range?.from ? format(range.from, 'MMM d, yyyy') : 'Add date'}</p>
        </div>
        <div className="p-3">
          <p className="font-bold uppercase">Checkout</p>
          <p className="text-sm">{range?.to ? format(range.to, 'MMM d, yyyy') : 'Add date'}</p>
        </div>
      </div>

      <div className="my-3 flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={disabled}
          excludeDisabled
          min={1}
          numberOfMonths={1}
          style={{ '--rdp-accent-color': '#e11d48', '--rdp-accent-background-color': '#ffe4e6' } as React.CSSProperties}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-400 p-3">
        <div>
          <p className="text-xs font-bold uppercase">Guests</p>
          <p className="text-sm">{guests} guest{guests > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Fewer guests" disabled={guests <= 1} onClick={() => setGuests((g) => g - 1)}
            className="rounded-full border p-1.5 disabled:opacity-30 hover:border-gray-900"><Minus className="h-4 w-4" /></button>
          <span className="w-4 text-center">{guests}</span>
          <button aria-label="More guests" disabled={guests >= listing.max_guests} onClick={() => setGuests((g) => g + 1)}
            className="rounded-full border p-1.5 disabled:opacity-30 hover:border-gray-900"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">Up to {listing.max_guests} guests</p>

      <button onClick={reserve} disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 font-semibold text-white transition hover:brightness-95 disabled:opacity-70">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Reserve
      </button>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-center text-sm text-gray-500">You won't be charged yet</p>

      {nights > 0 && (
        <div className="mt-4 space-y-3 text-gray-700">
          <Row label={`${usd(listing.price_per_night)} x ${nights} night${nights > 1 ? 's' : ''}`} value={usd(b.subtotal)} />
          <Row label="Cleaning fee" value={usd(b.cleaning)} />
          <Row label="Staybnb service fee" value={usd(b.service)} />
          <div className="flex justify-between border-t pt-4 font-semibold text-gray-900">
            <span>Total</span><span>{usd(b.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="underline">{label}</span><span>{value}</span></div>;
}
