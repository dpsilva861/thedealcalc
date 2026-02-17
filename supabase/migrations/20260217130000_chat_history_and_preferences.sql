-- Add chat_history column to lease_analyses table
ALTER TABLE public.lease_analyses
  ADD COLUMN IF NOT EXISTS chat_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create user_lease_preferences table for memory/personalization
CREATE TABLE IF NOT EXISTS public.user_lease_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  negotiation_style text CHECK (negotiation_style IN ('aggressive', 'moderate', 'conservative')),
  typical_cap_rate numeric,
  typical_escalation numeric,
  preferred_doc_types text[],
  common_instructions text,
  revision_patterns jsonb DEFAULT '{}'::jsonb, -- tracks accept/reject patterns by category
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_lease_preferences_user_id
  ON public.user_lease_preferences(user_id);

-- RLS
ALTER TABLE public.user_lease_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lease preferences"
ON public.user_lease_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lease preferences"
ON public.user_lease_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lease preferences"
ON public.user_lease_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_lease_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_lease_preferences_updated_at
  BEFORE UPDATE ON public.user_lease_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_lease_preferences_updated_at();
