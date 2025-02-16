/**
 * @description
 * This file defines server actions for uploading and deleting receipt image files in Supabase Storage.
 * It is responsible for:
 *   - Validating file size and type.
 *   - Uploading images to the configured Supabase bucket.
 *   - Deleting images from the Supabase bucket.
 *
 * Key features:
 * - `uploadReceiptFileStorage`: Validates and uploads an image file to Supabase Storage.
 * - `deleteReceiptFileStorage`: Deletes a file from Supabase Storage.
 *
 * @dependencies
 * - `@supabase/auth-helpers-nextjs` for interacting with Supabase.
 * - `@/types` for the ActionState interface.
 *
 * @notes
 * - Ensures only files up to 10MB are uploaded.
 * - Only `image/png` or `image/jpeg` are allowed for receipt images.
 * - Relies on the `SUPABASE_BUCKET_RECEIPTS` env variable to know which bucket to use.
 * - Will throw an error if any operation fails, returning an `isSuccess: false` in the `ActionState`.
 */

"use server"

import { ActionState } from "@/types"
import { createClient } from "@supabase/supabase-js"

// Acceptable file types for receipts
const ALLOWED_TYPES = ["image/png", "image/jpeg"]
// 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Uploads a receipt file to Supabase Storage after validating its size and type.
 *
 * @param {string} bucket - The Supabase bucket name (from .env).
 * @param {string} path - The full path (including folders and filename) where the file should be saved.
 * @param {File} file - The file object to be uploaded.
 *
 * @returns {Promise<ActionState<{ path: string }>>} - An ActionState object indicating success or failure, with the uploaded path if successful.
 *
 * @throws {Error} - Throws if file validation fails or if Supabase upload encounters an error.
 */
export async function uploadReceiptFileStorage(
  bucket: string,
  path: string,
  file: File
): Promise<ActionState<{ path: string }>> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 10MB limit.")
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only PNG and JPEG images are allowed."
      )
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: false, // set to false to avoid overwriting existing files
        contentType: file.type
      })

    if (error) {
      throw error
    }

    return {
      isSuccess: true,
      message: "File uploaded successfully.",
      data: { path: data.path }
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to upload file"
    }
  }
}

/**
 * Deletes a receipt file from Supabase Storage given a bucket and path.
 *
 * @param {string} bucket - The Supabase bucket name (from .env).
 * @param {string} path - The full path (including folders and filename) where the file is located.
 *
 * @returns {Promise<ActionState<void>>} - An ActionState object indicating success or failure.
 *
 * @throws {Error} - Throws if the delete operation encounters an error.
 */
export async function deleteReceiptFileStorage(
  bucket: string,
  path: string
): Promise<ActionState<void>> {
  try {
    // Attempt to remove the file
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
      throw error
    }

    return {
      isSuccess: true,
      message: "File deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to delete file"
    }
  }
}
