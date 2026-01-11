import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SeriesPost {
  id: string;
  slug: string;
  title: string;
  series_order: number;
}

interface SeriesNavigationProps {
  seriesName: string;
  seriesSlug: string;
  posts: SeriesPost[];
  currentPostId: string;
}

export function SeriesNavigation({ seriesName, seriesSlug, posts, currentPostId }: SeriesNavigationProps) {
  if (posts.length <= 1) return null;

  const currentIndex = posts.findIndex(p => p.id === currentPostId);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <div className="my-8 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Part of series</p>
          <Link 
            to={`/blog/series/${seriesSlug}`}
            className="font-semibold text-primary hover:underline"
          >
            {seriesName}
          </Link>
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {posts.length}
        </span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        {prevPost ? (
          <Button variant="outline" size="sm" asChild className="flex-1 justify-start">
            <Link to={`/blog/${prevPost.slug}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="truncate">{prevPost.title}</span>
            </Link>
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        
        {nextPost ? (
          <Button variant="outline" size="sm" asChild className="flex-1 justify-end">
            <Link to={`/blog/${nextPost.slug}`}>
              <span className="truncate">{nextPost.title}</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
