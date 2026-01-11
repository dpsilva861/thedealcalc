-- A) Create admin emails table for storage RLS
CREATE TABLE IF NOT EXISTS public.blog_admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert seed emails (add your admin emails here)
-- Example: INSERT INTO public.blog_admin_emails (email) VALUES ('admin@example.com');

-- B) Create helper function for storage RLS
CREATE OR REPLACE FUNCTION public.is_blog_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blog_admin_emails
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  )
$$;

-- C) Add unique constraint on blog_posts.slug if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_slug_unique'
  ) THEN
    ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- D) Add unique constraints on category/series slugs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_categories_slug_unique'
  ) THEN
    ALTER TABLE public.blog_categories ADD CONSTRAINT blog_categories_slug_unique UNIQUE (slug);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_series_slug_unique'
  ) THEN
    ALTER TABLE public.blog_series ADD CONSTRAINT blog_series_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- E) Drop existing permissive storage policies on blog-images bucket
DROP POLICY IF EXISTS "Public read access for blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- F) Create new secure storage policies for blog-images
-- Public read for blog images (anyone can view)
CREATE POLICY "Public read blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Admin-only insert for blog images
CREATE POLICY "Admin only insert blog images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND public.is_blog_admin()
);

-- Admin-only update for blog images
CREATE POLICY "Admin only update blog images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-images' 
  AND public.is_blog_admin()
);

-- Admin-only delete for blog images
CREATE POLICY "Admin only delete blog images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-images' 
  AND public.is_blog_admin()
);