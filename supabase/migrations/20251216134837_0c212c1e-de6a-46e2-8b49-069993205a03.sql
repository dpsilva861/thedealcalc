-- Update default free_analyses_limit to 3 for new users
ALTER TABLE public.profiles 
ALTER COLUMN free_analyses_limit SET DEFAULT 3;

-- Update existing users who haven't used their free trial yet to get 3 free analyses
UPDATE public.profiles 
SET free_analyses_limit = 3 
WHERE subscription_status != 'active' 
AND analyses_used = 0;