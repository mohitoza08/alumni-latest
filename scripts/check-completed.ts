import { config } from "dotenv"
import { Pool } from "pg"

config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function check() {
  const result = await pool.query(`
    SELECT mr.id, mr.status, mr.topic, mr.mentor_id, mr.mentee_id
    FROM mentorship_requests mr
    WHERE mr.status = 'completed'
  `)
  
  console.log("Completed mentorships:", result.rows)
  
  // Check if there are any completed ones
  if (result.rows.length === 0) {
    console.log("\n❌ No completed mentorships found!")
    console.log("To mark as completed:")
    console.log("1. Go to Alumni Mentorship page")
    console.log("2. Find an active request")
    console.log("3. Click 'Mark Complete' button")
  }
  
  pool.end()
}

check()