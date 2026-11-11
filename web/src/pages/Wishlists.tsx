import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import ListingCard from '../components/ListingCard';
import { GRID, SkeletonGrid } from '../components/ListingGrid';
import type { ListingWithImages } from '../types/db';
import RequireLogin from '../components/booking/RequireLogin';

function WishlistsInner() {
  const { user } = useAuth();
  const wishlist = useWishlist();
  const [listings, setListings] = useState<ListingWithImages[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('wishlists').select('created_at, listings(*, listing_images(*))').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setListings(((data ?? []) as unknown as { listings: ListingWithImages | null }[])
        .map((r) => r.listings).filter((l): l is ListingWithImages => !!l)));
  }, [user]);

  // Hide un-hearted items immediately (toggle is optimistic)
  const visible = listings?.filter((l) => wishlist.ids.has(l.id)) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold">Wishlists</h1>
      {!visible ? (
        <SkeletonGrid count={4} />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center">
          <Heart className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h2 className="mb-1 text-xl font-semibold">Create your first wishlist</h2>
          <p className="mb-6 text-gray-600">As you search, tap the heart icon to save your favorite places.</p>
          <Link to="/" className="rounded-lg border border-gray-900 px-5 py-3 font-semibold hover:bg-gray-50">Start exploring</Link>
        </div>
      ) : (
        <div className={GRID}>
          {visible.map((l) => <ListingCard key={l.id} listing={l} wishlist={wishlist} />)}
        </div>
      )}
    </div>
  );
}

export default function Wishlists() { return <RequireLogin><WishlistsInner /></RequireLogin>; }
