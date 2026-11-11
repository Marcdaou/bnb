import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SERVICE_FEE_RATE = 0.12;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
    const { listing_id, check_in, check_out } = body ?? {};
    const guests = Number(body?.guests);
    if (!listing_id || typeof check_in !== "string" || typeof check_out !== "string" ||
        !DATE_RE.test(check_in) || !DATE_RE.test(check_out)) {
      return json({ error: "listing_id, check_in and check_out (YYYY-MM-DD) are required" }, 400);
    }
    if (!Number.isInteger(guests) || guests < 1) return json({ error: "guests must be a positive integer" }, 400);

    const today = new Date().toISOString().slice(0, 10);
    if (check_in < today) return json({ error: "Check-in cannot be in the past" }, 400);
    if (check_out <= check_in) return json({ error: "Check-out must be after check-in" }, 400);
    const nights = Math.round((Date.parse(check_out + "T00:00:00Z") - Date.parse(check_in + "T00:00:00Z")) / 86400000);
    if (!Number.isFinite(nights) || nights < 1) return json({ error: "Invalid dates" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id, title, price_per_night, cleaning_fee, max_guests, listing_images(url, position)")
      .eq("id", listing_id)
      .maybeSingle();
    if (lErr) return json({ error: lErr.message }, 500);
    if (!listing) return json({ error: "Listing not found" }, 404);
    if (guests > listing.max_guests) return json({ error: `This place allows at most ${listing.max_guests} guests` }, 400);

    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: overlaps, error: oErr } = await admin
      .from("bookings")
      .select("id")
      .eq("listing_id", listing_id)
      .lt("check_in", check_out)
      .gt("check_out", check_in)
      .or(`status.eq.confirmed,and(status.eq.pending,created_at.gt.${cutoff})`)
      .limit(1);
    if (oErr) return json({ error: oErr.message }, 500);
    if (overlaps && overlaps.length > 0) return json({ error: "Those dates are no longer available" }, 409);

    const subtotal = nights * listing.price_per_night;
    const service_fee = Math.round(subtotal * SERVICE_FEE_RATE);
    const total = subtotal + listing.cleaning_fee + service_fee;

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .insert({ listing_id, guest_id: user.id, check_in, check_out, guests, total_price: total, status: "pending" })
      .select()
      .single();
    if (bErr) return json({ error: bErr.message }, 500);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      return json({ error: "Payments are not configured (STRIPE_SECRET_KEY missing)" }, 500);
    }
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:5173";
    const images = (listing.listing_images ?? []).sort((a: any, b: any) => a.position - b.position);
    const image = images[0]?.url;

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email ?? undefined,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: total * 100,
            product_data: {
              name: `${listing.title} · ${nights} night${nights === 1 ? "" : "s"}`,
              description: `${check_in} to ${check_out} · ${guests} guest${guests === 1 ? "" : "s"}`,
              ...(image ? { images: [image] } : {}),
            },
          },
        }],
        metadata: { booking_id: booking.id, user_id: user.id },
        success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/listing/${listing_id}?cancelled=1`,
      });
    } catch (e) {
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      return json({ error: `Stripe error: ${(e as Error).message}` }, 502);
    }

    await admin.from("bookings").update({ stripe_session_id: session.id }).eq("id", booking.id);
    return json({ url: session.url, booking_id: booking.id });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});
