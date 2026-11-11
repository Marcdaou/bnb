# Deploy log: SCRUM-12 (preview)

- Preview URL: https://staybnb-ngugwiow2-marc-daous-projects.vercel.app
- Branch alias: https://staybnb-git-scrum-12-search-listings-694a73-marc-daous-projects.vercel.app
- Deployment id: dpl_BC7eLedym1MRPQtkFddQ9NnAsbFn (target: preview)
- Commit: 834f754a53930a2b1269431056e1ff51a652a84d (branch SCRUM-12-search-listings-location-dates)
- Created via Vercel MCP create_deployment: no Git-integration preview existed for the branch.
- First attempt dpl_ELYjJenwWSkshgbFAEoNyngHmfvB failed ("vite: command not found", built from repo root). Retried with projectSettings.rootDirectory=web -> READY.

## Smoke check
| Path | Result |
|---|---|
| / | 200, app shell served |
| /search?city=Lisbon&check_in=2027-06-12&check_out=2027-06-16 | 200, app shell served (SPA rewrite OK) |
| /search?check_in=garbage | 200, app shell served |
| get_runtime_errors (1h) | none |

Note: the app is a client-rendered SPA; the HTTP fetch confirms the shell and routing, not client-side rendering or the Supabase query. A browser check is still advised.

## Migrations pending
Migration 0002 (available_listings RPC) is NOT applied. The preview runs against the existing DB and relies on the app's PGRST202 fallback. Applying it needs a human.

## Production
NOT promoted (human gate).

## Maintain check
Healthy 2026-11-11 (window: last 24h, covers deployment dpl_BC7eLedym1MRPQtkFddQ9NnAsbFn)
- Vercel get_runtime_errors (24h): none. Static SPA, no functions, so runtime logs carry little signal.
- Supabase staybnb (auxkvbijleeakvfjtlxh) logs: no 4xx/5xx on rest/rpc; only a single unauthenticated `GET /` 401 (noise) and schema-cache reloads. `get_unavailable_ranges` RPC calls return 200. No preview search traffic seen yet, so the PGRST202 fallback path is unexercised in real use.
- Advisors (pre-existing, not caused by SCRUM-12):
  - security WARN 0028/0029: `get_unavailable_ranges` is SECURITY DEFINER and executable by anon/authenticated. Intentional per 0001_schema.sql and intent.md (exposes only date ranges). No action.
  - security WARN: leaked password protection disabled (Auth setting). Hardening, not an incident.
  - performance INFO: unused indexes `listings_host_id_idx`, `wishlists_listing_id_idx` (DB is new; expected).
- Context, not an incident: migration 0002 (`unavailable_listing_ids`) is still NOT applied; search relies on the app's PGRST202 fallback until a human applies it.
