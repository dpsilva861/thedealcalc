import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { BlogBreadcrumb, BLOG_BREADCRUMBS } from '@/components/blog/BlogBreadcrumb';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Tag } from 'lucide-react';

interface TagCount {
  tag: string;
  post_count: number;
}

export default function BlogTags() {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchTags() {
      try {
        const { data, error } = await supabase.rpc('get_blog_tag_counts');
        
        if (error) throw error;
        setTags(data || []);
        setFilteredTags(data || []);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
      setLoading(false);
    }

    fetchTags();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTags(tags);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTags(tags.filter(t => t.tag.toLowerCase().includes(query)));
    }
  }, [searchQuery, tags]);

  const totalPosts = tags.reduce((sum, t) => sum + Number(t.post_count), 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Blog Tags",
    "description": "Browse all blog topics and tags on TheDealCalc",
    "url": "https://thedealcalc.com/blog/tags",
  };

  return (
    <Layout>
      <Helmet>
        <title>Blog Tags | TheDealCalc</title>
        <meta name="description" content="Browse all blog topics and tags on TheDealCalc. Find articles on real estate investing, BRRRR, syndication, analysis, and more." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/blog/tags" />
        <meta property="og:title" content="Blog Tags | TheDealCalc" />
        <meta property="og:description" content="Browse all blog topics and tags on TheDealCalc." />
        <meta property="og:url" content="https://thedealcalc.com/blog/tags" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thedealcalc.com/og/og-blog.png" />
        <meta property="og:site_name" content="TheDealCalc" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Tags | TheDealCalc" />
        <meta name="twitter:image" content="https://thedealcalc.com/og/og-blog.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <BlogBreadcrumb 
          items={[BLOG_BREADCRUMBS.home, BLOG_BREADCRUMBS.blog, BLOG_BREADCRUMBS.tags]} 
          includeJsonLd={false} 
        />
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Browse Tags</h1>
          </div>
          <p className="text-muted-foreground">
            Explore {tags.length} tags across {totalPosts} articles
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No tags match your search.' : 'No tags found.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredTags.map((item) => (
              <Link 
                key={item.tag} 
                to={`/blog/tag/${encodeURIComponent(item.tag)}`}
                className="group"
              >
                <Badge 
                  variant="secondary" 
                  className="text-sm py-2 px-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  {item.tag}
                  <span className="ml-2 opacity-70">({item.post_count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
