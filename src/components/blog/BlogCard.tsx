import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  postedAt: string | null;
  tags: string[] | null;
  readingTimeMinutes: number | null;
}

export function BlogCard({ 
  slug, 
  title, 
  excerpt, 
  postedAt, 
  tags, 
  readingTimeMinutes 
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <Link to={`/blog/${slug}`} className="group">
          <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
            {title}
          </h2>
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
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
      </CardHeader>
      <CardContent>
        {excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
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
    </Card>
  );
}
