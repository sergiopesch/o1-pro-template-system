/**
 * @file page.tsx
 * @description
 * This file is a **server component** entry for the `/receipts/upload` route.
 * It imports the server action `uploadReceiptsAction` from `/actions`, then
 * passes it down to a child **client** component (`UploadPageClient`) via props.
 *
 * Key Features:
 * - Declared as `"use server"` so it can fetch data or call server logic
 * - Renders `<UploadPageClient>` client component
 * - Passes the server action function as a prop to the client
 *
 * @dependencies
 * - `uploadReceiptsAction` from `"@/actions/upload-receipts-action"`
 * - `UploadPageClient` from `./_components/upload-page-client.tsx`
 *
 * @notes
 * - Since we can't define server actions inline in a client component, we do it here and pass them as props
 */

"use server"

import { uploadReceiptsAction } from "@/actions/upload-receipts-action"
import UploadPageClient from "./_components/upload-page-client"

/**
 * @function UploadPage
 * @description
 * Server component that returns the client component for receipt uploading. It
 * passes the server action as a prop. The client can then call this function
 * through a React hook (e.g. `useTransition` or direct call).
 */
export default async function UploadPage() {
  return <UploadPageClient uploadReceiptsAction={uploadReceiptsAction} />
}
