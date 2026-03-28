-- =============================================
-- CREagentic Initial Database Schema
-- =============================================

-- System prompt version control (created first for FK reference)
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  changelog TEXT,
  patterns_incorporated UUID[],
  avg_feedback_score FLOAT,
  total_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  is_candidate BOOLEAN DEFAULT false,
  ab_test_allocation FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CORE TABLES
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  credits INTEGER DEFAULT 0,
  total_redlines INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE redline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  input_filename TEXT NOT NULL,
  input_text TEXT,
  input_token_count INTEGER,
  property_type TEXT,
  deal_type TEXT,
  redline_mode TEXT DEFAULT 'standard',
  perspective TEXT DEFAULT 'landlord',
  prompt_version_id UUID REFERENCES prompt_versions(id),
  output_json JSONB,
  output_docx_url TEXT,
  output_pdf_url TEXT,
  processing_time_ms INTEGER,
  api_cost_cents INTEGER,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- SELF-LEARNING TABLES
-- =============================================

-- Individual feedback on each redline item within a job
CREATE TABLE redline_item_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES redline_jobs(id),
  redline_item_index INTEGER NOT NULL,
  category TEXT,
  severity TEXT,
  action TEXT NOT NULL,
  modified_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Overall job feedback (stars + comment)
CREATE TABLE job_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES redline_jobs(id),
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned patterns (auto-populated by learning engine)
CREATE TABLE learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  example_text TEXT,
  recommended_action TEXT,
  recommended_language TEXT,
  frequency INTEGER DEFAULT 1,
  acceptance_rate FLOAT,
  avg_rating FLOAT,
  confidence FLOAT DEFAULT 0.5,
  property_types TEXT[],
  deal_types TEXT[],
  regions TEXT[],
  source_job_ids UUID[],
  is_active BOOLEAN DEFAULT true,
  promoted_to_prompt BOOLEAN DEFAULT false,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test results tracking
CREATE TABLE ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  control_version_id UUID REFERENCES prompt_versions(id),
  candidate_version_id UUID REFERENCES prompt_versions(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  control_jobs INTEGER DEFAULT 0,
  candidate_jobs INTEGER DEFAULT 0,
  control_avg_rating FLOAT,
  candidate_avg_rating FLOAT,
  control_acceptance_rate FLOAT,
  candidate_acceptance_rate FLOAT,
  winner TEXT,
  auto_promoted BOOLEAN DEFAULT false
);

-- Clause library (grows automatically from processed LOIs)
CREATE TABLE clause_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_type TEXT NOT NULL,
  original_language TEXT NOT NULL,
  quality_assessment TEXT,
  recommended_alternative TEXT,
  perspective TEXT,
  times_seen INTEGER DEFAULT 1,
  source_job_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTENT/SEO TABLES
-- =============================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_jobs_user ON redline_jobs(user_id);
CREATE INDEX idx_jobs_status ON redline_jobs(status);
CREATE INDEX idx_jobs_created ON redline_jobs(created_at DESC);
CREATE INDEX idx_patterns_category ON learned_patterns(category);
CREATE INDEX idx_patterns_confidence ON learned_patterns(confidence DESC);
CREATE INDEX idx_patterns_active ON learned_patterns(is_active) WHERE is_active = true;
CREATE INDEX idx_item_feedback_job ON redline_item_feedback(job_id);
CREATE INDEX idx_item_feedback_action ON redline_item_feedback(action);
CREATE INDEX idx_clause_library_type ON clause_library(clause_type);
CREATE INDEX idx_prompt_active ON prompt_versions(is_active) WHERE is_active = true;
