/*
The root server layout for the app.
*/

import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { Preload } from "@/components/utilities/preload"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Receipt AI",
    template: "%s | Receipt AI"
  },
  description:
    "A modern web app for receipt management and analysis powered by AI.",
  keywords: ["receipts", "finance", "expense management", "ai", "analysis"],
  authors: [{ name: "Receipt AI Team" }],
  creator: "Receipt AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://receiptai.app",
    title: "Receipt AI",
    description:
      "A modern web app for receipt management and analysis powered by AI.",
    siteName: "Receipt AI"
  },
  twitter: {
    card: "summary_large_image",
    title: "Receipt AI",
    description:
      "A modern web app for receipt management and analysis powered by AI."
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (userId) {
    const profileRes = await getProfileByUserIdAction(userId)
    if (!profileRes.isSuccess) {
      await createProfileAction({ userId })
    }
  }

  return (
    <ClerkProvider>
      <html suppressHydrationWarning lang="en">
        <body
          suppressHydrationWarning
          className={cn(
            "mx-auto min-h-screen w-full scroll-smooth bg-background antialiased",
            inter.className
          )}
        >
          <Providers
            disableTransitionOnChange
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            {children}

            <TailwindIndicator />

            <Toaster />
            <Preload />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
