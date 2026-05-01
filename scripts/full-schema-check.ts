import { query } from "../lib/db"

async function fullSchemaCheck() {
  try {
    console.log("=== ALL TABLES IN DATABASE ===\n")
    const tables = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    console.log(tables.map((t: any) => t.table_name).join(", "))

    // Check each table's columns
    console.log("\n=== EACH TABLE COLUMNS ===\n")
    for (const t of tables) {
      const cols = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [t.table_name])
      console.log(`\n--- ${t.table_name} (${cols.length} cols) ---`)
      cols.forEach((c: any) => {
        console.log(`  ${c.column_name}: ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default || "-"}`)
      })
    }

    console.log("\n=== ALL CHECK CONSTRAINTS ===\n")
    const constraints = await query(`
      SELECT tc.table_name, cc.constraint_name, cc.check_clause
      FROM information_schema.check_constraints cc
      JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
      WHERE tc.constraint_schema = 'public'
      ORDER BY tc.table_name
    `)
    constraints.forEach((c: any) => {
      console.log(`${c.table_name}.${c.constraint_name}: ${c.check_clause.substring(0, 100)}...`)
    })

    console.log("\n✅ Schema check complete!")
    process.exit(0)
  } catch (error: any) {
    console.error("Error:", error.message, error.code, error.detail)
    process.exit(1)
  }
}

fullSchemaCheck()
