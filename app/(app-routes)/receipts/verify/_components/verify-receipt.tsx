/**
 * @file verify-receipt.tsx
 * @description
 * A client component for verifying a single unverified receipt. We added a category
 * dropdown so the user can assign a category from the fetched list. On "Confirm,"
 * we pass the chosen categoryId (along with vendor/date/amount/currency) to the
 * parent's onConfirm callback.
 *
 * Key Features:
 * - Image preview on the left
 * - Editable form on the right
 * - Category dropdown (using Shadcn UI <Select>)
 * - Confirm and Skip actions
 *
 * @dependencies
 * - React: local state
 * - Shadcn UI components: Button, Input, Label, Select
 */

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useState } from "react"

import type { SelectCategory } from "@/db/schema/categories-schema"
import type { SelectReceipt } from "@/db/schema/receipts-schema"

interface VerifyReceiptProps {
  /**
   * @property {SelectReceipt} receipt
   * The unverified receipt object containing details like vendor, date, etc.
   */
  receipt: SelectReceipt

  /**
   * @property {SelectCategory[]} categories
   * A list of user-defined categories to choose from.
   */
  categories: SelectCategory[]

  /**
   * @function onConfirm
   * Callback to confirm the receipt with updated fields (including category).
   *
   * @param {string} receiptId - The ID of the receipt to confirm
   * @param {Partial<SelectReceipt>} updatedFields - The updated fields
   */
  onConfirm: (receiptId: string, updatedFields: Partial<SelectReceipt>) => void

  /**
   * @function onSkip
   * Callback to skip verifying this receipt (optional).
   */
  onSkip: (receiptId: string) => void

  /**
   * @property {boolean} isPending
   * Indicates if a server action is in progress (disables form).
   */
  isPending: boolean
}

/**
 * @function VerifyReceipt
 * @description
 * Displays a single unverified receipt side-by-side with a form. The form includes:
 * vendor, date, amount, currency, and now a category dropdown. On "Confirm," we call
 * onConfirm with the updated fields.
 */
export default function VerifyReceipt({
  receipt,
  categories,
  onConfirm,
  onSkip,
  isPending
}: VerifyReceiptProps) {
  const [vendor, setVendor] = useState<string>(receipt.vendor || "")
  const [date, setDate] = useState<string>(() => {
    if (receipt.date) {
      // Convert to YYYY-MM-DD for form usage
      return new Date(receipt.date).toISOString().slice(0, 10)
    }
    return ""
  })
  const [amount, setAmount] = useState<string>(() => {
    if (receipt.amount != null) {
      return Number(receipt.amount).toFixed(2)
    }
    return ""
  })
  const [currency, setCurrency] = useState<string>(receipt.currency || "USD")

  // Store the selected category ID; if receipt.categoryId exists, use that as default
  const [categoryId, setCategoryId] = useState<string | undefined>(
    receipt.categoryId || undefined
  )

  /**
   * @function handleConfirm
   * Called when the user clicks "Confirm." Gathers all field states and
   * passes them to onConfirm. Sets `status=verified`.
   */
  function handleConfirm() {
    onConfirm(receipt.id, {
      vendor: vendor || null,
      date: date || null,
      amount: amount || null,
      currency,
      categoryId: categoryId || null,
      status: "verified"
    })
  }

  /**
   * @function handleSkip
   * Called when user clicks "Skip."
   */
  function handleSkip() {
    onSkip(receipt.id)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* Left: Receipt image */}
      <div className="sm:w-1/2">
        <img
          src={receipt.imageUrl}
          alt="Receipt"
          className="h-auto w-full max-w-md rounded-md border"
        />
      </div>

      {/* Right: Form inputs */}
      <div className="flex flex-col gap-2 sm:w-1/2">
        <div>
          <Label className="mb-1 block">Vendor</Label>
          <Input
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            disabled={isPending}
            placeholder="e.g. Starbucks"
          />
        </div>

        <div>
          <Label className="mb-1 block">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <Label className="mb-1 block">Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={isPending}
            placeholder="e.g. 4.99"
          />
        </div>

        <div>
          <Label className="mb-1 block">Currency</Label>
          <Input
            value={currency}
            onChange={e => setCurrency(e.target.value.toUpperCase())}
            disabled={isPending}
            placeholder="USD"
          />
        </div>

        <div>
          <Label className="mb-1 block">Category</Label>
          <Select
            value={categoryId || ""}
            onValueChange={val => setCategoryId(val)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <SelectItem value="">No categories available</SelectItem>
              ) : (
                categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={handleConfirm} disabled={isPending}>
            Confirm
          </Button>
          <Button variant="outline" onClick={handleSkip} disabled={isPending}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}
