"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DamageReport {
  id: string
  title: string
  status: string
  created_at: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  new: { label: "Neu", variant: "default" },
  in_progress: { label: "In Bearbeitung", variant: "secondary" },
  waiting_for_parts: { label: "Wartet auf Teile", variant: "outline" },
  scheduled: { label: "Termin geplant", variant: "outline" },
  resolved: { label: "Erledigt", variant: "default" },
  closed: { label: "Geschlossen", variant: "default" },
}

export default function MeinBereichPage() {
  const [recentReports, setRecentReports] = useState<DamageReport[]>([])
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Load profile for greeting
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single()

        if (profile?.first_name) {
          setUserName(profile.first_name)
        }

        // Load recent damage reports
        const { data: reports } = await supabase
          .from("damage_reports")
          .select("id, title, status, created_at")
          .eq("reporter_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5)

        if (reports) {
          setRecentReports(reports)

          const total = reports.length
          const open = reports.filter(
            (r) => !["resolved", "closed"].includes(r.status)
          ).length
          const resolved = reports.filter((r) =>
            ["resolved", "closed"].includes(r.status)
          ).length

          setStats({ total, open, resolved })
        }
      } catch {
        // Silently fail -- layout handles auth
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {userName ? `Hallo, ${userName}!` : "Willkommen!"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Hier sehen Sie eine Übersicht Ihrer Schadensmeldungen.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/mein-bereich/meldungen/neu">
            <Plus className="mr-2 h-4 w-4" />
            Neue Schadensmeldung
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/mein-bereich/meldungen">
            <ClipboardList className="mr-2 h-4 w-4" />
            Alle Meldungen
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Offen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Erledigt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Letzte Meldungen</CardTitle>
          <CardDescription>
            Ihre letzten 5 Schadensmeldungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Sie haben noch keine Schadensmeldungen erstellt.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/mein-bereich/meldungen/neu">
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Meldung erstellen
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const statusInfo = STATUS_CONFIG[report.status] || {
                  label: report.status,
                  variant: "outline" as const,
                }

                return (
                  <Link
                    key={report.id}
                    href={`/mein-bereich/meldungen/${report.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {report.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString(
                          "de-AT",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant} className="ml-3 shrink-0">
                      {statusInfo.label}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
