-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage zip codes" ON public.zip_codes;

-- Create specific policies for zip_codes table
-- Authenticated users can only read zip codes (intentional for app functionality)
-- The existing "Authenticated users can view zip codes" policy handles SELECT

-- Service role can only INSERT new zip codes (from edge functions)
CREATE POLICY "Service role can insert zip codes"
ON public.zip_codes
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can only UPDATE existing zip codes (increment counts)
CREATE POLICY "Service role can update zip codes"
ON public.zip_codes
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- No DELETE policy for service role - zip codes should not be deleted