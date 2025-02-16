/**
 * @file upload-page-client.tsx
 * @description
 * This client component is the main UI for uploading receipts. It receives the
 * server action `uploadReceiptsAction` from its parent server component
 * (page.tsx). When the user submits files, it calls that server action using a
 * React transition, displaying success/error feedback.
 *
 * Key Features:
 * - "use client" for client-side interactivity
 * - Takes a server action (`uploadReceiptsAction`) as a prop
 * - Renders `UploadForm`, and upon submit, calls the server action
 * - Uses `useTransition` to handle concurrent rendering states
 *
 * @dependencies
 * - React, `useTransition`, `useState` for managing UI transitions & state
 * - The `ActionState` type for typed success/failure responses
 * - `UploadForm` child component for collecting File inputs
 *
 * @notes
 * - By splitting the server and client logic, we adhere to Next.js best practices
 * - "Never use server actions in client components" is satisfied by injecting
 *   the server action as a prop from the server module
 */

"use client"

import { Button } from "@/components/ui/button"
import { ActionState } from "@/types"
import { useState, useTransition } from "react"
import UploadForm from "./upload-form"

interface UploadPageClientProps {
  /**
   * @property {Function} uploadReceiptsAction
   * A server action passed in from the server page. This function
   * takes a FormData object and returns an ActionState with the results.
   */
  uploadReceiptsAction: (
    formData: FormData
  ) => Promise<ActionState<{ createdReceipts: any[] }>>
}

/**
 * @function UploadPageClient
 * @description
 * The main client component for uploading receipts. Calls `uploadReceiptsAction`
 * with the user's selected files. Provides UI feedback.
 */
export default function UploadPageClient({
  uploadReceiptsAction
}: UploadPageClientProps) {
  const [isPending, startTransition] = useTransition()
  const [uploadResult, setUploadResult] = useState<ActionState<{
    createdReceipts: any[]
  }> | null>(null)

  /**
   * @function handleSubmit
   * @description
   * Called by the `<UploadForm>` after the user selects files. Wraps the
   * server action call in `startTransition` so Next.js can manage concurrency.
   *
   * @param {FormData} data - A FormData containing the user's uploaded files
   */
  function handleSubmit(data: FormData) {
    startTransition(async () => {
      const res = await uploadReceiptsAction(data)
      setUploadResult(res)
    })
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Upload Receipts</h1>

      <UploadForm onSubmit={handleSubmit} isUploading={isPending} />

      {uploadResult && (
        <div className="mt-6">
          {uploadResult.isSuccess ? (
            <div className="text-sm text-green-600">
              {uploadResult.message}{" "}
              {uploadResult.data?.createdReceipts &&
                uploadResult.data.createdReceipts.length > 0 && (
                  <div>
                    Created receipts:
                    <ul className="list-disc pl-6">
                      {uploadResult.data.createdReceipts.map(receipt => (
                        <li key={receipt.id}>
                          ID: {receipt.id} | Status: {receipt.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-sm text-red-600">
              Error: {uploadResult.message}
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="text-muted-foreground mt-2 text-sm">Uploading...</div>
      )}

      <div className="mt-6">
        <Button variant="outline" onClick={() => setUploadResult(null)}>
          Clear Status
        </Button>
      </div>
    </div>
  )
}
