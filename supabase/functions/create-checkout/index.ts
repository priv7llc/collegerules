import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { product_code, user_id, user_email, coupon_code } = await req.json();
    
    const products: Record<string, { price: number; credits: number; name: string }> = {
      single_route: { price: 1000, credits: 1, name: '1 Transfer Route' },
      five_route_pack: { price: 2500, credits: 5, name: '5 Transfer Routes' },
    };

    const product = products[product_code];
    if (!product) throw new Error('Invalid product');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: product.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/app?payment=success`,
      cancel_url: `${req.headers.get('origin')}/app/buy-credits?payment=cancelled`,
      client_reference_id: user_id,
      customer_email: user_email,
      metadata: { product_code, user_id, credits: String(product.credits) },
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
