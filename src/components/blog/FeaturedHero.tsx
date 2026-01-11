import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, TrendingUp } from 'lucide-react';

interface FeaturedHeroProps {
  slug: string;
  title: string;
  excerpt: string | null;
  postedAt: string | null;
  readingTimeMinutes: number | null;
  featuredImageUrl: string | null;
  categoryName: string | null;
  tags: string[] | null;
}

export function FeaturedHero({
  slug,
  title,
  excerpt,
  postedAt,
  readingTimeMinutes,
  featuredImageUrl,
  categoryName,
  tags,
}: FeaturedHeroProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Link 
      to={`/blog/${slug}`}
      className="group relative block overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border mb-8"
    >
      <div className="md:flex">
        {featuredImageUrl && (
          <div className="md:w-1/2">
            <img
              src={featuredImageUrl}
              alt={title}
              className="h-64 md:h-full w-full object-cover"
              loading="eager"
            />
          </div>
        )}
        <div className={`p-6 md:p-8 flex flex-col justify-center ${featuredImageUrl ? 'md:w-1/2' : 'w-full'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default" className="bg-primary">
              <TrendingUp className="h-3 w-3 mr-1" />
              Featured
            </Badge>
            {categoryName && (
              <Badge variant="secondary">{categoryName}</Badge>
            )}
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
            {title}
          </h2>
          
          {excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {postedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(postedAt)}
              </span>
            )}
            {readingTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readingTimeMinutes} min read
              </span>
            )}
          </div>
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
