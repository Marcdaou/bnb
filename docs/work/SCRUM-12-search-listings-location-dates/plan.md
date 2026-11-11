# Plan: SCRUM-12
Branch: SCRUM-12-search-listings-location-dates

Approach: keep existing `/search` code; extract pure helpers so they can be unit-tested, fix the gaps found while reading the code, and swap the N per-listing RPC calls for one batched RPC.

Gaps found in current code (web/src/pages/Search.tsx):
- `format(parseISO(x))` throws a RangeError on a malformed date (e.g. `check_in=2027-13-40`), which crashes the page (R5).
- Date validation is only `checkIn < checkOut` as strings, with no ISO check (R3/R5).
- No "Pick both dates" banner (R5).
- `min_price=abc` sends `NaN` to PostgREST, which errors instead of being ignored (R9).
- Empty state has no "Clear price filter" button (R8).
- Availability uses one `get_unavailable_ranges` call per listing (R4).
- Header (R1) is already correct: `SearchBar key={location.search}` re-reads URL params; submit writes city/check_in/check_out/guests/category. No change needed there (optional check-out highlight skipped, see Risks).

## Files
| File | Change | Why (spec req ID) |
|---|---|---|
| `supabase/migrations/0002_unavailable_listing_ids.sql` | new: `unavailable_listing_ids(uuid[], date, date)` RPC exactly as in spec; grant to anon, authenticated | R4, R11, R3 |
| `web/src/lib/search.ts` | new pure helpers: `overlaps(range, a, b)`, `isIsoDate(s)`, `parseDateRange(checkIn, checkOut)` -> `{ checkIn, checkOut } \| null` plus `partial: boolean`, `parsePrice(s)` -> `number \| null`, `parseGuests(s)` | R3, R5, R6, R9 |
| `web/src/components/DatePrompt.tsx` | new amber banner (`bg-orange-50 border border-orange-300 rounded-xl`, CalendarDays icon, "Pick both dates to check availability") | R5 |
| `web/src/pages/Search.tsx` | use helpers; one call to `supabase.rpc('unavailable_listing_ids', …)`, skipped when 0 rows; date label only from a valid range; show DatePrompt when the range is partial or invalid; empty state adds a "Clear price filter" button (removes min/max_price from the URL) when a price filter is set | R3, R4, R5, R8, R9, R10 |
| `web/src/lib/search.test.ts` | new Vitest tests | R3, R5, R6, R9 |

No changes to Header.tsx, ListingCard, ListingGrid (R1, R7 already met).

## Steps
1. Add migration `0002_unavailable_listing_ids.sql` (SQL from spec, same status rule as `get_unavailable_ranges`). Do NOT apply to production. Apply only to a local/branch DB if one is available. - verify: `supabase db lint` / apply on local or branch, then `select * from unavailable_listing_ids(array[<id>]::uuid[], '2027-06-12', '2027-06-16')` returns the expected id
2. Add `web/src/lib/search.ts` with the helpers (pure, no React or Supabase imports). `isIsoDate` checks `/^\d{4}-\d{2}-\d{2}$/` and `isValid(parseISO(s))` with a round-trip so `2027-02-30` is rejected. - verify: `cd web && npm run build`
3. Add `DatePrompt.tsx` (not used yet). - verify: `npm run build`
4. Refactor `Search.tsx`: replace the local `overlaps` and the raw parsing with the helpers; price filters use `parsePrice` (ignore null/NaN); build `dateLabel` only from a valid range. - verify: `npm run build`; `/search?check_in=garbage&check_out=x` renders without crashing
5. Replace the `Promise.all(get_unavailable_ranges)` loop with a single `unavailable_listing_ids` RPC (`p_listing_ids: rows.map(r=>r.id)`); filter out the returned ids; skip the call when there are no rows; on RPC error, set the error state. - verify: `npm run build`; the network tab on preview shows 1 RPC request; a listing with a known booking disappears for overlapping dates and stays for back-to-back dates
6. Render `<DatePrompt />` above the results when exactly one date is set or the range is invalid (half range). - verify: `/search?city=Lisbon&check_in=2027-06-12` shows the banner, the summary has no dates, and results ignore dates (Figma 2:340)
7. Empty state: add the "Clear price filter" primary button when `min_price` or `max_price` is set (deletes both params via `setParams`). Keep "Explore all stays". - verify: `/search?min_price=900&max_price=100` shows the empty state with both buttons, and clicking Clear updates the URL and shows results (Figma 2:268)
8. Add Vitest tests (tester stage adds the `vitest` devDependency and the `test` script if missing). - verify: `npx vitest run`

## Tests to add
| Test file | Covers req ID |
|---|---|
| `web/src/lib/search.test.ts` — `overlaps`: overlap, contained, touching at check-in (not overlap), touching at check-out (not overlap), disjoint | R3 |
| same — `parseDateRange`: valid, only check_in, only check_out, equal dates, reversed, malformed (`2027-13-01`, `abc`, `2027-02-30`) | R5 |
| same — `parsePrice`: `''`->null, `'abc'`->null, `'80'`->80, `'0'`->0 | R9 |
| same — `parseGuests`: `'0'`, `'abc'`, `'4'` | R6 |
| Manual on preview (anonymous): case-insensitive city/country, guests, overlap vs back-to-back, reload/share URL, Figma 2:25 / 2:268 / 2:340 / 2:498 | R1, R2, R7, R8, R10, R11 |

## Migrations
New file `supabase/migrations/0002_unavailable_listing_ids.sql` (function + revoke/grant only, no table changes). A human applies it to production. The preview needs it in whichever DB the preview points at, otherwise the RPC 404s (see Risks).

## Rollback
Revert the PR. Down-migration if the function was applied:
```sql
drop function if exists public.unavailable_listing_ids(uuid[], date, date);
```
Note: the old code does not use the function, so reverting the frontend alone is safe even with the function left in place.

## Risks / things I'm unsure about
- Preview and production probably share one Supabase project. If so, the preview cannot call the new RPC until a human applies the migration. Option: fall back to the old per-listing loop when the RPC returns error code `PGRST202` (function not found). I'm not planning this fallback unless asked.
- The optional "check-out field highlighted" in the header (Figma 2:340) is skipped to keep Header.tsx unchanged. Tell me if you want it.
- The new RPC's status rule must stay in sync with `get_unavailable_ranges`. It is copied verbatim, but there is no shared definition.
- The new RPC lets anon test any listing id for availability. That is equivalent to the existing `get_unavailable_ranges` exposure, so it adds no new leak.
- min_price > max_price simply returns empty (spec). There is no inline validation message.

## Decisions (approved by human)
- Plan approved with fallback: in step 5, if `unavailable_listing_ids` returns PGRST202 (function not found), fall back to the existing per-listing `get_unavailable_ranges` check, so the preview works before a human applies migration 0002.

## Deviations
- Step 1: no local Supabase stack (`supabase/config.toml` absent) and no branch DB, so the migration was not linted/applied anywhere. SQL is copied verbatim from spec.md. Verify on a branch/local DB before a human applies it.
- Step 5: implemented the approved PGRST202 fallback (`unavailableIds()` in Search.tsx). Errors from either RPC now set the error state; the old loop silently ignored per-listing errors.
- Step 8: builder added `vitest` devDependency and `"test": "vitest run"` script (allowed by build-feature step 6).
- `parsePrice` also rejects negative numbers; `parseGuests` rejects non-integers (e.g. `2.5` -> no filter).
- Browser checks in steps 4-7 (no crash on garbage dates, banner, Clear price filter, 1 RPC request) are left for the tester on preview; covered here by unit tests + build only.
