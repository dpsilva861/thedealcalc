-- Fix stripe_events RLS: remove SELECT policy for authenticated users
-- Only service role should access this table

DROP POLICY IF EXISTS "Service role can select stripe events" ON public.stripe_events;

-- Create restrictive policy that denies all client SELECT
CREATE POLICY "No client access to stripe events" ON public.stripe_events
FOR SELECT USING (false);