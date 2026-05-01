import { config } from "dotenv"
import { Pool } from "pg"

config({ path: ".env.local" })

async function addConversationsTable() {
  console.log("🚀 Adding conversations table...\n")

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in .env.local")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    console.log("📡 Testing database connection...")
    await pool.query("SELECT NOW()")
    console.log("✅ Database connection successful\n")

    // 1. Create conversations table
    console.log("📋 Creating conversations table...")
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(255),
        created_by BIGINT NOT NULL,
        college_id BIGINT NOT NULL,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log("✅ Conversations table created\n")

    // 2. Add conversation_id column to messages
    console.log("📋 Adding conversation_id to messages...")
    await pool.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT
    `)
    console.log("✅ conversation_id column added\n")

    // 3. Create indexes
    console.log("📋 Creating indexes...")
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_conversations_college ON conversations(college_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`)
    console.log("✅ Indexes created\n")

    console.log("🎉 Conversations migration completed!\n")
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addConversationsTable()