"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  ClipboardList,
  Home,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PlatformStats {
  total_organizations: number
  total_users: number
  total_cases: number
  total_units: number
  new_orgs_this_month: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Fehler beim Laden")
        }
        const json = await res.json()
        setStats(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Registrierte HV-Kunden",
      value: stats?.total_organizations ?? 0,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Hausverwaltungen auf der Plattform",
    },
    {
      title: "Aktive Nutzer",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
      description: "HV-Mitarbeiter und Mieter",
    },
    {
      title: "Schadensmeldungen gesamt",
      value: stats?.total_cases ?? 0,
      icon: ClipboardList,
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: "Alle Meldungen aller Kunden",
    },
    {
      title: "Wohneinheiten gesamt",
      value: stats?.total_units ?? 0,
      icon: Home,
      color: "text-purple-600",
      bg: "bg-purple-50",
      description: "Verwaltete Einheiten plattformweit",
    },
    {
      title: "Neue Kunden diesen Monat",
      value: stats?.new_orgs_this_month ?? 0,
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
      description: "Neu registriert diesen Monat",
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Übersicht</h1>
        <p className="text-muted-foreground mt-1">SchadensMelder Betreiberansicht</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString("de-AT")}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kundenverwaltung</CardTitle>
          <CardDescription>
            Alle registrierten Hausverwaltungen mit Statistiken und Details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/organizations">
              <Building2 className="mr-2 h-4 w-4" />
              Alle Kunden anzeigen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
