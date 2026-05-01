-- ============================================================================
-- ONBOARDING & VERIFICATION SYSTEM MIGRATION
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS onboarding_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('student', 'alumni')),
    graduation_year INTEGER,
    current_year VARCHAR(20),
    semester VARCHAR(20),
    degree VARCHAR(100),
    major VARCHAR(100),
    current_company VARCHAR(255),
    current_position VARCHAR(255),
    linkedin_url VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    certificate_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_onboarding_user ON onboarding_requests(user_id);
CREATE INDEX idx_onboarding_status ON onboarding_requests(status);
CREATE INDEX idx_onboarding_type ON onboarding_requests(type);
