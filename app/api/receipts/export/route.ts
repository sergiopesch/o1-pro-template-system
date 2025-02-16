/**
 * @description
 * API route that returns a CSV download of the user's filtered receipts.
 *
 * Responsibilities:
 * - Read query params from the request URL to gather filters (merchant, category, verified, startDate, endDate).
 * - Validate the user via Clerk's auth().
 * - Call the server action `exportReceiptsAction(userId, filters)`.
 * - Return a CSV file with HTTP 200 and appropriate headers on success.
 * - Return a JSON error with a 4xx or 5xx status if something goes wrong.
 *
 * @dependencies
 * - Clerk's `auth()` for user authentication
 * - `exportReceiptsAction` from "@/actions/db/receipts-actions"
 * - Next.js App Router's `NextResponse` for sending the response
 *
 * @notes
 * - This approach automatically triggers a download because we set `Content-Disposition: attachment`.
 * - The CSV is built entirely in memory. For large data sets, consider streaming.
 */

import { exportReceiptsAction } from "@/actions/db/receipts-actions"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * We use the standard "nodejs" runtime for file or stream operations (if needed).
 */
export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    // 1) Ensure user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { isSuccess: false, message: "User not authenticated" },
        { status: 401 }
      )
    }

    // 2) Parse query params for filters
    const url = new URL(req.url)
    const merchant = url.searchParams.get("merchant") || ""
    const category = url.searchParams.get("category") || ""
    const verifiedParam = url.searchParams.get("verified")
    const startDateStr = url.searchParams.get("startDate") || ""
    const endDateStr = url.searchParams.get("endDate") || ""

    let verified: boolean | undefined
    if (verifiedParam === "true") {
      verified = true
    } else if (verifiedParam === "false") {
      verified = false
    }

    let startDate: Date | undefined
    if (startDateStr.trim().length > 0) {
      const d = new Date(startDateStr)
      if (!isNaN(d.getTime())) {
        startDate = d
      }
    }

    let endDate: Date | undefined
    if (endDateStr.trim().length > 0) {
      const d = new Date(endDateStr)
      if (!isNaN(d.getTime())) {
        endDate = d
      }
    }

    // 3) Call the export action
    const exportResult = await exportReceiptsAction(userId, {
      merchant,
      category,
      verified,
      startDate,
      endDate
    })

    if (!exportResult.isSuccess) {
      return NextResponse.json(
        { isSuccess: false, message: exportResult.message },
        { status: 400 }
      )
    }

    // 4) Return CSV as an attachment
    const { csv } = exportResult.data
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=receipts.csv"
      }
    })
  } catch (error) {
    console.error("Error in /api/receipts/export route:", error)
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error occurred while exporting receipts"
    return NextResponse.json({ isSuccess: false, message }, { status: 500 })
  }
}
