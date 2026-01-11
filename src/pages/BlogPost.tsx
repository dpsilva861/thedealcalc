import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { MarkdownContent } from '@/components/blog/MarkdownContent';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { SeriesNavigation } from '@/components/blog/SeriesNavigation';
import { BlogBreadcrumb, BLOG_BREADCRUMBS } from '@/components/blog/BlogBreadcrumb';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, User, Eye } from 'lucide-react';

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  posted_at: string | null;
  tags: string[] | null;
  reading_time_minutes: number | null;
  author_name: string | null;
  featured_image_url: string | null;
  category_id: string | null;
  series_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  difficulty: string | null;
  view_count_total: number | null;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  posted_at: string | null;
  featured_image_url: string | null;
}

interface SeriesPost {
  id: string;
  slug: string;
  title: string;
  series_order: number;
}

interface Series {
  id: string;
  slug: string;
  name: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [seriesPosts, setSeriesPosts] = useState<SeriesPost[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      // Check for redirect first
      const { data: redirect } = await supabase
        .from('blog_post_redirects')
        .select('new_slug')
        .eq('old_slug', slug)
        .maybeSingle();

      if (redirect?.new_slug) {
        navigate(`/blog/${redirect.new_slug}`, { replace: true });
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load post');
        console.error('Error fetching post:', fetchError);
        setLoading(false);
        return;
      }
      
      if (!data) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      setPost(data);

      // Track view (fire and forget)
      supabase.functions.invoke('blog-track-view', {
        body: { slug }
      }).catch(console.error);

      // Fetch category if exists
      if (data.category_id) {
        const { data: catData } = await supabase
          .from('blog_categories')
          .select('id, slug, name')
          .eq('id', data.category_id)
          .single();
        if (catData) setCategory(catData);
      }

      // Fetch series if exists
      if (data.series_id) {
        const { data: seriesData } = await supabase
          .from('blog_series')
          .select('id, slug, name')
          .eq('id', data.series_id)
          .single();
        if (seriesData) {
          setSeries(seriesData);
          
          // Fetch series posts
          const { data: spData } = await supabase.rpc('get_series_posts', {
            series_id_param: data.series_id
          });
          if (spData) setSeriesPosts(spData);
        }
      }

      // Fetch related posts
      const { data: related } = await supabase.rpc('get_related_posts', {
        post_id: data.id,
        limit_count: 3
      });
      if (related) setRelatedPosts(related);

      setLoading(false);
    }

    fetchPost();
  }, [slug, navigate]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not dated';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-64 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
            <h1 className="text-2xl font-bold mb-4">{error || 'Post not found'}</h1>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const pageTitle = post.seo_title || post.title;
  const pageDescription = post.seo_description || post.excerpt || `Read ${post.title} on TheDealCalc Blog`;
  const ogImage = post.og_image_url || post.featured_image_url;
  const canonicalUrl = post.canonical_url || `${window.location.origin}/blog/${post.slug}`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": ogImage,
    "datePublished": post.posted_at,
    "author": {
      "@type": "Person",
      "name": post.author_name || "TheDealCalc Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TheDealCalc"
    },
    "mainEntityOfPage": canonicalUrl
  };

  // Breadcrumb items for UI - note: JSON-LD is already handled above
  const breadcrumbItems = [
    BLOG_BREADCRUMBS.home,
    BLOG_BREADCRUMBS.blog,
    { label: post.title }
  ];

  return (
    <Layout>
      <Helmet>
        <title>{pageTitle} | TheDealCalc Blog</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {post.posted_at && (
          <meta property="article:published_time" content={new Date(post.posted_at).toISOString()} />
        )}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <ReadingProgress />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <BlogBreadcrumb items={breadcrumbItems} />

            <div className="lg:flex lg:gap-8">
              {/* Main content */}
              <article className="flex-1 min-w-0">
                {/* Posted date at the very top */}
                <p className="text-muted-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Posted: {formatDate(post.posted_at)}
                </p>

                <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                  {post.author_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author_name}
                    </span>
                  )}
                  {post.reading_time_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.reading_time_minutes} min read
                    </span>
                  )}
                  {post.view_count_total !== null && post.view_count_total > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count_total.toLocaleString()} views
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {category && (
                    <Link to={`/blog/category/${category.slug}`}>
                      <Badge variant="default">{category.name}</Badge>
                    </Link>
                  )}
                  {post.difficulty && (
                    <Badge variant="outline" className="capitalize">{post.difficulty}</Badge>
                  )}
                  {post.tags && post.tags.map((tag) => (
                    <Link key={tag} to={`/blog/tag/${encodeURIComponent(tag)}`}>
                      <Badge variant="secondary">{tag}</Badge>
                    </Link>
                  ))}
                </div>

                {series && seriesPosts.length > 1 && (
                  <SeriesNavigation
                    seriesName={series.name}
                    seriesSlug={series.slug}
                    posts={seriesPosts}
                    currentPostId={post.id}
                  />
                )}

                {post.featured_image_url && (
                  <img 
                    src={post.featured_image_url} 
                    alt={post.title}
                    className="w-full h-auto rounded-lg mb-8 max-h-96 object-cover"
                    loading="eager"
                  />
                )}

                <div className="prose prose-lg max-w-none">
                  <MarkdownContent content={post.body_markdown} />
                </div>

                <RelatedPosts posts={relatedPosts} />
              </article>

              {/* Sidebar TOC */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <TableOfContents content={post.body_markdown} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
