/**
 * @file categories-schema.ts
 * @description
 * This file defines the database schema for the "categories" table using Drizzle ORM.
 * It includes a table for user-defined expense categories (e.g. "Meals", "Travel").
 *
 * Key features:
 * - Each category row is tied to a specific user via Clerk's userId
 * - A name field to label the category
 * - Timestamps for creation and updates
 *
 * @dependencies
 * - drizzle-orm/pg-core for Postgres column definitions
 *
 * @notes
 * - If a category is deleted, any receipts referencing it may either remain referencing a non-existent category,
 *   or we can set the categoryId to null in receipts. For now, we set onDelete="set null" in receipts (see receipts-schema.ts).
 * - On updates, updatedAt is automatically changed to the current date/time.
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * categoriesTable:
 * - id: Primary key (uuid), defaults to a random generated UUID.
 * - userId: The Clerk user ID that owns the category.
 * - name: The display name of the category (e.g. "Meals", "Office Supplies").
 * - createdAt: Timestamp when the category is created; defaults to now.
 * - updatedAt: Timestamp when the category is updated; auto-updates to the current time.
 */
export const categoriesTable = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

/**
 * InsertCategory:
 * Type for inserting a new record into the categories table
 */
export type InsertCategory = typeof categoriesTable.$inferInsert

/**
 * SelectCategory:
 * Type for selecting/fetching a record from the categories table
 */
export type SelectCategory = typeof categoriesTable.$inferSelect
