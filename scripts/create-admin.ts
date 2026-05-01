import { query } from "../lib/db"
import bcrypt from "bcryptjs"

async function createAdmin() {
  try {
    console.log("👤 Creating/resetting admin user...\n")

    const config = {
      email: "admin@mit.edu",
      password: "Admin123",
      firstName: "Admin",
      lastName: "User",
      collegeId: 1,
    }

    console.log("🔐 Hashing password...")
    const passwordHash = await bcrypt.hash(config.password, 10)

    console.log("🏫 Checking college...")
    const college = await query("SELECT id, name FROM colleges WHERE id = $1", [config.collegeId])

    if (college.length === 0) {
      console.error("❌ College not found! Run: npm run setup")
      process.exit(1)
    }

    console.log("✏️  Creating admin user...")
    const result = await query(
      `INSERT INTO users (
        college_id,
        role,
        email,
        password_hash,
        first_name,
        last_name,
        status,
        email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (college_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id, email, role`,
      [config.collegeId, "admin", config.email, passwordHash, config.firstName, config.lastName, "active", true],
    )

    console.log("\n✅ Admin ready!")
    console.log("═══════════════════════════════════════")
    console.log("  Email:", config.email)
    console.log("  Password:", config.password)
    console.log("  College ID:", config.collegeId)
    console.log("═══════════════════════════════════════\n")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

createAdmin()
