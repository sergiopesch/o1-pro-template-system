/**
 * @file page.tsx
 * @description
 * This server component handles the `/receipts/verify` route. Previously, it only
 * fetched unverified receipts. Now, it also fetches the user's categories so
 * that a user can assign a category while verifying a receipt.
 *
 * Key Features:
 * - Checks auth via Clerk
 * - Fetches unverified receipts from `getReceiptsAction`
 * - Fetches categories from `getCategoriesAction`
 * - Generates signed URLs for receipts if stored in private Supabase bucket
 * - Passes both receipts and categories to `VerifyPageClient`
 *
 * @dependencies
 * - Clerk (auth) for user session
 * - getReceiptsAction, updateReceiptAction from "@/actions/db/receipts-actions"
 * - getCategoriesAction from "@/actions/db/categories-actions"
 * - createClient from "@supabase/supabase-js" for generating signed URLs
 * - confirmReceiptAction: wraps updateReceiptAction for setting "status" and/or other fields
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { confirmReceiptAction } from "@/actions/confirm-receipt-action"
import { getCategoriesAction } from "@/actions/db/categories-actions"
import { getReceiptsAction } from "@/actions/db/receipts-actions"

import type { SelectCategory } from "@/db/schema"
import type { SelectReceipt } from "@/db/schema/receipts-schema"
import { createClient } from "@supabase/supabase-js"

import VerifyPageClient from "./_components/verify-page-client"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_BUCKET_RECEIPTS =
  process.env.SUPABASE_BUCKET_RECEIPTS || "user-receipts"

const supabaseAdmin = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? ""
)

export default async function VerifyPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // 1) Fetch unverified receipts
  const receiptsResult = await getReceiptsAction(userId, {
    status: "unverified"
  })
  if (!receiptsResult.isSuccess) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">
          Error loading unverified receipts
        </h2>
        <p className="text-muted-foreground">{receiptsResult.message}</p>
      </div>
    )
  }
  const unverifiedReceipts = receiptsResult.data

  // 2) Generate signed URLs for each receipt if needed
  const receiptsWithSignedUrl: SelectReceipt[] = []
  for (const r of unverifiedReceipts) {
    let finalUrl = r.imageUrl
    const isProbablyJustPath =
      !r.imageUrl.includes("http://") && !r.imageUrl.includes("https://")

    if (isProbablyJustPath) {
      const { data: signedData, error: signedError } =
        await supabaseAdmin.storage
          .from(SUPABASE_BUCKET_RECEIPTS)
          .createSignedUrl(r.imageUrl, 60 * 60) // 1 hour
      if (signedError || !signedData?.signedUrl) {
        console.error("Failed to create signed URL for receipt:", signedError)
      } else {
        finalUrl = signedData.signedUrl
      }
    }

    receiptsWithSignedUrl.push({ ...r, imageUrl: finalUrl })
  }

  // 3) Fetch categories so the user can assign them if they want
  const categoriesResult = await getCategoriesAction(userId)
  let categories: SelectCategory[] = []
  if (categoriesResult.isSuccess && categoriesResult.data) {
    categories = categoriesResult.data
  }

  // 4) Render the client component
  return (
    <VerifyPageClient
      unverifiedReceipts={receiptsWithSignedUrl}
      confirmReceiptAction={confirmReceiptAction}
      categories={categories}
    />
  )
}
