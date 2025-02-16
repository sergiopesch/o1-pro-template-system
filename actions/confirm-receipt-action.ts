/**
 * @file confirm-receipt-action.ts
 * @description
 * Server action for confirming/verifying a receipt. This action updates a receipt's
 * fields (vendor, date, amount, currency, categoryId) and sets its status to 'verified'.
 *
 * Key Features:
 * - Validates user auth via Clerk
 * - Updates receipt fields via updateReceiptAction
 * - Sets status to 'verified'
 *
 * @dependencies
 * - Clerk (auth) for user session
 * - updateReceiptAction from "@/actions/db/receipts-actions"
 */

"use server"

import { updateReceiptAction } from "@/actions/db/receipts-actions"
import type { InsertReceipt } from "@/db/schema/receipts-schema"
import type { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"

/**
 * @function confirmReceiptAction
 * @async
 * @description
 * Updates a specific receipt with new data (vendor, date, amount, currency, categoryId),
 * setting `status='verified'` if provided. Auth check ensures user can only modify
 * their own receipts.
 *
 * @param {string} receiptId - The ID of the receipt
 * @param {Partial<InsertReceipt>} data - The updated fields
 * @returns {Promise<ActionState<any>>}
 */
export async function confirmReceiptAction(
  receiptId: string,
  data: Partial<InsertReceipt>
): Promise<ActionState<any>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "You must be signed in to verify a receipt."
      }
    }

    return await updateReceiptAction(receiptId, data, userId)
  } catch (error: any) {
    console.error("Error in confirmReceiptAction:", error)
    return {
      isSuccess: false,
      message: error?.message || "Failed to confirm receipt."
    }
  }
}
