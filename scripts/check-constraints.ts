import { query } from "../lib/db"

async function checkConstraints() {
  try {
    const r = await query(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND contype = 'c'
    `)
    console.log("Users check constraints:", JSON.stringify(r, null, 2))

    const r2 = await query(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'onboarding_requests'::regclass AND contype = 'c'
    `)
    console.log("Onboarding check constraints:", JSON.stringify(r2, null, 2))

    process.exit(0)
  } catch (error: any) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

checkConstraints()
