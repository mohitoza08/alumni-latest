-- ============================================================================
-- PROFESSIONAL TYPE FIELDS FOR ALUMNI ONBOARDING
-- ============================================================================
ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS professional_type VARCHAR(20) CHECK (professional_type IN ('corporate', 'business', 'freelancer', 'other'));
ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS freelancer_skills TEXT;
