import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("Creating checkout for user:", user.id, user.email);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }

    // Create or get the $5/month product
    const products = await stripe.products.list({ limit: 100, active: true });
    let priceId: string;

    const existingProduct = products.data.find((p: Stripe.Product) => p.name === "Pro Subscription");

    if (!existingProduct) {
      console.log("Creating new product and price");
      const product = await stripe.products.create({
        name: "Pro Subscription",
        description: "Unlimited deal analyses",
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 500, // $5.00
        currency: "usd",
        recurring: { interval: "month" },
      });
      priceId = price.id;
    } else {
      const prices = await stripe.prices.list({ 
        product: existingProduct.id,
        active: true,
        limit: 1,
      });
      priceId = prices.data[0].id;
    }

    console.log("Using price ID:", priceId);

    const { data: bodyData } = await req.json().catch(() => ({ data: {} }));
    const origin = bodyData?.origin || "https://yneaxuokgfqyoomycjam.lovableproject.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: { supabase_user_id: user.id },
    });

    console.log("Created checkout session:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
