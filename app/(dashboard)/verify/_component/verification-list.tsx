/**
 * @description
 * A client component that displays unverified receipts, lets the user edit them,
 * and calls a server action (`verifyAndUpdateReceiptAction`) directly to mark them verified.
 *
 * Responsibilities:
 * - Holds local state for unverified receipts.
 * - Renders each receipt with inputs for merchant, date, amount, category, etc.
 * - On button click, calls the server action to update (including verifying).
 *
 * Key features:
 * - Next.js 13+ "use client" with direct server action import from `@/actions/db/receipts-actions`.
 * - No separate API route needed; the server action handles auth & ownership.
 * - Removes the verified receipt from local state on success.
 *
 * @dependencies
 * - React "use client"
 * - Shadcn UI components (Input, Button, Table)
 * - `verifyAndUpdateReceiptAction` from "@/actions/db/receipts-actions"
 *
 * @notes
 * - Minimally validated fields. The server side also checks for valid data & ownership.
 * - If you want to keep the row visible after verifying, you can skip removing it from local state.
 */

"use client"

import { verifyAndUpdateReceiptAction } from "@/actions/db/receipts-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface VerificationListProps {
  initialReceipts: SelectReceipt[]
}

/**
 * Client component for verifying and editing receipts in a table.
 * Calls a server action to perform the update & verification.
 */
export default function VerificationList({
  initialReceipts
}: VerificationListProps) {
  const [receipts, setReceipts] = useState<SelectReceipt[]>(initialReceipts)

  const handleChange = (
    id: string,
    field: keyof SelectReceipt,
    value: string
  ) => {
    setReceipts(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  /**
   * Called when the user clicks "Verify" on a receipt row.
   * We pass the updated fields plus `verified = true` to the server action.
   */
  const handleVerify = async (receipt: SelectReceipt) => {
    try {
      // Format the date properly if it exists
      let formattedDate = undefined
      if (receipt.date) {
        try {
          const date = new Date(receipt.date)
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString()
          }
        } catch (error) {
          console.error("Error formatting date:", error)
          toast({
            title: "Error verifying receipt",
            description: "Invalid date format",
            variant: "destructive"
          })
          return
        }
      }

      const payload = {
        id: receipt.id,
        merchant: receipt.merchant || "",
        date: formattedDate,
        amount: receipt.amount ? String(receipt.amount) : "",
        category: receipt.category || "",
        verified: true
      }

      const result = await verifyAndUpdateReceiptAction(payload)
      if (!result.isSuccess) {
        toast({
          title: "Error verifying receipt",
          description: result.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Receipt verified",
        description: `Receipt for ${receipt.merchant} marked as verified.`
      })

      // Remove it from local state so it's no longer shown
      setReceipts(prev => prev.filter(r => r.id !== receipt.id))
    } catch (error) {
      console.error("Error verifying receipt:", error)
      toast({
        title: "Error verifying receipt",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded border p-4">
        <p className="text-muted-foreground">No unverified receipts left.</p>
      </div>
    )
  }

  return (
    <div className="rounded border p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map(r => {
            // For date display, if it's a string, we slice the first 10 chars (YYYY-MM-DD)
            const dateString = r.date
              ? new Date(r.date).toISOString().slice(0, 10)
              : ""
            const amountString = r.amount ? String(r.amount) : ""

            return (
              <TableRow key={r.id}>
                {/* Merchant input */}
                <TableCell>
                  <Input
                    value={r.merchant || ""}
                    onChange={e =>
                      handleChange(r.id, "merchant", e.target.value)
                    }
                  />
                </TableCell>

                {/* Category input */}
                <TableCell>
                  <Input
                    value={r.category || ""}
                    onChange={e =>
                      handleChange(r.id, "category", e.target.value)
                    }
                  />
                </TableCell>

                {/* Date input */}
                <TableCell>
                  <Input
                    type="date"
                    value={dateString}
                    onChange={e => handleChange(r.id, "date", e.target.value)}
                  />
                </TableCell>

                {/* Amount input */}
                <TableCell>
                  <Input
                    value={amountString}
                    onChange={e => handleChange(r.id, "amount", e.target.value)}
                  />
                </TableCell>

                {/* Action */}
                <TableCell>
                  <Button onClick={() => handleVerify(r)}>Verify</Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
