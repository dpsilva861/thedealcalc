import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogBreadcrumb, BLOG_BREADCRUMBS } from '@/components/blog/BlogBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogSeries() {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<{ name: string; description: string | null } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!slug) return;
      
      const { data: s } = await supabase
        .from('blog_series')
        .select('name, description')
        .eq('slug', slug)
        .single();
      
      if (s) setSeries(s);

      const { data } = await supabase.rpc('search_blog_posts', {
        series_slug: slug,
        page_num: 1,
        page_size: 50
      });
      
      setPosts(data || []);
      setLoading(false);
    }
    fetch();
  }, [slug]);

  const breadcrumbItems = [
    BLOG_BREADCRUMBS.home,
    BLOG_BREADCRUMBS.blog,
    { label: "Series", href: "/blog" },
    { label: series?.name || "Series" }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": series?.name || "Series",
    "description": series?.description || `Articles in the ${series?.name || 'series'} on TheDealCalc`,
    "url": `https://thedealcalc.com/blog/series/${slug}`,
  };

  return (
    <Layout>
      <Helmet>
        <title>{series?.name || 'Series'} | TheDealCalc Blog</title>
        <meta name="description" content={series?.description || `Browse articles in the ${series?.name || 'series'}`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://thedealcalc.com/blog/series/${slug}`} />
        <meta property="og:title" content={`${series?.name || 'Series'} | TheDealCalc Blog`} />
        <meta property="og:description" content={series?.description || `Browse articles in the ${series?.name || 'series'}`} />
        <meta property="og:url" content={`https://thedealcalc.com/blog/series/${slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-blog.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${series?.name || 'Series'} | TheDealCalc Blog`} />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-blog.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <BlogBreadcrumb items={breadcrumbItems} includeJsonLd={false} />
          <h1 className="text-4xl font-bold mb-2">{series?.name || 'Series'}</h1>
          {series?.description && <p className="text-muted-foreground mb-8">{series.description}</p>}
          
          {loading ? (
            <div className="space-y-6">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground">No posts in this series yet.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <BlogCard key={post.id} slug={post.slug} title={post.title} excerpt={post.excerpt}
                  postedAt={post.posted_at} tags={post.tags} readingTimeMinutes={post.reading_time_minutes}
                  featuredImageUrl={post.featured_image_url} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
