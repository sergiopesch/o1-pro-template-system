/**
 * @file layout.tsx
 * @description
 * This file defines the server layout for the `/receipts` route group. It provides
 * a unified, consistent wrapper around all receipts-related pages (upload, listing,
 * verification, etc.). By default, it includes the application sidebar from
 * `@/components/sidebar/app-sidebar` and sets up any additional layout elements
 * necessary for the receipts section of the app.
 *
 * Key Features:
 * - Integrates the shared <AppSidebar> to provide side navigation.
 * - Ensures a consistent look and feel for all `/receipts/*` routes.
 * - Adheres to project rules about Next.js 13 (App Router), using "use server".
 *
 * @dependencies
 * - React: For rendering the layout.
 * - AppSidebar (from "@/components/sidebar/app-sidebar"): Reusable sidebar component.
 * - Suspense (optional usage if we decide to wrap child content with a suspense boundary).
 *
 * @notes
 * - This layout is a server component (`"use server"`) to fetch server data if needed.
 * - Currently, no additional data fetching is performed here. The children pages can
 *   implement their own data logic as needed.
 * - The layout leverages Tailwind utility classes to handle basic styling (min-h-screen, flex).
 * - Ensure that this layout is placed in `app/(app-routes)/receipts/layout.tsx` as indicated
 *   in the implementation plan.
 */

"use server"

import { ReactNode, Suspense } from "react"

/**
 * @interface ReceiptsLayoutProps
 * @description
 * Type definition for the props expected by the ReceiptsLayout component.
 * - children: The content (pages, components) that will be wrapped by this layout.
 */
interface ReceiptsLayoutProps {
  children: ReactNode
}

/**
 * @function ReceiptsLayout
 * @async
 * @description
 * A server component that provides a shared layout for the `/receipts` route group. It
 * includes a sidebar (`<AppSidebar />`) and a main content area where nested routes/pages
 * are rendered.
 *
 * @param {ReceiptsLayoutProps} props The props for this layout, primarily containing `children`.
 * @returns {JSX.Element} A JSX element representing the layout.
 *
 * @example
 * // In Next.js App Router, pages under /receipts will be automatically wrapped by this layout:
 * // e.g., /receipts/page.tsx -> automatically uses <ReceiptsLayout> as defined here.
 */
export default async function ReceiptsLayout({
  children
}: ReceiptsLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1">
        <Suspense fallback={<div className="p-4">Loading Receipts...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
