/*
Preloads key resources for faster page loads
*/

"use client"

import { useEffect } from "react"

export function Preload() {
  useEffect(() => {
    // Preload key resources
    const preloadLinks = [
      // Preload fonts
      {
        rel: "preload",
        href: "/fonts/inter-var.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous"
      },

      // Preload critical images
      { rel: "preload", href: "/logo.png", as: "image" },

      // Preconnect to key domains
      { rel: "preconnect", href: "https://prgalskhamygixowmkhp.supabase.co" },
      { rel: "preconnect", href: "https://api.clerk.dev" },
      { rel: "preconnect", href: "https://api.stripe.com" }
    ]

    preloadLinks.forEach(link => {
      const linkEl = document.createElement("link")
      Object.entries(link).forEach(([key, value]) => {
        linkEl.setAttribute(key, value)
      })
      document.head.appendChild(linkEl)
    })

    // Optional: Implement instant.page for preloading on hover
    // https://instant.page/
    if (process.env.NODE_ENV === "production") {
      const script = document.createElement("script")
      script.src = "https://instant.page/5.2.0"
      script.type = "module"
      script.integrity =
        "sha384-jnZyxPjiipYXnSU0ygqeac2q7CVYMbh84q0uHVRRxEhFds1mHWbQ26fkkegzyFb"
      script.crossOrigin = "anonymous"
      document.body.appendChild(script)
    }

    return () => {
      // Clean up if component unmounts
    }
  }, [])

  return null
}
