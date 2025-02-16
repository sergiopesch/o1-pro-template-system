/**
 * @file route.ts
 * @description
 * This file defines a Next.js route for handling CSV export of receipts.
 *
 * Key features:
 * - Receives a GET request at `/receipts/export`
 * - Authenticates the user via Clerk (auth)
 * - Parses query parameters to allow optional filtering: fromDate, toDate, status, categoryId
 * - Calls `exportReceiptsAction` to retrieve and convert receipts to CSV
 * - Returns a CSV file for download
 *
 * @dependencies
 * - Clerk's server-side `auth` for user authentication
 * - exportReceiptsAction from "@/actions/db/receipts-actions"
 * - Next.js 13 route for generating a streaming or text-based response
 *
 * @notes
 * - We set `Content-Disposition` to "attachment" so the browser prompts a CSV download.
 * - If the user is not logged in, we redirect to "/login".
 * - We do minimal error handling here, returning 400 or 500 statuses if something fails.
 */

import { exportReceiptsAction } from "@/actions/db/receipts-actions"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * @function GET
 * @async
 * @description
 * Handles GET requests to /receipts/export, returning a CSV file for the user's filtered receipts.
 *
 * Query parameters:
 * - fromDate?: string
 * - toDate?: string
 * - status?: string
 * - categoryId?: string
 *
 * @param {Request} req - The incoming request object
 * @returns {Promise<Response>} A response containing the CSV as `text/csv`
 *
 * @example
 * GET /receipts/export?status=verified&fromDate=2023-01-01&toDate=2023-12-31
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      // If user not logged in, redirect to login
      return NextResponse.redirect("/login")
    }

    // Parse query params
    const url = new URL(req.url)
    const fromDate = url.searchParams.get("fromDate") || undefined
    const toDate = url.searchParams.get("toDate") || undefined
    const status = url.searchParams.get("status") || undefined
    const categoryId = url.searchParams.get("categoryId") || undefined

    // Call the action to generate CSV
    const exportResult = await exportReceiptsAction(userId, {
      fromDate,
      toDate,
      status,
      categoryId
    })

    if (!exportResult.isSuccess) {
      return new NextResponse(exportResult.message, { status: 400 })
    }

    const csv = exportResult.data.csv

    // Return the CSV in a response with appropriate headers
    // so it downloads as a file named "receipts.csv"
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="receipts.csv"`
      }
    })
  } catch (error: any) {
    console.error("Error in GET /receipts/export route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
