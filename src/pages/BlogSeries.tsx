import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BlogCard } from '@/components/blog/BlogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

  return (
    <Layout>
      <Helmet>
        <title>{series?.name || 'Series'} | TheDealCalc Blog</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />Back to Blog</Link>
          </Button>
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
