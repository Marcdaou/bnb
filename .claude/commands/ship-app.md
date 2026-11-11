---
description: Fully automated idea → React/Tailwind app on Supabase + Stripe (test mode) + Unsplash seed data → Vercel deploy → Chrome E2E test. No questions asked.
argument-hint: "[optional app idea, e.g. 'a boat rental marketplace'] — leave empty to let Claude pick"
---

# /ship-app — idea to tested production app, end to end, zero questions

Idea from the user (may be empty): **$ARGUMENTS**

You run this whole pipeline **autonomously**. Do NOT use AskUserQuestion, do NOT enter plan mode, and do NOT pause for confirmation between phases. Make every product and technical decision yourself, pick sensible defaults, and record them in `PLAN.md`. Only stop for the hard blockers listed under "Hard stops". Give the user short progress lines between phases.

Use subagents (the Agent tool) for every chunk that can run in parallel. Launch the parallel agents **in a single message**. You are the team lead: you own the contract, relay messages between agents (SendMessage), integrate, and verify.

---

## Phase 0 — Idea & plan (you, ~2 min)

1. If `$ARGUMENTS` is empty, invent a marketplace or booking-style consumer app that fits this stack. It needs:
   - browse, search and a detail page
   - auth
   - a paid action through Stripe Checkout
   - a "my purchases/bookings" page
   - a favorites list

   Give it an **original name and brand**. Never copy a real company's name, logo or trademarks. A product *in the style of* a known app is fine, but the branding must be your own.
2. Write `PLAN.md` in the project root covering: the concept, the pages, the data model, the edge functions, how the agents split the work, and the verification checklist.
3. Pick a project slug: lowercase, plus a short random suffix (e.g. `tidebook-7k2q`). **Vercel `*.vercel.app` subdomains are global.** A plain name like `staybnb` may already belong to a stranger's site, so always use the suffixed slug for both Supabase and Vercel.

## Phase 1 — Infrastructure + contract (you, sequential)

Load MCP tools through ToolSearch in batches. The servers are `supabase`, `stripe` and `vercel` (see `.mcp.json`), plus `claude-in-chrome` and `playwright`.

1. **Supabase project:**
   - Call `list_organizations` and use the first org.
   - Call `get_cost` (type project).
   - If the cost is **$0**, call `confirm_cost`, then `create_project` (region `us-east-1`, name = slug).
   - If the cost is **non-zero**, that is a hard stop: report the cost and stop. Never accept charges on the user's behalf.
   - Poll `get_project` until status is `ACTIVE_HEALTHY`.
   - Call `get_project_url` and `get_publishable_keys`, and use the `sb_publishable_…` key.
2. **Stripe:** use the Stripe MCP (`list_available_accounts_or_orgs`, or a cheap `stripe_api_read` such as retrieving the balance) to confirm a **test-mode** account is connected.
   - Never use live keys.
   - **No webhooks**: payment is confirmed by retrieving the Checkout Session on the server.
   - The secret key lives **only** as the Supabase Edge Function secret `STRIPE_SECRET_KEY`.
   - If the secret isn't set yet, deploy anyway. The functions must return a clear `500 "Payments are not configured"` until it is set. Tell the user exactly where to add it, and continue with every non-payment step.
   - The publishable key is optional, because the flow is a hosted Checkout redirect.
3. Scaffold the contract files, which every agent must follow:
   - `web/src/types/db.ts`: every table's TS interface, union types, the price/fee constants, the RPC signatures, and each edge function's request/response shapes and error status codes. Include `400` bad input, `401` not logged in, `402` not paid, `403` wrong user, `404` not found, `409` conflict (e.g. dates taken), `500` not configured, `502` Stripe error.
   - `web/.env.example` and `web/.env`, with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` (may be empty), plus a comment saying the secret key lives in Supabase secrets.
   - A root `.gitignore` covering `node_modules`, `dist`, `.env`, `.vercel`.

## Phase 2 — Parallel build (5 subagents, ONE message)

Give every agent the absolute project path, the Supabase project id, the contract file path, its **exclusive file ownership**, and a requirement to report back. Tell each one how to load its MCP tools through ToolSearch.

1. **backend** (general-purpose):
   - **Migrations:** apply them through `apply_migration` and also save them to `supabase/migrations/`.
   - **Database rules:**
     - Enable RLS on every table.
     - Public tables are readable by anyone. Users can only read their own orders/bookings, and clients can't write orders at all; only the service role can.
     - Add a `btree_gist` exclusion constraint on overlapping confirmed bookings, so a conflict raises error 23P01.
     - Use `SECURITY DEFINER` + `search_path=''` for the profile trigger and the availability RPC.
     - Index every foreign key.
   - **Seed** (save to `supabase/seed.sql`, then execute):
     - About 30 items across about 8–10 cities or categories.
     - 4–5 images per item, all `https://images.unsplash.com/photo-<id>?w=1200&q=80`.
     - **Verify every distinct image URL returns HTTP 200** with a `curl` loop, and replace any that fail.
     - Unsplash portrait URLs for avatars.
     - Realistic reviews, with `review_count` matching the actual number of reviews.
   - **Demo user:** `demo@<slug>.test` / `Demo1234!`, inserted with SQL into `auth.users` + `auth.identities`:
     - `email_confirmed_at = now()`
     - password hashed with `crypt(pw, gen_salt('bf'))`
     - instance_id of all zeros, aud/role `authenticated`
     - `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new` set to `''` (NULLs break GoTrue login)
   - **Checks:** run `get_advisors` (security + performance) and fix the real issues. Generate TS types into `web/src/types/supabase.ts`.
2. **payments** (general-purpose): build the Edge Functions in `supabase/functions/` with a shared `_shared/cors.ts`, and deploy them with `verify_jwt: true`.
   - **Libraries:** `npm:stripe@17` with `Stripe.createFetchHttpClient()`, and `npm:@supabase/supabase-js@2`.
   - **`create-checkout-session`:**
     - Authenticate the user and validate the input.
     - Compute the price on the server and check for conflicts.
     - Insert a `pending` row through the service role.
     - Create a Checkout Session. `success_url` is `${origin}/…/success?session_id={CHECKOUT_SESSION_ID}` and `cancel_url` goes back to the detail page with `?cancelled=1`. Put `{booking_id, user_id}` in the metadata.
     - Return `{url, booking_id}`.
     - If Stripe fails or the key is missing, mark the pending row `cancelled`.
   - **`confirm-booking`:**
     - Retrieve the session and check that `metadata.user_id` is the caller.
     - If `payment_status==='paid'`, set the row to `confirmed`. This must be idempotent, and error 23P01 maps to 409.
   - **Done when:** CORS preflight returns 200.
3. **frontend-a** (general-purpose): build the scaffold first, because the others wait on it.
   - **Stack:** Vite + React + TS in `web/`. Packages: `react-router-dom`, `@supabase/supabase-js`, `date-fns`, `react-day-picker`, `lucide-react`, and Tailwind v4 via `@tailwindcss/vite`.
   - **Vercel SPA rewrite:** create `web/vercel.json` containing `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`.
   - **Owns these shared files:**
     - `lib/supabase.ts`
     - `lib/format.ts`
     - `context/AuthContext.tsx`, where `signIn`/`signUp` return `{error}`
     - `hooks/useWishlist.ts`, with optimistic updates
     - `App.tsx` with all routes
     - Layout, Header (search pill), Footer, CategoryBar, ListingCard (image carousel + heart), ListingGrid/SkeletonGrid
     - Home and Search pages
   - **Placeholders:** create placeholder files for agent B's pages **only if they don't exist yet**.
   - **Quality bar:** polished, responsive UI that matches the original brand.
4. **frontend-b** (general-purpose): owns these files only.
   - The detail page: gallery with a "show all photos" modal, amenities, reviews, and a sticky booking widget with a date-range picker that disables unavailable dates.
   - The login/sign-up page: supports `?mode=signup`, `?redirect=` and `location.state.from`, and shows a hint with the demo credentials.
   - The success page: calls `confirm-booking` once, using a ref guard against StrictMode running it twice.
   - The Trips and Wishlists pages.
   - **Errors:** read edge function errors with `await error.context.json()`.
   - **Waiting on the scaffold:** poll until `web/node_modules/react-router-dom` exists, then adapt to agent A's real exports.
5. **deployer** (general-purpose):
   - **Wait for the build:** poll until the scaffold exists and `npm run build` passes, retrying while the other agents are mid-edit. Never edit source files.
   - **Link and configure:** `vercel link --yes --project <slug>`, then set the `VITE_*` env vars for production + preview (skip empty ones).
   - **Deploy:** `vercel deploy --prod --yes`. The first deploy is promoted to production anyway, so be explicit about it.
   - **Turn off deployment protection** (`ssoProtection: null`) so the browser test can reach the site.
   - **Check it's really our app:** verify the URL by checking that the HTML `<title>` matches **our** app. A 200 alone isn't proof.
   - **Report** the stable project alias, `https://<slug>-<team-slug>.vercel.app`, rather than the bare `<slug>.vercel.app`.

**Your job while they run:** forward each agent's API notes to the agents that depend on them, e.g. payments' error contract → frontend-b, and frontend-a's exports → frontend-b. Don't redo the agents' work yourself.

## Phase 3 — Integrate & redeploy (you)

1. Run `cd web && npm run build` and fix any type or integration errors.
2. API smoke test with curl:
   - Log the demo user in through `/auth/v1/token?grant_type=password`.
   - `GET /rest/v1/<items>` with the publishable key returns the seeded rows.
   - POST `create-checkout-session` with the user JWT. You must get back a `checkout.stripe.com` URL, or the clear "not configured" 500 if the key isn't set yet.
3. Redeploy to production with `vercel deploy --prod --yes`, then confirm the HTML `<title>` again.

## Phase 4 — End-to-end browser test

**Browser to use:**
- Use **Claude in Chrome** first: load its tools in ONE ToolSearch, open a new tab, and record a GIF with `gif_creator`.
- If Chrome says "Permission denied … on this domain" or isn't connected, **switch to the Playwright MCP straight away** (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_take_screenshot`) and keep going.
- Do not stop to ask. Tell the user afterwards that they can allow the domain in the Chrome extension.

Run this checklist against the production URL and record pass/fail for each step:
1. The home page loads the seeded items with Unsplash images, and the category filter works.
2. Search by location, dates and guests filters correctly.
3. The detail page shows the gallery, amenities and reviews, and the price breakdown is right.
4. Log in with the demo user.
5. Reserve → Stripe Checkout (test mode) → pay with card `4242 4242 4242 4242`, any future expiry, CVC `123`, any name and ZIP → land on the success page → the booking shows `confirmed`:
   - on the Trips page, and
   - in the database, checked with `execute_sql`.
6. Booking the same dates again is blocked. Cancelling a Checkout leaves the booking not confirmed.
7. The console has no errors (`read_console_messages`/`browser_console_messages`). Check the Supabase `get_logs` for the edge functions and the auth service.
8. Fix every failure, redeploy, and re-run the failed steps until everything passes, or you hit a hard stop.

## Phase 5 — Final report

Give the user:
- the production URL, which must be the verified one
- the Supabase project id
- the demo login
- the checklist results, with the GIF path
- the decisions you made
- anything the user still has to do, e.g. add `STRIPE_SECRET_KEY` under Supabase → Edge Functions → Secrets, allow the domain in the Chrome extension, or turn on leaked-password protection in Supabase Auth

Be honest: anything you didn't verify gets labelled unverified.

## Hard stops (the only reasons to stop early)
- Creating the Supabase project would cost money. Report the cost and stop.
- An MCP server isn't connected or authenticated, e.g. `vercel login` is required. Report the exact command, `! vercel login`, and do everything you can without it.
- The Stripe account isn't in test mode. Never touch live keys or real payments.

## Lessons baked in (from the first run)
- `<name>.vercel.app` may belong to someone else, so always confirm the page `<title>` is ours.
- Vercel promotes a new project's first deploy to production.
- The Chrome extension needs per-domain permission, so fall back to Playwright.
- A demo user inserted with SQL needs the token columns set to `''`, not NULL.
- `supabase.functions.invoke` errors are `FunctionsHttpError`; read the body with `error.context.json()`.
- Don't use Stripe webhooks; confirm payment by retrieving the session on the success page.
