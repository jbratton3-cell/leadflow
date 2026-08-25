import "dotenv/config";
import pg from "pg";
import { randomBytes, scryptSync } from "crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Must match hashPassword() in src/lib/auth.ts
const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

async function main() {
  const client = await pool.connect();
  try {
    console.log("Seeding HomePro CRM...");

    // Wipe CRM data (respecting FKs order). Login users are preserved.
    await client.query(
      "TRUNCATE jobs, sales, appointments, call_logs, leads, products, lead_sources, reps RESTART IDENTITY CASCADE"
    );

    // Default admin login (idempotent — won't overwrite an existing account)
    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,'admin')
       ON CONFLICT (email) DO NOTHING`,
      ["Admin", "admin@homepro.com", hashPassword("admin123")]
    );

    // Reps
    const reps = [
      ["Dana Whitfield", "dana@homepro.com", "admin"],
      ["Marcus Lee", "marcus@homepro.com", "sales"],
      ["Priya Nair", "priya@homepro.com", "sales"],
      ["Tom Ramirez", "tom@homepro.com", "sales"],
      ["Sara Kohl", "sara@homepro.com", "call_center"],
      ["Jordan Ellis", "jordan@homepro.com", "call_center"],
      ["Bill Cortez", "bill@homepro.com", "production"],
    ];
    for (const [name, email, role] of reps) {
      await client.query(
        "INSERT INTO reps (name, email, role) VALUES ($1,$2,$3)",
        [name, email, role]
      );
    }

    // Lead sources with spend
    const sources = [
      ["Google PPC", "internet", 6500],
      ["Facebook Ads", "internet", 4200],
      ["Direct Mail Drop", "direct_mail", 8000],
      ["TV Spot - Local", "tv", 12000],
      ["Radio AM790", "radio", 3000],
      ["Customer Referral", "referral", 0],
      ["Spring Home Show", "home_show", 5500],
      ["Door Canvassing", "canvassing", 2500],
    ];
    for (const [name, category, cost] of sources) {
      await client.query(
        "INSERT INTO lead_sources (name, category, monthly_cost) VALUES ($1,$2,$3)",
        [name, category, cost]
      );
    }

    // Products
    const products = [
      ["Replacement Windows", 12500],
      ["Roofing", 18000],
      ["Bath Remodel", 15000],
      ["Siding", 22000],
      ["Gutters & Guards", 4500],
      ["HVAC", 9500],
    ];
    for (const [name, ticket] of products) {
      await client.query(
        "INSERT INTO products (name, avg_ticket) VALUES ($1,$2)",
        [name, ticket]
      );
    }

    const firstNames = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Barbara","William","Susan","Richard","Karen","Joseph","Nancy","Thomas","Betty","Chris","Sandra","Dan","Ashley","Paul","Emily","Mark","Donna"];
    const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Clark","Lewis","Walker","Hall","Young"];
    const cities = [["Springfield","IL","62701"],["Naperville","IL","60540"],["Aurora","IL","60505"],["Peoria","IL","61602"],["Joliet","IL","60431"],["Rockford","IL","61101"],["Elgin","IL","60120"],["Evanston","IL","60201"]];
    const streets = ["Oak St","Maple Ave","Cedar Ln","Pine Rd","Elm Dr","Birch Way","Willow Ct","Sunset Blvd","Lincoln Ave","Park Pl"];

    const callDispositions = ["no_answer","left_message","busy","contacted","callback"];

    const salesRepIds = [2, 3, 4]; // Marcus, Priya, Tom
    const callRepIds = [5, 6]; // Sara, Jordan

    const NUM_LEADS = 90;
    for (let i = 0; i < NUM_LEADS; i++) {
      const fn = rand(firstNames);
      const ln = rand(lastNames);
      const [city, state, zip] = rand(cities);
      const sourceId = randInt(1, sources.length);
      const productId = randInt(1, products.length);
      const phone = `(${randInt(200,989)}) ${randInt(200,989)}-${randInt(1000,9999)}`;
      const daysAgo = randInt(0, 75);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      const assignedRep = rand(callRepIds);

      // Decide an outcome path
      const roll = Math.random();
      let stage = "new";
      let disposition = null;
      let estValue = 0;
      let deadReason = null;

      const leadRes = await client.query(
        `INSERT INTO leads (first_name,last_name,email,phone,address,city,state,zip,source_id,product_id,assigned_rep_id,stage,estimated_value,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14) RETURNING id`,
        [fn, ln, `${fn.toLowerCase()}.${ln.toLowerCase()}@email.com`, phone,
         `${randInt(100,9999)} ${rand(streets)}`, city, state, zip,
         sourceId, productId, assignedRep, stage, estValue, createdAt]
      );
      const leadId = leadRes.rows[0].id;

      // Simulate call attempts
      const attempts = randInt(0, 3);
      for (let a = 0; a < attempts; a++) {
        const disp = rand(callDispositions);
        disposition = disp;
        await client.query(
          "INSERT INTO call_logs (lead_id, rep_id, disposition, created_at) VALUES ($1,$2,$3,$4)",
          [leadId, assignedRep, disp, new Date(createdAt.getTime() + a * 86400000)]
        );
      }
      if (attempts > 0) stage = "contacting";

      // Progress some leads to appointments/sales
      if (roll < 0.06) {
        // dead
        stage = "dead";
        deadReason = "not_interested";
      } else if (roll < 0.55) {
        // set an appointment
        const salesRep = rand(salesRepIds);
        const setBy = assignedRep;
        const apptDate = new Date(createdAt.getTime() + randInt(1, 7) * 86400000);
        stage = "appt_set";

        // outcome of appointment
        const apptRoll = Math.random();
        let apptStatus = "set";
        let apptResult = null;
        if (apptDate < new Date()) {
          if (apptRoll < 0.15) { apptStatus = "no_show"; stage = "dead"; deadReason = "no_show"; }
          else if (apptRoll < 0.3) { apptStatus = "cancelled"; stage = "dead"; deadReason = "cancelled"; }
          else { apptStatus = "sat"; stage = "sat"; }
        } else if (apptRoll < 0.5) {
          apptStatus = "confirmed"; stage = "confirmed";
        }

        const apptRes = await client.query(
          `INSERT INTO appointments (lead_id, sales_rep_id, set_by_id, scheduled_at, status, result, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [leadId, salesRep, setBy, apptDate, apptStatus, apptResult, createdAt]
        );
        const apptId = apptRes.rows[0].id;

        await client.query(
          "INSERT INTO call_logs (lead_id, rep_id, disposition, notes, created_at) VALUES ($1,$2,'appt_set','Appointment scheduled',$3)",
          [leadId, setBy, createdAt]
        );

        // If sat, chance of sale
        if (apptStatus === "sat" && Math.random() < 0.55) {
          const prodTicket = { 1:12500,2:18000,3:15000,4:22000,5:4500,6:9500 }[productId];
          const amount = Math.round((prodTicket * (0.7 + Math.random() * 0.8)) / 100) * 100;
          estValue = amount;
          stage = "sold";
          const soldAt = new Date(apptDate.getTime() + 3600000);
          await client.query(
            "UPDATE appointments SET status='sat', result='sold' WHERE id=$1",
            [apptId]
          );
          const saleRes = await client.query(
            `INSERT INTO sales (lead_id, appointment_id, sales_rep_id, product_id, amount, finance_type, sold_at, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING id`,
            [leadId, apptId, salesRep, productId, amount, rand(["cash","financed","check"]), soldAt]
          );
          const saleId = saleRes.rows[0].id;

          // production job
          const jobRoll = Math.random();
          let jobStatus = "pending";
          let milestones = {};
          let startDate = null;
          let completionDate = null;
          if (jobRoll < 0.3) {
            jobStatus = "in_progress";
            milestones = { measured:true, permits_pulled:true, materials_ordered:true, crew_assigned:true };
            startDate = new Date(soldAt.getTime() + 14 * 86400000);
            stage = "production";
          } else if (jobRoll < 0.55) {
            jobStatus = "completed";
            milestones = { measured:true, permits_pulled:true, materials_ordered:true, crew_assigned:true, installed:true, inspected:true, paid:true };
            startDate = new Date(soldAt.getTime() + 14 * 86400000);
            completionDate = new Date(soldAt.getTime() + 21 * 86400000);
            stage = "completed";
          } else if (jobRoll < 0.75) {
            jobStatus = "materials_ordered";
            milestones = { measured:true, permits_pulled:true, materials_ordered:true };
            stage = "production";
          }
          await client.query(
            `INSERT INTO jobs (sale_id, lead_id, status, crew, start_date, completion_date, milestones, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
            [saleId, leadId, jobStatus, jobStatus === "pending" ? null : "Crew A", startDate, completionDate, JSON.stringify(milestones), soldAt]
          );
        }
      }

      await client.query(
        "UPDATE leads SET stage=$1, disposition=$2, estimated_value=$3, dead_reason=$4 WHERE id=$5",
        [stage, disposition, estValue, deadReason, leadId]
      );
    }

    const counts = await client.query("SELECT stage, count(*) FROM leads GROUP BY stage");
    console.log("Lead stages:", counts.rows);
    console.log("✅ Seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
