import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from the environment so the same config works locally,
// in the sandbox, and against your production database. Falls back to the
// local sandbox DB when DATABASE_URL isn't set.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
