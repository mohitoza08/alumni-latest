import { config } from "dotenv"
import { Pool } from "pg"

config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function check() {
  try {
    const count = await pool.query("SELECT COUNT(*) FROM messages")
    console.log("Total messages:", count.rows[0])
    
    const sample = await pool.query("SELECT * FROM messages LIMIT 3")
    console.log("Sample messages:", sample.rows)
    
    const withMentorship = await pool.query("SELECT * FROM messages WHERE mentorship_id IS NOT NULL LIMIT 3")
    console.log("With mentorship_id:", withMentorship.rows)
  } catch(e) {
    console.log("Error:", e.message)
  }
  
  pool.end()
}

check()