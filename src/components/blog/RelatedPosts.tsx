import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  posted_at: string | null;
  featured_image_url: string | null;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link to={`/blog/${post.slug}`}>
              {post.featured_image_url && (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(post.posted_at)}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
