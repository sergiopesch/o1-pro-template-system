/**
 * @file db.ts
 * @description
 * This file initializes the database connection using drizzle-orm and postgres,
 * and defines the combined schema object that includes all tables in the app.
 *
 * Key features:
 * - Uses .env.local for database credentials
 * - Exports a `db` object used throughout the app for queries
 * - Aggregates all table definitions into one schema object
 *
 * @dependencies
 * - dotenv for loading environment variables
 * - postgres for creating a Postgres client instance
 * - drizzle-orm/postgres-js for the Drizzle ORM
 *
 * @notes
 * - We do not generate migrations in this project according to the rules
 * - The schema object includes profiles, receipts, and categories tables
 * - Make sure the environment variable DATABASE_URL is set in .env.local
 */

import {
  categoriesTable,
  profilesTable,
  receiptsRelations,
  receiptsTable
} from "@/db/schema"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

config({ path: ".env.local" })

// Combine all table definitions into a single schema object
const schema = {
  profiles: profilesTable,
  receipts: receiptsTable,
  categories: categoriesTable,
  receiptsRelations
}

// Create a Postgres client using the provided DATABASE_URL
const client = postgres(process.env.DATABASE_URL!)

// Create a Drizzle ORM instance, associating it with our schema
export const db = drizzle(client, { schema })
