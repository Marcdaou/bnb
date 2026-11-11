import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CategoryBar from '../components/CategoryBar';
import DatePrompt from '../components/DatePrompt';
import ListingGrid, { SkeletonGrid } from '../components/ListingGrid';
import { supabase } from '../lib/supabase';
import { overlaps, parseDateRange, parseGuests, parsePrice, type Range } from '../lib/search';
import type { ListingWithImages } from '../types/db';

/** Rows unavailable for [checkIn, checkOut). Falls back to the per-listing RPC while migration 0002 is not applied (PGRST202). */
async function unavailableIds(ids: string[], checkIn: string, checkOut: string): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('unavailable_listing_ids', { p_listing_ids: ids, p_check_in: checkIn, p_check_out: checkOut });
  if (!error) return new Set((data ?? []) as string[]);
  if (error.code !== 'PGRST202') throw new Error(error.message);
  const results = await Promise.all(ids.map(id =>
    supabase.rpc('get_unavailable_ranges', { p_listing_id: id }).then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return ((data ?? []) as Range[]).some(r => overlaps(r, checkIn, checkOut));
    })));
  return new Set(ids.filter((_, i) => results[i]));
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const city = params.get('city') ?? '';
  const checkIn = params.get('check_in') ?? '';
  const checkOut = params.get('check_out') ?? '';
  const guests = parseGuests(params.get('guests'));
  const category = params.get('category') ?? '';
  const minPrice = params.get('min_price') ?? '';
  const maxPrice = params.get('max_price') ?? '';
  const minValue = parsePrice(minPrice);
  const maxValue = parsePrice(maxPrice);
  const { range, partial: datesPartial } = parseDateRange(checkIn, checkOut);
  const rangeIn = range?.checkIn ?? '';
  const rangeOut = range?.checkOut ?? '';

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
      if (minValue !== null) q = q.gte('price_per_night', minValue);
      if (maxValue !== null) q = q.lte('price_per_night', maxValue);
      const { data, error } = await q;
      if (error) { if (active) setError(error.message); return; }
      let rows = (data ?? []) as ListingWithImages[];
      if (rangeIn && rangeOut && rows.length > 0) {
        try {
          const blocked = await unavailableIds(rows.map(r => r.id), rangeIn, rangeOut);
          rows = rows.filter(r => !blocked.has(r.id));
        } catch (e) {
          if (active) setError((e as Error).message);
          return;
        }
      }
      if (active) setListings(rows);
    })();
    return () => { active = false; };
  }, [city, guests, category, minValue, maxValue, rangeIn, rangeOut]);

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (minInput) next.set('min_price', minInput); else next.delete('min_price');
    if (maxInput) next.set('max_price', maxInput); else next.delete('max_price');
    setParams(next);
  };

  const clearPrice = () => {
    const next = new URLSearchParams(params);
    next.delete('min_price'); next.delete('max_price');
    setParams(next);
  };

  const dateLabel = range
    ? `${format(parseISO(range.checkIn), 'MMM d')} – ${format(parseISO(range.checkOut), 'MMM d')}` : null;
  const hasPriceFilter = Boolean(minPrice || maxPrice);
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
        {datesPartial && <DatePrompt />}
        {error ? (
          <p className="text-center py-20 text-muted">Search failed: {error}</p>
        ) : !listings ? (
          <SkeletonGrid />
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <SearchX className="mx-auto text-muted" size={40} />
            <h2 className="mt-4 text-xl font-semibold">No exact matches</h2>
            <p className="text-muted mt-1">Try changing or removing some of your filters or adjusting your search area.</p>
            {hasPriceFilter && (
              <button type="button" onClick={clearPrice} className="inline-block mt-5 mr-3 px-5 py-2.5 rounded-lg bg-ink text-white font-semibold hover:bg-black">Clear price filter</button>
            )}
            <Link to="/" className="inline-block mt-5 px-5 py-2.5 rounded-lg border border-ink font-semibold hover:bg-gray-50">Explore all stays</Link>
          </div>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </div>
    </>
  );
}
