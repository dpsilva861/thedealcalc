import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BlogCard } from '@/components/blog/BlogCard';
import { FeaturedHero } from '@/components/blog/FeaturedHero';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  posted_at: string | null;
  tags: string[] | null;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
  category_name: string | null;
  series_name: string | null;
  difficulty: string | null;
  property_type: string | null;
  featured: boolean | null;
  view_count_total: number | null;
  total_count: number;
}

interface Category {
  slug: string;
  name: string;
}

const PAGE_SIZE = 10;

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories and tags on mount
  useEffect(() => {
    async function fetchMeta() {
      const [catResult, tagResult] = await Promise.all([
        supabase.from('blog_categories').select('slug, name').order('name'),
        supabase.from('blog_posts')
          .select('tags')
          .eq('status', 'published')
          .not('tags', 'is', null)
      ]);
      
      if (catResult.data) setCategories(catResult.data);
      
      // Extract unique tags
      if (tagResult.data) {
        const tags = new Set<string>();
        tagResult.data.forEach(post => {
          (post.tags || []).forEach((tag: string) => tags.add(tag));
        });
        setAllTags(Array.from(tags).sort());
      }
    }
    fetchMeta();
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('search_blog_posts', {
        search_query: debouncedSearch || null,
        category_slug: selectedCategory,
        series_slug: null,
        tag_filter: selectedTag,
        difficulty_filter: selectedDifficulty,
        property_type_filter: null,
        page_num: currentPage,
        page_size: PAGE_SIZE,
      });

      if (error) throw error;

      const results = data || [];
      
      // Get featured post from first page only
      if (currentPage === 1 && !debouncedSearch && !selectedCategory && !selectedTag && !selectedDifficulty) {
        const featured = results.find((p: BlogPost) => p.featured);
        setFeaturedPost(featured || null);
        setPosts(results.filter((p: BlogPost) => p.id !== featured?.id));
      } else {
        setFeaturedPost(null);
        setPosts(results);
      }
      
      setTotalCount(results.length > 0 ? Number(results[0].total_count) : 0);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load blog posts');
    }
    
    setLoading(false);
  }, [debouncedSearch, selectedCategory, selectedTag, selectedDifficulty, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedDifficulty(null);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchQuery || selectedCategory || selectedTag || selectedDifficulty);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Get RSS URL from edge function
  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss`;

  return (
    <Layout>
      <Helmet>
        <title>Blog | TheDealCalc - Real Estate Investment Insights</title>
        <meta 
          name="description" 
          content="Expert insights, strategies, and analysis for real estate investors. Learn about rental property analysis, BRRRR method, syndication, and more." 
        />
        <link rel="alternate" type="application/rss+xml" title="TheDealCalc Blog RSS" href={rssUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "TheDealCalc Blog",
            "description": "Real estate investment insights and analysis",
            "url": window.location.href,
            "publisher": {
              "@type": "Organization",
              "name": "TheDealCalc"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Blog</h1>
              <p className="text-muted-foreground">
                Insights and strategies for real estate investors
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={rssUrl} target="_blank" rel="noopener noreferrer">
                <Rss className="h-4 w-4 mr-2" />
                RSS
              </a>
            </Button>
          </div>

          <BlogFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
            selectedTag={selectedTag}
            onTagChange={(v) => { setSelectedTag(v); setCurrentPage(1); }}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={(v) => { setSelectedDifficulty(v); setCurrentPage(1); }}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categories={categories}
            allTags={allTags}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
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
          ) : posts.length === 0 && !featuredPost ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'No posts match your filters.' : 'No blog posts yet. Check back soon!'}
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {featuredPost && (
                <FeaturedHero
                  slug={featuredPost.slug}
                  title={featuredPost.title}
                  excerpt={featuredPost.excerpt}
                  postedAt={featuredPost.posted_at}
                  readingTimeMinutes={featuredPost.reading_time_minutes}
                  featuredImageUrl={featuredPost.featured_image_url}
                  categoryName={featuredPost.category_name}
                  tags={featuredPost.tags}
                />
              )}

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

              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
