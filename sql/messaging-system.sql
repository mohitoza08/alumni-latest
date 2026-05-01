-- ============================================================================
-- AlumniConnect Messaging System SQL
-- Copy and run this entire block in Supabase SQL Editor
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

-- 2. Add conversation_id to messages table (if column doesn't exist)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT;

-- 3. Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_college ON conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);