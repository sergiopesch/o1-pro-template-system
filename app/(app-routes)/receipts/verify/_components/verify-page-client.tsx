/**
 * @file verify-page-client.tsx
 * @description
 * Client component for listing unverified receipts and enabling verification.
 * Now includes a `categories` prop to allow the user to pick a category for each receipt.
 *
 * Key Features:
 * - Displays unverified receipts using <VerifyReceipt>.
 * - Each receipt can be edited for vendor, date, amount, currency, and category.
 * - Once confirmed, calls the server action to update the DB.
 *
 * @dependencies
 * - React for state management
 * - Shadcn UI components for styling
 */

"use client"

import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"

import type { SelectCategory } from "@/db/schema/categories-schema"
import type { SelectReceipt } from "@/db/schema/receipts-schema"
import type { ActionState } from "@/types"
import VerifyReceipt from "./verify-receipt"

interface VerifyPageClientProps {
  /**
   * @property {SelectReceipt[]} unverifiedReceipts
   * All unverified receipts to be displayed.
   */
  unverifiedReceipts: SelectReceipt[]

  /**
   * @property {Function} confirmReceiptAction
   * Server action to confirm a single receipt.
   */
  confirmReceiptAction: (
    receiptId: string,
    data: Partial<SelectReceipt>
  ) => Promise<ActionState<any>>

  /**
   * @property {SelectCategory[]} categories
   * The user's available categories to choose from for each receipt.
   */
  categories: SelectCategory[]
}

/**
 * @function VerifyPageClient
 * @description
 * Manages unverified receipts in a list. Passes categories to each <VerifyReceipt>,
 * so users can assign a category. On confirm, the server action is invoked.
 */
export default function VerifyPageClient({
  unverifiedReceipts,
  confirmReceiptAction,
  categories
}: VerifyPageClientProps) {
  const [receipts, setReceipts] = useState<SelectReceipt[]>(unverifiedReceipts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  /**
   * @function handleConfirm
   * Invoked by each child <VerifyReceipt>. Calls the confirmReceiptAction server action
   * to update the DB. If successful, remove the verified receipt from local state.
   */
  function handleConfirm(
    receiptId: string,
    updatedFields: Partial<SelectReceipt>
  ) {
    startTransition(async () => {
      setErrorMessage(null)
      const res = await confirmReceiptAction(receiptId, updatedFields)
      if (!res.isSuccess) {
        setErrorMessage(res.message)
        return
      }
      // Remove from local list if verified
      setReceipts(prev => prev.filter(r => r.id !== receiptId))
    })
  }

  /**
   * @function handleSkip
   * For demonstration, we remove the receipt from the UI but do not verify it.
   * A real app might let you do partial updates or store a "skipped" status.
   */
  function handleSkip(receiptId: string) {
    setReceipts(prev => prev.filter(r => r.id !== receiptId))
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Verify Receipts</h1>

      {errorMessage && (
        <div className="mb-4 text-red-600">Error: {errorMessage}</div>
      )}

      {receipts.length === 0 && !isPending && (
        <div className="text-muted-foreground text-sm">
          No unverified receipts left!
        </div>
      )}

      <div className="flex flex-col gap-6">
        {receipts.map(receipt => (
          <div key={receipt.id} className="rounded-md border p-4 shadow-sm">
            <VerifyReceipt
              receipt={receipt}
              categories={categories}
              onConfirm={handleConfirm}
              onSkip={handleSkip}
              isPending={isPending}
            />
          </div>
        ))}
      </div>

      {isPending && (
        <div className="text-muted-foreground mt-4 text-sm">
          Processing changes...
        </div>
      )}

      <div className="mt-8">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </div>
  )
}
