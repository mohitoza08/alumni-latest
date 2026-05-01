import { query } from "../lib/db";
import bcrypt from "bcrypt";

(async () => {
  // Delete existing colleges
  await query("DELETE FROM colleges");

  // Reset sequence
  await query("ALTER SEQUENCE colleges_id_seq RESTART WITH 1");

  // Insert Saffrony as id=1 (now auto-increment starts at 1)
  const college = await query(
    "INSERT INTO colleges (name, code, city, state, country) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    ["Saffrony University", "SIT", "Surat", "Gujarat", "India"]
  );
  console.log("College id:", college[0].id);

  // Create admin user
  const hash = await bcrypt.hash("Saffrony@19", 10);
  const user = await query(
    "INSERT INTO users (college_id, role, email, password_hash, first_name, last_name, status, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
    [1, "admin", "admin@saffrony.ac.in", hash, "Admin", "User", "active", true]
  );
  console.log("Admin user id:", user[0].id);

  // Verify
  const colleges = await query("SELECT id, name, code FROM colleges");
  console.log("Colleges:", JSON.stringify(colleges));
  const users = await query("SELECT id, email, college_id, role, status FROM users WHERE email = $1", ["admin@saffrony.ac.in"]);
  console.log("Admin:", JSON.stringify(users));

  process.exit(0);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
