# Spec: SCRUM-12 - Search listings by location and dates
Intent: ./intent.md   Design: ./design.md

Scope (per approved Decisions): verify and close gaps in the existing `/search` feature. Keep existing code; change only what fails a success criterion.

## Requirements
| ID | Requirement | Traces to (intent success criterion) |
|---|---|---|
| R1 | Header search bar submits location, check_in, check_out, guests to `/search` as URL params; bar is pre-filled from current URL params when on `/search`. | SC1 search bar opens /search with values; SC8 URL state |
| R2 | `city` param filters listings where city OR country matches case-insensitively (ilike); special chars sanitized. | SC2 location filter |
| R3 | When check_in and check_out are both valid ISO dates and check_in < check_out, listings with any booking range overlapping [check_in, check_out) are excluded; a booking whose check_out == search check_in (or check_in == search check_out) does NOT exclude. Overlap rule: `r.check_in < check_out && r.check_out > check_in`. | SC3 availability |
| R4 | Availability check uses a single batched query (new RPC, see API) instead of one `get_unavailable_ranges` call per listing. | SC3 (decision: availability-check performance) |
| R5 | Only one of check_in/check_out given, or check_in >= check_out, or unparseable date: dates are ignored for availability; results filter by location/guests/price; the "Pick both dates" prompt banner (Figma 2:340) is shown and summary omits dates. Date formatting must not crash on invalid params. | SC3 + Decision (half date range) |
| R6 | `guests` filters `max_guests >= guests`. | SC4 guests |
| R7 | Each result card shows photo, title, nightly price and rating ("New" when no reviews) - existing ListingCard. | SC5 card content |
| R8 | Zero results show the empty state (Figma 2:268): icon, "No exact matches", message, "Clear price filter" button (only if min/max price set) and "Explore all stays" link. | SC6 empty state |
| R9 | min_price / max_price filter `price_per_night` inclusive and combine (AND) with location, dates, guests, category; non-numeric values are ignored. | SC7 price filter |
| R10 | All criteria live in URL params (`city, check_in, check_out, guests, min_price, max_price, category`); reload/shared URL yields same results; Apply/Clear update the URL. | SC8 URL state |
| R11 | Works for anonymous visitors (all reads via anon key; RPC granted to anon). | Constraint: anonymous search |

## UI
- `/search` - `web/src/pages/Search.tsx` (changed): add date validation helper, DatePrompt banner (R5), empty-state copy + Clear price filter button (R8), call new RPC (R4). Figma 2:25, 2:268, 2:340, 2:498.
- `web/src/components/Header.tsx` (verify/changed): ensure fields initialize from URL params on `/search` (R1); when only one date set, check-out field highlighted (optional, Figma 2:340).
- `ListingCard` / `ListingGrid` - unchanged (Figma component 2:2).
- New small component (optional) `web/src/components/DatePrompt.tsx`: amber banner (`bg-orange-50 border-orange-300 rounded-xl`, CalendarDays icon).

## Data model
No table changes. New migration `supabase/migrations/<next>_available_listings.sql`:
```sql
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
```
Status condition copied from `get_unavailable_ranges` (0001_schema.sql:129). Only ids are returned, so no booking details leak.

## API / edge functions
- RPC `unavailable_listing_ids(p_listing_ids, p_check_in, p_check_out)` -> `uuid[]`. Called once after the listings query; client removes those ids. No edge functions, no Stripe.

## Edge cases
- Back-to-back bookings (checkout == search check-in) -> listing shown.
- check_in == check_out, check_in > check_out, malformed dates -> treated as half range (R5), no crash in `parseISO`/`format`.
- `guests=0`/non-numeric -> no guest filter.
- min_price > max_price -> empty results with empty state (no error).
- City with commas/parentheses/% -> sanitized (existing).
- Listing with no images -> fallback photo (existing).
- Zero listings before the availability step -> skip RPC.

## Risks
- New migration must not be applied to production by agents (human gate).
- Status filter mismatch between new RPC and `get_unavailable_ranges` would make results inconsistent with the listing page calendar.

## Test strategy
| Req | Coverage |
|---|---|
| R3, R5 | Vitest unit tests for extracted pure helpers: `overlaps()` (incl. touching ranges) and `parseDateRange(params)` (valid / half / reversed / malformed) |
| R9, R10 | Vitest for a `buildSearchParams`/price-parse helper; manual on preview: reload + share URL |
| R2, R4, R6, R11 | Manual on preview as anonymous user: search "lisbon" vs "LISBON", country name, guests above capacity, dates overlapping a known booking |
| R1, R7, R8 | Manual on preview against Figma frames 2:25, 2:268, 2:340, 2:498 |
| all | `npm run build` (tsc + vite) passes |

## Out of scope
Map view, sorting, extra filters, autocomplete/geocoding, listing detail/booking/payment changes (SCRUM-13, SCRUM-14), redesign of loading/error states.
