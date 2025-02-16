/**
 * @file receipts-schema.ts
 * @description
 * This file defines the database schema for the "receipts" table using Drizzle ORM.
 * It includes a table for storing user receipts (e.g. images of receipts/invoices)
 * and metadata extracted from those documents (vendor, date, amount, etc.).
 *
 * Key features:
 * - Each receipt row is tied to a specific user via Clerk's userId
 * - Allows for storing and referencing a corresponding image URL
 * - Supports linking to an optional category via categoryId
 * - Tracks verification status ("unverified" or "verified")
 * - Stores creation and update timestamps
 *
 * @dependencies
 * - drizzle-orm/pg-core for Postgres column definitions
 * - categories-schema.ts for category references
 *
 * @notes
 * - The date column is stored as a SQL "date" type (no time component)
 * - The amount is stored as numeric (arbitrary precision)
 * - The currency defaults to "USD"
 * - The categoryId references categoriesTable.id. We do NOT cascade delete,
 *   but you can adjust if you prefer different behavior.
 * - The status defaults to "unverified" and will be changed to "verified" upon user confirmation.
 * - On updates, updatedAt is automatically changed to the current date/time.
 */

import { relations } from "drizzle-orm"
import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { categoriesTable } from "./categories-schema"

/**
 * receiptsTable:
 * - id: Primary key (uuid), defaults to a random generated UUID.
 * - userId: The Clerk user ID that owns the receipt (references no foreign key, but used for ownership).
 * - imageUrl: A text field storing the URL/path to the uploaded receipt image.
 * - vendor: The name of the vendor extracted from the receipt, can be edited by the user.
 * - date: The date of the transaction (SQL date type). May be null if extraction is uncertain.
 * - amount: The total amount spent, stored as numeric for arbitrary precision.
 * - currency: The currency code, defaults to "USD".
 * - categoryId: Optional reference to a category (see categoriesTable).
 * - status: "unverified" or "verified"; defaults to "unverified".
 * - createdAt: Timestamp when the receipt entry is created; defaults to now.
 * - updatedAt: Timestamp when the receipt entry is updated; auto-updates to the current time.
 */
export const receiptsTable = pgTable("receipts", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  vendor: text("vendor"),
  date: date("date"), // can be null if we fail to parse
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  categoryId: uuid("category_id").references(() => categoriesTable.id, {
    onDelete: "set null"
  }),
  status: text("status").notNull().default("unverified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

/**
 * Define the relationship between receipts and categories
 */
export const receiptsRelations = relations(receiptsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [receiptsTable.categoryId],
    references: [categoriesTable.id]
  })
}))

/**
 * InsertReceipt:
 * Type for inserting a new record into the receipts table
 */
export type InsertReceipt = typeof receiptsTable.$inferInsert

/**
 * SelectReceipt:
 * Type for selecting/fetching a record from the receipts table
 */
export type SelectReceipt = typeof receiptsTable.$inferSelect
