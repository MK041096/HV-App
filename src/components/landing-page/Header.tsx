"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="w-full bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-primary">
              SchadensMelder
            </Link>
          </div>
          <div className="hidden md:flex md:space-x-6">
            <Link href="/login" className="text-gray-700 hover:text-primary">
              Login für Hausverwalter
            </Link>
            <Link
              href="/mein-bereich"
              className="text-gray-700 hover:text-primary"
            >
              Mieter-Portal
            </Link>
            <Button asChild>
              <Link href="/login">Kostenlos testen</Link>
            </Button>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/login"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
            >
              Login für Hausverwalter
            </Link>
            <Link
              href="/mein-bereich"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
            >
              Mieter-Portal
            </Link>
            <Link href="/login"
              className="block px-3 py-2">
              <Button className="w-full">Kostenlos testen</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
