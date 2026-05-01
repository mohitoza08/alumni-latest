import { config } from "dotenv"
import { Pool } from "pg"

config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function fixMessages() {
  // Check existing conversations
  const existingConv = await pool.query("SELECT * FROM conversations")
  console.log("Existing conversations:", existingConv.rows)
  
  // Create a conversation for mentorship 1
  const conv = await pool.query(`
    INSERT INTO conversations (title, created_by, college_id)
    VALUES ('DSA - Kiran and Mohit', 2, 1)
    ON CONFLICT DO NOTHING
    RETURNING id
  `)
  
  let convId = existingConv.rows[0]?.id
  if (!convId && conv.rows[0]) {
    convId = conv.rows[0].id
  }
  
  if (!convId) {
    console.log("❌ No conversation created")
    pool.end()
    return
  }
  
  console.log("Using conversation ID:", convId)
  
  // Link messages between Mohit(2) and Kiran(4) to mentorship 1 and conversation
  await pool.query(`
    UPDATE messages 
    SET mentorship_id = 1, conversation_id = $1
    WHERE (sender_id = 2 AND recipient_id = 4) 
       OR (sender_id = 4 AND recipient_id = 2)
  `, [convId])
  
  console.log("✅ Updated messages!")
  
  // Verify
  const verify = await pool.query("SELECT * FROM messages WHERE mentorship_id = 1")
  console.log("Updated messages:", verify.rows)
  
  pool.end()
}

fixMessages()