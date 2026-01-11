import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { BlogBreadcrumb, BLOG_BREADCRUMBS } from '@/components/blog/BlogBreadcrumb';
import { Loader2, Tag } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  posted_at: string | null;
  tags: string[] | null;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  total_count: number;
}

const POSTS_PER_PAGE = 10;

export default function BlogTag() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = tag ? decodeURIComponent(tag) : '';
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchPosts() {
      if (!decodedTag) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_posts_by_tag', {
          tag_filter: decodedTag,
          page_num: currentPage,
          page_size: POSTS_PER_PAGE,
        });
        
        if (error) throw error;
        
        setPosts(data || []);
        if (data && data.length > 0) {
          setTotalCount(Number(data[0].total_count));
        } else {
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching posts by tag:', err);
      }
      setLoading(false);
    }

    fetchPosts();
  }, [decodedTag, currentPage]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Posts tagged "${decodedTag}"`,
    "description": `Articles about ${decodedTag} on TheDealCalc blog`,
    "url": `https://thedealcalc.com/blog/tag/${encodeURIComponent(decodedTag)}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalCount,
      "itemListElement": posts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://thedealcalc.com/blog/${post.slug}`,
        "name": post.title
      }))
    }
  };

  const breadcrumbItems = [
    BLOG_BREADCRUMBS.home,
    BLOG_BREADCRUMBS.blog,
    BLOG_BREADCRUMBS.tags,
    { label: decodedTag }
  ];

  return (
    <Layout>
      <Helmet>
        <title>{`Posts tagged "${decodedTag}" | TheDealCalc Blog`}</title>
        <meta 
          name="description" 
          content={`Browse ${totalCount} articles about ${decodedTag} on TheDealCalc. Real estate investing insights and analysis.`} 
        />
        <link rel="canonical" href={`https://thedealcalc.com/blog/tag/${encodeURIComponent(decodedTag)}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <BlogBreadcrumb items={breadcrumbItems} includeJsonLd={false} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{decodedTag}</h1>
              <p className="text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found with this tag.</p>
            <Link to="/blog" className="text-primary hover:underline mt-2 inline-block">
              Browse all posts
            </Link>
          </div>
        ) : (
          <>
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

            {totalPages > 1 && (
              <div className="mt-8">
                <BlogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
