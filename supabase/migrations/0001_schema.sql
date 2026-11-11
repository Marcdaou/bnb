-- Staybnb schema
create extension if not exists btree_gist with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  price_per_night int not null check (price_per_night > 0),
  cleaning_fee int not null default 0 check (cleaning_fee >= 0),
  max_guests int not null check (max_guests > 0),
  bedrooms int not null,
  beds int not null,
  baths int not null,
  category text not null check (category in ('Beach','Cabins','City','Countryside','Pools','Mountains','Lakefront','Tropical')),
  amenities text[] not null default '{}',
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  host_name text not null,
  host_avatar text,
  created_at timestamptz not null default now()
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests int not null check (guests > 0),
  total_price int not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  stripe_session_id text unique,
  created_at timestamptz not null default now(),
  constraint bookings_dates_chk check (check_out > check_in),
  constraint bookings_no_overlap exclude using gist (
    listing_id with =, daterange(check_in, check_out, '[)') with &&
  ) where (status = 'confirmed')
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Indexes
create index listings_host_id_idx on public.listings(host_id);
create index listings_city_idx on public.listings(city);
create index listings_category_idx on public.listings(category);
create index listing_images_listing_id_idx on public.listing_images(listing_id, position);
create index bookings_listing_id_idx on public.bookings(listing_id);
create index bookings_guest_id_idx on public.bookings(guest_id);
create index reviews_listing_id_idx on public.reviews(listing_id);
create index wishlists_listing_id_idx on public.wishlists(listing_id);

-- Profile trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;

create policy "listings public read" on public.listings for select using (true);
create policy "listing_images public read" on public.listing_images for select using (true);
create policy "reviews public read" on public.reviews for select using (true);
create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "bookings select own" on public.bookings for select to authenticated
  using ((select auth.uid()) = guest_id);
create policy "wishlists select own" on public.wishlists for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "wishlists insert own" on public.wishlists for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "wishlists delete own" on public.wishlists for delete to authenticated
  using ((select auth.uid()) = user_id);

-- RPC
create or replace function public.get_unavailable_ranges(p_listing_id uuid)
returns table(check_in date, check_out date)
language sql stable security definer set search_path = '' as $$
  select b.check_in, b.check_out from public.bookings b
  where b.listing_id = p_listing_id
    and (b.status = 'confirmed'
         or (b.status = 'pending' and b.created_at > now() - interval '30 minutes'))
  order by b.check_in;
$$;
revoke execute on function public.get_unavailable_ranges(uuid) from public;
grant execute on function public.get_unavailable_ranges(uuid) to anon, authenticated;
