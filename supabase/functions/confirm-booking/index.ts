import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

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
    const session_id = body?.session_id;
    if (!session_id || typeof session_id !== "string") return json({ error: "session_id is required" }, 400);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Payments are not configured (STRIPE_SECRET_KEY missing)" }, 500);
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (e) {
      return json({ error: `Could not find checkout session: ${(e as Error).message}` }, 404);
    }

    const booking_id = session.metadata?.booking_id;
    if (!booking_id || session.metadata?.user_id !== user.id) {
      return json({ error: "This checkout session does not belong to you" }, 403);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    if (session.payment_status !== "paid") {
      return json({ error: "Payment has not been completed" }, 402);
    }

    const { data: existing, error: eErr } = await admin.from("bookings").select("*").eq("id", booking_id).maybeSingle();
    if (eErr) return json({ error: eErr.message }, 500);
    if (!existing) return json({ error: "Booking not found" }, 404);
    if (existing.status === "confirmed") return json({ booking: existing });

    const { data: booking, error: uErr } = await admin
      .from("bookings")
      .update({ status: "confirmed", stripe_session_id: session.id })
      .eq("id", booking_id)
      .select()
      .single();
    if (uErr) {
      if (uErr.code === "23P01") {
        return json({ error: "Those dates were booked by someone else before your payment completed. Please contact support for a refund." }, 409);
      }
      return json({ error: uErr.message }, 500);
    }
    return json({ booking });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});
