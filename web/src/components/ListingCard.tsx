import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import type { ListingWithImages } from '../types/db';
import { useWishlist } from '../hooks/useWishlist';
import { formatPrice } from '../lib/format';

const FALLBACK = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=60';

interface Props {
  listing: ListingWithImages;
  /** Optional: pass from parent to avoid one wishlist fetch per card. */
  wishlist?: { ids: Set<string>; toggle: (id: string) => void };
}

function OwnWishlistCard(props: Props) {
  const w = useWishlist();
  return <CardInner {...props} wishlist={w} />;
}

export default function ListingCard(props: Props) {
  return props.wishlist ? <CardInner {...props} /> : <OwnWishlistCard {...props} />;
}

function CardInner({ listing, wishlist }: Props) {
  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position);
  const urls = images.length ? images.map(i => i.url) : [FALLBACK];
  const [idx, setIdx] = useState(0);
  const saved = wishlist!.ids.has(listing.id);

  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault(); e.stopPropagation();
    setIdx(i => (i + d + urls.length) % urls.length);
  };

  return (
    <Link to={`/listing/${listing.id}`} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
        <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {urls.map((u, i) => (
            <img key={u + i} src={u} alt={i === 0 ? listing.title : ''} loading="lazy"
              className="w-full h-full object-cover shrink-0" />
          ))}
        </div>
        <button aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={e => { e.preventDefault(); e.stopPropagation(); wishlist!.toggle(listing.id); }}
          className="absolute top-3 right-3 p-1 transition-transform active:scale-90">
          <Heart size={24} strokeWidth={2} className={saved ? 'fill-brand text-white' : 'fill-black/40 text-white'} />
        </button>
        {urls.length > 1 && (
          <>
            {idx > 0 && (
              <button aria-label="Previous photo" onClick={e => go(e, -1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-white/90 shadow opacity-0 group-hover:opacity-100 hover:scale-105 transition">
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
            )}
            {idx < urls.length - 1 && (
              <button aria-label="Next photo" onClick={e => go(e, 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-white/90 shadow opacity-0 group-hover:opacity-100 hover:scale-105 transition">
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            )}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
              {urls.slice(0, 5).map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === Math.min(idx, 4) ? 'bg-white' : 'bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-3 text-[15px] leading-5">
        <div className="flex justify-between gap-2">
          <h3 className="font-semibold truncate">{listing.city}, {listing.country}</h3>
          {listing.review_count > 0 ? (
            <span className="flex items-center gap-1 shrink-0"><Star size={13} className="fill-ink" />{Number(listing.rating).toFixed(2)}</span>
          ) : <span className="shrink-0">New</span>}
        </div>
        <p className="text-muted truncate">{listing.title}</p>
        <p className="text-muted">{listing.beds} bed{listing.beds !== 1 ? 's' : ''} · {listing.max_guests} guests</p>
        <p className="mt-1"><span className="font-semibold">{formatPrice(listing.price_per_night)}</span> night</p>
      </div>
    </Link>
  );
}
