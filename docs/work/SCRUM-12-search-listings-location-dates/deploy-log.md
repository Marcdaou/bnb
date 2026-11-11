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
