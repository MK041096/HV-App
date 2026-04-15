"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, Users, ClipboardList, Home, TrendingUp,
  ArrowRight, Loader2, AlertTriangle, CheckCircle2,
  Clock, Wrench, XCircle, Zap, Activity, RefreshCw,
  Ban, ShieldAlert,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface SuspiciousTenant {
  tenant_id: string
  tenant_name: string
  email: string | null
  report_count: number
  org_name: string
  unit_name: string | null
  blocked_until: string | null
  is_blocked: boolean | null | undefined
}

interface PlatformStats {
  total_organizations: number
  total_users: number
  total_cases: number
  total_units: number
  new_orgs_this_month: number
  cases_by_status: Record<string, number>
  cases_by_urgency: Record<string, number>
  orgs_by_status: Record<string, number>
  cases_per_month: { month: string; cases: number }[]
  orgs_per_month: { month: string; orgs: number }[]
  recent_errors: { id: string; action: string; entity_type: string; details: Record<string, unknown>; created_at: string; organization_id: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  neu: "Neu",
  warte_auf_handwerker: "Warte auf Werkstatt",
  termin_vereinbart: "Termin vereinbart",
  erledigt: "Erledigt",
  abgelehnt: "Abgelehnt",
}

const STATUS_COLORS: Record<string, string> = {
  neu: "#38bdf8",
  warte_auf_handwerker: "#a78bfa",
  termin_vereinbart: "#6366f1",
  erledigt: "#22c55e",
  abgelehnt: "#9ca3af",
}

const URGENCY_COLORS = ["#ef4444", "#f97316", "#3b82f6"]

function StatCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: number | string; sub: string
  icon: React.ElementType; color: string; trend?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-5 ${color}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color} bg-opacity-15`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString("de-AT") : value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{sub}</p>
          {trend && <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background shadow-lg px-3 py-2 text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: { name: string; value: number; color: string }, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Suspicious activity
  const [suspicious, setSuspicious] = useState<SuspiciousTenant[]>([])
  const [blockingId, setBlockingId] = useState<string | null>(null)

  async function loadStats() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error((await res.json()).error || "Fehler beim Laden")
      setStats((await res.json()).data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler")
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSuspicious() {
    try {
      const res = await fetch("/api/admin/suspicious-activity")
      if (res.ok) {
        const json = await res.json()
        setSuspicious(json.data || [])
      }
    } catch { /* still show main page */ }
  }

  async function handleBlock(tenantId: string, action: "block_1day" | "unblock") {
    setBlockingId(tenantId)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        await loadSuspicious()
      }
    } finally {
      setBlockingId(null)
    }
  }

  useEffect(() => {
    loadStats()
    loadSuspicious()
    // Auto-refresh Alarm alle 60 Sekunden
    const interval = setInterval(loadSuspicious, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="p-6">
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    </div>
  )

  if (!stats) return null

  const pieData = [
    { name: "Notfall", value: stats.cases_by_urgency.notfall },
    { name: "Dringend", value: stats.cases_by_urgency.dringend },
    { name: "Normal", value: stats.cases_by_urgency.normal },
  ]

  const statusBarData = Object.entries(stats.cases_by_status).map(([key, val]) => ({
    name: STATUS_LABELS[key] || key,
    value: val,
    color: STATUS_COLORS[key] || "#94a3b8",
  }))

  const openCases = (stats.cases_by_status.neu || 0) +
    (stats.cases_by_status.warte_auf_handwerker || 0) +
    (stats.cases_by_status.termin_vereinbart || 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Übersicht</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Stand: {lastRefresh.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })} Uhr
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Aktualisieren
        </Button>
      </div>

      {/* Suspicious Activity Alarm */}
      <Card className={suspicious.length > 0 ? "border-red-300 bg-red-50/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className={`h-4 w-4 ${suspicious.length > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              Alarm: Verdächtige Meldungsaktivität
            </CardTitle>
            <div className="flex items-center gap-2">
              {suspicious.length > 0 && (
                <Badge className="bg-red-600 text-white text-xs">{suspicious.length} Alarm{suspicious.length !== 1 ? "e" : ""}</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={loadSuspicious} className="h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Prüfen
              </Button>
            </div>
          </div>
          <CardDescription>
            Mieter mit 5 oder mehr Meldungen in den letzten 2 Stunden — wird jede Minute automatisch aktualisiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suspicious.length === 0 ? (
            <div className="flex items-center gap-3 py-3 text-green-700">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm font-medium">Alles ruhig — keine auffällige Aktivität in den letzten 2 Stunden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suspicious.map((t, i) => (
                <div key={t.tenant_id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{t.tenant_name}</span>
                        {t.is_blocked ? (
                          <Badge variant="outline" className="text-[10px] bg-red-100 text-red-800 border-red-200">
                            <Ban className="h-2.5 w-2.5 mr-1" />Gesperrt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-orange-100 text-orange-800 border-orange-200">
                            {t.report_count}× in 2h
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.org_name}{t.unit_name ? ` · ${t.unit_name}` : ""}
                        {t.email && <span className="ml-1">· {t.email}</span>}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {t.is_blocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleBlock(t.tenant_id, "unblock")}
                          disabled={blockingId === t.tenant_id}
                        >
                          {blockingId === t.tenant_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Freigeben"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleBlock(t.tenant_id, "block_1day")}
                          disabled={blockingId === t.tenant_id}
                        >
                          {blockingId === t.tenant_id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <><Ban className="h-3 w-3 mr-1" />1 Tag sperren</>
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="HV-Kunden"
          value={stats.total_organizations}
          sub="Registrierte Hausverwaltungen"
          icon={Building2}
          color="bg-blue-500 text-blue-600"
          trend={stats.new_orgs_this_month > 0 ? `+${stats.new_orgs_this_month} diesen Monat` : undefined}
        />
        <StatCard
          title="Nutzer gesamt"
          value={stats.total_users}
          sub="HV-Mitarbeiter & Mieter"
          icon={Users}
          color="bg-green-500 text-green-600"
        />
        <StatCard
          title="Schadensmeldungen"
          value={stats.total_cases}
          sub="Plattformweit gesamt"
          icon={ClipboardList}
          color="bg-orange-500 text-orange-600"
        />
        <StatCard
          title="Offene Fälle"
          value={openCases}
          sub="Aktuell in Bearbeitung"
          icon={Activity}
          color="bg-red-500 text-red-600"
        />
        <StatCard
          title="Wohneinheiten"
          value={stats.total_units}
          sub="Verwaltete Einheiten"
          icon={Home}
          color="bg-purple-500 text-purple-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Cases per Month — Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Schadensmeldungen (letzte 6 Monate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.cases_per_month} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="casesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cases" name="Meldungen" stroke="#f97316" strokeWidth={2} fill="url(#casesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orgs per Month — Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Neue HV-Kunden (letzte 6 Monate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.orgs_per_month} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orgsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="orgs" name="Neue Kunden" stroke="#3b82f6" strokeWidth={2} fill="url(#orgsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Cases by Status — Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              Fälle nach Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Fälle" radius={[4, 4, 0, 0]}>
                  {statusBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cases by Urgency — Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-500" />
              Dringlichkeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={URGENCY_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Org Status + Quick Links */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Org Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kunden-Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Aktiv", value: stats.orgs_by_status.active, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
              { label: "Ausstehend (warten auf Freischaltung)", value: stats.orgs_by_status.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Inaktiv", value: stats.orgs_by_status.inactive, icon: XCircle, color: "text-gray-500", bg: "bg-gray-50" },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between rounded-lg px-4 py-3 ${item.bg}`}>
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
            <Button asChild className="w-full mt-2">
              <Link href="/admin/organizations">
                <Building2 className="mr-2 h-4 w-4" />
                Alle Kunden verwalten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* System Error Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              System-Fehlerlog
            </CardTitle>
            <CardDescription>Letzte Systemfehler (CARL, E-Mail, Upload)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent_errors.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-700">Keine Fehler</p>
                <p className="text-xs text-muted-foreground mt-0.5">System läuft einwandfrei</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {stats.recent_errors.map(err => (
                  <div key={err.id} className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-white px-1.5 py-0">
                          {err.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(err.created_at).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {err.details && Object.keys(err.details).length > 0 && (
                        <p className="text-xs text-red-700 mt-0.5 truncate">
                          {JSON.stringify(err.details).slice(0, 80)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Werkstatt KPI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-500" />
            Plattform-Kennzahlen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: "Ø Fälle pro Kunde", value: stats.total_organizations > 0 ? (stats.total_cases / stats.total_organizations).toFixed(1) : "—" },
              { label: "Ø Einheiten pro Kunde", value: stats.total_organizations > 0 ? (stats.total_units / stats.total_organizations).toFixed(0) : "—" },
              { label: "Abschlussrate", value: stats.total_cases > 0 ? `${((stats.cases_by_status.erledigt / stats.total_cases) * 100).toFixed(0)}%` : "—" },
              { label: "Notfall-Anteil", value: stats.total_cases > 0 ? `${((stats.cases_by_urgency.notfall / stats.total_cases) * 100).toFixed(1)}%` : "—" },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
