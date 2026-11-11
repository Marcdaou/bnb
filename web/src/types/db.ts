// SHARED CONTRACT — all agents must use these shapes. Mirrors supabase/migrations.
export type Category = 'Beach' | 'Cabins' | 'City' | 'Countryside' | 'Pools' | 'Mountains' | 'Lakefront' | 'Tropical';
export const CATEGORIES: Category[] = ['Beach','Cabins','City','Countryside','Pools','Mountains','Lakefront','Tropical'];

export interface Profile { id: string; full_name: string | null; avatar_url: string | null; created_at: string; }

export interface Listing {
  id: string; host_id: string | null; title: string; description: string;
  city: string; country: string; lat: number; lng: number;
  price_per_night: number; // whole USD
  cleaning_fee: number;    // whole USD
  max_guests: number; bedrooms: number; beds: number; baths: number;
  category: Category; amenities: string[];
  rating: number; review_count: number; host_name: string; host_avatar: string | null;
  created_at: string;
}
export interface ListingImage { id: string; listing_id: string; url: string; position: number; }
export type ListingWithImages = Listing & { listing_images: ListingImage[] };

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export interface Booking {
  id: string; listing_id: string; guest_id: string;
  check_in: string; check_out: string; // 'YYYY-MM-DD'
  guests: number; total_price: number; status: BookingStatus;
  stripe_session_id: string | null; created_at: string;
}
export type BookingWithListing = Booking & { listings: ListingWithImages };

export interface Review { id: string; listing_id: string; author_name: string; author_avatar: string | null; rating: number; comment: string; created_at: string; }
export interface Wishlist { user_id: string; listing_id: string; created_at: string; }

// Edge functions (invoke via supabase.functions.invoke, user JWT attached automatically)
// 'create-checkout-session' body: { listing_id, check_in, check_out, guests } -> { url: string, booking_id: string } | { error }
// 'confirm-booking'        body: { session_id }                              -> { booking: Booking } | { error }
// Service fee: 12% of nights*price, rounded. total = nights*price + cleaning_fee + service_fee.
export const SERVICE_FEE_RATE = 0.12;
// RPC: get_unavailable_ranges(p_listing_id uuid) -> { check_in, check_out }[] (confirmed + pending<30min bookings)
