import { query } from "../lib/db";
import bcrypt from "bcrypt";

(async () => {
  // Create Saffrony college if not exists
  const colResult = await query("INSERT INTO colleges (name, code, city, state, country) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING RETURNING id", ["Saffrony Institute of Technology", "SIT", "Surat", "Gujarat", "India"]);
  let cid = colResult.length > 0 ? colResult[0].id : null;
  if (!cid) {
    cid = (await query("SELECT id FROM colleges WHERE code = $1", ["SIT"]))[0].id;
  }
  console.log("College ID:", cid);

  const users = await query("SELECT id, email FROM users WHERE email = $1", ["admin@saffrony.ac.in"]);
  console.log("Existing admin:", users.length > 0 ? "YES" : "NO");

  if (users.length === 0) {
    const hash = await bcrypt.hash("Saffrony@19", 10);
    await query(
      "INSERT INTO users (college_id, role, email, password_hash, first_name, last_name, status, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [cid, "admin", "admin@saffrony.ac.in", hash, "Admin", "User", "active", true]
    );
    console.log("Admin CREATED successfully");
  } else {
    console.log("Admin already exists");
  }
  process.exit(0);
})().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
