"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Mietverträge", href: "/dashboard/dokumente", icon: FileText },
  { label: "Versicherungen", href: "/dashboard/versicherungen", icon: ShieldCheck },
]

export default function DokumenteTabsHeader() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-background">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <h1 className="text-2xl font-bold tracking-tight">Dokumente</h1>
        <p className="text-muted-foreground text-sm mt-1 mb-4">Mietverträge je Einheit und Versicherungspolicen je Liegenschaft</p>
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
