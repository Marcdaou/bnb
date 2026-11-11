import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import CategoryBar from '../components/CategoryBar';
import ListingGrid, { SkeletonGrid } from '../components/ListingGrid';
import { supabase } from '../lib/supabase';
import type { ListingWithImages } from '../types/db';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category');
  const [listings, setListings] = useState<ListingWithImages[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setListings(null); setError(null);
    let q = supabase.from('listings').select('*, listing_images(*)')
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'listing_images', ascending: true });
    if (category) q = q.eq('category', category);
    q.then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message); else setListings((data ?? []) as ListingWithImages[]);
    });
    return () => { active = false; };
  }, [category]);

  return (
    <>
      <CategoryBar />
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 xl:px-20 pt-6">
        {error ? (
          <p className="text-center py-20 text-muted">Couldn't load stays: {error}</p>
        ) : !listings ? (
          <SkeletonGrid />
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <SearchX className="mx-auto text-muted" size={40} />
            <h2 className="mt-4 text-xl font-semibold">No stays here yet</h2>
            <p className="text-muted mt-1">Try a different category.</p>
            {category && (
              <button onClick={() => setParams({})} className="mt-5 px-5 py-2.5 rounded-lg border border-ink font-semibold hover:bg-gray-50">
                Show all stays
              </button>
            )}
          </div>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </div>
    </>
  );
}
