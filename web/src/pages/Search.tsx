import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CategoryBar from '../components/CategoryBar';
import ListingGrid, { SkeletonGrid } from '../components/ListingGrid';
import { supabase } from '../lib/supabase';
import type { ListingWithImages } from '../types/db';

type Range = { check_in: string; check_out: string };
const overlaps = (r: Range, a: string, b: string) => r.check_in < b && r.check_out > a;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const city = params.get('city') ?? '';
  const checkIn = params.get('check_in') ?? '';
  const checkOut = params.get('check_out') ?? '';
  const guests = Number(params.get('guests') ?? 0) || 0;
  const category = params.get('category') ?? '';
  const minPrice = params.get('min_price') ?? '';
  const maxPrice = params.get('max_price') ?? '';

  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [listings, setListings] = useState<ListingWithImages[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMinInput(minPrice); setMaxInput(maxPrice); }, [minPrice, maxPrice]);

  useEffect(() => {
    let active = true;
    setListings(null); setError(null);
    (async () => {
      let q = supabase.from('listings').select('*, listing_images(*)')
        .order('rating', { ascending: false })
        .order('position', { referencedTable: 'listing_images', ascending: true });
      if (city) q = q.or(`city.ilike.%${city.replace(/[,()%]/g, '')}%,country.ilike.%${city.replace(/[,()%]/g, '')}%`);
      if (guests) q = q.gte('max_guests', guests);
      if (category) q = q.eq('category', category);
      if (minPrice) q = q.gte('price_per_night', Number(minPrice));
      if (maxPrice) q = q.lte('price_per_night', Number(maxPrice));
      const { data, error } = await q;
      if (error) { if (active) setError(error.message); return; }
      let rows = (data ?? []) as ListingWithImages[];
      if (checkIn && checkOut && checkIn < checkOut) {
        const results = await Promise.all(rows.map(l =>
          supabase.rpc('get_unavailable_ranges', { p_listing_id: l.id })
            .then(({ data }) => ((data ?? []) as Range[]).some(r => overlaps(r, checkIn, checkOut)))));
        rows = rows.filter((_, i) => !results[i]);
      }
      if (active) setListings(rows);
    })();
    return () => { active = false; };
  }, [city, guests, category, minPrice, maxPrice, checkIn, checkOut]);

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (minInput) next.set('min_price', minInput); else next.delete('min_price');
    if (maxInput) next.set('max_price', maxInput); else next.delete('max_price');
    setParams(next);
  };

  const dateLabel = checkIn && checkOut
    ? `${format(parseISO(checkIn), 'MMM d')} – ${format(parseISO(checkOut), 'MMM d')}` : null;
  const summary = [city && `in ${city}`, dateLabel, guests ? `${guests} guest${guests > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ');
  const priceInput = 'w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <>
      <CategoryBar />
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 xl:px-20 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              {listings ? `${listings.length} stay${listings.length !== 1 ? 's' : ''}` : 'Searching…'}
              {summary && <span className="font-normal text-muted"> {summary}</span>}
            </h1>
            {category && <p className="text-sm text-muted mt-1">Category: {category}</p>}
          </div>
          <form onSubmit={applyPrice} className="flex items-center gap-2">
            <input type="number" min={0} placeholder="Min $" value={minInput} onChange={e => setMinInput(e.target.value)} className={priceInput} aria-label="Minimum price" />
            <span className="text-muted">–</span>
            <input type="number" min={0} placeholder="Max $" value={maxInput} onChange={e => setMaxInput(e.target.value)} className={priceInput} aria-label="Maximum price" />
            <button className="px-4 py-2 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-black">Apply</button>
          </form>
        </div>
        {error ? (
          <p className="text-center py-20 text-muted">Search failed: {error}</p>
        ) : !listings ? (
          <SkeletonGrid />
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <SearchX className="mx-auto text-muted" size={40} />
            <h2 className="mt-4 text-xl font-semibold">No exact matches</h2>
            <p className="text-muted mt-1">Try changing or removing some of your filters or adjusting your search area.</p>
            <Link to="/" className="inline-block mt-5 px-5 py-2.5 rounded-lg border border-ink font-semibold hover:bg-gray-50">Explore all stays</Link>
          </div>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </div>
    </>
  );
}
