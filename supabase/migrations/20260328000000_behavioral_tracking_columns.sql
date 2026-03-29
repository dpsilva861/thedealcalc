-- Add behavioral tracking columns to redline_jobs
ALTER TABLE redline_jobs ADD COLUMN IF NOT EXISTS docx_downloaded BOOLEAN DEFAULT FALSE;
ALTER TABLE redline_jobs ADD COLUMN IF NOT EXISTS pdf_downloaded BOOLEAN DEFAULT FALSE;
ALTER TABLE redline_jobs ADD COLUMN IF NOT EXISTS time_on_results_seconds INTEGER;
