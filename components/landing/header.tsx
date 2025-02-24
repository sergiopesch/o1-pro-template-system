/*
This client component provides the header for the app.
*/

"use client"

import { Button } from "@/components/ui/button"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Menu, Receipt, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" }
]

const signedInLinks = [{ href: "/dashboard", label: "Dashboard" }]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 transition-colors ${
        isScrolled
          ? "bg-background/80 shadow-sm backdrop-blur-sm"
          : "bg-background"
      }`}
      initial={{ y: -20, opacity: 0 }}
    >
      <div className="container mx-auto flex max-w-7xl items-center justify-between p-4">
        <motion.div
          className="flex items-center space-x-2 hover:cursor-pointer hover:opacity-80"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Receipt className="size-6" />
          <Link className="text-xl font-bold" href="/">
            Receipt AI
          </Link>
        </motion.div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 space-x-2 md:flex">
          {navLinks.map(link => (
            <motion.div
              key={link.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                className="rounded-full px-3 py-1 text-muted-foreground transition hover:text-foreground"
                href={link.href}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}

          <SignedIn>
            {signedInLinks.map(link => (
              <motion.div
                key={link.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  className="rounded-full px-3 py-1 text-muted-foreground transition hover:text-foreground"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </SignedIn>
        </nav>

        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="ghost">Sign In</Button>
              </motion.div>
            </SignInButton>

            <SignUpButton>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button>Get Started</Button>
              </motion.div>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>

          <motion.div
            className="md:hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              aria-label="Toggle menu"
              size="icon"
              variant="ghost"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {isMenuOpen && (
        <motion.nav
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-foreground p-4 text-primary md:hidden"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: -10 }}
        >
          <ul className="space-y-2">
            <li>
              <Link
                className="block hover:underline"
                href="/"
                onClick={toggleMenu}
              >
                Home
              </Link>
            </li>
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  className="block hover:underline"
                  href={link.href}
                  onClick={toggleMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <SignedIn>
              {signedInLinks.map(link => (
                <li key={link.href}>
                  <Link
                    className="block hover:underline"
                    href={link.href}
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </SignedIn>
          </ul>
        </motion.nav>
      )}
    </motion.header>
  )
}
