/**
 * @description
 * This file aggregates and exports all table schema definitions for the application.
 *
 * Key features:
 * - Exports `profilesTable` and `receiptsTable` so they can be accessed throughout the app.
 * - Ensures centralized access to Drizzle schema objects.
 *
 * @notes
 * - Any new schema file must be exported here.
 * - Maintains consistent naming and structure across tables.
 */

export * from "./profiles-schema"
export * from "./receipts-schema"
