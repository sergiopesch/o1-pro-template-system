/**
 * @description
 * Server Layout component for the `/dashboard` route group.
 *
 * Responsibilities:
 * - Protects all child routes under `/dashboard/*` by verifying user authentication.
 * - Redirects users to `/login` if not authenticated.
 * - Renders the client-side layout (`DashboardWrapper`) if authenticated.
 *
 * Key features:
 * - "use server" to access server-side data and Clerk's `auth()` within the Next.js App Router.
 * - Checks user session; if `userId` is empty, calls `redirect("/login")`.
 * - If logged in, renders the child components inside a client layout for the dashboard.
 *
 * @dependencies
 * - `@clerk/nextjs/server` for `auth()` (retrieving user session info)
 * - `next/navigation` for `redirect()`
 * - `ReactNode` type for defining component children
 *
 * @notes
 * - This layout is automatically applied to any pages or nested route segments within `(dashboard)`.
 * - The actual UI scaffolding (sidebar, etc.) is delegated to `DashboardWrapper` (a client component).
 * - We separate the server logic (user check) from the client UI for best practices in Next.js.
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import DashboardWrapper from "./_components/dashboard-wrapper"

interface DashboardLayoutProps {
  /**
   * React children. These are the nested route pages/elements under `/dashboard`.
   */
  children: ReactNode
}

/**
 * Protects all routes nested under `/dashboard`.
 * Validates the user session and redirects to `/login` if not authenticated.
 *
 * @param {DashboardLayoutProps} props - The layout props containing child components/routes.
 * @returns {JSX.Element} The rendered UI if authenticated, or a redirect to /login otherwise.
 */
export default async function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const { userId } = await auth()

  // If user is not authenticated, redirect to the login page.
  if (!userId) {
    redirect("/login")
  }

  // If authenticated, render the dashboard client layout wrapper.
  return <DashboardWrapper>{children}</DashboardWrapper>
}
