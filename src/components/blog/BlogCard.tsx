import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  postedAt: string | null;
  tags: string[] | null;
  readingTimeMinutes: number | null;
  featuredImageUrl: string | null;
}

export function BlogCard({ 
  slug, 
  title, 
  excerpt, 
  postedAt, 
  tags, 
  readingTimeMinutes,
  featuredImageUrl,
}: BlogCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not dated';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <div className={featuredImageUrl ? 'md:flex' : ''}>
        {featuredImageUrl && (
          <Link to={`/blog/${slug}`} className="block md:w-64 md:flex-shrink-0">
            <img 
              src={featuredImageUrl} 
              alt={title}
              className="h-48 w-full object-cover md:h-full"
            />
          </Link>
        )}
        <CardContent className={`p-6 ${featuredImageUrl ? 'flex-1' : ''}`}>
          <Link to={`/blog/${slug}`} className="group">
            <h2 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
              {title}
            </h2>
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Posted: {formatDate(postedAt)}
            </span>
            {readingTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readingTimeMinutes} min read
              </span>
            )}
          </div>
          {excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {excerpt}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
