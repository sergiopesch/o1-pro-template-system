/**
 * @description
 * Demonstration of using GPT-4o with image inputs and structured outputs to extract receipt information.
 *
 * This file has two exports:
 * 1) `extractReceiptWithStructuredOutput(imageUrl: string, userPrompt?: string)`: Low-level function
 *    that calls GPT-4 with a public or signed image URL and tries to parse out { merchant, date, amount }.
 *    Returns the extracted data or null if failed/refused.
 *
 * 2) `extractReceiptDataAction(path: string)`: A server action that:
 *    - Generates a short-lived signed URL for the path in Supabase storage
 *    - Calls `extractReceiptWithStructuredOutput(...)`
 *    - Returns an ActionState with the final extraction result
 *
 * @dependencies
 * - `openai` + `openai/helpers/zod` for GPT-4 structured outputs
 * - `zod` for defining the structured extraction schema
 * - `@supabase/auth-helpers-nextjs` to create a Supabase client for signed URL generation
 * - `ActionState` from `@/types`
 *
 * @notes
 * - If the model refuses to parse or returns incomplete data, we handle that by returning null from the
 *   low-level function. The server action wraps that in an ActionState response.
 * - You can adjust the signed URL TTL, error handling, and fallback as needed.
 */

"use server"

import { ActionState } from "@/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { OpenAI } from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"

// 1. Create the Zod schema for the structured output.
const ReceiptExtractionSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  amount: z.string()
})

// 2. Instantiate the OpenAI client (GPT-4o).
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * @interface ExtractedReceiptData
 * Maps exactly to our Zod schema's shape for convenience in TypeScript.
 */
export interface ExtractedReceiptData {
  merchant: string
  date: string
  amount: string
}

/**
 * Low-level function that directly calls GPT-4o with an image URL, expecting to parse:
 * { merchant, date, amount }
 *
 * @param imageUrl {string} - The publicly accessible or signed URL for the receipt image.
 * @param userPrompt {string} - Optional instructions to the model.
 * @returns {Promise<ExtractedReceiptData | null>}
 */
export async function extractReceiptWithStructuredOutput(
  imageUrl: string,
  userPrompt = "Please extract the merchant, date, and amount from this receipt."
): Promise<ExtractedReceiptData | null> {
  try {
    // Prepare messages containing text + an image reference
    const messages = [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userPrompt },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl,
              detail: "auto" as const
            }
          }
        ]
      }
    ]

    // Use gpt-4-vision-preview or whichever model is appropriate:
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages,
      response_format: zodResponseFormat(
        ReceiptExtractionSchema,
        "receiptExtraction"
      )
    })

    const parsedResult = completion.choices[0].message

    // If the model refused
    if (parsedResult.refusal) {
      console.log("Model refused the request:", parsedResult.refusal)
      return null
    }

    // Otherwise we have a valid object
    const data = parsedResult.parsed
    console.log("Extraction success:", data)

    return data
  } catch (error) {
    console.error("Error extracting structured receipt data:", error)
    return null
  }
}

/**
 * Server action that:
 * 1) Generates a short-lived signed URL for the stored file in Supabase (if private bucket)
 * 2) Calls `extractReceiptWithStructuredOutput(...)` to parse merchant/date/amount
 * 3) Returns an ActionState with success/failure
 *
 * @param path {string} - The Supabase storage path for the file (e.g. "userId/uuid.png").
 * @returns {Promise<ActionState<ExtractedReceiptData>>}
 *
 * @notes
 * - If your bucket is public, you may skip signed URLs and simply prepend the public base URL.
 * - If extraction fails, the data is null and we return isSuccess=false.
 */
export async function extractReceiptDataAction(
  path: string
): Promise<ActionState<ExtractedReceiptData>> {
  try {
    const supabase = createClientComponentClient()

    const bucket = process.env.SUPABASE_BUCKET_RECEIPTS
    if (!bucket) {
      throw new Error("SUPABASE_BUCKET_RECEIPTS is not set in env.")
    }

    // Generate a short-lived signed URL for the file so GPT can see it
    // We request a 5-minute (300 second) link
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 300)

    if (urlError || !urlData?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${urlError?.message}`)
    }

    // Now we pass the signed URL to GPT-4
    const result = await extractReceiptWithStructuredOutput(urlData.signedUrl)
    if (!result) {
      return {
        isSuccess: false,
        message: "AI extraction returned null or refused."
      }
    }

    return {
      isSuccess: true,
      message: "Receipt data extracted successfully",
      data: result
    }
  } catch (error) {
    console.error("Error in extractReceiptDataAction:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error in extractReceiptDataAction"
    }
  }
}
