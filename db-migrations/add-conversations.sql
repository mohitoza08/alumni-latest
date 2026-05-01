-- Migration: Add conversations table for unified messaging
-- Run this SQL to add the new tables and columns

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255),
    created_by BIGINT NOT NULL,
    college_id BIGINT NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add conversation_id to messages table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'conversation_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN conversation_id BIGINT;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_college ON conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Also add conversation_id to messages_participants if needed for the query
-- (This is optional - we used a different query approach)