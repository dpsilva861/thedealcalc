-- Create billing_private table for Stripe data (service-role only access)
CREATE TABLE public.billing_private (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS with NO client access
ALTER TABLE public.billing_private ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no authenticated user policies)
CREATE POLICY "Service role only - insert" ON public.billing_private
FOR INSERT WITH CHECK (false);

CREATE POLICY "Service role only - select" ON public.billing_private
FOR SELECT USING (false);

CREATE POLICY "Service role only - update" ON public.billing_private
FOR UPDATE USING (false);

CREATE POLICY "Service role only - delete" ON public.billing_private
FOR DELETE USING (false);

-- Migrate existing Stripe data from profiles to billing_private
INSERT INTO public.billing_private (user_id, stripe_customer_id, stripe_subscription_id)
SELECT user_id, stripe_customer_id, stripe_subscription_id
FROM public.profiles
WHERE stripe_customer_id IS NOT NULL OR stripe_subscription_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remove Stripe columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_subscription_id;

-- Create trigger for updated_at on billing_private
CREATE TRIGGER update_billing_private_updated_at
BEFORE UPDATE ON public.billing_private
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();