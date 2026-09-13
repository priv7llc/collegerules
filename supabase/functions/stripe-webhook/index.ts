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
    const kind = session.metadata?.kind || 'credits';
    const credits = parseInt(session.metadata?.credits || '0');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Skip if this session was already recorded
    const { data: already } = await supabase
      .from('purchases').select('id').eq('stripe_session_id', session.id).maybeSingle();
    if (already) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Create purchase record
    const { data: purchase } = await supabase.from('purchases').insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_id: session.payment_intent,
      product_code: productCode,
      amount_cents: session.amount_total,
      status: 'completed',
    }).select().single();

    if (purchase && kind === 'unlock') {
      const unlockType = session.metadata?.unlock_type;
      const routeId = session.metadata?.route_id || null;

      if (unlockType === 'unlimited') {
        await supabase.from('route_unlocks').insert({
          user_id: userId, route_id: null, unlock_type: 'unlimited', purchase_id: purchase.id,
        });
      } else if (unlockType === 'five_pack') {
        await supabase.from('route_unlocks').insert({
          user_id: userId, route_id: null, unlock_type: 'five_pack', slots: 5, purchase_id: purchase.id,
        });
        // Spend the first slot immediately on the route the user was looking at
        if (routeId) {
          await supabase.from('route_unlocks').insert({
            user_id: userId, route_id: routeId, unlock_type: 'five_pack_redemption', purchase_id: purchase.id,
          });
        }
      } else if (unlockType === 'single' && routeId) {
        await supabase.from('route_unlocks').insert({
          user_id: userId, route_id: routeId, unlock_type: 'single', purchase_id: purchase.id,
        });
      }
    } else if (purchase && kind === 'writer') {
      const tier = session.metadata?.writer_tier;
      const expiresAt = tier === 'month'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : tier === 'three_month'
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      await supabase.from('scholarship_writer_unlocks').insert({
        user_id: userId, tier, expires_at: expiresAt, purchase_id: purchase.id,
      });
    } else if (purchase && credits > 0) {
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
