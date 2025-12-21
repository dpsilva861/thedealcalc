-- Add plan_tier and selected_calculator columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'free' NOT NULL,
ADD COLUMN IF NOT EXISTS selected_calculator text DEFAULT NULL;

-- Create stripe_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on stripe_events (only service role should access this)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Only service role can manage stripe_events (no policies means only service role)
-- This is intentional - webhook uses service role key

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_tier ON public.profiles(plan_tier);