import { config } from "dotenv"
import { Pool } from "pg"

config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function check() {
  const users = await pool.query("SELECT id, email, role, status, college_id FROM users")
  console.log("Users:", users.rows)
  
  const colleges = await pool.query("SELECT id, name, code FROM colleges")
  console.log("Colleges:", colleges.rows)
  
  pool.end()
}

check()