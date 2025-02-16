/**
 * @file page.tsx
 * @description
 * This server component handles the `/dashboard` route. It aggregates
 * data for monthly totals, category breakdowns, and recent verified receipts,
 * and passes that data to a client chart component for visualization.
 *
 * Key Features:
 * - Auth check via Clerk (`auth()`)
 * - Calls `getDashboardStatsAction` to retrieve aggregated receipt data
 * - Renders the `AnalyticsCharts` client component for charts
 * - Displays a simple table/list for recent receipts
 * - Provides "quick action" links for uploading new receipts and exporting data
 *
 * @dependencies
 * - Clerk: to check `userId`
 * - getDashboardStatsAction: Aggregated analytics queries
 * - AnalyticsCharts: Client component for chart rendering
 *
 * @notes
 * - If the user is not authenticated, the page redirects to /login
 * - The stats only include `status='verified'` receipts
 * - For final production usage, you can refine the chart designs and the quick actions
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import {
  getDashboardStatsAction,
  type DashboardStats
} from "@/actions/db/dashboard-actions"

import { Button } from "@/components/ui/button"
import AnalyticsCharts from "./_components/analytics-charts"

/**
 * @function DashboardPage
 * @async
 * @description
 * The main server component for the `/dashboard` route. Fetches aggregated
 * stats, then displays them with a client chart component and a recent
 * receipts list.
 */
export default async function DashboardPage() {
  // 1) Validate user session
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // 2) Fetch stats from the server action
  const statsResult = await getDashboardStatsAction(userId)
  if (!statsResult.isSuccess) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">Error loading dashboard</h2>
        <p className="text-muted-foreground">{statsResult.message}</p>
      </div>
    )
  }

  const stats: DashboardStats = statsResult.data

  // 3) Render the page with the chart + a recent receipts section
  // We wrap the chart in a Suspense boundary (optional). If there's async loading,
  // we can show a fallback. Right now, there's no further async in AnalyticsCharts,
  // so it's purely for demonstration.
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button asChild>
          <a href="/receipts/upload">Upload Receipts</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/receipts/export">Export CSV</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/receipts/categories">Manage Categories</a>
        </Button>
      </div>

      {/* Analytics Charts */}
      <Suspense fallback={<div>Loading charts...</div>}>
        <AnalyticsCharts
          monthlyStats={stats.monthlyStats}
          categoryStats={stats.categoryStats}
        />
      </Suspense>

      {/* Recent Receipts */}
      <div className="mt-8">
        <h2 className="mb-2 text-xl font-semibold">Recent Verified Receipts</h2>
        {stats.recentReceipts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recent verified receipts.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Vendor</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Currency</th>
                  <th className="p-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentReceipts.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">
                      {r.date ? new Date(r.date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-2">{r.vendor || <em>Unknown</em>}</td>
                    <td className="p-2">{r.amount || "0.00"}</td>
                    <td className="p-2">{r.currency}</td>
                    <td className="p-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
