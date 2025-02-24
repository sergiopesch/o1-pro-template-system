/*
This client component provides the providers for the app.
*/

"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps
} from "next-themes"
import { MotionConfig } from "framer-motion"
import { SWRConfig } from "swr"
import { useState, useEffect } from "react"

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  // Respect user's motion preferences
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setReducedMotion(motionQuery.matches)

      // Listen for changes in the reduced motion preference
      const handleMotionChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches)
      }

      motionQuery.addEventListener("change", handleMotionChange)

      // Cleanup event listener when component unmounts
      return () => {
        motionQuery.removeEventListener("change", handleMotionChange)
      }
    }
  }, []) // Empty dependency array ensures this only runs once after mounting

  return (
    <NextThemesProvider {...props}>
      <SWRConfig
        value={{
          fetcher: (url: string) => fetch(url).then(res => res.json()),
          revalidateOnFocus: false,
          shouldRetryOnError: false
        }}
      >
        <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
          <TooltipProvider>{children}</TooltipProvider>
        </MotionConfig>
      </SWRConfig>
    </NextThemesProvider>
  )
}
