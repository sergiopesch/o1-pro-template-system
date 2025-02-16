/**
 * @file upload-receipts-action.ts
 * @description
 * This file defines a server action function for uploading receipts from a
 * client. It handles FormData that includes files, calls `bulkUploadAction`
 * to store them in Supabase, runs GPT extraction, and creates unverified
 * receipts in the database.
 *
 * Key Features:
 * - Declares `"use server"` at the top to be recognized as a server action
 * - Validates that the user is logged in (via Clerk's auth)
 * - Extracts File[] from FormData
 * - Invokes `bulkUploadAction` in `receipts-actions.ts`
 * - Returns an ActionState with info about the created receipts
 *
 * @dependencies
 * - Clerk's server-side `auth` to get the current user
 * - `bulkUploadAction` from `@/actions/db/receipts-actions` for the actual upload logic
 * - ActionState for typed responses
 *
 * @notes
 * - Because this references environment variables and server logic, it must reside on the server
 * - Must be imported by a server component or passed as a function prop to a client component
 * - If you need to call this from a client, you must pass it via a server component's props
 */

"use server"

import { bulkUploadAction } from "@/actions/db/receipts-actions"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"

/**
 * @function uploadReceiptsAction
 * @async
 * @description
 * Receives a FormData object from the client, extracts the userId from Clerk,
 * calls `bulkUploadAction` to process the files, and returns an ActionState
 * with success/failure details.
 *
 * @param {FormData} formData - A FormData object containing the "files" input array
 * @returns {Promise<ActionState<{ createdReceipts: any[] }>>}
 *  - On success, an object with `isSuccess=true` and the newly created receipts
 *  - On failure, an object with `isSuccess=false` and an error message
 *
 * @example
 * // Called from a server or passed to a client component as a prop:
 * const result = await uploadReceiptsAction(formData)
 * if (result.isSuccess) {
 *   console.log("Bulk upload completed", result.data?.createdReceipts)
 * } else {
 *   console.error("Upload failed", result.message)
 * }
 */
export async function uploadReceiptsAction(
  formData: FormData
): Promise<ActionState<{ createdReceipts: any[] }>> {
  try {
    // Validate user authentication
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "You must be signed in to upload receipts."
      }
    }

    // Extract files from formData
    const files = formData.getAll("files") as File[]
    if (!files || files.length === 0) {
      return { isSuccess: false, message: "No files found in form data." }
    }

    // Delegate to existing server logic to handle multi-file upload
    const result = await bulkUploadAction(files, userId)
    if (!result.isSuccess) {
      return { isSuccess: false, message: result.message }
    }

    return {
      isSuccess: true,
      message: result.message,
      data: result.data
    }
  } catch (error: any) {
    console.error("uploadReceiptsAction error:", error)
    return {
      isSuccess: false,
      message: error?.message || "Failed to upload receipts."
    }
  }
}
