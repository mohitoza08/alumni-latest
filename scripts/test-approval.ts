import { query } from "../lib/db"

async function testApproval() {
  try {
    console.log("Checking onboarding requests...")
    const requests = await query(`
      SELECT o.id, o.status, o.user_id, u.email, u.role, u.first_name, u.last_name
      FROM onboarding_requests o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id
    `)
    console.log("Requests:", JSON.stringify(requests, null, 2))

    if (requests.length === 0) {
      console.log("No onboarding requests found")
      process.exit(0)
    }

    // Try to approve the first pending one
    const pending = requests.find((r: any) => r.status === "pending")
    if (!pending) {
      console.log("No pending requests to test with")
      process.exit(0)
    }

    console.log(`\nTrying to approve request #${pending.id}...`)

    // Step 1: Update onboarding_requests
    await query(
      `UPDATE onboarding_requests 
       SET status = 'approved', admin_notes = 'test', reviewed_by = 1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [pending.id]
    )
    console.log("✓ onboarding_requests updated")

    // Step 2: Update users
    await query(
      `UPDATE users SET status = 'active', onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [pending.user_id]
    )
    console.log("✓ users updated")

    console.log("\n✅ Approval flow works!")

    // Rollback for testing
    await query(
      `UPDATE onboarding_requests SET status = 'pending', admin_notes = NULL, reviewed_by = NULL, reviewed_at = NULL WHERE id = $1`,
      [pending.id]
    )
    await query(
      `UPDATE users SET status = 'pending', onboarding_completed = FALSE WHERE id = $1`,
      [pending.user_id]
    )
    console.log("✓ Rolled back for safety")

    process.exit(0)
  } catch (error: any) {
    console.error("Error:", error.message, error.code, error.detail)
    process.exit(1)
  }
}

testApproval()
