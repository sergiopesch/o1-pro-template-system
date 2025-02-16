/**
 * @description
 * Server page for listing and filtering receipts. This page:
 *   1) Retrieves query parameters for filtering (merchant, category, verified, start/end dates).
 *   2) Calls `getReceiptsAction` to fetch filtered receipts from the DB.
 *   3) Renders a search form, an export button, and a receipts list to display results.
 *
 * Key features:
 * - "use server" allows us to fetch data securely and parse search parameters on the server.
 * - We pass the receipts plus filter data to client components for rendering and user interaction.
 * - Now includes an "Export CSV" button that redirects to /api/receipts/export with the same filters.
 *
 * @dependencies
 * - `@clerk/nextjs/server` for user auth.
 * - `next/navigation` for reading `searchParams`.
 * - `getReceiptsAction` from `@/actions/db/receipts-actions` for server-side fetching.
 * - `SearchForm`, `ReceiptsList`, `ExportButton` from `./_components`.
 *
 * @notes
 * - If no user is found, we redirect to /login (the parent layout also protects).
 * - We parse date strings and convert them to Date objects to pass to the server action.
 * - The "export CSV" uses the same filters so the user can see the same subset of receipts in the file.
 */

"use server"

import { getReceiptsAction } from "@/actions/db/receipts-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ExportButton } from "./_components/export-button"
import { ReceiptUploader } from "./_components/receipt-uploader"
import { ReceiptsList } from "./_components/receipts-list"
import { SearchForm } from "./_components/search-form"

interface ReceiptsPageProps {
  /**
   * The searchParams object is provided automatically by Next.js.
   * We can parse it in a server component to apply filters.
   */
  searchParams?: Promise<{
    merchant?: string
    category?: string
    verified?: string
    startDate?: string
    endDate?: string
  }>
}

/**
 * The main server page for `/dashboard/receipts`.
 * @param props - Contains optional `searchParams` from the route query.
 */
export default async function ReceiptsPage({
  searchParams
}: ReceiptsPageProps) {
  const { userId } = await auth()
  if (!userId) {
    // In theory, the (dashboard) layout should already redirect if user is not authenticated.
    redirect("/login")
  }

  // Parse filters from query params
  const params = await searchParams
  const {
    merchant = "",
    category = "",
    verified,
    startDate,
    endDate
  } = params || {}

  // Convert verified string to boolean if it exists
  let verifiedFilter: boolean | undefined
  if (verified === "true") {
    verifiedFilter = true
  } else if (verified === "false") {
    verifiedFilter = false
  }

  // Convert start/end date strings to Date objects if present
  let start: Date | undefined
  if (startDate) {
    try {
      const d = new Date(startDate)
      if (!isNaN(d.getTime())) {
        start = d
      }
    } catch {
      // ignore
    }
  }

  let end: Date | undefined
  if (endDate) {
    try {
      const d = new Date(endDate)
      if (!isNaN(d.getTime())) {
        end = d
      }
    } catch {
      // ignore
    }
  }

  // Fetch receipts from the database
  const receiptsResult = await getReceiptsAction(userId, {
    merchant,
    category,
    verified: verifiedFilter,
    startDate: start,
    endDate: end
  })

  const receipts = receiptsResult.isSuccess ? receiptsResult.data : []

  return (
    <div>
      {/* Receipt uploader for new images */}
      <ReceiptUploader />

      {/* Search form for filters */}
      <SearchForm
        initialMerchant={merchant}
        initialCategory={category}
        initialVerified={verified ?? ""}
        initialStartDate={startDate ?? ""}
        initialEndDate={endDate ?? ""}
      />

      {/* Export CSV button with the same filters */}
      <div className="mt-4 flex justify-end">
        <ExportButton
          merchant={merchant}
          category={category}
          verified={verified ?? ""}
          startDate={startDate ?? ""}
          endDate={endDate ?? ""}
        />
      </div>

      {/* Display the filtered receipts */}
      <ReceiptsList receipts={receipts} />
    </div>
  )
}
