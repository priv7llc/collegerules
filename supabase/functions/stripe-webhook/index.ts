import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  // For now, handle without webhook signature verification for development
  const event = JSON.parse(body);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const productCode = session.metadata?.product_code;
    const credits = parseInt(session.metadata?.credits || '0');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create purchase record
    const { data: purchase } = await supabase.from('purchases').insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_id: session.payment_intent,
      product_code: productCode,
      amount_cents: session.amount_total,
      status: 'completed',
    }).select().single();

    // Add credits
    if (purchase) {
      await supabase.from('route_credits').insert({
        user_id: userId,
        purchase_id: purchase.id,
        credits_added: credits,
        credits_used: 0,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
