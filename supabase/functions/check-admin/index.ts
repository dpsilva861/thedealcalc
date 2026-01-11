import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminEmails = Deno.env.get('ADMIN_EMAILS') || '';
    const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    
    const isAdmin = adminList.includes(email.toLowerCase());
    
    console.log(`Admin check for ${email}: ${isAdmin}`);
    
    return new Response(
      JSON.stringify({ isAdmin }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking admin:', error);
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
