-- ============================================================================
-- ALUMNICONNECT MESSAGING SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_by BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add conversation_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT;

-- 3. Add foreign key constraint
ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS fk_messages_conversation 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_college ON conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- ============================================================================
-- OPTIONAL: Also fix the existing column issues seen in logs
-- ============================================================================

-- Fix posts table user_id column (if it doesn't exist)
-- NOTE: This is optional and may break existing code - check your schema first!
-- ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Fix users points column (if it doesn't exist)  
-- NOTE: This is optional and may break existing code - check your schema first!
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================