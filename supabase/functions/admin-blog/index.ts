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
      // ========== POST ACTIONS ==========
      case 'list': {
        const { data, error } = await adminClient
          .from('blog_posts')
          .select(`
            *,
            blog_categories(id, name, slug),
            blog_series(id, name, slug)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ posts: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        // Validate required fields for publish
        if (postData.status === 'published') {
          if (!postData.title || !postData.slug || !postData.body_markdown) {
            throw new Error('Title, slug, and content are required for publishing');
          }
          if (!postData.excerpt) {
            throw new Error('Excerpt is required for publishing');
          }
          // Set posted_at to now if publishing without a date
          if (!postData.posted_at) {
            postData.posted_at = new Date().toISOString();
          }
        }

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
            featured_image_url: postData.featured_image_url,
            featured_image_alt: postData.featured_image_alt,
            category_id: postData.category_id || null,
            series_id: postData.series_id || null,
            series_order: postData.series_order || 0,
            difficulty: postData.difficulty || null,
            property_type: postData.property_type || null,
            featured: postData.featured || false,
            seo_title: postData.seo_title || null,
            seo_description: postData.seo_description || null,
            canonical_url: postData.canonical_url || null,
            og_image_url: postData.og_image_url || null,
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

        // Validate required fields for publish
        if (postData.status === 'published') {
          if (!postData.title || !postData.slug || !postData.body_markdown) {
            throw new Error('Title, slug, and content are required for publishing');
          }
          if (!postData.excerpt) {
            throw new Error('Excerpt is required for publishing');
          }
          // Set posted_at to now if publishing without a date
          if (!postData.posted_at) {
            postData.posted_at = new Date().toISOString();
          }
        }

        // Get old post for slug change detection and revision creation
        const { data: oldPost, error: oldPostError } = await adminClient
          .from('blog_posts')
          .select('slug, title, body_markdown, excerpt')
          .eq('id', id)
          .single();

        if (oldPostError) throw oldPostError;

        // Create revision snapshot
        await adminClient
          .from('blog_post_revisions')
          .insert({
            post_id: id,
            title: oldPost.title,
            body_markdown: oldPost.body_markdown,
            excerpt: oldPost.excerpt,
            updated_by: user.id,
          });

        // Check for slug change and create redirect
        if (oldPost.slug !== postData.slug) {
          // Check if redirect already exists
          const { data: existingRedirect } = await adminClient
            .from('blog_post_redirects')
            .select('id')
            .eq('old_slug', oldPost.slug)
            .eq('new_slug', postData.slug)
            .single();

          if (!existingRedirect) {
            await adminClient
              .from('blog_post_redirects')
              .insert({
                post_id: id,
                old_slug: oldPost.slug,
                new_slug: postData.slug,
              });
            console.log(`Created redirect: ${oldPost.slug} -> ${postData.slug}`);
          }
        }
        
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
            featured_image_url: postData.featured_image_url,
            featured_image_alt: postData.featured_image_alt,
            category_id: postData.category_id || null,
            series_id: postData.series_id || null,
            series_order: postData.series_order || 0,
            difficulty: postData.difficulty || null,
            property_type: postData.property_type || null,
            featured: postData.featured || false,
            seo_title: postData.seo_title || null,
            seo_description: postData.seo_description || null,
            canonical_url: postData.canonical_url || null,
            og_image_url: postData.og_image_url || null,
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

      case 'get_revisions': {
        if (!id) throw new Error('Post ID required');
        
        const { data, error } = await adminClient
          .from('blog_post_revisions')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return new Response(
          JSON.stringify({ revisions: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ========== CATEGORY ACTIONS ==========
      case 'list_categories': {
        const { data: categories, error } = await adminClient
          .from('blog_categories')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        // Get post counts
        const { data: counts } = await adminClient.rpc('get_category_post_counts');
        
        const categoriesWithCounts = categories.map(cat => ({
          ...cat,
          post_count: counts?.find((c: { category_id: string; post_count: number }) => c.category_id === cat.id)?.post_count || 0
        }));

        return new Response(
          JSON.stringify({ categories: categoriesWithCounts }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_category': {
        if (!postData.name) throw new Error('Category name required');
        
        const slug = postData.slug || postData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
        
        const { data, error } = await adminClient
          .from('blog_categories')
          .insert({
            name: postData.name,
            slug,
            description: postData.description || null,
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Created category: ${data.slug}`);
        return new Response(
          JSON.stringify({ category: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_category': {
        if (!id) throw new Error('Category ID required');
        
        const { data, error } = await adminClient
          .from('blog_categories')
          .update({
            name: postData.name,
            slug: postData.slug,
            description: postData.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        console.log(`Updated category: ${data.slug}`);
        return new Response(
          JSON.stringify({ category: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_category': {
        if (!id) throw new Error('Category ID required');
        
        // Check if any posts reference this category
        const { data: posts, error: postsError } = await adminClient
          .from('blog_posts')
          .select('id')
          .eq('category_id', id)
          .limit(1);

        if (postsError) throw postsError;
        
        if (posts && posts.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete category with existing posts. Remove posts from category first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { error } = await adminClient
          .from('blog_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        console.log(`Deleted category: ${id}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ========== SERIES ACTIONS ==========
      case 'list_series': {
        const { data: series, error } = await adminClient
          .from('blog_series')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;

        // Get post counts
        const { data: counts } = await adminClient.rpc('get_series_post_counts');
        
        const seriesWithCounts = series.map(s => ({
          ...s,
          post_count: counts?.find((c: { series_id: string; post_count: number }) => c.series_id === s.id)?.post_count || 0
        }));

        return new Response(
          JSON.stringify({ series: seriesWithCounts }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_series': {
        if (!postData.name) throw new Error('Series name required');
        
        const slug = postData.slug || postData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
        
        const { data, error } = await adminClient
          .from('blog_series')
          .insert({
            name: postData.name,
            slug,
            description: postData.description || null,
            order_index: postData.order_index || 0,
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`Created series: ${data.slug}`);
        return new Response(
          JSON.stringify({ series: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_series': {
        if (!id) throw new Error('Series ID required');
        
        const { data, error } = await adminClient
          .from('blog_series')
          .update({
            name: postData.name,
            slug: postData.slug,
            description: postData.description || null,
            order_index: postData.order_index || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        console.log(`Updated series: ${data.slug}`);
        return new Response(
          JSON.stringify({ series: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_series': {
        if (!id) throw new Error('Series ID required');
        
        // Check if any posts reference this series
        const { data: posts, error: postsError } = await adminClient
          .from('blog_posts')
          .select('id')
          .eq('series_id', id)
          .limit(1);

        if (postsError) throw postsError;
        
        if (posts && posts.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete series with existing posts. Remove posts from series first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { error } = await adminClient
          .from('blog_series')
          .delete()
          .eq('id', id);

        if (error) throw error;
        console.log(`Deleted series: ${id}`);
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
