-- Seed initial prompt version (v1)
-- The prompt_text will be fully populated when the redline engine is built in prompt 2.
-- This is the initial active version that all jobs will use until A/B testing promotes a new one.

INSERT INTO prompt_versions (
  version_number,
  prompt_text,
  changelog,
  is_active,
  is_candidate,
  ab_test_allocation,
  total_uses
) VALUES (
  1,
  'You are RedlineIQ, an expert commercial real estate LOI redlining agent. You analyze Letters of Intent (LOIs) for commercial real estate transactions and provide detailed, actionable redline recommendations. Full system prompt to be configured in application code.',
  'Initial prompt version - base system prompt v1',
  true,
  false,
  1.0,
  0
);
