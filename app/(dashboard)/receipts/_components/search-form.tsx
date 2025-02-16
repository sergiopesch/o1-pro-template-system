/**
 * @description
 * A client component that renders a filter form for searching receipts by:
 *   - Merchant name (partial match)
 *   - Category (partial match)
 *   - Verified status (true/false or unset)
 *   - Start date
 *   - End date
 *
 * Key features:
 * - Uses Next.js's `useRouter` and `useSearchParams` from "next/navigation" to manipulate the URL query.
 * - On form submit, we push a new query string, causing the server page to re-run and apply filters.
 * - Input validation (like date parsing) is minimal; the server re-parses to ensure correctness.
 *
 * @dependencies
 * - React & "use client" for interactive form.
 * - `useRouter`, `useSearchParams` from "next/navigation" for updating the route.
 * - Shadcn UI input components (optional).
 *
 * @notes
 * - This approach triggers a full server-side re-fetch. For more advanced usage, consider a React Query or similar approach.
 * - We do not store local state for the form because we just read from initial props, then push new URL.
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
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

interface SearchFormProps {
  /**
   * Initial string for the merchant filter from the query params (if any).
   */
  initialMerchant: string

  /**
   * Initial string for the category filter from the query params (if any).
   */
  initialCategory: string

  /**
   * Initial string for verification status filter: "true" | "false" | "" (means no filter).
   */
  initialVerified: string

  /**
   * Initial start date string (YYYY-MM-DD) from the query params (if any).
   */
  initialStartDate: string

  /**
   * Initial end date string (YYYY-MM-DD) from the query params (if any).
   */
  initialEndDate: string
}

/**
 * Client-side search form for receipts. On submit, updates the URL with query parameters for filtering.
 * The server page will read them in `searchParams` and call `getReceiptsAction`.
 */
export function SearchForm({
  initialMerchant,
  initialCategory,
  initialVerified,
  initialStartDate,
  initialEndDate
}: SearchFormProps) {
  const router = useRouter()

  const [merchant, setMerchant] = useState(initialMerchant)
  const [category, setCategory] = useState(initialCategory)
  const [verified, setVerified] = useState(initialVerified || "all")
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  /**
   * Handle form submission by constructing the query string and pushing it to the router.
   */
  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // Construct query parameters
      const params = new URLSearchParams()

      if (merchant.trim() !== "") {
        params.set("merchant", merchant.trim())
      }
      if (category.trim() !== "") {
        params.set("category", category.trim())
      }
      if (verified === "true" || verified === "false") {
        params.set("verified", verified)
      }
      if (startDate.trim() !== "") {
        params.set("startDate", startDate.trim())
      }
      if (endDate.trim() !== "") {
        params.set("endDate", endDate.trim())
      }

      // Build final URL: /dashboard/receipts?params...
      const url = `/dashboard/receipts${params.toString() ? `?${params}` : ""}`

      // Navigate to the new URL, triggering a server refresh
      router.push(url)
    },
    [merchant, category, verified, startDate, endDate, router]
  )

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-6 rounded-md border p-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* MERCHANT */}
        <div>
          <Label htmlFor="merchant">Merchant</Label>
          <Input
            id="merchant"
            placeholder="e.g. Starbucks"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
          />
        </div>

        {/* CATEGORY */}
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="e.g. Travel"
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
        </div>

        {/* VERIFIED */}
        <div>
          <Label htmlFor="verified">Verified</Label>
          <Select
            value={verified}
            onValueChange={val => {
              setVerified(val)
            }}
          >
            <SelectTrigger id="verified">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DATES */}
        <div className="flex flex-col gap-2 md:col-span-1">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit">Search</Button>
      </div>
    </form>
  )
}
