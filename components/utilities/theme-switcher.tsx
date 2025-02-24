/*
This client component provides a theme switcher for the app.
*/

"use client"

import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { type HTMLAttributes, useCallback } from "react"

interface ThemeSwitcherProps extends HTMLAttributes<HTMLDivElement> {}

export const ThemeSwitcher = ({ ...props }: ThemeSwitcherProps) => {
  const { setTheme, theme } = useTheme()

  const handleChange = useCallback(
    (newTheme: "dark" | "light") => {
      // Only access localStorage in the browser
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("theme", newTheme)
        } catch (error) {
          console.error("Error setting theme in localStorage:", error)
        }
      }
      setTheme(newTheme)
    },
    [setTheme]
  )

  return (
    <div
      className={cn(
        "p-1 hover:cursor-pointer hover:opacity-50",
        props.className
      )}
      onClick={() => handleChange(theme === "light" ? "dark" : "light")}
    >
      {theme === "dark" ? (
        <Moon className="size-6" />
      ) : (
        <Sun className="size-6" />
      )}
    </div>
  )
}
