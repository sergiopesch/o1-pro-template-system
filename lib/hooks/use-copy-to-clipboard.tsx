/*
Hook for copying text to the clipboard.
*/

"use client"

import { useState } from "react"

export interface useCopyToClipboardProps {
  timeout?: number
}

export function useCopyToClipboard({
  timeout = 2000
}: useCopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const copyToClipboard = (value: string) => {
    if (typeof window === "undefined" || !value) {
      return
    }

    // Try to use the modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          setIsCopied(true)
          setTimeout(() => {
            setIsCopied(false)
          }, timeout)
        })
        .catch(error => {
          console.error("Failed to copy text: ", error)
        })
      return
    }

    // Fallback to document.execCommand('copy') for older browsers
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea")
      textArea.value = value

      // Make the textarea out of viewport
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)

      // Select and copy the text
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")

      // Clean up
      document.body.removeChild(textArea)

      if (successful) {
        setIsCopied(true)
        setTimeout(() => {
          setIsCopied(false)
        }, timeout)
      }
    } catch (err) {
      console.error("Fallback: Failed to copy text: ", err)
    }
  }

  return { isCopied, copyToClipboard }
}
