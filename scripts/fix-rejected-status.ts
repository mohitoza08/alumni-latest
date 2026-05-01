import { query } from "../lib/db"

async function fixStatusConstraint() {
  try {
    console.log("Fixing users status constraint to include 'rejected'...")

    await query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
      ALTER TABLE users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'rejected'));
    `)

    console.log("✅ Status constraint updated successfully!")
  } catch (error) {
    console.error("Error updating constraint:", error)
    process.exit(1)
  }

  process.exit(0)
}

fixStatusConstraint()
