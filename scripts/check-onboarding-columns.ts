import { query } from "../lib/db"

async function checkOnboardingColumns() {
  try {
    const tables = ["onboarding_requests", "users"]
    for (const table of tables) {
      console.log(`\n=== ${table} ===`)
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table])
      result.forEach((r: any) => {
        console.log(`  ${r.column_name}: ${r.data_type} (${r.is_nullable})`)
      })
    }

    // Check status constraint
    console.log("\n=== users status constraint ===")
    const constraintResult = await query(`
      SELECT check_clause FROM information_schema.check_constraints cc
      JOIN table_constraints tc ON cc.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'users' AND cc.constraint_name LIKE '%status%'
    `)
    constraintResult.forEach((r: any) => console.log(r.check_clause))

    console.log("\n=== onboarding_requests status constraint ===")
    const orConstraintResult = await query(`
      SELECT check_clause FROM information_schema.check_constraints cc
      JOIN table_constraints tc ON cc.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'onboarding_requests' AND cc.constraint_name LIKE '%status%'
    `)
    orConstraintResult.forEach((r: any) => console.log(r.check_clause))

    console.log("\n✅ Done!")
  } catch (error: any) {
    console.error("Error:", error.message, error.code, error.detail)
    process.exit(1)
  }
  process.exit(0)
}

checkOnboardingColumns()
