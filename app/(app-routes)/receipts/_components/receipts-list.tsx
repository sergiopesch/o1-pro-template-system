/**
 * @file receipts-list.tsx
 * @description
 * This client component renders a list (table) of receipts. It can display
 * basic metadata (vendor, date, amount, currency, status) and offers a
 * minimal filter form for demonstration purposes.
 *
 * Key Features:
 * - Renders data from the server-provided `initialReceipts` prop
 * - Provides a simple filter form (status, date range, category) that updates
 *   the query params in the URL, triggering a server-side refetch
 * - Uses Tailwind classes for styling
 *
 * @dependencies
 * - React, useState/useEffect for client interactivity
 * - Next.js router for manipulating search params (useRouter, useSearchParams)
 * - Shadcn UI components (Button, Input, etc.)
 *
 * @notes
 * - For more robust filtering, you can expand the form or integrate
 *   a client side approach. Currently, it demonstrates a pattern of
 *   modifying the URL's search params to do a server refetch.
 * - Each row displays vendor, date, amount, currency, status, category, etc.
 * - If you have large data sets, consider pagination or infinite scroll.
 */

"use client"

import type { SelectCategory } from "@/db/schema/categories-schema"
import type { SelectReceipt } from "@/db/schema/receipts-schema"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

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

/**
 * @interface ReceiptsListProps
 * @description
 * The shape of the props accepted by this client component. We expect
 * a list of receipts from the server and available categories.
 */
interface ReceiptsListProps {
  initialReceipts: SelectReceipt[]
  categories: SelectCategory[]
}

/**
 * @function ReceiptsList
 * @description
 * Displays a table of receipts. Also includes a simple filter UI:
 * - status: verified or unverified (or "all")
 * - fromDate: e.g. "2023-01-01"
 * - toDate: e.g. "2023-12-31"
 * - categoryId: dropdown to select from available categories
 *
 * When the user updates filters, we push new search params to the URL,
 * triggering a server-side fetch via Next.js 13's server/page pattern.
 */
export default function ReceiptsList({
  initialReceipts,
  categories
}: ReceiptsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State hooks for filtering
  const [status, setStatus] = useState<string>(
    searchParams.get("status") || "all"
  )
  const [fromDate, setFromDate] = useState<string>(
    searchParams.get("fromDate") || ""
  )
  const [toDate, setToDate] = useState<string>(searchParams.get("toDate") || "")
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("categoryId") || "all"
  )

  // Receipts data from the server
  const [receipts, setReceipts] = useState<SelectReceipt[]>(initialReceipts)

  // If props change, update local state
  useEffect(() => {
    setReceipts(initialReceipts)
  }, [initialReceipts])

  /**
   * @function handleFilterSubmit
   * @description
   * Updates the URL's search params to reflect any filter changes. Next.js
   * will then re-load the server component with new data.
   */
  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Build the new search params
    const newParams = new URLSearchParams()
    if (status && status !== "all") {
      newParams.set("status", status)
    }
    if (fromDate) {
      newParams.set("fromDate", fromDate)
    }
    if (toDate) {
      newParams.set("toDate", toDate)
    }
    if (categoryId && categoryId !== "all") {
      newParams.set("categoryId", categoryId)
    }

    const queryString = newParams.toString()
    router.push(`/receipts?${queryString}`)
  }

  /**
   * @function getCategoryName
   * @description
   * Helper function to get a category name from its ID
   */
  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId)?.name || null
  }

  return (
    <div className="p-4">
      {/* Filter Form */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        {/* Status filter */}
        <div className="flex flex-col">
          <Label>Status</Label>
          <Select value={status} onValueChange={val => setStatus(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* From Date */}
        <div className="flex flex-col">
          <Label>From Date</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col">
          <Label>To Date</Label>
          <Input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={val => setCategoryId(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          <Button type="submit">Apply Filters</Button>
        </div>
      </form>

      {/* Receipts Table */}
      {receipts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No receipts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-2 text-left">Vendor</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2 text-left">Currency</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.vendor || <em>Unknown</em>}</td>
                  <td className="p-2">
                    {r.date ? (
                      new Date(r.date).toLocaleDateString()
                    ) : (
                      <em>N/A</em>
                    )}
                  </td>
                  <td className="p-2">
                    {r.amount !== null ? Number(r.amount).toFixed(2) : "0.00"}
                  </td>
                  <td className="p-2">{r.currency}</td>
                  <td className="p-2">
                    {getCategoryName(r.categoryId) || <em>None</em>}
                  </td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
