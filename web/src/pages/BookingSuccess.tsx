import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Booking, ListingWithImages } from '../types/db';
import { usd } from '../components/booking/money';

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const called = useRef(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    if (!sessionId) { setError('Missing checkout session.'); return; }
    (async () => {
      const { data, error: err } = await supabase.functions.invoke('confirm-booking', { body: { session_id: sessionId } });
      if (err || !data?.booking) {
        let msg = data?.error ?? err?.message ?? 'Could not confirm your booking.';
        try { const b = await (err as { context?: Response })?.context?.clone().json(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        setError(msg); return;
      }
      const bk = data.booking as Booking;
      setBooking(bk);
      const { data: l } = await supabase.from('listings').select('*, listing_images(*)').eq('id', bk.listing_id).maybeSingle();
      setListing(l as ListingWithImages | null);
    })();
  }, [sessionId]);

  if (error) return (
    <Center>
      <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
      <h1 className="mb-2 text-2xl font-semibold">We couldn't confirm your booking</h1>
      <p className="mb-6 text-gray-600">{error}</p>
      <Link to="/trips" className="font-semibold underline">Go to your trips</Link>
    </Center>
  );
  if (!booking) return (
    <Center><Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-rose-500" /><p className="text-gray-600">Confirming your reservation…</p></Center>
  );

  const img = listing?.listing_images?.slice().sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
        <h1 className="text-3xl font-semibold">You're going{listing ? ` to ${listing.city}` : ''}!</h1>
        <p className="mt-1 text-gray-600">Your reservation is {booking.status}.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
        {img && <img src={img} alt={listing?.title} className="h-56 w-full object-cover" />}
        <div className="space-y-4 p-6">
          {listing && <h2 className="text-lg font-semibold">{listing.title}</h2>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Check-in" value={format(parseISO(booking.check_in), 'EEE, MMM d, yyyy')} />
            <Field label="Checkout" value={format(parseISO(booking.check_out), 'EEE, MMM d, yyyy')} />
            <Field label="Guests" value={`${booking.guests} guest${booking.guests > 1 ? 's' : ''}`} />
            <Field label="Total paid" value={usd(booking.total_price)} />
          </div>
          <Link to="/trips" className="block rounded-xl bg-gray-900 py-3 text-center font-semibold text-white hover:bg-black">View my trips</Link>
        </div>
      </div>
    </div>
  );
}

const Center = ({ children }: { children: React.ReactNode }) => <div className="mx-auto max-w-md px-4 py-24 text-center">{children}</div>;
const Field = ({ label, value }: { label: string; value: string }) => (
  <div><p className="text-xs font-bold uppercase text-gray-500">{label}</p><p className="font-medium">{value}</p></div>
);
