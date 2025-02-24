/*
This server component provides the footer for the app.
*/

import { Github, Twitter } from "lucide-react"
import Link from "next/link"

export async function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Company</h3>
            <div className="flex flex-col gap-2">
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/about"
              >
                About
              </Link>
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/blog"
              >
                Blog
              </Link>
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/careers"
              >
                Careers
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Product</h3>
            <div className="flex flex-col gap-2">
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/features"
              >
                Features
              </Link>
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/docs"
              >
                Documentation
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Resources</h3>
            <div className="flex flex-col gap-2">
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/support"
              >
                Support
              </Link>
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/terms"
              >
                Terms
              </Link>
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/privacy"
              >
                Privacy
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Social</h3>
            <div className="flex gap-4">
              <Link
                href="https://github.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github className="size-6 text-muted-foreground transition hover:text-foreground" />
              </Link>
              <Link
                href="https://twitter.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter className="size-6 text-muted-foreground transition hover:text-foreground" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
