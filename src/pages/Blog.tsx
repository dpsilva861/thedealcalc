import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { BlogCard } from '@/components/blog/BlogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  posted_at: string | null;
  tags: string[] | null;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, posted_at, tags, reading_time_minutes, featured_image_url')
        .eq('status', 'published')
        .order('posted_at', { ascending: false });

      if (error) {
        setError('Failed to load blog posts');
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  return (
    <>
      <Helmet>
        <title>Blog | TheDealCalc - Real Estate Investment Insights</title>
        <meta 
          name="description" 
          content="Expert insights, strategies, and analysis for real estate investors. Learn about rental property analysis, BRRRR method, syndication, and more." 
        />
        <link rel="alternate" type="application/rss+xml" title="TheDealCalc Blog RSS" href="/rss.xml" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Blog</h1>
              <p className="text-muted-foreground">
                Insights and strategies for real estate investors
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/rss.xml" target="_blank">
                <Rss className="h-4 w-4 mr-2" />
                RSS
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  postedAt={post.posted_at}
                  tags={post.tags}
                  readingTimeMinutes={post.reading_time_minutes}
                  featuredImageUrl={post.featured_image_url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
