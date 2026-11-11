# Test report: SCRUM-12  -  RESULT: PASS
Branch: SCRUM-12-search-listings-location-dates @ e996f3f   Date: 2026-11-11T13:10:58Z
| Check | Result | Notes |
|---|---|---|
| typecheck | PASS | `tsc -b --noEmit` (script added in chore commit) |
| lint | SKIPPED (pre-existing) | Cannot run: repo uses TypeScript 7.0.2; typescript-eslint 8.x throws "does not support TS 7.0" and npm overrides cannot replace the peer dep. Lint tooling not added. Not caused by this PR. |
| unit tests | 27 passed / 0 failed | `web/src/lib/search.test.ts` (Vitest, jsdom) |
| build | PASS | Warning only: main chunk > 500 kB (pre-existing) |
| edge functions | SKIPPED | No changes under supabase/functions/; deno not installed |
## Spec coverage
| Req ID | Covered by | Status |
|---|---|---|
| R1 | Manual on preview (Figma 2:25, 2:498) | Not automated - pending deploy |
| R2 | Manual on preview (case-insensitive city/country) | Not automated - pending deploy |
| R3 | Vitest `overlaps (R3)` - 6 cases incl. touching ranges | PASS |
| R4 | Migration 0002_unavailable_listing_ids.sql + build; manual on preview | Partially (compiles); runtime pending deploy |
| R5 | Vitest `parseDateRange (R5)` - valid/half/reversed/malformed | PASS (banner UI manual, Figma 2:340) |
| R6 | Vitest `parseGuests (R6)` | PASS (query manual) |
| R7 | Manual on preview (existing ListingCard) | Not automated - pending deploy |
| R8 | Manual on preview (Figma 2:268) | Not automated - pending deploy |
| R9 | Vitest `parsePrice (R9)` | PASS (combined query manual) |
| R10 | Vitest helpers + manual reload/share on preview | Partially |
| R11 | Manual as anonymous user on preview | Not automated - pending deploy |
## Pre-existing issues
- Lint cannot be set up: TypeScript 7 is incompatible with typescript-eslint (needs TS < 6.1). Fix options: run tsc 7 side-by-side with TS 6 for eslint, or wait for typescript-eslint TS 7 support.
- Build warns main chunk > 500 kB.
