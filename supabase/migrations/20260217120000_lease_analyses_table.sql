-- Create lease_analyses table for persisting redline analysis results
CREATE TABLE IF NOT EXISTS public.lease_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'lease', 'loi', 'amendment', 'addendum', 'work_letter',
    'guaranty', 'subordination_estoppel', 'restaurant_exhibit'
  )),
  output_mode text NOT NULL CHECK (output_mode IN ('redline', 'clean', 'summary')),
  document_text_preview text, -- first 500 chars for listing/search
  additional_instructions text,
  revisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  defined_terms jsonb NOT NULL DEFAULT '[]'::jsonb,
  decisions jsonb NOT NULL DEFAULT '[]'::jsonb, -- user accept/reject decisions
  token_usage jsonb,
  title text, -- user-assigned or auto-generated title
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_lease_analyses_user_id ON public.lease_analyses(user_id);
CREATE INDEX idx_lease_analyses_created_at ON public.lease_analyses(created_at DESC);
CREATE INDEX idx_lease_analyses_document_type ON public.lease_analyses(document_type);

-- Enable RLS
ALTER TABLE public.lease_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own lease analyses"
ON public.lease_analyses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own lease analyses"
ON public.lease_analyses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses (e.g., decisions, title)
CREATE POLICY "Users can update own lease analyses"
ON public.lease_analyses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own lease analyses"
ON public.lease_analyses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lease_analyses_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lease_analyses_updated_at
  BEFORE UPDATE ON public.lease_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_lease_analyses_updated_at();
