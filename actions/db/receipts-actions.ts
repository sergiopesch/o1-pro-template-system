/**
 * @description
 * Provides server actions (CRUD) for the `receiptsTable` in the DB, plus specialized
 * actions for verifying receipts, deleting them, and now exporting them to CSV.
 *
 * Key features:
 * - `createReceiptDbAction` (DB-only insert)
 * - `getReceiptsAction` (read with optional filters)
 * - `updateReceiptAction` (update existing record)
 * - `deleteReceiptAction` (delete record from DB)
 * - `createReceiptAction` (orchestrates upload + AI extraction + insert)
 * - `getReceiptByIdAction` (for ownership checks)
 * - `verifyAndUpdateReceiptAction` (for verifying receipts from a client component)
 * - `deleteReceiptWithOwnershipCheckAction` (ensures user is owner, then deletes from storage & DB)
 * - `exportReceiptsAction` (new) generates a CSV string of selected receipts
 *
 * @notes
 * - We rely on rules:
 *   1. "Never generate migrations automatically."
 *   2. "All server actions must return an ActionState."
 * - We do partial updates in `updateReceiptAction`.
 */

"use server"

import { extractReceiptDataAction } from "@/actions/extract-receipt-actions"
import {
  deleteReceiptFileStorage,
  uploadReceiptFileStorage
} from "@/actions/storage/receipts-storage-actions"
import { db } from "@/db/db"
import {
  InsertReceipt,
  SelectReceipt,
  receiptsTable
} from "@/db/schema/receipts-schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { and, eq, gte, lte, sql } from "drizzle-orm"

/**
 * @interface GetReceiptsFilters
 * Defines optional filters for retrieving receipts.
 */
interface GetReceiptsFilters {
  merchant?: string
  category?: string
  verified?: boolean
  startDate?: Date
  endDate?: Date
  receiptId?: string
}

/**
 * A low-level DB-only function to create a new receipt record.
 * @param data {InsertReceipt} - The data to insert.
 * @returns {Promise<ActionState<SelectReceipt>>}
 */
export async function createReceiptDbAction(
  data: InsertReceipt
): Promise<ActionState<SelectReceipt>> {
  try {
    const [newReceipt] = await db.insert(receiptsTable).values(data).returning()
    return {
      isSuccess: true,
      message: "Receipt created successfully (DB-only)",
      data: newReceipt
    }
  } catch (error) {
    console.error("Error creating receipt (DB-only):", error)
    return { isSuccess: false, message: "Failed to create receipt in DB" }
  }
}

/**
 * Fetches an array of receipts for a given user, optionally applying filters.
 * @param userId {string} - The user's ID
 * @param filters {GetReceiptsFilters} - Optional filters
 * @returns {Promise<ActionState<SelectReceipt[]>>} - A list of matching receipts on success
 */
export async function getReceiptsAction(
  userId: string,
  filters: GetReceiptsFilters = {}
): Promise<ActionState<SelectReceipt[]>> {
  try {
    const { merchant, category, verified, startDate, endDate, receiptId } =
      filters

    const conditions = [eq(receiptsTable.userId, userId)]

    if (receiptId) {
      conditions.push(eq(receiptsTable.id, receiptId))
    }

    if (merchant && merchant.trim().length > 0) {
      conditions.push(
        sql`${receiptsTable.merchant} ILIKE ${"%" + merchant + "%"}`
      )
    }
    if (category && category.trim().length > 0) {
      conditions.push(
        sql`${receiptsTable.category} ILIKE ${"%" + category + "%"}`
      )
    }
    if (typeof verified === "boolean") {
      conditions.push(eq(receiptsTable.verified, verified))
    }
    if (startDate) {
      conditions.push(gte(receiptsTable.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(receiptsTable.date, endDate))
    }

    const receipts = await db.query.receipts.findMany({
      where: and(...conditions),
      orderBy: (r, { desc }) => desc(r.createdAt)
    })

    return {
      isSuccess: true,
      message: "Receipts retrieved successfully",
      data: receipts
    }
  } catch (error) {
    console.error("Error getting receipts:", error)
    return { isSuccess: false, message: "Failed to get receipts" }
  }
}

/**
 * Updates an existing receipt record, returning the updated row.
 * @param id {string} - The primary key (UUID)
 * @param data {Partial<InsertReceipt>} - The partial fields to update
 * @returns {Promise<ActionState<SelectReceipt>>}
 */
export async function updateReceiptAction(
  id: string,
  data: Partial<InsertReceipt>
): Promise<ActionState<SelectReceipt>> {
  try {
    // Create a new object for the update to avoid modifying the input
    const updateData: Partial<InsertReceipt> = {}

    // Copy non-date fields
    if (data.merchant !== undefined) updateData.merchant = data.merchant
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.category !== undefined) updateData.category = data.category
    if (data.verified !== undefined) updateData.verified = data.verified
    if (data.userId !== undefined) updateData.userId = data.userId
    if (data.storagePath !== undefined)
      updateData.storagePath = data.storagePath

    // Handle date separately
    if (data.date) {
      try {
        const date = new Date(data.date)
        if (!isNaN(date.getTime())) {
          updateData.date = date
        }
      } catch (error) {
        return { isSuccess: false, message: "Invalid date format" }
      }
    }

    const [updatedReceipt] = await db
      .update(receiptsTable)
      .set(updateData)
      .where(eq(receiptsTable.id, id))
      .returning()

    if (!updatedReceipt) {
      return { isSuccess: false, message: "No receipt found with given ID" }
    }

    return {
      isSuccess: true,
      message: "Receipt updated successfully",
      data: updatedReceipt
    }
  } catch (error) {
    console.error("Error updating receipt:", error)
    return { isSuccess: false, message: "Failed to update receipt" }
  }
}

/**
 * Deletes a receipt from the DB (not from storage).
 * @param id {string} - The primary key (UUID)
 * @returns {Promise<ActionState<void>>}
 */
export async function deleteReceiptAction(
  id: string
): Promise<ActionState<void>> {
  try {
    const result = await db
      .delete(receiptsTable)
      .where(eq(receiptsTable.id, id))
      .returning()

    if (result.length === 0) {
      return {
        isSuccess: false,
        message: "No receipt found to delete"
      }
    }

    return {
      isSuccess: true,
      message: "Receipt deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting receipt:", error)
    return { isSuccess: false, message: "Failed to delete receipt" }
  }
}

/**
 * Orchestrates file upload + AI extraction + DB insert in one step.
 * @param file {File}
 * @param userId {string}
 * @returns {Promise<ActionState<SelectReceipt>>}
 */
export async function createReceiptAction(
  file: File,
  userId: string
): Promise<ActionState<SelectReceipt>> {
  try {
    if (!file || !userId) {
      throw new Error("Missing file or userId")
    }

    if (userId.trim() === "") {
      throw new Error("Invalid userId")
    }

    let extension: string
    if (file.type === "image/png") {
      extension = "png"
    } else if (file.type === "image/jpeg") {
      extension = "jpg"
    } else {
      throw new Error("Unsupported file type. Only PNG and JPEG are allowed.")
    }

    const uniqueId = crypto.randomUUID()
    const filePath = `${userId}/${uniqueId}.${extension}`
    const bucket = process.env.SUPABASE_BUCKET_RECEIPTS
    if (!bucket) {
      throw new Error("Missing SUPABASE_BUCKET_RECEIPTS env var")
    }

    const uploadResult = await uploadReceiptFileStorage(bucket, filePath, file)
    if (!uploadResult.isSuccess) {
      return {
        isSuccess: false,
        message: `File upload failed: ${uploadResult.message}`
      }
    }

    const extractionResult = await extractReceiptDataAction(filePath)
    if (!extractionResult.isSuccess) {
      return {
        isSuccess: false,
        message: `AI extraction failed: ${extractionResult.message}`
      }
    }

    const { merchant, date, amount } = extractionResult.data
    const cleanAmount = amount
      ? parseFloat(amount.replace(/[$,]/g, "")).toString()
      : undefined

    const insertData: InsertReceipt = {
      userId,
      storagePath: filePath,
      merchant: merchant || "",
      date: date ? new Date(date) : undefined,
      amount: cleanAmount,
      category: null as any,
      verified: false
    }

    const [newReceipt] = await db
      .insert(receiptsTable)
      .values(insertData)
      .returning()

    return {
      isSuccess: true,
      message: "Receipt uploaded and AI-extracted successfully",
      data: newReceipt
    }
  } catch (error) {
    console.error("Error in createReceiptAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred in createReceiptAction"
    }
  }
}

/**
 * Fetch a single receipt by ID for the given user (ownership check).
 * @param userId {string}
 * @param receiptId {string}
 * @returns {Promise<ActionState<SelectReceipt>>}
 */
export async function getReceiptByIdAction(
  userId: string,
  receiptId: string
): Promise<ActionState<SelectReceipt>> {
  try {
    const [found] = await db.query.receipts.findMany({
      where: and(
        eq(receiptsTable.userId, userId),
        eq(receiptsTable.id, receiptId)
      ),
      limit: 1
    })

    if (!found) {
      return { isSuccess: false, message: "No matching receipt found" }
    }

    return {
      isSuccess: true,
      message: "Receipt retrieved successfully",
      data: found
    }
  } catch (error) {
    console.error("Error in getReceiptByIdAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve receipt by ID"
    }
  }
}

/**
 * @function verifyAndUpdateReceiptAction
 * This server action is invoked from a client component to:
 * 1) Check the current user
 * 2) Verify ownership of the receipt
 * 3) Update the fields (merchant, date, amount, category, verified, etc.)
 * 4) Return the updated row
 *
 * @param data {object} - Contains the fields to update
 *   e.g. { id, merchant, date, amount, category, verified (usually true) }
 *
 * @returns {Promise<ActionState<SelectReceipt>>}
 *
 * @notes
 * - Called directly from the client as a server action
 * - We do a final ownership check using `getReceiptByIdAction`
 */
export async function verifyAndUpdateReceiptAction(data: {
  id: string
  merchant?: string
  date?: string
  amount?: string
  category?: string
  verified?: boolean
}): Promise<ActionState<SelectReceipt>> {
  try {
    // Ensure user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    // Ensure they own the receipt
    const ownershipCheck = await getReceiptByIdAction(userId, data.id)
    if (!ownershipCheck.isSuccess) {
      return {
        isSuccess: false,
        message: "Receipt not found or not owned by user"
      }
    }

    // Build the partial update
    const updateData: Partial<InsertReceipt> = {}

    if (data.merchant !== undefined) {
      updateData.merchant = data.merchant.trim()
    }
    if (data.date !== undefined && data.date.trim() !== "") {
      try {
        const date = new Date(data.date)
        if (!isNaN(date.getTime())) {
          updateData.date = date
        } else {
          throw new Error("Invalid date")
        }
      } catch (error) {
        return { isSuccess: false, message: "Invalid date format" }
      }
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount.trim()
    }
    if (data.category !== undefined) {
      updateData.category = data.category.trim()
    }
    if (data.verified !== undefined) {
      updateData.verified = data.verified
    }

    // Call the existing updateReceiptAction
    const result = await updateReceiptAction(data.id, updateData)
    return result
  } catch (error) {
    console.error("Error in verifyAndUpdateReceiptAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while verifying receipt"
    }
  }
}

/**
 * @function deleteReceiptWithOwnershipCheckAction
 * This server action enforces ownership, deletes the associated file from
 * Supabase Storage, then removes the DB record.
 *
 * @param receiptId {string} - The ID of the receipt to delete
 * @returns {Promise<ActionState<void>>}
 *
 * Steps:
 * 1) Check user via auth()
 * 2) Ensure the user owns the receipt with getReceiptByIdAction
 * 3) If owned, call deleteReceiptFileStorage for the image
 * 4) Call deleteReceiptAction to remove from DB
 */
export async function deleteReceiptWithOwnershipCheckAction(
  receiptId: string
): Promise<ActionState<void>> {
  try {
    // 1) check if user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    // 2) ensure the user owns the receipt
    const ownershipCheck = await getReceiptByIdAction(userId, receiptId)
    if (!ownershipCheck.isSuccess) {
      return {
        isSuccess: false,
        message: "Receipt not found or not owned by user"
      }
    }

    // 3) delete from storage
    const bucket = process.env.SUPABASE_BUCKET_RECEIPTS
    if (!bucket) {
      throw new Error("Missing SUPABASE_BUCKET_RECEIPTS env var")
    }

    const { storagePath } = ownershipCheck.data
    const storageResult = await deleteReceiptFileStorage(bucket, storagePath)
    if (!storageResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Failed to delete file from storage: ${storageResult.message}`
      }
    }

    // 4) delete from DB
    const dbDeleteResult = await deleteReceiptAction(receiptId)
    if (!dbDeleteResult.isSuccess) {
      return {
        isSuccess: false,
        message: `Failed to delete receipt record: ${dbDeleteResult.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Receipt fully deleted",
      data: undefined
    }
  } catch (error) {
    console.error("Error in deleteReceiptWithOwnershipCheckAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while deleting receipt"
    }
  }
}

/**
 * @function exportReceiptsAction
 * Returns a CSV string of filtered receipts for a given user, with columns:
 *  Date, Merchant, Amount, Category, Verified
 *
 * @param userId {string} The user ID
 * @param filters {GetReceiptsFilters} optional filters for merchant, category, etc.
 * @returns {Promise<ActionState<{ csv: string }>>}
 */
export async function exportReceiptsAction(
  userId: string,
  filters: GetReceiptsFilters = {}
): Promise<ActionState<{ csv: string }>> {
  try {
    // Re-use getReceiptsAction to fetch the data.
    const result = await getReceiptsAction(userId, filters)
    if (!result.isSuccess) {
      return { isSuccess: false, message: result.message }
    }

    const receipts = result.data

    // Build the CSV header
    const header = ["Date", "Merchant", "Amount", "Category", "Verified"]
    const rows: string[] = []
    rows.push(header.join(","))

    // Each row
    for (const r of receipts) {
      const dateString = r.date
        ? new Date(r.date).toISOString().split("T")[0]
        : ""
      const merchant = csvEscape(r.merchant ?? "")
      const amount = r.amount != null ? r.amount.toString() : ""
      const category = csvEscape(r.category ?? "")
      const verified = r.verified ? "true" : "false"

      const row = [dateString, merchant, amount, category, verified].join(",")
      rows.push(row)
    }

    const csvContent = rows.join("\n")

    return {
      isSuccess: true,
      message: "CSV export generated successfully",
      data: { csv: csvContent }
    }
  } catch (error) {
    console.error("Error in exportReceiptsAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred during CSV export"
    }
  }
}

/**
 * Simple CSV escape: replaces quotes and commas with safe forms.
 * You can extend this to handle multiline strings, etc.
 */
function csvEscape(input: string): string {
  // If the string has a comma or quote, we wrap it in quotes and escape internal quotes
  if (/,|"/.test(input)) {
    const escaped = input.replace(/"/g, '""')
    return `"${escaped}"`
  }
  return input
}
