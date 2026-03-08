"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  Loader2,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  total: number
  neu: number
  in_bearbeitung: number
  warte_auf_handwerker: number
  termin_vereinbart: number
  erledigt: number
  notfall: number
  dringend: number
}

interface RecentCase {
  id: string
  case_number: string
  title: string
  urgency: string
  status: string
  created_at: string
  reporter: { first_name: string | null; last_name: string | null } | null
  unit: { name: string } | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCases, setRecentCases] = useState<RecentCase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single()

        if (!profile) return

        // Fetch counts by status
        const { data: allCases } = await supabase
          .from("damage_reports")
          .select("id, status, urgency")
          .eq("organization_id", profile.organization_id)
          .eq("is_deleted", false)

        const cases = allCases || []
        const statsData: DashboardStats = {
          total: cases.length,
          neu: cases.filter((c) => c.status === "neu").length,
          in_bearbeitung: cases.filter((c) => c.status === "in_bearbeitung")
            .length,
          warte_auf_handwerker: cases.filter(
            (c) => c.status === "warte_auf_handwerker"
          ).length,
          termin_vereinbart: cases.filter(
            (c) => c.status === "termin_vereinbart"
          ).length,
          erledigt: cases.filter((c) => c.status === "erledigt").length,
          notfall: cases.filter((c) => c.urgency === "notfall").length,
          dringend: cases.filter((c) => c.urgency === "dringend").length,
        }
        setStats(statsData)

        // Fetch recent cases (newest 5 open cases)
        const { data: recent } = await supabase
          .from("damage_reports")
          .select(
            `id, case_number, title, urgency, status, created_at,
            reporter:profiles!damage_reports_reporter_id_fkey(first_name, last_name),
            unit:units(name)`
          )
          .eq("organization_id", profile.organization_id)
          .eq("is_deleted", false)
          .in("status", [
            "neu",
            "in_bearbeitung",
            "warte_auf_handwerker",
            "termin_vereinbart",
          ])
          .order("created_at", { ascending: false })
          .limit(5)

        if (recent) {
          setRecentCases(recent as unknown as RecentCase[])
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const openCount = stats
    ? stats.neu +
      stats.in_bearbeitung +
      stats.warte_auf_handwerker +
      stats.termin_vereinbart
    : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
        <p className="text-muted-foreground mt-1">
          Willkommen im Case-Management Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Fälle</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total || 0} gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notfälle</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.notfall || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sofortige Bearbeitung erforderlich
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Meldungen</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.neu || 0}</div>
            <p className="text-xs text-muted-foreground">
              Noch nicht bearbeitet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erledigt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.erledigt || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Abgeschlossene Fälle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Neueste offene Fälle</CardTitle>
            <CardDescription>
              Die letzten 5 offenen Schadensmeldungen
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/cases">
              Alle Fälle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Keine offenen Fälle vorhanden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UrgencyDot urgency={c.urgency} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {c.case_number}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">
                        {c.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.reporter?.first_name} {c.reporter?.last_name}
                        {c.unit?.name ? ` - ${c.unit.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDate(c.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UrgencyDot({ urgency }: { urgency: string }) {
  const colors: Record<string, string> = {
    notfall: "bg-red-500",
    dringend: "bg-orange-500",
    normal: "bg-blue-500",
  }
  return (
    <div
      className={cn(
        "h-3 w-3 rounded-full shrink-0",
        colors[urgency] || "bg-gray-400"
      )}
      title={
        urgency === "notfall"
          ? "Notfall"
          : urgency === "dringend"
            ? "Dringend"
            : "Normal"
      }
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    neu: { label: "Neu", variant: "default" },
    in_bearbeitung: { label: "In Bearbeitung", variant: "secondary" },
    warte_auf_handwerker: { label: "Warte auf Handwerker", variant: "outline" },
    termin_vereinbart: { label: "Termin vereinbart", variant: "outline" },
    erledigt: { label: "Erledigt", variant: "secondary" },
    abgelehnt: { label: "Abgelehnt", variant: "destructive" },
  }
  const c = config[status] || { label: status, variant: "outline" as const }
  return (
    <Badge variant={c.variant} className="text-[10px] px-1.5 py-0">
      {c.label}
    </Badge>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
