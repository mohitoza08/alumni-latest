import { query } from "../lib/db"

async function addProfessionalTypeColumns() {
  try {
    console.log("Adding professional type columns to onboarding_requests...")

    await query(`ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS professional_type VARCHAR(20) CHECK (professional_type IN ('corporate', 'business', 'freelancer', 'other'))`)
    console.log("✓ professional_type column added")

    await query(`ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS business_name VARCHAR(255)`)
    console.log("✓ business_name column added")

    await query(`ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS business_type VARCHAR(100)`)
    console.log("✓ business_type column added")

    await query(`ALTER TABLE onboarding_requests ADD COLUMN IF NOT EXISTS freelancer_skills TEXT`)
    console.log("✓ freelancer_skills column added")

    console.log("\n✅ All professional type columns added successfully!")
  } catch (error) {
    console.error("Error adding columns:", error)
    process.exit(1)
  }

  process.exit(0)
}

addProfessionalTypeColumns()
