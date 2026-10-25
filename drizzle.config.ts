/*
Configures Drizzle for the app.
*/

import { config } from "dotenv"

config({ path: ".env.local" })

// Keep this optional CLI configuration independent of the removed CLI package.
export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql" as const,
  dbCredentials: { url: process.env.DATABASE_URL! }
}
