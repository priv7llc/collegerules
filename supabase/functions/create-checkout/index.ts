import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { product_code, user_id, user_email, coupon_code, route_id, return_path } = await req.json();

    // Route-unlock products are the only purchase path.
    // Route generation itself is free; legacy credit products are retired.
    const products: Record<string, { price: number; credits: number; name: string }> = {};


    const unlockProducts: Record<string, { price: number; name: string; unlock_type: string; slots: number }> = {
      route_unlock_1: { price: 100, name: 'Unlock 1 Transfer Route', unlock_type: 'single', slots: 1 },
      route_unlock_5pack: { price: 300, name: 'Unlock 5 Transfer Routes', unlock_type: 'five_pack', slots: 5 },
      route_unlock_unlimited: { price: 1000, name: 'Unlimited Route Unlocks', unlock_type: 'unlimited', slots: 0 },
    };

    // Scholarship Writer (AI essay tools) — account-wide, time-boxed access
    const writerProducts: Record<string, { price: number; name: string; tier: string }> = {
      writer_unlock_1mo: { price: 100, name: 'Scholarship Writer — 1 Month', tier: 'month' },
      writer_unlock_3mo: { price: 300, name: 'Scholarship Writer — 3 Months', tier: 'three_month' },
      writer_unlock_lifetime: { price: 1000, name: 'Scholarship Writer — Lifetime', tier: 'lifetime' },
    };

    const origin = req.headers.get('origin');
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

    const unlock = unlockProducts[product_code];
    const writer = writerProducts[product_code];
    const product = products[product_code];
    if (!unlock && !writer && !product) throw new Error('Invalid product');

    const name = unlock ? unlock.name : writer ? writer.name : product.name;
    const amount = unlock ? unlock.price : writer ? writer.price : product.price;

    const basePath = return_path || '/app';

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}${basePath}${basePath.includes('?') ? '&' : '?'}payment=success`,
      cancel_url: `${origin}${basePath}${basePath.includes('?') ? '&' : '?'}payment=cancelled`,
      client_reference_id: user_id,
      customer_email: user_email,
      metadata: unlock
        ? {
            product_code,
            user_id,
            kind: 'unlock',
            unlock_type: unlock.unlock_type,
            slots: String(unlock.slots),
            route_id: route_id || '',
          }
        : writer
        ? { product_code, user_id, kind: 'writer', writer_tier: writer.tier }
        : { product_code, user_id, kind: 'credits', credits: String(product.credits) },
    };

    if (coupon_code) {
      sessionParams.discounts = [{ coupon: coupon_code }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
