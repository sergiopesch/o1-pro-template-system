/**
 * @file upload-form.tsx
 * @description
 * This client component renders a simple form for uploading files. It includes
 * an <input type="file" multiple> element for receipt selection, and on submit,
 * it calls an `onSubmit` prop with a FormData object containing the selected files.
 *
 * Key Features:
 * - "use client" to handle local UI state for file selection
 * - Provides a drag-and-drop area or simple input
 * - Calls back into a parent handler (`handleSubmit` from upload-page-client.tsx)
 * - Disables itself while uploading to prevent duplicate submissions
 *
 * @dependencies
 * - React for UI
 * - Tailwind for styling
 *
 * @notes
 * - For advanced usage, you could implement a true drag-and-drop experience using libraries
 *   such as `react-dropzone`. This example provides a minimal demonstration.
 * - We handle multiple files by setting `multiple` on the file input.
 * - `isUploading` helps display a loading state in the parent component
 */

"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"

interface UploadFormProps {
  /**
   * @property {boolean} isUploading
   * Indicates whether an upload is currently in progress, controlling form disabling.
   */
  isUploading: boolean

  /**
   * @function onSubmit
   * A callback invoked when the user submits the form. Receives a FormData object containing
   * the selected files.
   *
   * @param {FormData} data - The form data containing uploaded files
   */
  onSubmit: (data: FormData) => void
}

/**
 * @function UploadForm
 * @description
 * Renders a form with a file input for receipt upload. When the user selects files
 * and clicks "Upload," it builds a FormData object and invokes the `onSubmit` callback.
 */
export default function UploadForm({ onSubmit, isUploading }: UploadFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /**
   * @function handleFileSelect
   * @description
   * Triggered when the user changes the file input. We store the selected files in state.
   */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setSelectedFiles(Array.from(files))
  }

  /**
   * @function handleFormSubmit
   * @description
   * Builds a FormData object containing the "files" array, then calls `onSubmit`.
   */
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFiles.length) return

    const data = new FormData()
    selectedFiles.forEach(file => data.append("files", file))

    onSubmit(data)
  }

  /**
   * Optional: auto-clear the file input once the upload is done or canceled.
   * If you want to keep the selection, remove this effect.
   */
  useEffect(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [isUploading])

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      {/* 
        A minimal approach. You could expand this to be a drag-and-drop area
        or integrate a library like react-dropzone for a richer experience.
      */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Select Receipt Files:
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={isUploading}
          onChange={handleFileSelect}
          className="file:bg-primary hover:file:bg-primary/90 file:mr-4 file:rounded file:border-0 file:px-4 file:py-2 file:text-white file:transition hover:file:cursor-pointer disabled:opacity-50"
        />
        {selectedFiles.length > 0 && (
          <ul className="text-muted-foreground mt-2 list-disc pl-6 text-sm">
            {selectedFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Button
          type="submit"
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  )
}
