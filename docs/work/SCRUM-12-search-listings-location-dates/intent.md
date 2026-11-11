# Intent: SCRUM-12 - Search listings by location and dates

## Problem
Guests planning a trip need to find places they can actually book: in the place they want to go, free on their travel dates, and big enough for their group. If search shows listings that are already booked, too small, or over budget, guests waste time and may give up before booking.

## Who is affected
- Guests (signed in or anonymous) using the header search bar and the `/search` results page.
- Hosts indirectly: their listings must show up correctly for matching searches.

## Success criteria
- [ ] The search bar accepts a location, a check-in date, a check-out date and a number of guests, and submitting it opens `/search` with those values.
- [ ] Searching a city or country returns only listings in that location (case-insensitive).
- [ ] A listing with a booking that overlaps the selected check-in/check-out range is not shown; a listing whose bookings only touch the range (checkout day = check-in day) is shown.
- [ ] Listings whose maximum guests is below the requested guest count are not shown.
- [ ] Each result card shows a photo, title, nightly price and rating.
- [ ] When no listing matches, an empty state is shown instead of a blank grid.
- [ ] Setting a minimum and/or maximum nightly price narrows the results to listings within that range, and the filter combines with location, dates and guests.
- [ ] Search criteria are kept in the URL, so reloading or sharing the results page shows the same results.

## Constraints
- A `/search` route and header search bar already exist (`web/src/pages/Search.tsx`, `web/src/components/Header.tsx`), with URL params `city`, `check_in`, `check_out`, `guests`, `min_price`, `max_price`, `category`. This work should be checked against the criteria above and gaps closed, not started from scratch.
- Booked dates are exposed through the `get_unavailable_ranges` RPC (security definer, granted to anon and authenticated) in `supabase/migrations/0001_schema.sql`; guests cannot read other users' bookings directly because of RLS.
- Existing `ListingCard` / `ListingGrid` components render result cards.
- Search must work for anonymous visitors.

## Non-goals
- Map view, sorting options, or filters beyond price (amenities, property type, etc.).
- Location autocomplete / geocoding or distance-based search.
- Booking, payment or listing detail changes (SCRUM-13, SCRUM-14).

## Decisions (approved by human)
- Scope: "verify and close gaps" - keep what exists, fix only what fails the success criteria (e.g. empty state, invalid/half date ranges, availability-check performance).
- Only one of check-in/check-out given: ignore dates for availability, search by location/guests, and prompt the user to pick both dates.

## Source
Jira: https://marc7182.atlassian.net/browse/SCRUM-12 (priority Medium, sprint SCRUM Sprint 0)
