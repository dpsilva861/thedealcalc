-- Step 1: Add featured_image_alt column to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS featured_image_alt text;

-- Step 2: Create RPC function for tag counts (only published posts)
CREATE OR REPLACE FUNCTION public.get_blog_tag_counts()
RETURNS TABLE (tag text, post_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(bp.tags) as tag,
    COUNT(*)::bigint as post_count
  FROM public.blog_posts bp
  WHERE bp.status = 'published'
    AND bp.tags IS NOT NULL
    AND array_length(bp.tags, 1) > 0
  GROUP BY unnest(bp.tags)
  ORDER BY post_count DESC, tag ASC;
END;
$$;

-- Step 3: Create RPC function to get posts by tag with pagination
CREATE OR REPLACE FUNCTION public.get_posts_by_tag(
  tag_filter text,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  excerpt text,
  posted_at timestamp with time zone,
  tags text[],
  reading_time_minutes integer,
  featured_image_url text,
  featured_image_alt text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total bigint;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total
  FROM public.blog_posts bp
  WHERE bp.status = 'published'
    AND tag_filter = ANY(bp.tags);

  RETURN QUERY
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.excerpt,
    bp.posted_at,
    bp.tags,
    bp.reading_time_minutes,
    bp.featured_image_url,
    bp.featured_image_alt,
    total as total_count
  FROM public.blog_posts bp
  WHERE bp.status = 'published'
    AND tag_filter = ANY(bp.tags)
  ORDER BY bp.posted_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$;

-- Step 4: Create function to get category post counts
CREATE OR REPLACE FUNCTION public.get_category_post_counts()
RETURNS TABLE (category_id uuid, post_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id as category_id,
    COUNT(bp.id)::bigint as post_count
  FROM public.blog_categories bc
  LEFT JOIN public.blog_posts bp ON bp.category_id = bc.id AND bp.status = 'published'
  GROUP BY bc.id;
END;
$$;

-- Step 5: Create function to get series post counts
CREATE OR REPLACE FUNCTION public.get_series_post_counts()
RETURNS TABLE (series_id uuid, post_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.id as series_id,
    COUNT(bp.id)::bigint as post_count
  FROM public.blog_series bs
  LEFT JOIN public.blog_posts bp ON bp.series_id = bs.id AND bp.status = 'published'
  GROUP BY bs.id;
END;
$$;

-- Step 6: Update search_blog_posts to include featured_image_alt
DROP FUNCTION IF EXISTS public.search_blog_posts(text, text, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.search_blog_posts(
  search_query text DEFAULT NULL,
  category_slug text DEFAULT NULL,
  series_slug text DEFAULT NULL,
  tag_filter text DEFAULT NULL,
  difficulty_filter text DEFAULT NULL,
  property_type_filter text DEFAULT NULL,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  excerpt text,
  posted_at timestamp with time zone,
  tags text[],
  reading_time_minutes integer,
  featured_image_url text,
  featured_image_alt text,
  category_name text,
  series_name text,
  difficulty text,
  property_type text,
  featured boolean,
  view_count_total integer,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total bigint;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total
  FROM public.blog_posts bp
  LEFT JOIN public.blog_categories bc ON bp.category_id = bc.id
  LEFT JOIN public.blog_series bs ON bp.series_id = bs.id
  WHERE bp.status = 'published'
    AND (search_query IS NULL OR bp.search_vector @@ plainto_tsquery('english', search_query))
    AND (category_slug IS NULL OR bc.slug = category_slug)
    AND (series_slug IS NULL OR bs.slug = series_slug)
    AND (tag_filter IS NULL OR tag_filter = ANY(bp.tags))
    AND (difficulty_filter IS NULL OR bp.difficulty = difficulty_filter)
    AND (property_type_filter IS NULL OR bp.property_type = property_type_filter);

  RETURN QUERY
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.excerpt,
    bp.posted_at,
    bp.tags,
    bp.reading_time_minutes,
    bp.featured_image_url,
    bp.featured_image_alt,
    bc.name as category_name,
    bs.name as series_name,
    bp.difficulty,
    bp.property_type,
    bp.featured,
    bp.view_count_total,
    total as total_count
  FROM public.blog_posts bp
  LEFT JOIN public.blog_categories bc ON bp.category_id = bc.id
  LEFT JOIN public.blog_series bs ON bp.series_id = bs.id
  WHERE bp.status = 'published'
    AND (search_query IS NULL OR bp.search_vector @@ plainto_tsquery('english', search_query))
    AND (category_slug IS NULL OR bc.slug = category_slug)
    AND (series_slug IS NULL OR bs.slug = series_slug)
    AND (tag_filter IS NULL OR tag_filter = ANY(bp.tags))
    AND (difficulty_filter IS NULL OR bp.difficulty = difficulty_filter)
    AND (property_type_filter IS NULL OR bp.property_type = property_type_filter)
  ORDER BY bp.featured DESC, bp.posted_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$;