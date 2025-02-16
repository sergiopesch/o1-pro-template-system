/**
 * @description
 * Provides a button to export the currently filtered receipts as a CSV file.
 *
 * Responsibilities:
 * - Accept the same filters that are applied in the receipts listing (merchant, category, verified, etc.).
 * - Build a query string that matches those filters.
 * - Use `window.location.href` to cause a file download from `GET /api/receipts/export`.
 *
 * Key features:
 * - "use client" for interactive onClick logic
 * - Minimally validated query param building
 * - Re-uses the same search param values so we get a consistent export
 *
 * @dependencies
 * - React
 * - No direct server action usage (we do a client-side redirect to an API route).
 *
 * @notes
 * - The user must be authenticated (the parent layout ensures that).
 * - We do not parse or validate user input beyond basic string checks.
 */

"use client"

import { Button } from "@/components/ui/button"
import React from "react"

interface ExportButtonProps {
  merchant?: string
  category?: string
  verified?: string
  startDate?: string
  endDate?: string
}

/**
 * A client component that builds a query string from the provided props and redirects
 * to /api/receipts/export when clicked, prompting a CSV download.
 */
export function ExportButton({
  merchant = "",
  category = "",
  verified = "",
  startDate = "",
  endDate = ""
}: ExportButtonProps) {
  /**
   * When clicked, we build the query string and set window.location.href
   * to the /api/receipts/export endpoint, which returns a CSV download.
   */
  const handleExport = React.useCallback(() => {
    const params = new URLSearchParams()

    if (merchant.trim()) {
      params.set("merchant", merchant.trim())
    }
    if (category.trim()) {
      params.set("category", category.trim())
    }
    if (verified === "true" || verified === "false") {
      params.set("verified", verified)
    }
    if (startDate.trim()) {
      params.set("startDate", startDate.trim())
    }
    if (endDate.trim()) {
      params.set("endDate", endDate.trim())
    }

    const query = params.toString()
    const exportUrl = `/api/receipts/export${query ? `?${query}` : ""}`
    window.location.href = exportUrl
  }, [merchant, category, verified, startDate, endDate])

  return (
    <Button onClick={handleExport} variant="outline">
      Export CSV
    </Button>
  )
}
