import { pool } from "../lib/db";

async function run() {
  console.log("Adding current_year_level column...");
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_year_level VARCHAR(10)");
    console.log("Done.");
  } catch (e: any) {
    console.error(e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
