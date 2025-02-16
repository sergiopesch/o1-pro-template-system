/**
 * @file analytics-charts.tsx
 * @description
 * This client component renders a couple of charts to visualize the user's
 * monthly spend totals and category breakdown. Uses Recharts for data
 * visualization.
 *
 * Key Features:
 * - "use client" ensures we can use dynamic chart libraries
 * - Renders a BarChart for monthlyStats (spending by month)
 * - Renders a PieChart for categoryStats
 * - Accepts stats from the parent server page
 *
 * @dependencies
 * - React, for the client-side logic
 * - Recharts (BarChart, XAxis, YAxis, Tooltip, Legend, PieChart, etc.)
 * - Data types from DashboardStats
 *
 * @notes
 * - Minimal styling is shown. You can style further with Tailwind or Shadcn UI classes.
 * - The data shape is straightforward: monthlyStats => {yearMonth, totalAmount},
 *   categoryStats => {categoryName, totalAmount}.
 */

"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

/**
 * @interface AnalyticsChartsProps
 * @description
 * The props required by the AnalyticsCharts component.
 */
interface AnalyticsChartsProps {
  monthlyStats: Array<{
    yearMonth: string
    totalAmount: number
  }>
  categoryStats: Array<{
    categoryName: string
    totalAmount: number
  }>
}

/**
 * @function AnalyticsCharts
 * @description
 * Renders two charts:
 * 1. A BarChart for monthly spend
 * 2. A PieChart for category distribution
 *
 * @param {AnalyticsChartsProps} props - monthlyStats and categoryStats
 */
export default function AnalyticsCharts({
  monthlyStats,
  categoryStats
}: AnalyticsChartsProps) {
  // Prepare data for the bar chart
  const monthlyData = useMemo(
    () =>
      monthlyStats.map(ms => ({
        name: ms.yearMonth,
        total: ms.totalAmount
      })),
    [monthlyStats]
  )

  // Prepare data for the pie chart
  const categoryData = useMemo(
    () =>
      categoryStats.map(cs => ({
        name: cs.categoryName,
        value: cs.totalAmount
      })),
    [categoryStats]
  )

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      {/* Monthly Totals Bar Chart */}
      <div className="flex-1">
        <h2 className="mb-2 text-lg font-semibold">Monthly Totals</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Pie Chart */}
      <div className="flex-1">
        <h2 className="mb-2 text-lg font-semibold">Category Breakdown</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                label
                fill="#8884d8"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
