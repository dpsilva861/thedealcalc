
-- Enable RLS on blog_admin_emails table
ALTER TABLE public.blog_admin_emails ENABLE ROW LEVEL SECURITY;

-- Create policy: No public read access (table is only accessed by is_blog_admin() function which uses SECURITY DEFINER)
-- The is_blog_admin() function already has SECURITY DEFINER and queries this table directly
CREATE POLICY "No public access to admin emails"
ON public.blog_admin_emails
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Note: Service role can still access this table for management
-- The is_blog_admin() function uses SECURITY DEFINER so it bypasses RLS
