import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, startOfToday } from 'date-fns';
import { Luggage } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { BookingStatus, BookingWithListing } from '../types/db';
import RequireLogin from '../components/booking/RequireLogin';
import { usd } from '../components/booking/money';

const BADGE: Record<BookingStatus, string> = {
  confirmed: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', cancelled: 'bg-gray-200 text-gray-700',
};

function TripsInner() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<BookingWithListing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('bookings').select('*, listings(*, listing_images(*))').eq('guest_id', user.id)
      .order('check_in', { ascending: true })
      .then(({ data }) => setTrips((data as BookingWithListing[]) ?? []));
  }, [user]);

  if (!trips) return <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />)}</div>;
  const today = startOfToday();
  const upcoming = trips.filter((t) => parseISO(t.check_out) >= today);
  const past = trips.filter((t) => parseISO(t.check_out) < today).reverse();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold">Trips</h1>
      {trips.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center">
          <Luggage className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h2 className="mb-1 text-xl font-semibold">No trips booked… yet!</h2>
          <p className="mb-6 text-gray-600">Time to dust off your bags and start planning your next adventure.</p>
          <Link to="/" className="rounded-lg border border-gray-900 px-5 py-3 font-semibold hover:bg-gray-50">Start searching</Link>
        </div>
      ) : (
        <>
          <Section title="Upcoming" trips={upcoming} empty="No upcoming trips." />
          <Section title="Past" trips={past} empty="No past trips." />
        </>
      )}
    </div>
  );
}

function Section({ title, trips, empty }: { title: string; trips: BookingWithListing[]; empty: string }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {trips.length === 0 ? <p className="text-gray-600">{empty}</p> : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {trips.map((t) => {
            const img = t.listings?.listing_images?.slice().sort((a, b) => a.position - b.position)[0]?.url;
            return (
              <Link key={t.id} to={`/listing/${t.listing_id}`} className="flex overflow-hidden rounded-2xl border border-gray-200 transition hover:shadow-lg">
                <div className="w-36 shrink-0 bg-gray-100 sm:w-44">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1 p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{t.listings?.city}, {t.listings?.country}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${BADGE[t.status]}`}>{t.status}</span>
                  </div>
                  <p className="mb-3 truncate text-sm text-gray-600">{t.listings?.title}</p>
                  <p className="text-sm">{format(parseISO(t.check_in), 'MMM d')} – {format(parseISO(t.check_out), 'MMM d, yyyy')}</p>
                  <p className="text-sm text-gray-600">{t.guests} guest{t.guests > 1 ? 's' : ''} · {usd(t.total_price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Trips() { return <RequireLogin><TripsInner /></RequireLogin>; }
