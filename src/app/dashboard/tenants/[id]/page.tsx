"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  MapPin,
  Clock,
  ClipboardList,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Eye,
  ShieldAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ── Types ──

interface TenantUnit {
  id: string
  name: string
  address: string | null
  floor: string | null
}

interface DamageReport {
  id: string
  case_number: string
  title: string
  category: string
  category_label: string
  status: string
  status_label: string
  urgency: string
  urgency_label: string
  created_at: string
  updated_at: string
  closed_at: string | null
  unit: { id: string; name: string; address: string | null } | null
}

interface ActivationCode {
  id: string
  status: string
  created_at: string
  expires_at: string
  used_at: string | null
}

interface TenantDetail {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string
  email: string | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  unit: TenantUnit | null
  unit_id: string | null
  activation_codes: ActivationCode[] | null
  damage_reports: {
    items: DamageReport[]
    total_count: number
    status_counts: Record<string, number>
  }
}

// ── Helpers ──

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getUrgencyConfig(urgency: string) {
  switch (urgency) {
    case "notfall":
      return {
        label: "Notfall",
        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      }
    case "dringend":
      return {
        label: "Dringend",
        className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
      }
    default:
      return {
        label: "Normal",
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      }
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "neu":
      return {
        label: "Neu",
        className: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400",
      }
    case "in_bearbeitung":
      return {
        label: "In Bearbeitung",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      }
    case "warte_auf_handwerker":
      return {
        label: "Warte auf Handwerker",
        className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
      }
    case "termin_vereinbart":
      return {
        label: "Termin vereinbart",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
      }
    case "erledigt":
      return {
        label: "Erledigt",
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      }
    case "abgelehnt":
      return {
        label: "Abgelehnt",
        className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
      }
    default:
      return { label: status, className: "" }
  }
}

// ── Page ──

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Deactivate/Reactivate state
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [deactivateReason, setDeactivateReason] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch tenant
  async function fetchTenant() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/hv/tenants/${id}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden des Mieterprofils")
      }
      const json = await res.json()
      setTenant(json.data as TenantDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTenant()
  }, [id])

  // Handle deactivate/reactivate
  async function handleStatusChange(action: "deactivate" | "reactivate") {
    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      const res = await fetch(`/api/hv/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: deactivateReason || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler")

      setUpdateMessage({
        type: "success",
        text: json.message || `Mieter wurde ${action === "deactivate" ? "deaktiviert" : "reaktiviert"}.`,
      })
      setDeactivateReason("")
      setDialogOpen(false)
      await fetchTenant()
    } catch (err) {
      setUpdateMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Aktualisieren",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // ── Render ──

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
            <p className="text-destructive font-medium">{error || "Mieter nicht gefunden"}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => router.push("/dashboard/tenants")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
              <Button variant="outline" onClick={fetchTenant}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const openReports = tenant.damage_reports.items.filter(
    (r) => !["erledigt", "abgelehnt"].includes(r.status)
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/tenants">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Zurück</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {tenant.full_name}
              </h1>
              {tenant.is_active ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  <UserCheck className="mr-1 h-3 w-3" />
                  Aktiv
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-800 border-gray-200"
                >
                  <UserX className="mr-1 h-3 w-3" />
                  Deaktiviert
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Mieter-ID: {tenant.id.substring(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {updateMessage && (
        <Alert variant={updateMessage.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="flex items-center justify-between">
            {updateMessage.text}
            <button onClick={() => setUpdateMessage(null)}>
              <span className="sr-only">Schliessen</span>
              &times;
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* DSGVO Notice */}
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Datenschutzhinweis: Die angezeigten personenbezogenen Daten unterliegen der DSGVO.
          Der Zugriff auf dieses Profil wurde protokolliert.
        </AlertDescription>
      </Alert>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile & Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profil-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{tenant.full_name}</p>
                  </div>
                </div>

                {tenant.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">E-Mail</p>
                      <p className="font-medium">{tenant.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Registriert am</p>
                    <p className="font-medium">{formatDateTime(tenant.created_at)}</p>
                  </div>
                </div>

                {!tenant.is_active && tenant.deleted_at && (
                  <div className="flex items-start gap-3">
                    <UserX className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deaktiviert am</p>
                      <p className="font-medium text-red-600">
                        {formatDateTime(tenant.deleted_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Unit Assignment */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Wohneinheit</p>
                {tenant.unit ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{tenant.unit.name}</p>
                      {tenant.unit.address && (
                        <p className="text-xs text-muted-foreground">{tenant.unit.address}</p>
                      )}
                      {tenant.unit.floor && (
                        <p className="text-xs text-muted-foreground">
                          Stockwerk: {tenant.unit.floor}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Keine Wohneinheit zugewiesen
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Damage Reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Schadensmeldungen
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {tenant.damage_reports.total_count} gesamt, {openReports} offen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status summary pills */}
              {Object.keys(tenant.damage_reports.status_counts).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(tenant.damage_reports.status_counts).map(([status, count]) => {
                    const config = getStatusConfig(status)
                    return (
                      <Badge
                        key={status}
                        variant="outline"
                        className={config.className + " text-xs"}
                      >
                        {config.label}: {count}
                      </Badge>
                    )
                  })}
                </div>
              )}

              {tenant.damage_reports.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Keine Schadensmeldungen vorhanden</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Fall-Nr.</TableHead>
                          <TableHead>Titel</TableHead>
                          <TableHead>Kategorie</TableHead>
                          <TableHead>Dringlichkeit</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Erstellt</TableHead>
                          <TableHead className="w-[50px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenant.damage_reports.items.map((report) => {
                          const urgencyConfig = getUrgencyConfig(report.urgency)
                          const statusConfig = getStatusConfig(report.status)

                          return (
                            <TableRow
                              key={report.id}
                              className="cursor-pointer hover:bg-accent/50"
                              onClick={() => router.push(`/dashboard/cases/${report.id}`)}
                            >
                              <TableCell className="font-mono text-xs">
                                {report.case_number}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium truncate max-w-[200px]">
                                  {report.title}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {report.category_label}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={urgencyConfig.className + " text-[10px]"}
                                >
                                  {urgencyConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={statusConfig.className + " text-[10px]"}
                                >
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(report.created_at)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/dashboard/cases/${report.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Fall öffnen</span>
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {tenant.damage_reports.items.map((report) => {
                      const urgencyConfig = getUrgencyConfig(report.urgency)
                      const statusConfig = getStatusConfig(report.status)

                      return (
                        <Link key={report.id} href={`/dashboard/cases/${report.id}`}>
                          <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-muted-foreground">
                                {report.case_number}
                              </span>
                              <Badge
                                variant="outline"
                                className={urgencyConfig.className + " text-[10px]"}
                              >
                                {urgencyConfig.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={statusConfig.className + " text-[10px]"}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm mt-1.5 truncate">
                              {report.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{report.category_label}</span>
                              <span>{formatDate(report.created_at)}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Schadensmeldungen</span>
                <span className="text-sm font-bold">
                  {tenant.damage_reports.total_count}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offene Fälle</span>
                <span className="text-sm font-bold text-orange-600">
                  {openReports}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registriert seit</span>
                <span className="text-sm font-medium">
                  {formatDate(tenant.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Deactivate / Reactivate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konto-Verwaltung</CardTitle>
              <CardDescription>
                {tenant.is_active
                  ? "Mieter-Account deaktivieren (z.B. nach Auszug)"
                  : "Mieter-Account reaktivieren"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.is_active ? (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <UserX className="mr-2 h-4 w-4" />
                      Mieter deaktivieren
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mieter deaktivieren</DialogTitle>
                      <DialogDescription>
                        Der Mieter &quot;{tenant.full_name}&quot; wird deaktiviert und kann sich
                        nicht mehr einloggen. Diese Aktion kann rueckgaengig gemacht werden.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="deactivate-reason" className="text-sm mb-1.5 block">
                        Grund (optional)
                      </Label>
                      <Input
                        id="deactivate-reason"
                        placeholder="z.B. Auszug, Vertragskuendigung..."
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={isUpdating}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusChange("deactivate")}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="mr-2 h-4 w-4" />
                        )}
                        Deaktivieren
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleStatusChange("reactivate")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-4 w-4" />
                  )}
                  Mieter reaktivieren
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Activation Codes (if any) */}
          {tenant.activation_codes && tenant.activation_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktivierungscodes</CardTitle>
                <CardDescription>
                  Codes für die Registrierung dieses Mieters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tenant.activation_codes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between text-sm p-2 rounded-lg border"
                    >
                      <div>
                        <Badge
                          variant="outline"
                          className={
                            code.status === "used"
                              ? "bg-green-100 text-green-800 border-green-200 text-[10px]"
                              : code.status === "expired"
                                ? "bg-gray-100 text-gray-800 border-gray-200 text-[10px]"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]"
                          }
                        >
                          {code.status === "used"
                            ? "Verwendet"
                            : code.status === "expired"
                              ? "Abgelaufen"
                              : "Ausstehend"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(code.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
