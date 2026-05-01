import { query } from "../lib/db"

async function fixApprovalColumns() {
  try {
    console.log("Checking/fixing columns needed for onboarding approval...")

    // onboarding_completed on users
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`)
    console.log("✓ users.onboarding_ready column")

    // Check if updated_at exists on onboarding_requests
    await query(`ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
    console.log("✓ onboarding_requests.updated_at column")

    // Verify columns exist
    const cols = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `)
    console.log("onboarding_completed exists:", cols.length > 0)

    console.log("\n✅ Done!")
  } catch (error: any) {
    console.error("Error:", error.message, error.code, error.detail)
    process.exit(1)
  }
  process.exit(0)
}

fixApprovalColumns()
