-- Add column to track free trial usage
ALTER TABLE public.profiles 
ADD COLUMN analyses_used INTEGER NOT NULL DEFAULT 0;

-- Add column for free trial limit (allows flexibility)
ALTER TABLE public.profiles 
ADD COLUMN free_analyses_limit INTEGER NOT NULL DEFAULT 1;