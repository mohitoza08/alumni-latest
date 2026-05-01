import { query } from "../lib/db";
(async () => {
  const users = await query("SELECT id, email, college_id, role, status FROM users WHERE email = $1", ["admin@saffrony.ac.in"]);
  console.log("Users:", JSON.stringify(users, null, 2));
  const colleges = await query("SELECT id, name, code FROM colleges");
  console.log("Colleges:", JSON.stringify(colleges, null, 2));
  process.exit(0);
})();
