/**
 * @description
 * Initializes the database connection and schema for the app using Drizzle ORM and Postgres.js.
 *
 * Key features:
 * - Imports environment variables from `.env.local`.
 * - Creates a Postgres client using `postgres` and sets up Drizzle ORM with the defined schema.
 * - The `schema` object includes `profiles` and `receipts` tables.
 *
 * @dependencies
 * - `postgres` for connecting to the Postgres database.
 * - `drizzle-orm/postgres-js` for the ORM layer.
 * - `profilesTable` and `receiptsTable` from the schema definitions.
 *
 * @notes
 * - Ensure `DATABASE_URL` is defined in `.env.local`.
 * - This file is the main entry point for database queries in this application.
 */

import { profilesTable } from "@/db/schema/profiles-schema"
import { receiptsTable } from "@/db/schema/receipts-schema"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

config({ path: ".env.local" })

/**
 * Drizzle schema object that maps logical names to actual tables in the database.
 */
const schema = {
  profiles: profilesTable,
  receipts: receiptsTable
}

/**
 * Create a Postgres.js client using the provided DATABASE_URL.
 */
const client = postgres(process.env.DATABASE_URL!)

/**
 * The main database export, typed with the Drizzle schema for type-safe queries.
 */
export const db = drizzle(client, { schema })
