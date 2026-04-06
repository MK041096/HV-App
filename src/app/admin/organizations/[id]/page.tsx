"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
  Users,
  ClipboardList,
  Home,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Upload,
  Headset,
  FileSpreadsheet,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface UserRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role: string
  created_at: string
}

interface CaseRow {
  id: string
  case_number: string
  title: string
  status: string
  urgency: string
  created_at: string
}

interface OrgDetail {
  id: string
  name: string
  created_at: string
  avv_accepted_at: string | null
  is_suspended: boolean
  unit_count: number
  tenant_count: number
  case_count: number
  open_case_count: number
  users: UserRow[]
  recent_cases: CaseRow[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const ROLE_LABELS: Record<string, string> = {
  hv_admin: "Administrator",
  hv_mitarbeiter: "Sachbearbeiter",
  mieter: "Mieter",
  platform_admin: "Platform Admin",
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  neu: { label: "Neu", variant: "default" },
  in_bearbeitung: { label: "In Bearbeitung", variant: "secondary" },
  warte_auf_handwerker: { label: "Warte auf HW", variant: "outline" },
  termin_vereinbart: { label: "Termin vereinbart", variant: "outline" },
  erledigt: { label: "Erledigt", variant: "secondary" },
  abgelehnt: { label: "Abgelehnt", variant: "destructive" },
}

const URGENCY_LABELS: Record<string, string> = {
  notfall: "Notfall",
  dringend: "Dringend",
  normal: "Normal",
}

export default function AdminOrganizationDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Support upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    units_created: number; units_skipped: number; codes_generated: number; emails_sent: number
    errors: { row: number; message: string }[]
  } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function loadOrg() {
      try {
        const res = await fetch(`/api/admin/organizations/${id}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Fehler beim Laden")
        }
        const json = await res.json()
        setOrg(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler")
      } finally {
        setIsLoading(false)
      }
    }

    loadOrg()
  }, [id])

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setIsImporting(true)
    setImportResult(null)
    setImportError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/organizations/${id}/import-units`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setImportError(json.error || 'Import fehlgeschlagen'); return }
      setImportResult(json.data)
      // Refresh org stats
      const orgRes = await fetch(`/api/admin/organizations/${id}`)
      if (orgRes.ok) { const orgJson = await orgRes.json(); setOrg(orgJson.data) }
    } catch {
      setImportError('Netzwerkfehler beim Import')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error ?? "Organisation nicht gefunden"}</p>
        </div>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/organizations">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm font-mono">{org.id}</p>
      </div>

      {/* Info section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organisationsdetails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                Registriert
              </dt>
              <dd className="font-medium">{formatDate(org.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                AVV akzeptiert
              </dt>
              <dd className="flex items-center gap-1.5">
                {org.avv_accepted_at ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{formatDate(org.avv_accepted_at)}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Nicht akzeptiert</span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                Status
              </dt>
              <dd>
                {org.is_suspended ? (
                  <Badge variant="destructive">Gesperrt</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    Aktiv
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Einheiten</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.unit_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mieter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.tenant_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fälle</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.case_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {org.open_case_count} offen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benutzer dieser Organisation</CardTitle>
          <CardDescription>HV-Administratoren und Sachbearbeiter</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {org.users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Keine Benutzer gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Registriert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {org.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") || (
                          <span className="text-muted-foreground italic">Kein Name</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === "hv_admin" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Letzte 10 Schadensmeldungen</CardTitle>
          <CardDescription>Neueste Meldungen dieser Hausverwaltung</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {org.recent_cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Keine Schadensmeldungen vorhanden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fallnummer</TableHead>
                    <TableHead>Titel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dringlichkeit</TableHead>
                    <TableHead>Erstellt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {org.recent_cases.map((c) => {
                    const statusConf = STATUS_CONFIG[c.status] ?? {
                      label: c.status,
                      variant: "outline" as const,
                    }
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {c.case_number}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {c.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConf.variant} className="text-xs">
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span
                            className={
                              c.urgency === "notfall"
                                ? "text-red-600 font-medium"
                                : c.urgency === "dringend"
                                ? "text-orange-600 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {URGENCY_LABELS[c.urgency] ?? c.urgency}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(c.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SUPPORT BEREICH ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Headset className="h-4 w-4" />
            Support-Tools
          </CardTitle>
          <CardDescription>
            Direkte Hilfe für diese Hausverwaltung — nur für Platform-Admins sichtbar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Einheiten-Upload */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Einheiten für diese HV importieren</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Falls die HV Probleme mit dem Excel-Upload hat, können Sie die Datei hier direkt hochladen.
                  Einheiten, Aktivierungscodes und Einladungsemails werden automatisch erstellt — genau wie
                  wenn die HV es selbst machen würde.
                </p>
              </div>
            </div>

            <div className="ml-8 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                id="admin-unit-import"
                onChange={handleImportFile}
                disabled={isImporting}
              />
              <label htmlFor="admin-unit-import">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={isImporting}
                  className="cursor-pointer"
                >
                  <span>
                    {isImporting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird importiert...</>
                      : <><Upload className="mr-2 h-4 w-4" />Excel / CSV hochladen</>
                    }
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">
                .xlsx, .xls oder .csv · max. 5 MB · bis zu 1.000 Einheiten
              </p>

              {importError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Import abgeschlossen
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Einheiten erstellt', value: importResult.units_created },
                      { label: 'Übersprungen', value: importResult.units_skipped },
                      { label: 'Codes generiert', value: importResult.codes_generated },
                      { label: 'E-Mails gesendet', value: importResult.emails_sent },
                    ].map((s) => (
                      <div key={s.label} className="rounded bg-white border px-3 py-2 text-center">
                        <p className="text-lg font-bold text-green-700">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-amber-700">{importResult.errors.length} Fehler:</p>
                      {importResult.errors.slice(0, 5).map((e, i) => (
                        <p key={i} className="text-xs text-amber-700">Zeile {e.row}: {e.message}</p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-xs text-amber-600">...und {importResult.errors.length - 5} weitere</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Hinweis Sperrung */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Konto sperren / reaktivieren</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Diese Funktion wird in einer zukünftigen Version verfügbar sein.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
