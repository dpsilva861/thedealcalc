-- Create function to increment zip code count
CREATE OR REPLACE FUNCTION public.increment_zip_count(p_zip_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE zip_codes 
  SET analysis_count = analysis_count + 1, updated_at = now()
  WHERE zip_code = p_zip_code;
END;
$$;