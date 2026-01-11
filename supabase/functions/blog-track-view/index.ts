import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on function cold start)
const viewCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_VIEWS_PER_WINDOW = 1; // 1 view per IP per post per minute

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = await req.json();
    
    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for rate limiting (hash it for privacy)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const ipHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(clientIp + slug)
    );
    const cacheKey = Array.from(new Uint8Array(ipHash)).slice(0, 8).join('');
    
    // Check rate limit
    const now = Date.now();
    const lastView = viewCache.get(cacheKey);
    
    if (lastView && now - lastView < RATE_LIMIT_WINDOW) {
      console.log(`Rate limited: ${cacheKey} for slug ${slug}`);
      return new Response(
        JSON.stringify({ success: true, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update rate limit cache
    viewCache.set(cacheKey, now);
    
    // Clean old entries periodically
    if (viewCache.size > 10000) {
      const cutoff = now - RATE_LIMIT_WINDOW * 10;
      for (const [key, time] of viewCache.entries()) {
        if (time < cutoff) viewCache.delete(key);
      }
    }

    // Use service role for view increment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Call the increment function
    const { error } = await adminClient.rpc('increment_blog_view', { post_slug: slug });
    
    if (error) {
      console.error('Error incrementing view:', error);
      throw error;
    }

    console.log(`View tracked for: ${slug}`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in blog-track-view:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
