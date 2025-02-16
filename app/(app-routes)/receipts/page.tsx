/**
 * @file page.tsx
 * @description
 * This server page displays a list of receipts for the current user.
 * By default, it shows only "verified" receipts, but allows users to
 * adjust filters via query params. It fetches data using the
 * `getReceiptsAction` server action and passes it to a client component
 * (`ReceiptsList`) for rendering.
 *
 * Key Features:
 * - Fetches receipts from the database using `getReceiptsAction`
 * - Fetches categories from the database using `getCategoriesAction`
 * - Supports optional query parameters for filtering:
 *   - status: e.g., "verified" or "unverified"
 *   - fromDate: e.g., "2023-01-01"
 *   - toDate: e.g., "2023-12-31"
 *   - categoryId: e.g., "cat-uuid"
 * - Renders a client component with the resulting data
 *
 * @dependencies
 * - React, ReactNode for Next.js server page
 * - Clerk's `auth` for user authentication
 * - `getReceiptsAction` from "@/actions/db/receipts-actions"
 * - `getCategoriesAction` from "@/actions/db/categories-actions"
 * - `ReceiptsList` from "./_components/receipts-list"
 *
 * @notes
 * - We rely on route protections to ensure only authenticated users
 *   access this page. If the user is not authenticated, the app's
 *   middleware or layout redirection will handle it.
 * - If needed, we can enhance this page to display error states or
 *   more advanced filters. For now, it demonstrates a basic pattern
 *   of server-side data fetching + client component rendering.
 * - We use bracket notation to avoid enumerating `searchParams` and
 *   bypass Next.js's warnings about dynamic properties.
 */

"use server"

import { getCategoriesAction } from "@/actions/db/categories-actions"
import { getReceiptsAction } from "@/actions/db/receipts-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import ReceiptsList from "./_components/receipts-list"

/**
 * @interface ReceiptsPageProps
 * @description
 * Defines the shape of incoming props for this server component,
 * including optional search parameters for filtering receipts.
 */
interface ReceiptsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

/**
 * @function ReceiptsPage
 * @async
 * @description
 * The main server component for the /receipts route. Fetches the current user's
 * receipts (by default only those with status="verified"), then renders a
 * <ReceiptsList> client component with the results.
 *
 * @param {ReceiptsPageProps} props - The props containing optional search params
 * @returns {JSX.Element}
 *  - The rendered receipts listing
 * @throws
 *  - If user is not authenticated, we redirect to /login (handled in middleware).
 */
export default async function ReceiptsPage({
  searchParams
}: ReceiptsPageProps) {
  // Get the current user's ID using Clerk
  const { userId } = await auth()

  // If no user ID, redirect to login. (Alternatively, rely on middleware.)
  if (!userId) {
    redirect("/login")
  }

  // Await searchParams to resolve the promise
  const resolvedSearchParams = await searchParams

  // Access properties using bracket notation
  const rawStatus = resolvedSearchParams["status"] || "all"
  const statusFilter = rawStatus === "all" ? undefined : rawStatus
  const fromDateFilter = resolvedSearchParams["fromDate"] ?? undefined
  const toDateFilter = resolvedSearchParams["toDate"] ?? undefined
  const categoryFilter = resolvedSearchParams["categoryId"] ?? undefined

  // Build a filter object matching the server action signature
  const filters = {
    status: statusFilter,
    fromDate: fromDateFilter,
    toDate: toDateFilter,
    categoryId: categoryFilter
  }

  // Fetch receipts from the database
  const receiptsResult = await getReceiptsAction(userId, filters)

  // If the DB call failed, we can handle it gracefully
  if (!receiptsResult.isSuccess) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">Error loading receipts</h2>
        <p className="text-muted-foreground">{receiptsResult.message}</p>
      </div>
    )
  }

  // Fetch categories from the database
  const categoriesResult = await getCategoriesAction(userId)
  if (!categoriesResult.isSuccess) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">Error loading categories</h2>
        <p className="text-muted-foreground">{categoriesResult.message}</p>
      </div>
    )
  }

  // If success, pass data to the client component
  const receipts = receiptsResult.data
  const categories = categoriesResult.data

  return (
    <Suspense fallback={<div className="p-4">Loading your receipts...</div>}>
      <ReceiptsList initialReceipts={receipts} categories={categories} />
    </Suspense>
  )
}
