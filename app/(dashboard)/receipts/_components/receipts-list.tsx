/**
 * @description
 * Client component that displays a list (or table) of receipts. It receives
 * the pre-fetched, filtered receipts as props from the server page, but also
 * allows the user to delete receipts.
 *
 * Key features:
 * - Stores receipts in local state so the UI can immediately reflect deleted items.
 * - Displays columns for merchant, category, date, amount, verification status.
 * - Adds a new Actions column with a "Delete" button.
 * - Confirm deletion, calls a server action to remove the receipt from both
 *   storage and the DB.
 *
 * @dependencies
 * - React for rendering the table and managing local state.
 * - `SelectReceipt` from `@/db/schema/receipts-schema` type to define data shape.
 * - Shadcn `Table` UI for rendering (table-based layout).
 * - `deleteReceiptWithOwnershipCheckAction` from `@/actions/db/receipts-actions` for deletion.
 * - `useToast` for success/error messages to the user.
 *
 * @notes
 * - If no receipts, shows a "No receipts found" message.
 * - On delete success, we remove it locally from `localReceipts`.
 * - This ensures that the user sees immediate feedback without needing a full page refresh.
 */

"use client"

import { deleteReceiptWithOwnershipCheckAction } from "@/actions/db/receipts-actions"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { SelectReceipt } from "@/db/schema/receipts-schema"
import { toast } from "@/lib/hooks/use-toast"
import { useState } from "react"

interface ReceiptsListProps {
  /**
   * The array of receipts to display. This is passed from the server component
   * after fetching from the database.
   */
  receipts: SelectReceipt[]
}

/**
 * Renders a table of receipts or an empty state if none are present.
 * Also provides a Delete action in the last column.
 */
export function ReceiptsList({ receipts }: ReceiptsListProps) {
  // Store in local state so we can remove items if the user deletes them
  const [localReceipts, setLocalReceipts] = useState<SelectReceipt[]>(receipts)

  /**
   * Confirms user wants to delete the receipt, calls the server action to remove
   * the item from storage + DB, then removes from local state if successful.
   *
   * @param id {string} - The receipt ID to delete
   */
  async function handleDelete(id: string) {
    const ok = window.confirm(
      "Are you sure you want to permanently delete this receipt?"
    )
    if (!ok) return

    try {
      const result = await deleteReceiptWithOwnershipCheckAction(id)
      if (!result.isSuccess) {
        toast({
          title: "Error deleting receipt",
          description: result.message,
          variant: "destructive"
        })
        return
      }

      // If successful, remove from local state
      toast({
        title: "Receipt deleted",
        description: "The receipt was removed successfully."
      })
      setLocalReceipts(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error deleting receipt:", error)
      toast({
        title: "Error deleting receipt",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    }
  }

  // If no receipts, render empty state
  if (!localReceipts || localReceipts.length === 0) {
    return (
      <div className="mt-8 rounded-md border p-4 text-center">
        <p className="text-muted-foreground">No receipts found.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {localReceipts.map(receipt => {
            const dateString = receipt.date
              ? new Date(receipt.date).toLocaleDateString()
              : ""

            const amountString = receipt.amount
              ? `$${Number(receipt.amount).toFixed(2)}`
              : "—"

            return (
              <TableRow key={receipt.id}>
                <TableCell>{receipt.merchant || "—"}</TableCell>
                <TableCell>{receipt.category || "—"}</TableCell>
                <TableCell>{dateString || "—"}</TableCell>
                <TableCell>{amountString || "—"}</TableCell>
                <TableCell>
                  {receipt.verified ? (
                    <span className="font-medium text-green-600">Yes</span>
                  ) : (
                    <span className="font-medium text-red-600">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(receipt.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
