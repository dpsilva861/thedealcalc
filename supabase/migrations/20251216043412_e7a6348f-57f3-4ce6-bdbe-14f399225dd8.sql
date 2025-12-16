-- Create saved_analyses table
CREATE TABLE public.saved_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own analyses"
ON public.saved_analyses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
ON public.saved_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
ON public.saved_analyses
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_analyses_updated_at
BEFORE UPDATE ON public.saved_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create zip_codes table for analytics (collecting area info)
CREATE TABLE public.zip_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code TEXT NOT NULL,
  city TEXT,
  state TEXT,
  analysis_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(zip_code)
);

-- Enable RLS but allow inserts/updates from authenticated users
ALTER TABLE public.zip_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read zip codes (for future features)
CREATE POLICY "Authenticated users can view zip codes"
ON public.zip_codes
FOR SELECT
TO authenticated
USING (true);

-- Service role only for inserts/updates (we'll use edge function)
CREATE POLICY "Service role can manage zip codes"
ON public.zip_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);