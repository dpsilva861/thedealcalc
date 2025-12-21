-- Fix stripe_events table RLS policies
-- This table should only be accessible by service role (edge functions)

-- Create policy for service role to insert stripe events (for idempotency tracking)
CREATE POLICY "Service role can insert stripe events"
ON public.stripe_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy for service role to select stripe events (for idempotency check)
CREATE POLICY "Service role can select stripe events"
ON public.stripe_events
FOR SELECT
TO service_role
USING (true);