import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const adminEmails = Deno.env.get('ADMIN_EMAILS') || '';
    const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    
    if (!adminList.includes(user.email.toLowerCase())) {
      console.log(`Access denied for ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Not an admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, id, ...postData } = body;

    console.log(`Admin ${user.email} performing action: ${action}`);

    switch (action) {
      case 'list': {
        const { data, error } = await adminClient
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ posts: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        const { data, error } = await adminClient
          .from('blog_posts')
          .insert({
            title: postData.title,
            slug: postData.slug,
            excerpt: postData.excerpt,
            body_markdown: postData.body_markdown,
            tags: postData.tags,
            posted_at: postData.posted_at,
            status: postData.status,
            author_name: postData.author_name,
            reading_time_minutes: postData.reading_time_minutes,
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Created post: ${data.slug}`);
        return new Response(
          JSON.stringify({ post: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!id) throw new Error('Post ID required');
        
        const { data, error } = await adminClient
          .from('blog_posts')
          .update({
            title: postData.title,
            slug: postData.slug,
            excerpt: postData.excerpt,
            body_markdown: postData.body_markdown,
            tags: postData.tags,
            posted_at: postData.posted_at,
            status: postData.status,
            author_name: postData.author_name,
            reading_time_minutes: postData.reading_time_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        console.log(`Updated post: ${data.slug}`);
        return new Response(
          JSON.stringify({ post: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!id) throw new Error('Post ID required');
        
        const { error } = await adminClient
          .from('blog_posts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        console.log(`Deleted post: ${id}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in admin-blog:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
