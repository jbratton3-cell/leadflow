import "dotenv/config";
import pg from "pg";
import { randomBytes } from "crypto";

// Usage:
//   DATABASE_URL="..." APP_URL="https://your-domain.com" \
//     node scripts/create-admin.mjs "Full Name" "email@example.com"
//
// Creates a pending ADMIN invitation and prints the activation link.
// Open the link in a browser to set your password and log in.

const { Pool } = pg;

const name = process.argv[2];
const email = (process.argv[3] || "").toLowerCase();

if (!name || !email) {
  console.error('Usage: node scripts/create-admin.mjs "Full Name" "email@example.com"');
  process.exit(1);
}

const baseUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows[0]) {
      console.log(`A user with ${email} already exists (id ${existing.rows[0].id}). Nothing to do.`);
      return;
    }

    await client.query("DELETE FROM invitations WHERE email=$1", [email]);

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    await client.query(
      `INSERT INTO invitations (token, name, email, role, delivered_via, expires_at)
       VALUES ($1,$2,$3,'admin','link',$4)`,
      [token, name, email, expiresAt]
    );

    console.log("\n✅ Admin invitation created.\n");
    console.log("Open this link to set your password and log in:\n");
    console.log(`   ${baseUrl}/invite/${token}\n`);
    console.log("(Valid for 7 days, single use.)\n");
  } finally {
    client.release();
    await pool.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
