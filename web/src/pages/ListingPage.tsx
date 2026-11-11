import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { MapPin, Star, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ListingWithImages, Review } from '../types/db';
import BookingWidget from '../components/booking/BookingWidget';
import PhotoGallery from '../components/listing/PhotoGallery';
import Amenities from '../components/listing/Amenities';
import Avatar from '../components/listing/Avatar';

export default function ListingPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [listing, setListing] = useState<ListingWithImages | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('listings').select('*, listing_images(*)').eq('id', id).maybeSingle(),
      supabase.from('reviews').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
    ]).then(([l, r]) => {
      setListing(l.data as ListingWithImages | null);
      setReviews((r.data as Review[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
      <div className="mb-4 h-8 w-1/2 rounded bg-gray-200" /><div className="h-[440px] rounded-2xl bg-gray-200" />
    </div>
  );
  if (!listing) return <div className="py-24 text-center text-gray-600">Listing not found.</div>;

  const cancelled = params.get('cancelled') === '1';

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {cancelled && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm">Your payment was cancelled and you have not been charged. Your dates are still open to book.</p>
          <button aria-label="Dismiss" onClick={() => { params.delete('cancelled'); setParams(params, { replace: true }); }}><X className="h-4 w-4" /></button>
        </div>
      )}
      <h1 className="mb-2 text-2xl font-semibold md:text-3xl">{listing.title}</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Star className="h-4 w-4 fill-current" /><span className="font-semibold">{Number(listing.rating).toFixed(2)}</span>
        <span>·</span><span className="underline">{listing.review_count} reviews</span><span>·</span>
        <span className="font-medium underline">{listing.city}, {listing.country}</span>
      </div>

      <PhotoGallery images={listing.listing_images} title={listing.title} />

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b pb-6">
            <div>
              <h2 className="text-xl font-semibold">{listing.category} stay hosted by {listing.host_name}</h2>
              <p className="text-gray-600">
                {listing.max_guests} guests · {listing.bedrooms} bedroom{listing.bedrooms !== 1 && 's'} · {listing.beds} bed{listing.beds !== 1 && 's'} · {listing.baths} bath{listing.baths !== 1 && 's'}
              </p>
            </div>
            <Avatar src={listing.host_avatar} name={listing.host_name} size={56} />
          </div>
          <p className="whitespace-pre-line border-b py-8 leading-relaxed text-gray-800">{listing.description}</p>
          <section className="border-b py-8">
            <h3 className="mb-6 text-xl font-semibold">What this place offers</h3>
            <Amenities amenities={listing.amenities ?? []} />
          </section>
          <section className="border-b py-8">
            <h3 className="mb-4 text-xl font-semibold">Where you'll be</h3>
            <p className="flex items-center gap-2 text-gray-800"><MapPin className="h-5 w-5" />{listing.city}, {listing.country}</p>
          </section>
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start"><BookingWidget listing={listing} /></aside>
      </div>

      <section className="border-t py-10 mt-4">
        <h3 className="mb-8 flex items-center gap-2 text-xl font-semibold">
          <Star className="h-5 w-5 fill-current" />{Number(listing.rating).toFixed(2)} · {listing.review_count} reviews
        </h3>
        {reviews.length === 0 ? <p className="text-gray-600">No reviews yet.</p> : (
          <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id}>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar src={r.author_avatar} name={r.author_name} />
                  <div>
                    <p className="font-semibold">{r.author_name}</p>
                    <p className="text-sm text-gray-500">{format(parseISO(r.created_at), 'MMMM yyyy')}</p>
                  </div>
                </div>
                <div className="mb-2 flex">{Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-current' : 'text-gray-300'}`} />))}</div>
                <p className="leading-relaxed text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
