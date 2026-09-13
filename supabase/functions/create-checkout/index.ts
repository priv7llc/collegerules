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

    // Legacy route-generation credit products (unchanged)
    const products: Record<string, { price: number; credits: number; name: string }> = {
      single_route: { price: 1000, credits: 1, name: '1 Transfer Route' },
      five_route_pack: { price: 2500, credits: 5, name: '5 Transfer Routes' },
    };

    // New route-unlock products (additive, separate pricing)
    const unlockProducts: Record<string, { price: number; name: string; unlock_type: string; slots: number }> = {
      route_unlock_1: { price: 100, name: 'Unlock 1 Transfer Route', unlock_type: 'single', slots: 1 },
      route_unlock_5pack: { price: 300, name: 'Unlock 5 Transfer Routes', unlock_type: 'five_pack', slots: 5 },
      route_unlock_unlimited: { price: 1000, name: 'Unlimited Route Unlocks', unlock_type: 'unlimited', slots: 0 },
    };

    const origin = req.headers.get('origin');
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

    const unlock = unlockProducts[product_code];
    const product = products[product_code];
    if (!unlock && !product) throw new Error('Invalid product');

    const name = unlock ? unlock.name : product.name;
    const amount = unlock ? unlock.price : product.price;

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
      success_url: `${origin}${successPath}${successPath.includes('?') ? '&' : '?'}payment=success`,
      cancel_url: `${origin}${return_path || '/app/buy-credits'}${(return_path || '').includes('?') ? '&' : '?'}payment=cancelled`,
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
