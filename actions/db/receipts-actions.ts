/**
 * @file receipts-actions.ts
 * @description
 * This file implements server actions for performing CRUD operations on
 * the `receiptsTable`. These actions allow the creation, retrieval,
 * updating, and deletion of receipt records. Additionally, the retrieval
 * (`getReceiptsAction`) can apply optional filters (date range, status,
 * category, etc.) for more refined queries.
 *
 * Key Features:
 * - Create, read, update, and delete receipts linked to a specific user.
 * - Optional filtering by date range, category, status, etc.
 * - Ensures proper error handling with success/fail states.
 * - "bulkUploadAction" handles multiple file uploads, integrates with Supabase Storage
 *   to store files, uses GPT-4o to extract data, and inserts new unverified receipts.
 * - "exportReceiptsAction" converts filtered receipts to CSV and returns it for download.
 *
 * @dependencies
 * - db (Drizzle ORM instance) for executing queries.
 * - receiptsTable (schema definition for receipts).
 * - eq, and, desc, gte, lte from drizzle-orm for building filter conditions.
 * - ActionState type for consistent return structure.
 * - Supabase Admin Client for storage uploads (using Service Role Key).
 * - extractReceiptDataAction from "@/actions/extract-receipt-action".
 *
 * @notes
 * - Each CRUD action uses the `userId` to ensure that only the owner's receipts are accessed.
 * - On creation, the user can provide partial data; further extraction can update the record.
 * - On update, partial fields are allowed to accommodate incremental editing.
 * - "bulkUploadAction" automatically sets `status='unverified'` for each newly created receipt.
 * - "exportReceiptsAction" uses our filter logic and CSV formatting to produce a CSV file string.
 */

"use server"

import { extractReceiptDataAction } from "@/actions/extract-receipt-action"
import { db } from "@/db/db"
import {
  InsertReceipt,
  receiptsTable,
  SelectReceipt
} from "@/db/schema/receipts-schema"
import { ActionState } from "@/types"
import { and, desc, eq, gte, lte } from "drizzle-orm"

// ------------------------------------
//  Importing Supabase for file uploads
// ------------------------------------
import { createClient } from "@supabase/supabase-js"

// Env variables for Supabase
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_BUCKET_RECEIPTS =
  process.env.SUPABASE_BUCKET_RECEIPTS || "user-receipts"

/**
 * Create a Supabase admin client for server-side file uploads.
 * This uses the Supabase Service Role Key with full R/W capabilities.
 * Make sure you do NOT expose this to the client.
 */
const supabaseAdmin = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? ""
)

/**
 * @interface GetReceiptsFilters
 * @description
 * Represents the optional filter parameters for retrieving receipts.
 * - categoryId: If present, filters by the specified category ID.
 * - status: If present, filters receipts by status (e.g., "verified", "unverified").
 * - fromDate: If present, retrieves receipts on or after this date.
 * - toDate: If present, retrieves receipts on or before this date.
 */
interface GetReceiptsFilters {
  categoryId?: string
  status?: string
  fromDate?: string
  toDate?: string
}

/**
 * @function createReceiptAction
 * @async
 * @description
 * Creates a new receipt record in the database.
 *
 * @param {InsertReceipt} receiptData - The data required to insert a new receipt.
 * @returns {Promise<ActionState<SelectReceipt>>}
 *  - isSuccess: true, and the newly inserted receipt on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const receiptToInsert: InsertReceipt = {
 *   userId: "user_123",
 *   imageUrl: "https://example.com/receipt.jpg",
 *   vendor: "Example Store",
 *   date: new Date("2023-10-10"),
 *   amount: 19.99,
 *   currency: "USD",
 *   status: "unverified",
 *   // categoryId is optional
 * }
 * const result = await createReceiptAction(receiptToInsert)
 * if (result.isSuccess) {
 *   console.log("Created receipt:", result.data)
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function createReceiptAction(
  receiptData: InsertReceipt
): Promise<ActionState<SelectReceipt>> {
  try {
    const [newReceipt] = await db
      .insert(receiptsTable)
      .values(receiptData)
      .returning()
    return {
      isSuccess: true,
      message: "Receipt created successfully.",
      data: newReceipt
    }
  } catch (error) {
    console.error("Error creating receipt:", error)
    return { isSuccess: false, message: "Failed to create receipt." }
  }
}

/**
 * @function getReceiptsAction
 * @async
 * @description
 * Retrieves an array of receipts for a given user, optionally filtered by
 * category, status, and/or date range.
 *
 * @param {string} userId - The ID of the user who owns the receipts.
 * @param {GetReceiptsFilters} [filters] - Optional filtering parameters.
 * @returns {Promise<ActionState<SelectReceipt[]>>}
 *  - isSuccess: true, and an array of matching receipts on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const result = await getReceiptsAction("user_123", {
 *   categoryId: "cat_456",
 *   status: "verified",
 *   fromDate: "2023-01-01",
 *   toDate: "2023-12-31"
 * })
 * if (result.isSuccess) {
 *   console.log("Found receipts:", result.data)
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function getReceiptsAction(
  userId: string,
  filters?: GetReceiptsFilters
): Promise<ActionState<SelectReceipt[]>> {
  try {
    // Build an array of conditions for the 'where' clause
    const conditions = [eq(receiptsTable.userId, userId)]

    // If categoryId is provided, add it to the conditions
    if (filters?.categoryId) {
      conditions.push(eq(receiptsTable.categoryId, filters.categoryId))
    }

    // If status is provided, add it to the conditions
    if (filters?.status) {
      conditions.push(eq(receiptsTable.status, filters.status))
    }

    // If fromDate is provided, add it to the conditions
    if (filters?.fromDate) {
      const parsedFrom = new Date(filters.fromDate)
      if (!isNaN(parsedFrom.getTime())) {
        conditions.push(gte(receiptsTable.date, parsedFrom.toISOString()))
      }
    }

    // If toDate is provided, add it to the conditions
    if (filters?.toDate) {
      const parsedTo = new Date(filters.toDate)
      if (!isNaN(parsedTo.getTime())) {
        conditions.push(lte(receiptsTable.date, parsedTo.toISOString()))
      }
    }

    // Use drizzle-orm's query builder with category relationship
    const receipts = await db.query.receipts.findMany({
      where: and(...conditions),
      with: {
        category: true
      },
      orderBy: req => [desc(req.date)]
    })

    return {
      isSuccess: true,
      message: "Receipts retrieved successfully.",
      data: receipts
    }
  } catch (error) {
    console.error("Error retrieving receipts:", error)
    return { isSuccess: false, message: "Failed to retrieve receipts." }
  }
}

/**
 * @function updateReceiptAction
 * @async
 * @description
 * Updates an existing receipt record with partial data. Only the fields
 * specified in `data` will be updated.
 *
 * @param {string} receiptId - The UUID of the receipt to update.
 * @param {Partial<InsertReceipt>} data - The partial receipt data to update.
 * @param {string} userId - The ID of the user who owns the receipt.
 * @returns {Promise<ActionState<SelectReceipt>>}
 *  - isSuccess: true, and the updated receipt on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const result = await updateReceiptAction("receipt_abc", { status: "verified" }, "user_123")
 * if (result.isSuccess) {
 *   console.log("Updated receipt:", result.data)
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function updateReceiptAction(
  receiptId: string,
  data: Partial<InsertReceipt>,
  userId: string
): Promise<ActionState<SelectReceipt>> {
  try {
    // Check that the receipt belongs to the user via userId
    const [updatedReceipt] = await db
      .update(receiptsTable)
      .set(data)
      .where(
        and(eq(receiptsTable.id, receiptId), eq(receiptsTable.userId, userId))
      )
      .returning()

    if (!updatedReceipt) {
      return {
        isSuccess: false,
        message: "Receipt not found or you don't have permission to update it."
      }
    }

    return {
      isSuccess: true,
      message: "Receipt updated successfully.",
      data: updatedReceipt
    }
  } catch (error) {
    console.error("Error updating receipt:", error)
    return { isSuccess: false, message: "Failed to update receipt." }
  }
}

/**
 * @function deleteReceiptAction
 * @async
 * @description
 * Deletes a receipt record identified by `receiptId` for the specified user.
 *
 * @param {string} receiptId - The UUID of the receipt to delete.
 * @param {string} userId - The ID of the user who owns the receipt.
 * @returns {Promise<ActionState<void>>}
 *  - isSuccess: true on successful deletion.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const result = await deleteReceiptAction("receipt_abc", "user_123")
 * if (result.isSuccess) {
 *   console.log("Receipt deleted.")
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function deleteReceiptAction(
  receiptId: string,
  userId: string
): Promise<ActionState<void>> {
  try {
    // Only delete if user matches
    const deleted = await db
      .delete(receiptsTable)
      .where(
        and(eq(receiptsTable.id, receiptId), eq(receiptsTable.userId, userId))
      )
      .returning()

    if (deleted.length === 0) {
      return {
        isSuccess: false,
        message: "Receipt not found or you don't have permission to delete it."
      }
    }

    return {
      isSuccess: true,
      message: "Receipt deleted successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting receipt:", error)
    return { isSuccess: false, message: "Failed to delete receipt." }
  }
}

/**
 * @interface BulkUploadResult
 * @description
 * Defines the shape of the data returned by the "bulkUploadAction" operation.
 * - An array of newly created receipts for each uploaded file.
 */
interface BulkUploadResult {
  createdReceipts: SelectReceipt[]
}

/**
 * @function bulkUploadAction
 * @async
 * @description
 * Handles the bulk upload of multiple files by:
 * 1. Uploading each file to Supabase Storage.
 * 2. Generating a short-lived signed URL (since the bucket is private).
 * 3. Calling GPT-4o extraction on that signed URL.
 * 4. Creating a new receipt record in the DB with the extracted data and status="unverified".
 *
 * @param {File[]} files - Array of files to be uploaded.
 * @param {string} userId - The ID of the user who owns these receipts.
 * @returns {Promise<ActionState<BulkUploadResult>>}
 *  - isSuccess: true, and an array of newly created receipts on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const fileList = [file1, file2, ...] // from a form upload
 * const result = await bulkUploadAction(fileList, "user_123")
 * if (result.isSuccess) {
 *   console.log("Bulk upload success. Created receipts:", result.data.createdReceipts)
 * } else {
 *   console.error("Bulk upload failed:", result.message)
 * }
 *
 * @notes
 * - This action expects a real File[] object (e.g. from a web form).
 * - For each file, we generate a unique path that starts with userId.
 *   This is required by your private bucket policy so you can actually store it.
 * - Because the bucket is private, we cannot rely on a public URL. Instead,
 *   we create a short-lived signed URL for GPT extraction.
 * - If extraction fails, we store partial data or leave them blank. The user can verify/fix data later.
 * - Additional validations (e.g. file size, type) can be added as needed.
 */
export async function bulkUploadAction(
  files: File[],
  userId: string
): Promise<ActionState<BulkUploadResult>> {
  try {
    if (!files || files.length === 0) {
      return { isSuccess: false, message: "No files provided for bulk upload." }
    }
    if (!userId) {
      return {
        isSuccess: false,
        message: "No userId provided. Bulk upload cannot proceed."
      }
    }

    const createdReceipts: SelectReceipt[] = []

    // Iterate over each file
    for await (const file of files) {
      try {
        // Step 1: Upload the file to Supabase Storage
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "_")
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, "_")
        const path = `${sanitizedUserId}/${Date.now()}_${sanitizedFileName}`
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from(SUPABASE_BUCKET_RECEIPTS)
            .upload(path, file, { upsert: false, contentType: file.type })

        if (uploadError || !uploadData?.path) {
          console.error("Error uploading file to Supabase:", uploadError)
          continue
        }

        // Step 2: Generate a short-lived signed URL
        const { data: signedData, error: signedError } =
          await supabaseAdmin.storage
            .from(SUPABASE_BUCKET_RECEIPTS)
            .createSignedUrl(uploadData.path, 60 * 10) // valid for 10 minutes

        if (signedError || !signedData?.signedUrl) {
          console.error(
            "Error creating signed URL for GPT extraction:",
            signedError
          )
          continue
        }

        const accessibleUrl = signedData.signedUrl

        // Step 3: Extract data from the receipt using GPT-4o
        const extraction = await extractReceiptDataAction(accessibleUrl)
        let vendor: string | null = null
        let date: string | null = null
        let amount: number | null = null
        let currency = "USD"

        if (extraction.isSuccess && extraction.data) {
          vendor = extraction.data.vendor
          date = extraction.data.date
          amount = extraction.data.amount
          currency = extraction.data.currency
        } else {
          console.warn("Extraction failed or partial data. Using defaults.")
        }

        // Step 4: Create a new receipt record
        const newReceipt: InsertReceipt = {
          userId,
          imageUrl: uploadData.path,
          vendor: vendor || null,
          date: date ? new Date(date).toISOString() : null,
          amount: amount != null ? amount.toString() : null,
          currency,
          status: "unverified"
        }

        const createResult = await createReceiptAction(newReceipt)
        if (createResult.isSuccess && createResult.data) {
          createdReceipts.push(createResult.data)
        } else {
          console.error(
            "Failed to create receipt record in DB:",
            createResult.message
          )
        }
      } catch (fileError) {
        console.error("Error processing one file in bulk upload:", fileError)
      }
    }

    return {
      isSuccess: true,
      message: `Bulk upload complete. Created ${createdReceipts.length} receipts.`,
      data: { createdReceipts }
    }
  } catch (error) {
    console.error("Bulk upload action error:", error)
    return { isSuccess: false, message: "Bulk upload failed." }
  }
}

/**
 * @interface ExportReceiptsResult
 * @description
 * Defines the shape of the data returned by the "exportReceiptsAction".
 * - csv: The CSV text representing the exported receipts.
 */
interface ExportReceiptsResult {
  csv: string
}

/**
 * @function exportReceiptsAction
 * @async
 * @description
 * Filters receipts by userId and optional date/category/status criteria,
 * then converts them to a CSV string. Returns that CSV wrapped in an
 * ActionState.
 *
 * @param {string} userId - The ID of the user whose receipts are being exported.
 * @param {GetReceiptsFilters} [filters] - Optional filters (status, fromDate, toDate, categoryId).
 * @returns {Promise<ActionState<ExportReceiptsResult>>}
 *  - isSuccess: true, data.csv is the CSV representation of receipts.
 *  - isSuccess: false, message describing the error.
 *
 * @example
 * const result = await exportReceiptsAction("user_123", { fromDate: "2023-01-01" })
 * if (result.isSuccess) {
 *   console.log("CSV content:", result.data.csv)
 * }
 *
 * @notes
 * - CSV columns: date,vendor,amount,currency,category,status,createdAt
 * - We handle `null` or undefined fields by printing them as empty strings.
 */
export async function exportReceiptsAction(
  userId: string,
  filters?: GetReceiptsFilters
): Promise<ActionState<ExportReceiptsResult>> {
  try {
    // Build an array of conditions for the 'where' clause
    const conditions = [eq(receiptsTable.userId, userId)]

    // If categoryId is provided, add it to the conditions
    if (filters?.categoryId) {
      conditions.push(eq(receiptsTable.categoryId, filters.categoryId))
    }

    // If status is provided, add it to the conditions
    if (filters?.status) {
      conditions.push(eq(receiptsTable.status, filters.status))
    }

    // If fromDate is provided, add it to the conditions
    if (filters?.fromDate) {
      const parsedFrom = new Date(filters.fromDate)
      if (!isNaN(parsedFrom.getTime())) {
        conditions.push(gte(receiptsTable.date, parsedFrom.toISOString()))
      }
    }

    // If toDate is provided, add it to the conditions
    if (filters?.toDate) {
      const parsedTo = new Date(filters.toDate)
      if (!isNaN(parsedTo.getTime())) {
        conditions.push(lte(receiptsTable.date, parsedTo.toISOString()))
      }
    }

    // Use drizzle-orm's query builder with a join to get category names
    const receipts = await db.query.receipts.findMany({
      where: and(...conditions),
      with: {
        category: true
      },
      orderBy: req => [desc(req.date)]
    })

    // Build the CSV rows
    // Header row
    const columns = [
      "date",
      "vendor",
      "amount",
      "currency",
      "category",
      "status",
      "createdAt"
    ]
    const headerRow = columns.join(",")

    // Data rows
    const rows = receipts.map(r => {
      const date = r.date ? new Date(r.date).toISOString().slice(0, 10) : ""
      const vendor = r.vendor || ""
      const amount = r.amount?.toString() || ""
      const currency = r.currency || ""
      const category = r.category?.name || "Uncategorized"
      const status = r.status || ""
      const createdAt = r.createdAt?.toISOString() || ""

      // Escape or handle commas if needed, but for simplicity,
      // we assume no commas in these fields. If vendor can contain commas,
      // we'd add quotes. For brevity, we skip that here.
      return [date, vendor, amount, currency, category, status, createdAt].join(
        ","
      )
    })

    const csvContent = [headerRow, ...rows].join("\n")

    return {
      isSuccess: true,
      message: "CSV exported successfully",
      data: { csv: csvContent }
    }
  } catch (error) {
    console.error("Error exporting CSV:", error)
    return {
      isSuccess: false,
      message: "Failed to export CSV"
    }
  }
}
