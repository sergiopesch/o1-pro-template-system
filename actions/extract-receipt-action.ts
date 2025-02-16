/**
 * @file extract-receipt-action.ts
 * @description
 * This file contains the server action responsible for extracting structured receipt data
 * (such as date, amount, vendor, and currency) from an image URL using OpenAI GPT-4o (vision-capable).
 * It demonstrates how to make a real structured output call by leveraging OpenAI's Zod-based
 * response format parsing.
 *
 * Key features:
 * - Action name: `extractReceiptDataAction`.
 * - Accepts a single `imageUrl` string, which should be a publicly accessible URL (or a base64-encoded URL).
 * - Returns a Promise resolving to an ActionState object containing the extracted data or an error.
 * - Uses OpenAI's `openai.beta.chat.completions.parse` with a zod-based schema to enforce structured outputs.
 *
 * @dependencies
 * - openai (npm package): The official OpenAI Node.js library.
 * - zod: Schema validation library to parse and validate the AI's response.
 * - zodResponseFormat: An OpenAI helper function to interpret the AI response with Zod.
 * - ActionState from "@/types" for strong typing of return values.
 *
 * @notes
 * - You must install the OpenAI library (npm install openai) and configure your OPENAI_API_KEY in your env.
 * - This implementation uses the Beta `chat.completions.parse` method which is subject to change.
 * - The model name used here is "gpt-4o"; adjust as required (e.g., "gpt-4o-mini").
 * - Ensure the environment variable `OPENAI_API_KEY` is set in your `.env.local` to authenticate.
 * - If you want a fallback currency, this code sets the schema to "USD" by default if the AI doesn't provide one.
 */

"use server"

import { ActionState } from "@/types"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"

/**
 * @interface ExtractedReceiptData
 * @description Represents the structured data extracted from a receipt image.
 */
export interface ExtractedReceiptData {
  /**
   * @property {string | null} vendor
   * The name of the vendor or merchant, if identifiable.
   */
  vendor: string | null

  /**
   * @property {string | null} date
   * The date string in ISO (YYYY-MM-DD) format if parsed from the receipt; otherwise null.
   */
  date: string | null

  /**
   * @property {number | null} amount
   * The numeric total amount parsed from the receipt, or null if not found or not parsed.
   */
  amount: number | null

  /**
   * @property {string} currency
   * The extracted currency code or a default fallback (e.g., "USD").
   */
  currency: string
}

// ---------------------------------
// Zod Schema for AI response parsing
// ---------------------------------
const receiptDataSchema = z.object({
  vendor: z.string().nullable(),
  date: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string()
})

/**
 * Initialize the OpenAI client.
 * Ensure `process.env.OPENAI_API_KEY` is set in your environment variables.
 */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * @function extractReceiptDataAction
 * @async
 * @description
 * Server action that calls GPT-4o (vision-capable) with an image URL. The model
 * extracts structured data — vendor, date, amount, currency — and returns them
 * in a structured format validated by Zod.
 *
 * @param {string} imageUrl - The full, public or base64 URL to the receipt image.
 * @returns {Promise<ActionState<ExtractedReceiptData>>}
 *   An ActionState object containing either the extracted fields or an error.
 *
 * @example
 * const result = await extractReceiptDataAction("https://example.com/receipt.jpg")
 * if (result.isSuccess) {
 *   console.log("Vendor:", result.data.vendor)
 *   console.log("Date:", result.data.date)
 *   console.log("Amount:", result.data.amount)
 *   console.log("Currency:", result.data.currency)
 * }
 *
 * @notes
 * - This uses the Beta `chat.completions.parse` feature for structured outputs.
 * - Additional messages (system, user) are used to instruct the model to extract
 *   the desired fields from the image.
 * - Catch and handle any errors from the AI call or from the Zod parsing.
 * - The currency field defaults to "USD" if not specified by the model's response.
 *
 * @throws
 * This action returns an ActionState. If there's any failure, it logs and returns
 * an object with `{ isSuccess: false }`.
 */
export async function extractReceiptDataAction(
  imageUrl: string
): Promise<ActionState<ExtractedReceiptData>> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      // Adjust to your vision-capable model, e.g. "gpt-4o", "gpt-4o-mini", etc.
      model: "gpt-4o",
      // The model receives an array of messages with "type: text" or "type: image_url"
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that extracts structured receipt data from images. If currency is not found, use USD."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract the vendor name, date (YYYY-MM-DD), total amount, and currency from this receipt image. If currency is not visible, use USD."
            },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      // We instruct the AI to respond in a Zod-validated structure
      response_format: zodResponseFormat(receiptDataSchema, "receipt_data")
    })

    // `completion.choices[0].message.parsed` holds the Zod-validated object
    const extractedData = completion.choices[0].message.parsed

    if (!extractedData) {
      throw new Error("No data extracted from the receipt image")
    }

    return {
      isSuccess: true,
      message: "Receipt data extracted successfully",
      data: extractedData
    }
  } catch (error: any) {
    console.error("Error extracting receipt data via GPT-4o:", error)
    return {
      isSuccess: false,
      message: error?.message || "Failed to extract receipt data"
    }
  }
}
