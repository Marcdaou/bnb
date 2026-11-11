-- SCRUM-12: batched availability check for /search (replaces N calls to get_unavailable_ranges).
-- Status rule must stay in sync with get_unavailable_ranges (0001_schema.sql).
create or replace function public.unavailable_listing_ids(p_listing_ids uuid[], p_check_in date, p_check_out date)
returns setof uuid language sql stable security definer set search_path = '' as $$
  select distinct b.listing_id from public.bookings b
  where b.listing_id = any(p_listing_ids)
    and (b.status = 'confirmed'
         or (b.status = 'pending' and b.created_at > now() - interval '30 minutes'))  -- same rule as get_unavailable_ranges
    and b.check_in < p_check_out and b.check_out > p_check_in;
$$;
revoke execute on function public.unavailable_listing_ids(uuid[], date, date) from public;
grant execute on function public.unavailable_listing_ids(uuid[], date, date) to anon, authenticated;
