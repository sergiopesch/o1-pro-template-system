/**
 * @description
 * A client component that provides the UI scaffolding for the dashboard layout.
 *
 * Responsibilities:
 * - Wraps dashboard pages in a flex layout with a Sidebar on the left and main content on the right.
 * - Uses the `SidebarProvider` from Shadcn's `sidebar.tsx` to handle sidebar state (open/close).
 * - Renders child routes in the main area.
 *
 * Key features:
 * - "use client" to manage client-side interactivity (sidebar toggles).
 * - `SidebarProvider` for context.
 * - `Sidebar` and `SidebarContent` as left navigation.
 * - `children` as the main content area on the right.
 *
 * @dependencies
 * - `@/components/ui/sidebar` for Shadcn-based sidebar components.
 *
 * @notes
 * - This is intentionally minimal: you can add actual navigation links or UI components inside `SidebarContent`.
 * - The parent layout at `(dashboard)/layout.tsx` ensures only authenticated users can access this wrapper.
 * - The final layout is a two-column flex container.
 */

"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from "@/components/ui/sidebar"
import { ReactNode } from "react"

interface DashboardWrapperProps {
  /**
   * The nested pages/elements under the `/dashboard` layout.
   */
  children: ReactNode
}

/**
 * Client component that provides the actual dashboard layout structure:
 * a left sidebar + main content area.
 *
 * @param {DashboardWrapperProps} props - The props containing child elements/routes.
 * @returns {JSX.Element} The two-column layout with a sidebar on the left and main content on the right.
 */
export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/receipts">Receipts</a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Updated the link from "/verify" -> "/verify" */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/verify">Verify</a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Additional links can go here (e.g. "Settings"). */}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-4">{children}</main>
      </div>
    </SidebarProvider>
  )
}
