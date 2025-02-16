/**
 * @description
 * This file defines the schema for the `receiptsTable` in the database, which stores receipt data.
 * It includes columns for receipt metadata such as `merchant`, `date`, `amount`, and a reference to
 * the associated user in `profilesTable`. The table is used to store and organize receipts for each user.
 *
 * Key features:
 * - Defines `receiptsTable` with columns:
 *   - `id` (uuid) - Primary key
 *   - `userId` (text) - References `profilesTable.userId` with onDelete cascade
 *   - `storagePath` (text) - Path to the file in Supabase Storage
 *   - `merchant` (text) - Name of the merchant
 *   - `date` (timestamp) - Date of the transaction
 *   - `amount` (numeric(10,2)) - Total amount for the receipt
 *   - `category` (text) - User-defined category for expense tracking
 *   - `verified` (boolean) - Whether the receipt data is verified, defaults to false
 *   - `createdAt` (timestamp) - Defaults to now
 *   - `updatedAt` (timestamp) - Defaults to now, updates automatically on row changes
 *
 * @dependencies
 * - `drizzle-orm/pg-core` for column definitions
 * - `profilesTable` reference for the foreign key relationship
 *
 * @notes
 * - The foreign key uses onDelete: "cascade" to delete receipts if the associated user is removed.
 * - This schema is essential for storing user receipt data in the system.
 *
 * @limitations
 * - Currently does not handle extremely large numeric amounts beyond numeric(10,2).
 * - Date column may require careful parsing/formatting in other layers.
 */

import { profilesTable } from "@/db/schema/profiles-schema"
import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"

/**
 * Represents the database table 'receipts'.
 */
export const receiptsTable = pgTable("receipts", {
  /**
   * Primary key UUID for each receipt.
   */
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * User ID that this receipt belongs to (references profilesTable.userId).
   * Cascades on delete to remove receipts if the associated user is removed.
   */
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),

  /**
   * Path to the stored receipt image in Supabase Storage.
   */
  storagePath: text("storage_path").notNull(),

  /**
   * Merchant name extracted from the receipt.
   */
  merchant: text("merchant"),

  /**
   * Date of the transaction.
   * Could be null if AI extraction fails or if the user does not provide it.
   */
  date: timestamp("date", { withTimezone: false }),

  /**
   * Amount spent on the receipt (currency).
   * numeric(10,2) for storing dollars/cents accurately.
   */
  amount: numeric("amount", { precision: 10, scale: 2 }),

  /**
   * Category assigned by the user for expense tracking.
   */
  category: text("category"),

  /**
   * Whether this receipt's data has been verified by the user. Defaults to false.
   */
  verified: boolean("verified").notNull().default(false),

  /**
   * Auto-set timestamp when the row is created.
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /**
   * Auto-updated timestamp whenever the row is updated.
   */
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

/**
 * Type for inserting data into the receiptsTable.
 */
export type InsertReceipt = typeof receiptsTable.$inferInsert

/**
 * Type for selecting data from the receiptsTable.
 */
export type SelectReceipt = typeof receiptsTable.$inferSelect
