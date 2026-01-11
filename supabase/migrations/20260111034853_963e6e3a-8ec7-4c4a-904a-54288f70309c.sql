-- =============================================
-- BLOG ENHANCED SCHEMA MIGRATION
-- =============================================

-- 1. Create user_roles table for secure admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles - only service role can manage
CREATE POLICY "Service role manages user_roles"
ON public.user_roles FOR ALL
USING (false)
WITH CHECK (false);

-- 2. Create blog_categories table
CREATE TABLE public.blog_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
ON public.blog_categories FOR SELECT
USING (true);

CREATE POLICY "Service role manages categories"
ON public.blog_categories FOR ALL
USING (false)
WITH CHECK (false);

-- 3. Create blog_series table
CREATE TABLE public.blog_series (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    order_index integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view series"
ON public.blog_series FOR SELECT
USING (true);

CREATE POLICY "Service role manages series"
ON public.blog_series FOR ALL
USING (false)
WITH CHECK (false);

-- 4. Extend blog_posts with new columns
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.blog_categories(id),
ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.blog_series(id),
ADD COLUMN IF NOT EXISTS series_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS property_type text CHECK (property_type IN ('retail', 'industrial', 'multifamily', 'office', 'hospitality', 'general')),
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS canonical_url text,
ADD COLUMN IF NOT EXISTS og_image_url text,
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count_30d integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update status to support more states
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check 
CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived'));

-- 5. Create blog_post_redirects table
CREATE TABLE public.blog_post_redirects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    old_slug text UNIQUE NOT NULL,
    new_slug text NOT NULL,
    post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_post_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view redirects"
ON public.blog_post_redirects FOR SELECT
USING (true);

CREATE POLICY "Service role manages redirects"
ON public.blog_post_redirects FOR ALL
USING (false)
WITH CHECK (false);

-- 6. Create blog_post_revisions table
CREATE TABLE public.blog_post_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    title text NOT NULL,
    body_markdown text NOT NULL,
    excerpt text,
    updated_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_post_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages revisions"
ON public.blog_post_revisions FOR ALL
USING (false)
WITH CHECK (false);

-- 7. Create blog_post_views table for analytics
CREATE TABLE public.blog_post_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    view_date date NOT NULL DEFAULT CURRENT_DATE,
    view_count integer DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (post_id, view_date)
);

ALTER TABLE public.blog_post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages views"
ON public.blog_post_views FOR ALL
USING (false)
WITH CHECK (false);

-- 8. Create full-text search index
CREATE INDEX IF NOT EXISTS blog_posts_search_idx ON public.blog_posts USING gin(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION public.blog_posts_update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.body_markdown, '')), 'C');
  RETURN NEW;
END;
$$;

-- Trigger for search vector updates
DROP TRIGGER IF EXISTS blog_posts_search_trigger ON public.blog_posts;
CREATE TRIGGER blog_posts_search_trigger
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.blog_posts_update_search_vector();

-- Update existing posts to populate search_vector
UPDATE public.blog_posts SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(body_markdown, '')), 'C');

-- 9. Function for blog search (RPC)
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
  posted_at timestamptz,
  tags text[],
  reading_time_minutes integer,
  featured_image_url text,
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

-- 10. Function for related posts
CREATE OR REPLACE FUNCTION public.get_related_posts(
  post_id uuid,
  limit_count integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  excerpt text,
  posted_at timestamptz,
  featured_image_url text,
  relevance_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH target_post AS (
    SELECT bp.tags, bp.category_id, bp.series_id
    FROM public.blog_posts bp
    WHERE bp.id = post_id
  )
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.excerpt,
    bp.posted_at,
    bp.featured_image_url,
    (
      CASE WHEN bp.series_id = tp.series_id AND bp.series_id IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN bp.category_id = tp.category_id AND bp.category_id IS NOT NULL THEN 5 ELSE 0 END +
      COALESCE(array_length(ARRAY(SELECT unnest(bp.tags) INTERSECT SELECT unnest(tp.tags)), 1), 0) * 2
    )::integer as relevance_score
  FROM public.blog_posts bp, target_post tp
  WHERE bp.id != post_id
    AND bp.status = 'published'
  ORDER BY relevance_score DESC, bp.posted_at DESC
  LIMIT limit_count;
END;
$$;

-- 11. Function for series navigation
CREATE OR REPLACE FUNCTION public.get_series_posts(
  series_id_param uuid
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  series_order integer,
  posted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.series_order,
    bp.posted_at
  FROM public.blog_posts bp
  WHERE bp.series_id = series_id_param
    AND bp.status = 'published'
  ORDER BY bp.series_order ASC, bp.posted_at ASC;
END;
$$;

-- 12. Function to increment view count (rate-limited in edge function)
CREATE OR REPLACE FUNCTION public.increment_blog_view(post_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_id uuid;
BEGIN
  SELECT id INTO p_id FROM public.blog_posts WHERE slug = post_slug AND status = 'published';
  
  IF p_id IS NOT NULL THEN
    -- Update total view count
    UPDATE public.blog_posts 
    SET view_count_total = view_count_total + 1 
    WHERE id = p_id;
    
    -- Upsert daily view
    INSERT INTO public.blog_post_views (post_id, view_date, view_count)
    VALUES (p_id, CURRENT_DATE, 1)
    ON CONFLICT (post_id, view_date) 
    DO UPDATE SET view_count = blog_post_views.view_count + 1;
  END IF;
END;
$$;

-- 13. Function to update 30-day rolling views (call periodically)
CREATE OR REPLACE FUNCTION public.update_30d_view_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts bp
  SET view_count_30d = COALESCE((
    SELECT SUM(view_count)
    FROM public.blog_post_views bpv
    WHERE bpv.post_id = bp.id
      AND bpv.view_date >= CURRENT_DATE - INTERVAL '30 days'
  ), 0);
END;
$$;