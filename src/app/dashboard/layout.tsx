"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Home,
  Users,
  KeyRound,
  FolderOpen,
  LogOut,
  Loader2,
  Menu,
  X,
  Wrench,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface UserProfile {
  first_name: string | null
  last_name: string | null
  role: string
  organization_id: string
}

interface Organization {
  name: string
}

const NAV_ITEMS = [
  {
    label: "Übersicht",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Fälle",
    href: "/dashboard/cases",
    icon: ClipboardList,
  },
  {
    label: "Einheiten",
    href: "/dashboard/units",
    icon: Home,
  },
  {
    label: "Mieter",
    href: "/dashboard/tenants",
    icon: Users,
  },
  {
    label: "Aktivierungscodes",
    href: "/dashboard/codes",
    icon: KeyRound,
  },
  {
    label: "Werkstätten",
    href: "/dashboard/werkstaetten",
    icon: Wrench,
  },
  {
    label: "Dokumente",
    href: "/dashboard/dokumente",
    icon: FolderOpen,
  },
]

function SidebarContent({
  profile,
  organization,
  pathname,
  onLogout,
  isLoggingOut,
}: {
  profile: UserProfile | null
  organization: Organization | null
  pathname: string
  onLogout: () => void
  isLoggingOut: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">SchadensMelder</span>
          <span className="text-xs text-muted-foreground truncate">
            {organization?.name || "Hausverwaltung"}
          </span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
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
        {profile && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">
              {profile.first_name} {profile.last_name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {profile.role === "hv_admin" ? "Administrator" : "Sachbearbeiter"}
            </span>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/login?redirectTo=/dashboard"
          return
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name, role, organization_id")
          .eq("id", user.id)
          .eq("is_deleted", false)
          .single()

        if (!profileData) {
          window.location.href = "/login"
          return
        }

        // Verify HV role
        if (
          !["hv_admin", "hv_mitarbeiter", "platform_admin"].includes(
            profileData.role
          )
        ) {
          window.location.href = "/"
          return
        }

        setProfile(profileData)

        // Fetch organization name
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profileData.organization_id)
          .single()

        if (orgData) {
          setOrganization(orgData)
        }
      } catch {
        window.location.href = "/login"
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
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
          <p className="text-sm text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r bg-background z-30">
        <SidebarContent
          profile={profile}
          organization={organization}
          pathname={pathname}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Hauptnavigation der Anwendung
          </SheetDescription>
          <SidebarContent
            profile={profile}
            organization={organization}
            pathname={pathname}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
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
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">SchadensMelder</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
