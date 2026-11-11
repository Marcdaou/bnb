import type { ListingWithImages } from '../types/db';
import ListingCard from './ListingCard';
import { useWishlist } from '../hooks/useWishlist';

export const GRID = 'grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5';

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-xl bg-gray-200" />
          <div className="mt-3 h-4 w-2/3 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ListingGrid({ listings }: { listings: ListingWithImages[] }) {
  const wishlist = useWishlist();
  return (
    <div className={GRID}>
      {listings.map(l => <ListingCard key={l.id} listing={l} wishlist={wishlist} />)}
    </div>
  );
}
