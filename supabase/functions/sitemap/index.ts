import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    // Always use canonical domain - ignore origin from request
    const siteUrl = 'https://thedealcalc.com';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('posted_at', { ascending: false });

    if (error) throw error;

    // Fetch categories
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('slug');

    // Fetch series
    const { data: series } = await supabase
      .from('blog_series')
      .select('slug');

    const now = new Date().toISOString();

    // Static pages - NO trailing slashes except homepage
    // Comprehensive list of all indexable routes
    const staticPages = [
      // Homepage
      { url: '', priority: '1.0', changefreq: 'weekly' },
      
      // Calculator hub
      { url: '/calculators', priority: '0.9', changefreq: 'weekly' },
      
      // Core calculator apps
      { url: '/underwrite', priority: '0.9', changefreq: 'weekly' },
      { url: '/brrrr', priority: '0.9', changefreq: 'weekly' },
      { url: '/syndication', priority: '0.9', changefreq: 'weekly' },
      { url: '/npv-calculator', priority: '0.8', changefreq: 'weekly' },
      
      // SEO landing pages
      { url: '/rental-property-calculator', priority: '0.8', changefreq: 'weekly' },
      { url: '/brrrr-calculator', priority: '0.8', changefreq: 'weekly' },
      { url: '/syndication-calculator', priority: '0.8', changefreq: 'weekly' },
      { url: '/fix-and-flip-calculator', priority: '0.8', changefreq: 'weekly' },
      { url: '/cap-rate-calculator', priority: '0.8', changefreq: 'weekly' },
      { url: '/cash-on-cash-calculator', priority: '0.8', changefreq: 'weekly' },
      { url: '/real-estate-investment-calculator', priority: '0.8', changefreq: 'weekly' },
      
      // Blog
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/blog/tags', priority: '0.7', changefreq: 'weekly' },
      
      // Informational
      { url: '/how-it-works', priority: '0.7', changefreq: 'monthly' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      
      // Legal
      { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms', priority: '0.3', changefreq: 'yearly' },
      { url: '/cookies', priority: '0.3', changefreq: 'yearly' },
      { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
      { url: '/ad-tech-providers', priority: '0.3', changefreq: 'yearly' },
    ];

    // Homepage special case: add trailing slash
    let urls = staticPages.map(page => {
      const locUrl = page.url === '' ? `${siteUrl}/` : `${siteUrl}${page.url}`;
      return `
  <url>
    <loc>${locUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }).join('');

    // Blog posts
    (posts || []).forEach(post => {
      urls += `
  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Categories
    (categories || []).forEach(cat => {
      urls += `
  <url>
    <loc>${siteUrl}/blog/category/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    // Series
    (series || []).forEach(s => {
      urls += `
  <url>
    <loc>${siteUrl}/blog/series/${s.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
