/**
 * @description
 * API route that receives a receipt image via multipart/form-data, validates the user, and
 * calls the `createReceiptAction` to perform the actual upload + AI extraction + DB insert.
 * Returns JSON with the ActionState shape ({ isSuccess, message, data? }).
 *
 * Key Features:
 * 1. Uses "use server" to run server-side logic with Clerk's `auth()`.
 * 2. Accepts a `POST` request with an attached file in FormData under the key "file".
 * 3. Reconstructs a standard `File` object from the uploaded Blob so `createReceiptAction`
 *    can handle it as intended.
 * 4. Returns a JSON response with isSuccess, message, and optionally data.
 *
 * @dependencies
 * - createReceiptAction from "@/actions/db/receipts-actions"
 * - Clerk's auth() from "@clerk/nextjs/server"
 * - NextResponse for generating API responses
 *
 * @notes
 * - Validates user ID existence; unauthorized if no user.
 * - If the file is missing or invalid, returns an error response.
 * - createReceiptAction itself handles server-side validations (file type, size, AI calls).
 * - On success, returns 200 status with { isSuccess: true, ... } shape.
 *
 * @limitations
 * - Only handles single-file upload with key "file".
 * - Strictly expects image/png or image/jpeg (like in the rest of the code).
 */

import { createReceiptAction } from "@/actions/db/receipts-actions"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs" // Ensures we can handle file ops

export async function POST(req: Request) {
  try {
    // 1. Ensure user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          isSuccess: false,
          message: "User is not authenticated."
        },
        { status: 401 }
      )
    }

    // 2. Extract the file from the FormData
    const formData = await req.formData()
    const blob = formData.get("file")

    if (!blob || typeof blob === "string") {
      console.error("Upload error: No file or invalid file in FormData")
      return NextResponse.json(
        { isSuccess: false, message: "No file was uploaded." },
        { status: 400 }
      )
    }

    // Validate file type
    const typedBlob = blob as Blob
    if (!["image/jpeg", "image/png"].includes(typedBlob.type)) {
      console.error(`Upload error: Invalid file type ${typedBlob.type}`)
      return NextResponse.json(
        {
          isSuccess: false,
          message: "Only JPEG and PNG files are allowed."
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (typedBlob.size > MAX_SIZE) {
      console.error(`Upload error: File too large ${typedBlob.size} bytes`)
      return NextResponse.json(
        {
          isSuccess: false,
          message: "File size exceeds 10MB limit."
        },
        { status: 400 }
      )
    }

    // 3. Convert the Blob to a File
    const fileName = `receipt-${Date.now()}`
    const arrayBuffer = await typedBlob.arrayBuffer()
    const file = new File([arrayBuffer], fileName, { type: typedBlob.type })

    console.log("Processing upload for user:", userId, "filename:", fileName)

    // 4. Call our existing server action to handle the entire flow
    const result = await createReceiptAction(file, userId)

    // Return the result as JSON
    if (!result.isSuccess) {
      console.error("Upload error from createReceiptAction:", result.message)
      return NextResponse.json(
        {
          isSuccess: false,
          message: result.message
        },
        { status: 400 }
      )
    }

    console.log("Upload success for user:", userId, "filename:", fileName)

    // If success, respond with the new receipt data
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error in /api/receipts/upload route:", error)
    return NextResponse.json(
      {
        isSuccess: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error occurred in upload route"
      },
      { status: 500 }
    )
  }
}
