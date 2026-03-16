"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  LayoutDashboard,
  Building2,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface AdminUser {
  email: string
}

const NAV_ITEMS = [
  {
    label: "Übersicht",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Kunden",
    href: "/admin/organizations",
    icon: Building2,
    exact: false,
  },
]

function SidebarContent({
  adminUser,
  pathname,
  onLogout,
  isLoggingOut,
}: {
  adminUser: AdminUser | null
  pathname: string
  onLogout: () => void
  isLoggingOut: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">SchadensMelder</span>
          <span className="text-xs text-muted-foreground truncate">Admin Portal</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User Info & Logout */}
      <div className="px-4 py-4 space-y-3">
        {adminUser && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-muted-foreground truncate">
              {adminUser.email}
            </span>
            <span className="text-xs text-primary font-medium">Platform Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Abmelden
        </Button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    async function loadAdminUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/login"
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile?.role !== "platform_admin") {
          window.location.href = "/"
          return
        }

        setAdminUser({ email: user.email ?? "" })
      } catch {
        window.location.href = "/login"
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminUser()
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch {
      window.location.href = "/login"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Admin-Portal wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:inset-y-0 lg:border-r bg-background z-30">
        <SidebarContent
          adminUser={adminUser}
          pathname={pathname}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-56 p-0">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Hauptnavigation des Admin-Portals
          </SheetDescription>
          <SidebarContent
            adminUser={adminUser}
            pathname={pathname}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-56 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Navigation öffnen"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">SchadensMelder Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
