import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Use service role for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // List recent checkout sessions for this user's email
    const sessions = await stripe.checkout.sessions.list({
      customer_email: user.email!,
      limit: 10,
    });

    let credited = 0;

    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;
      if (!session.metadata?.user_id || session.metadata.user_id !== user.id) continue;

      const sessionId = session.id;

      // Check if already recorded
      const { data: existing } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (existing) continue; // Already credited

      const productCode = session.metadata?.product_code || 'unknown';
      const credits = parseInt(session.metadata?.credits || '0');

      // Record purchase
      const { data: purchase, error: purchaseErr } = await supabaseAdmin.from('purchases').insert({
        user_id: user.id,
        stripe_session_id: sessionId,
        stripe_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        product_code: productCode,
        amount_cents: session.amount_total || 0,
        status: 'completed',
      }).select().single();

      if (purchaseErr) {
        console.error('Purchase insert error:', purchaseErr);
        continue;
      }

      // Add credits
      if (purchase && credits > 0) {
        await supabaseAdmin.from('route_credits').insert({
          user_id: user.id,
          purchase_id: purchase.id,
          credits_added: credits,
          credits_used: 0,
        });
        credited += credits;
      }
    }

    return new Response(JSON.stringify({ credited, message: credited > 0 ? `${credited} credits added!` : 'No new credits to add' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
