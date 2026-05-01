-- ============================================================================
-- Alumni Management System - Database Schema
-- ============================================================================
-- This schema supports a comprehensive alumni management platform with:
-- - Multi-college support
-- - Role-based access (Admin, Alumni, Student)
-- - Community features (posts, comments, likes)
-- - Mentorship programs
-- - Event management
-- - Fundraising campaigns with external payment verification
-- - Achievement tracking & Gamification (badges, streaks, leaderboard)
-- - AI Resume Enhancement tracking
-- - Premium subscriptions & workshops
-- - Analytics
-- ============================================================================

-- ============================================================================
-- TABLE: colleges
-- ============================================================================
-- Stores information about participating colleges/universities
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
CREATE TABLE colleges (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    website VARCHAR(255),
    logo_url VARCHAR(500),
    description TEXT,
    established_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- Stores all user accounts (Admin, Alumni, Student)
-- Passwords should be hashed using bcrypt or similar before insertion
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'alumni', 'student')),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_picture VARCHAR(500),
    bio TEXT,
    graduation_year INTEGER,
    current_year_level VARCHAR(10),
    degree VARCHAR(100),
    major VARCHAR(100),
    current_company VARCHAR(255),
    current_position VARCHAR(255),
    linkedin_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'rejected')),
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ban_reason TEXT,
    suspended_until TIMESTAMP,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE (college_id, email)
);

CREATE INDEX idx_users_college ON users(college_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TABLE: applications
-- ============================================================================
-- Stores student applications to become alumni
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE applications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    graduation_year INTEGER NOT NULL,
    degree VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    student_id_number VARCHAR(50),
    transcript_url VARCHAR(500),
    additional_documents TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    admin_notes TEXT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_applications_college ON applications(college_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);

-- ============================================================================
-- TABLE: community_posts
-- ============================================================================
-- Stores community discussion posts
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE community_posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('general', 'jobs', 'events', 'networking', 'achievements', 'questions', 'announcements')),
    tags TEXT,
    image_url VARCHAR(500),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_reported BOOLEAN DEFAULT FALSE, -- Added is_reported field for admin moderation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_college ON community_posts(college_id);
CREATE INDEX idx_posts_author ON community_posts(author_id);
CREATE INDEX idx_posts_category ON community_posts(category);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);

-- ============================================================================
-- TABLE: post_likes
-- ============================================================================
-- Tracks which users liked which posts
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
CREATE TABLE post_likes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (post_id, user_id)
);

CREATE INDEX idx_likes_post ON post_likes(post_id);
CREATE INDEX idx_likes_user ON post_likes(user_id);

-- ============================================================================
-- TABLE: post_comments
-- ============================================================================
-- Stores comments on community posts
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
CREATE TABLE post_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id BIGINT,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES post_comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post ON post_comments(post_id);
CREATE INDEX idx_comments_author ON post_comments(author_id);

-- ============================================================================
-- TABLE: mentorships
-- ============================================================================
-- Tracks mentor-mentee relationships
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE mentorships (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    mentor_id BIGINT NOT NULL,
    mentee_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    request_message TEXT,
    start_date DATE,
    end_date DATE,
    sessions_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (mentor_id != mentee_id)
);

CREATE INDEX idx_mentorships_college ON mentorships(college_id);
CREATE INDEX idx_mentorships_mentor ON mentorships(mentor_id);
CREATE INDEX idx_mentorships_mentee ON mentorships(mentee_id);
CREATE INDEX idx_mentorships_status ON mentorships(status);

-- ============================================================================
-- TABLE: mentorship_requests
-- ============================================================================
-- Tracks mentorship requests from students to alumni before they become active mentorships
CREATE TABLE mentorship_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    mentee_id BIGINT NOT NULL,
    mentor_id BIGINT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (mentee_id != mentor_id)
);

CREATE INDEX idx_mentorship_requests_college ON mentorship_requests(college_id);
CREATE INDEX idx_mentorship_requests_mentee ON mentorship_requests(mentee_id);
CREATE INDEX idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_requests_status ON mentorship_requests(status);

-- ============================================================================
-- TABLE: mentorship_sessions
-- ============================================================================
-- Records individual mentoring sessions
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE mentorship_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mentorship_id BIGINT NOT NULL,
    session_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    meeting_type VARCHAR(20) CHECK (meeting_type IN ('in-person', 'video', 'phone', 'chat')),
    topics_discussed TEXT,
    action_items TEXT,
    mentor_notes TEXT,
    mentee_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentorship_id) REFERENCES mentorships(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_mentorship ON mentorship_sessions(mentorship_id);
CREATE INDEX idx_sessions_date ON mentorship_sessions(session_date);

-- ============================================================================
-- TABLE: events
-- ============================================================================
-- Stores alumni and college events
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    organizer_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) CHECK (event_type IN ('networking', 'workshop', 'seminar', 'reunion', 'social', 'fundraising', 'webinar', 'career_fair')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    venue_address TEXT,
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link VARCHAR(500),
    max_attendees INTEGER,
    registration_deadline TIMESTAMP,
    banner_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
    registration_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_college ON events(college_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);

-- ============================================================================
-- TABLE: event_registrations
-- ============================================================================
-- Tracks event registrations
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE event_registrations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled', 'waitlisted')),
    registration_notes TEXT,
    attended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (event_id, user_id)
);

CREATE INDEX idx_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);

-- ============================================================================
-- TABLE: fundraising_campaigns
-- ============================================================================
-- Stores fundraising campaign information
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE fundraising_campaigns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    campaign_type VARCHAR(50) CHECK (campaign_type IN ('scholarship', 'infrastructure', 'research', 'emergency', 'general', 'endowment')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    banner_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    donor_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaigns_college ON fundraising_campaigns(college_id);
CREATE INDEX idx_campaigns_status ON fundraising_campaigns(status);
CREATE INDEX idx_campaigns_dates ON fundraising_campaigns(start_date, end_date);

-- ============================================================================
-- TABLE: donations
-- ============================================================================
-- Records individual donations
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE donations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    donor_id BIGINT,
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_anonymous BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES fundraising_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_date ON donations(donated_at);

-- ============================================================================
-- TABLE: achievements
-- ============================================================================
-- Tracks user achievements and milestones
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE achievements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_type VARCHAR(50) CHECK (achievement_type IN ('academic', 'career', 'award', 'publication', 'patent', 'leadership', 'community_service', 'entrepreneurship')),
    achievement_date DATE,
    organization VARCHAR(255),
    verification_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_achievements_college ON achievements(college_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- ============================================================================
-- TABLE: skills
-- ============================================================================
-- Stores user skills and certifications
CREATE TABLE skills (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    date_obtained DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE INDEX idx_skills_user ON skills(user_id);
CREATE INDEX idx_skills_college ON skills(college_id);

-- ============================================================================
-- TABLE: projects
-- ============================================================================
-- Stores user project portfolio
CREATE TABLE projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    technologies TEXT,
    project_link VARCHAR(500),
    date_completed DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_college ON projects(college_id);

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
-- System notifications for users
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
-- Changed ENUM to VARCHAR with CHECK constraint for PostgreSQL compatibility
CREATE TABLE notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('application', 'post', 'comment', 'like', 'mentorship', 'event', 'donation', 'system', 'achievement')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- TABLE: analytics_metrics
-- ============================================================================
-- Stores aggregated analytics data
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
CREATE TABLE analytics_metrics (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    metric_date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    total_alumni INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    total_donations DECIMAL(15, 2) DEFAULT 0.00,
    engagement_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    UNIQUE (college_id, metric_date)
);

CREATE INDEX idx_analytics_college ON analytics_metrics(college_id);
CREATE INDEX idx_analytics_date ON analytics_metrics(metric_date DESC);

-- ============================================================================
-- TABLE: onboarding_requests
-- ============================================================================
-- Stores student and alumni onboarding verification requests
-- Alumni registration requires admin approval (certificate verification)
CREATE TABLE onboarding_requests (
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
    professional_type VARCHAR(20) CHECK (professional_type IN ('corporate', 'business', 'freelancer', 'other')),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    freelancer_skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_onboarding_user ON onboarding_requests(user_id);
CREATE INDEX idx_onboarding_status ON onboarding_requests(status);
CREATE INDEX idx_onboarding_type ON onboarding_requests(type);

-- ============================================================================
-- TABLE: system_settings
-- ============================================================================
-- Configuration and settings
-- Changed AUTO_INCREMENT to GENERATED ALWAYS AS IDENTITY for PostgreSQL
CREATE TABLE system_settings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: user_sessions
-- ============================================================================
-- Added user sessions table for authentication
CREATE TABLE user_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- TABLE: email_otps
-- ============================================================================
-- Stores OTP codes for email verification during registration
CREATE TABLE email_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_otps_email ON email_otps(email);
CREATE INDEX idx_email_otps_expires ON email_otps(expires_at);

-- ============================================================================
-- TABLE: donation_requests
-- ============================================================================
-- Added donation_requests table for external payment verification workflow
-- Stores unverified donation requests before admin approval
CREATE TABLE donation_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    donor_id BIGINT,
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_anonymous BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255) NOT NULL,
    receipt_url VARCHAR(500),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    admin_notes TEXT,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES fundraising_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_donation_requests_campaign ON donation_requests(campaign_id);
CREATE INDEX idx_donation_requests_donor ON donation_requests(donor_id);
CREATE INDEX idx_donation_requests_status ON donation_requests(status);
CREATE INDEX idx_donation_requests_date ON donation_requests(created_at DESC);

-- ============================================================================
-- TABLE: user_badges
-- ============================================================================
-- Added user_badges table for gamification system
-- Tracks which badges users have earned
CREATE TABLE user_badges (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    max_progress INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- ============================================================================
-- TABLE: user_streaks
-- ============================================================================
-- Added user_streaks table for daily activity tracking
-- Tracks daily check-ins and activity streaks for gamification
CREATE TABLE user_streaks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin DATE,
    total_points INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    comments_posted INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    events_attended INTEGER DEFAULT 0,
    mentorship_sessions INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_points ON user_streaks(total_points DESC);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);

-- ============================================================================
-- TABLE: workshops
-- ============================================================================
-- Added workshops table for premium paid workshops/events
-- Stores premium workshop information with pricing and capacity
CREATE TABLE workshops (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL,
    organizer_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_name VARCHAR(255),
    instructor_bio TEXT,
    workshop_type VARCHAR(50) CHECK (workshop_type IN ('technical', 'soft_skills', 'career', 'entrepreneurship', 'leadership', 'other')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    duration_hours INTEGER,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    max_attendees INTEGER,
    registration_deadline TIMESTAMP,
    banner_image VARCHAR(500),
    syllabus_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
    registration_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workshops_college ON workshops(college_id);
CREATE INDEX idx_workshops_organizer ON workshops(organizer_id);
CREATE INDEX idx_workshops_start_date ON workshops(start_date);
CREATE INDEX idx_workshops_status ON workshops(status);
CREATE INDEX idx_workshops_premium ON workshops(is_premium);

-- ============================================================================
-- TABLE: workshop_registrations
-- ============================================================================
-- Added workshop_registrations table for premium workshop purchases
-- Tracks paid workshop registrations with payment verification
CREATE TABLE workshop_registrations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workshop_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'attended', 'cancelled', 'rejected')),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    payment_proof_url VARCHAR(500),
    amount_paid DECIMAL(10, 2),
    registration_notes TEXT,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    attended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (workshop_id, user_id)
);

CREATE INDEX idx_workshop_registrations_workshop ON workshop_registrations(workshop_id);
CREATE INDEX idx_workshop_registrations_user ON workshop_registrations(user_id);
CREATE INDEX idx_workshop_registrations_status ON workshop_registrations(status);

-- ============================================================================
-- TABLE: resume_enhancements
-- ============================================================================
-- Added resume_enhancements table for AI resume enhancement tracking
-- Stores AI-generated resume improvements and suggestions
CREATE TABLE resume_enhancements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    original_resume TEXT,
    enhanced_resume TEXT,
    skills_suggested TEXT,
    improvements_made TEXT,
    ai_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_resume_enhancements_user ON resume_enhancements(user_id);
CREATE INDEX idx_resume_enhancements_date ON resume_enhancements(created_at DESC);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
-- Added subscriptions table for premium membership tracking
-- Tracks user premium subscriptions and access levels
CREATE TABLE subscriptions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subscription_type VARCHAR(50) CHECK (subscription_type IN ('free', 'basic', 'premium', 'enterprise')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    amount_paid DECIMAL(10, 2),
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- ============================================================================
-- TABLE: messages
-- ============================================================================
-- Added messages table for in-app messaging between users
-- Supports mentor-mentee communication and general messaging
CREATE TABLE messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    mentorship_id BIGINT,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    parent_message_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentorship_id) REFERENCES mentorships(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
-- New table for grouped conversations (chat threads)
CREATE TABLE conversations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255),
    created_by BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_college ON conversations(college_id);
CREATE INDEX idx_conversations_archived ON conversations(is_archived);

-- Add conversation_id to messages table
ALTER TABLE messages ADD COLUMN conversation_id BIGINT REFERENCES conversations(id) ON DELETE SET NULL;

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Dashboard statistics view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    u.college_id,
    COUNT(DISTINCT CASE WHEN u.role = 'alumni' THEN u.id END) AS total_alumni,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) AS total_students,
    COUNT(DISTINCT cp.id) AS total_posts,
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT m.id) AS active_mentorships,
    COALESCE(SUM(d.amount), 0) AS total_donations
FROM users u
LEFT JOIN community_posts cp ON cp.college_id = u.college_id
LEFT JOIN events e ON e.college_id = u.college_id AND e.status = 'upcoming'
LEFT JOIN mentorships m ON m.college_id = u.college_id AND m.status = 'active'
LEFT JOIN fundraising_campaigns fc ON fc.college_id = u.college_id
LEFT JOIN donations d ON d.campaign_id = fc.id AND d.status = 'completed'
GROUP BY u.college_id;

-- Recent activity view
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT 
    c.id AS college_id,
    c.name AS college_name,
    u.id AS user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    'post' AS activity_type,
    cp.title AS activity_title,
    cp.created_at
FROM colleges c
JOIN community_posts cp ON cp.college_id = c.id
JOIN users u ON cp.author_id = u.id
UNION ALL
SELECT 
    c.id,
    c.name,
    u.id,
    CONCAT(u.first_name, ' ', u.last_name),
    'event' AS activity_type,
    e.title,
    e.created_at
FROM colleges c
JOIN events e ON e.college_id = c.id
JOIN users u ON e.organizer_id = u.id
ORDER BY created_at DESC;

-- Added leaderboard view for gamification
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT 
    u.id AS user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    u.role,
    u.profile_picture,
    u.college_id,
    COALESCE(us.total_points, 0) AS total_points,
    COALESCE(us.current_streak, 0) AS current_streak,
    COUNT(DISTINCT ub.badge_id) AS badges_count,
    ROW_NUMBER() OVER (PARTITION BY u.college_id ORDER BY COALESCE(us.total_points, 0) DESC) AS rank
FROM users u
LEFT JOIN user_streaks us ON u.id = us.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.first_name, u.last_name, u.role, u.profile_picture, u.college_id, us.total_points, us.current_streak
ORDER BY total_points DESC;

-- Added pending verification requests view for admins
CREATE OR REPLACE VIEW v_pending_verifications AS
SELECT 
    'donation' AS verification_type,
    dr.id,
    dr.campaign_id AS related_id,
    fc.title AS related_title,
    CONCAT(u.first_name, ' ', u.last_name) AS requester_name,
    dr.amount,
    dr.transaction_reference,
    dr.created_at,
    dr.status
FROM donation_requests dr
JOIN fundraising_campaigns fc ON dr.campaign_id = fc.id
LEFT JOIN users u ON dr.donor_id = u.id
WHERE dr.status = 'pending'
UNION ALL
SELECT 
    'workshop' AS verification_type,
    wr.id,
    wr.workshop_id AS related_id,
    w.title AS related_title,
    CONCAT(u.first_name, ' ', u.last_name) AS requester_name,
    wr.amount_paid AS amount,
    wr.transaction_reference,
    wr.created_at,
    wr.status
FROM workshop_registrations wr
JOIN workshops w ON wr.workshop_id = w.id
JOIN users u ON wr.user_id = u.id
WHERE wr.status = 'pending'
ORDER BY created_at DESC;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO colleges (name, code, city, state, country, website) 
VALUES ('Tech University', 'TU', 'San Francisco', 'CA', 'USA', 'https://techuniversity.edu');

-- Remember to hash passwords in production!
INSERT INTO users (college_id, role, email, password_hash, first_name, last_name, graduation_year, status, email_verified)
VALUES (1, 'admin', 'admin@techuniversity.edu', '$2b$10$examplehash', 'Admin', 'User', NULL, 'active', TRUE);
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
