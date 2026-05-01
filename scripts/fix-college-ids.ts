import { query } from "../lib/db";

(async () => {
  const colleges1 = await query("SELECT id, name, code FROM colleges");
  console.log("BEFORE:", JSON.stringify(colleges1, null, 2));

  // Get Saffrony data before deleting
  const sit = colleges1.find((c: any) => c.code === "SIT");
  const demo = colleges1.find((c: any) => c.code === "DU");

  if (demo) {
    await query("DELETE FROM colleges WHERE code = $1", ["DU"]);
    console.log("Deleted Demo University");
  }

  if (sit) {
    // Try to update id to 1
    try {
      await query("UPDATE colleges SET id = 1 WHERE code = $1", ["SIT"]);
      console.log("Updated Saffrony to id=1");
    } catch (e: any) {
      console.log("Can't update id, recreating...");
      await query("DELETE FROM colleges WHERE code = $1", ["SIT"]);
      const r = await query(
        "INSERT INTO colleges (name, code, city, state, country) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ["Saffrony University", "SIT", "Surat", "Gujarat", "India"]
      );
      console.log("Reinserted Saffrony, new id:", r[0].id);
    }
  }

  const colleges2 = await query("SELECT id, name, code FROM colleges");
  console.log("AFTER:", JSON.stringify(colleges2, null, 2));

  // Update admin user to college_id=1
  await query("UPDATE users SET college_id = 1 WHERE email = $1", ["admin@saffrony.ac.in"]);
  const users = await query("SELECT id, email, college_id, role, status FROM users WHERE email = $1", ["admin@saffrony.ac.in"]);
  console.log("Admin user:", JSON.stringify(users, null, 2));

  process.exit(0);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
