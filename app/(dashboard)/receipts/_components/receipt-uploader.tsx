/**
 * @description
 * This client component provides a UI for uploading a receipt image (JPEG/PNG).
 * It handles drag-and-drop or a file picker. Once a file is selected,
 * we submit it to an API endpoint (`/api/receipts/upload`) which will call
 * the server action `createReceiptAction` internally.
 *
 * Key Features:
 * 1. Drag-and-drop area for images.
 * 2. File size/type validation in the client (complementing server checks).
 * 3. Submits data to `/api/receipts/upload` using FormData.
 * 4. Uses `useToast` to show success or error notifications.
 *
 * @dependencies
 * - React (client-side)
 * - @clerk/nextjs for user session (if needed, but we skip direct usage here)
 * - /api/receipts/upload route
 * - "useToast" from "@/lib/hooks/use-toast" for notifications
 *
 * @notes
 * - We never import a server action directly into this client component, respecting the project rule:
 *   "Never use server actions in client components."
 * - The server still re-validates file type and size via `createReceiptAction`.
 * - The user ID is inferred on the server side from Clerk's `auth()`.
 * - Because Next.js's "use server" logic disallows direct File usage in a client->server action call,
 *   we use an API route that calls `createReceiptAction`.
 *
 * @limitations
 * - Currently handles only a single-file upload.
 * - Does not show a file preview; can be extended for a preview if desired.
 * - Drag-and-drop events are minimal; in production, you might want to refine visual states
 *   (hover, drop feedback, etc.).
 */

"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import React, { useCallback, useRef, useState } from "react"

interface ReceiptUploaderProps {
  /**
   * Optional callback if the parent wants to refresh the receipts list after upload.
   */
  onUploadSuccess?: () => void
}

/**
 * Client component that handles uploading a single file (image).
 * Validates on the client, then uses fetch() to post the file to our /api/receipts/upload route.
 */
export function ReceiptUploader({ onUploadSuccess }: ReceiptUploaderProps) {
  // For storing a reference to the file from the file input
  const fileRef = useRef<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  // For drag-and-drop style toggling
  const [isDragging, setIsDragging] = useState(false)

  // Toast for success/error messages
  const { toast } = useToast()

  /**
   * Handles the drag-over event to let the user drop a file.
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  /**
   * Removes the drag styling when the user leaves the drop zone.
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * Sets the fileRef when a file is dropped, if it meets basic type checks.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFile = e.dataTransfer?.files?.[0]
      if (droppedFile) {
        if (!["image/jpeg", "image/png"].includes(droppedFile.type)) {
          toast({
            title: "Invalid file type",
            description: "Only JPEG or PNG images are allowed.",
            variant: "destructive"
          })
          return
        }
        fileRef.current = droppedFile
        setSelectedFileName(droppedFile.name)
        toast({
          title: "File selected",
          description: `Ready to upload: ${droppedFile.name}`
        })
      }
    },
    [toast]
  )

  /**
   * Handles change event from the file input if user picks a file via the picker dialog.
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) {
        fileRef.current = null
        setSelectedFileName("")
        return
      }

      // Basic type check
      if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPEG or PNG images are allowed.",
          variant: "destructive"
        })
        fileRef.current = null
        setSelectedFileName("")
        e.target.value = "" // reset
        return
      }

      fileRef.current = selectedFile
      setSelectedFileName(selectedFile.name)
      toast({
        title: "File selected",
        description: `Ready to upload: ${selectedFile.name}`
      })
    },
    [toast]
  )

  /**
   * Submits the selected file to the server via /api/receipts/upload.
   */
  const handleUpload = useCallback(async () => {
    if (!fileRef.current) {
      toast({
        title: "No file selected",
        description: "Please select or drop an image file to upload.",
        variant: "destructive"
      })
      return
    }

    const file = fileRef.current
    // Optional client-side file size check (10MB limit).
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "File size exceeds 10MB limit.",
        variant: "destructive"
      })
      return
    }

    // Submit via FormData to our API route
    const formData = new FormData()
    formData.append("file", file)

    try {
      setIsUploading(true)
      const res = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData
      })

      const json = await res.json()
      if (!res.ok || !json.isSuccess) {
        // If the server returns an error or the action fails
        toast({
          title: "Upload failed",
          description:
            json.message ||
            "Something went wrong while uploading. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Success
      toast({
        title: "Upload success",
        description:
          "Your receipt has been uploaded and extracted. Please verify it."
      })

      // Reset state
      fileRef.current = null
      setSelectedFileName("")

      // If parent wants to do something (e.g. refresh the list), call it
      onUploadSuccess?.()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload error",
        description:
          "An unexpected error occurred while uploading. Check console logs.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast, onUploadSuccess])

  return (
    <div className="my-4 w-full max-w-xl">
      {/**
       * Drag-and-drop area. We add some tailwind styling for the border
       * that changes color when isDragging is true.
       */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 text-blue-500"
            : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        {selectedFileName ? (
          <div className="text-center">
            <p className="mb-2 text-sm font-medium">Selected file:</p>
            <p className="text-muted-foreground text-sm">{selectedFileName}</p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm">Drag & drop a receipt image here, or</p>
            <label className="bg-secondary hover:bg-secondary/90 cursor-pointer rounded px-3 py-1 text-sm">
              Choose File
              <input
                type="file"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {selectedFileName && (
          <Button
            variant="ghost"
            onClick={() => {
              fileRef.current = null
              setSelectedFileName("")
            }}
          >
            Clear
          </Button>
        )}
        <div className="ml-auto">
          <Button
            onClick={handleUpload}
            disabled={!selectedFileName || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  )
}
