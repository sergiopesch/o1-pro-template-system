/**
 * @description
 * Server page for `/dashboard/verify`. Lists unverified receipts for the current user,
 * letting them verify or edit these receipts.
 *
 * Responsibilities:
 * - Check user authentication via Clerk.
 * - Fetch receipts that have `verified=false`.
 * - Render the VerificationList client component, passing these receipts as props.
 *
 * Key features:
 * - "use server" to securely fetch data.
 * - If user is not authenticated, redirect to `/login`.
 * - Uses `getReceiptsAction` from our server actions.
 *
 * @dependencies
 * - `auth` from "@clerk/nextjs/server" for user session
 * - `redirect` from "next/navigation"
 * - `getReceiptsAction` from "@/actions/db/receipts-actions"
 * - The `VerificationList` client component from "./_components/verification-list"
 *
 * @notes
 * - On an error or no unverified receipts, we simply handle gracefully in the UI.
 */

"use server"

import { getReceiptsAction } from "@/actions/db/receipts-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import VerificationList from "./_component/verification-list"

/**
 * Server component for the `/dashboard/verify` route.
 */
export default async function VerifyPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // Fetch all unverified receipts
  const result = await getReceiptsAction(userId, { verified: false })

  if (!result.isSuccess) {
    return (
      <div className="p-4">
        <h1 className="mb-4 text-2xl font-bold">Verify Receipts</h1>
        <p className="text-destructive">Error: {result.message}</p>
      </div>
    )
  }

  const unverifiedReceipts = result.data

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Verify Receipts</h1>
      <VerificationList initialReceipts={unverifiedReceipts} />
    </div>
  )
}
