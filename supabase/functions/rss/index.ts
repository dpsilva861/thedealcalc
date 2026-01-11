import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const siteUrl = Deno.env.get('SITE_URL') || url.origin;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch published posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, posted_at, updated_at')
      .eq('status', 'published')
      .order('posted_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const now = new Date().toUTCString();

    const items = (posts || []).map((post) => {
      const pubDate = post.posted_at ? new Date(post.posted_at).toUTCString() : now;
      const description = post.excerpt || '';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TheDealCalc Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Real estate investment insights, strategies, and analysis for investors</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating RSS:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
});
