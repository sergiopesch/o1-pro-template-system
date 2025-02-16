/**
 * @file dashboard-actions.ts
 * @description
 * This file defines server actions for fetching aggregated analytics data
 * for the Dashboard view. Specifically, it provides:
 * 1. Monthly sums for the past year (for verified receipts).
 * 2. Category-wise spending breakdown.
 * 3. Recent verified receipts.
 *
 * Key Features:
 * - getDashboardStatsAction: Aggregates receipt data grouped by month and by category.
 * - Summation is only for receipts whose status='verified'.
 * - Returns a small list of recent verified receipts for a quick overview.
 *
 * @dependencies
 * - db (Drizzle ORM instance) for direct database queries.
 * - eq, and from drizzle-orm for building conditions.
 * - receiptsTable, categoriesTable from the schema for referencing DB columns.
 * - ActionState from "@/types" for typed action responses.
 *
 * @notes
 * - We rely on Postgres functions (date_trunc) and the Drizzle ORM aggregator approach.
 * - If your Postgres is older or if you prefer not to use date_trunc, you can adapt logic accordingly.
 * - The user must ensure that only verified receipts are included in these calculations.
 */

"use server"

import { db } from "@/db/db"
import { categoriesTable } from "@/db/schema/categories-schema"
import { receiptsTable } from "@/db/schema/receipts-schema"
import { ActionState } from "@/types"
import { eq, sql } from "drizzle-orm"

/**
 * @interface DashboardStats
 * @description
 * The shape of the aggregated data returned by `getDashboardStatsAction`.
 */
export interface DashboardStats {
  monthlyStats: Array<{
    yearMonth: string
    totalAmount: number
  }>
  categoryStats: Array<{
    categoryName: string
    totalAmount: number
  }>
  recentReceipts: Array<{
    id: string
    vendor: string | null
    date: string | null
    amount: string | null
    currency: string
    createdAt: Date
  }>
}

/**
 * @function getDashboardStatsAction
 * @async
 * @description
 * Fetches summarized analytics for the logged-in user. Includes:
 * 1) monthlyStats: Summation of all verified receipts over the last 12 months, grouped by month
 * 2) categoryStats: Summation of all verified receipts grouped by category
 * 3) recentReceipts: The 5 most recently created verified receipts (descending by createdAt)
 *
 * @param {string} userId - The ID of the logged-in user
 * @returns {Promise<ActionState<DashboardStats>>}
 *  - isSuccess = true, data = aggregated stats object
 *  - isSuccess = false if any error occurs
 *
 * @example
 * const result = await getDashboardStatsAction("user_xyz")
 * if (result.isSuccess) {
 *   console.log(result.data.monthlyStats, result.data.categoryStats, result.data.recentReceipts)
 * } else {
 *   console.error("Failed to retrieve dashboard stats:", result.message)
 * }
 */
export async function getDashboardStatsAction(
  userId: string
): Promise<ActionState<DashboardStats>> {
  try {
    // 1) Monthly Stats for last 12 months
    // We'll group by year and month, summing amounts for status='verified'
    // We rely on the "date" column for grouping, ignoring receipts with no date by coalescing them if needed.
    // We'll do date_trunc to monthly. We'll also only look at last 12 months.
    // In Drizzle, we can use .execute() with raw SQL if necessary.

    // last 12 months from current date:
    // We'll rely on date >= CURRENT_DATE - interval '12 months'
    // and status='verified'
    const monthlyStatsRaw = await db.execute<{
      year_month: string
      sum: string
    }>(
      sql`
        SELECT 
          to_char(date_trunc('month', receipts.date), 'YYYY-MM') AS year_month,
          COALESCE(SUM(receipts.amount), 0) AS sum
        FROM ${receiptsTable} receipts
        WHERE 
          receipts.user_id = ${userId}
          AND receipts.status = 'verified'
          AND receipts.date >= (CURRENT_DATE - INTERVAL '12 months')
        GROUP BY date_trunc('month', receipts.date)
        ORDER BY date_trunc('month', receipts.date);
      `
    )

    const monthlyStats = monthlyStatsRaw.map(
      (row: { year_month: string; sum: string }) => ({
        yearMonth: row.year_month,
        totalAmount: Number(row.sum)
      })
    )

    // 2) Category Stats
    // Summation of amounts by category, including receipts with null category as "Uncategorized"
    // We'll do an outer join with categories to get the name or null
    // Then we'll label it "Uncategorized" if category is null
    const categoryStatsRaw = await db.execute<{
      category_name: string | null
      sum: string
    }>(sql`
      SELECT 
        COALESCE(cat.name, 'Uncategorized') AS category_name,
        COALESCE(SUM(r.amount), 0) AS sum
      FROM ${receiptsTable} r
      LEFT JOIN ${categoriesTable} cat
        ON r.category_id = cat.id
      WHERE 
        r.user_id = ${userId}
        AND r.status = 'verified'
      GROUP BY cat.name
      ORDER BY cat.name NULLS FIRST;
    `)

    const categoryStats = categoryStatsRaw.map(
      (row: { category_name: string | null; sum: string }) => ({
        categoryName: row.category_name || "Uncategorized",
        totalAmount: Number(row.sum)
      })
    )

    // 3) Recent Verified Receipts
    // Let's get the last 5 receipts (by createdAt desc) for the user with status=verified
    // We'll just select a subset of columns.
    const recent = await db.query.receipts.findMany({
      where: eq(receiptsTable.userId, userId),
      orderBy: receiptsTable.createdAt,
      limit: 5
    })
    // Drizzle sorts ascending by default - let's reverse or do manual ordering:
    // Instead, let's do some raw SQL or an advanced query.
    // But let's keep it simple - we'll fetch then reverse:
    // We'll also filter by verified status in code or use a Drizzle condition eq(...).
    // We'll do eq(receiptsTable.status, 'verified') in the where condition.
    const recentVerified = await db.query.receipts.findMany({
      where: (fields, { and }) =>
        and(eq(fields.userId, userId), eq(fields.status, "verified")),
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      limit: 5
    })

    const recentReceipts = recentVerified.map(r => ({
      id: r.id,
      vendor: r.vendor,
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null,
      amount: r.amount ? r.amount.toString() : null,
      currency: r.currency || "USD",
      createdAt: r.createdAt
    }))

    const result: DashboardStats = {
      monthlyStats,
      categoryStats,
      recentReceipts
    }

    return {
      isSuccess: true,
      message: "Dashboard stats retrieved successfully.",
      data: result
    }
  } catch (error) {
    console.error("Error in getDashboardStatsAction:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve dashboard stats."
    }
  }
}
