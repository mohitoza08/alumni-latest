import { config } from "dotenv"
import { Pool } from "pg"

config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function fix() {
  try {
    // Drop old constraint and add new one with 'completed' status
    await pool.query(`
      ALTER TABLE mentorship_requests 
      DROP CONSTRAINT IF EXISTS mentorship_requests_status_check
    `)
    
    await pool.query(`
      ALTER TABLE mentorship_requests 
      ADD CONSTRAINT mentorship_requests_status_check 
      CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'))
    `)
    
    console.log("✅ Fixed mentorship_requests status constraint!")
  } catch (e: any) {
    console.log("Note:", e.message)
  }
  
  pool.end()
}

fix()