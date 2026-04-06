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
  Wrench,
  FileText,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  // Support: Einheiten
  const unitFileRef = useRef<HTMLInputElement>(null)
  const [isImportingUnits, setIsImportingUnits] = useState(false)
  const [unitResult, setUnitResult] = useState<{ units_created: number; units_skipped: number; codes_generated: number; emails_sent: number; errors: { row: number; message: string }[] } | null>(null)
  const [unitError, setUnitError] = useState<string | null>(null)

  // Support: Werkstätten
  const contractorFileRef = useRef<HTMLInputElement>(null)
  const [isImportingContractors, setIsImportingContractors] = useState(false)
  const [contractorResult, setContractorResult] = useState<{ contractors_created: number; contractors_skipped: number; errors: { row: number; message: string }[] } | null>(null)
  const [contractorError, setContractorError] = useState<string | null>(null)

  // Support: Dokument hochladen
  const docFileRef = useRef<HTMLInputElement>(null)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [docResult, setDocResult] = useState<string | null>(null)
  const [docError, setDocError] = useState<string | null>(null)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('sonstiges')
  const [docLiegenschaft, setDocLiegenschaft] = useState('')

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

  async function handleImportUnits(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setIsImportingUnits(true); setUnitResult(null); setUnitError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`/api/admin/organizations/${id}/import-units`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setUnitError(json.error || 'Import fehlgeschlagen'); return }
      setUnitResult(json.data)
      const orgRes = await fetch(`/api/admin/organizations/${id}`)
      if (orgRes.ok) { const orgJson = await orgRes.json(); setOrg(orgJson.data) }
    } catch { setUnitError('Netzwerkfehler') }
    finally { setIsImportingUnits(false); if (unitFileRef.current) unitFileRef.current.value = '' }
  }

  async function handleImportContractors(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setIsImportingContractors(true); setContractorResult(null); setContractorError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`/api/admin/organizations/${id}/import-contractors`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setContractorError(json.error || 'Import fehlgeschlagen'); return }
      setContractorResult(json.data)
    } catch { setContractorError('Netzwerkfehler') }
    finally { setIsImportingContractors(false); if (contractorFileRef.current) contractorFileRef.current.value = '' }
  }

  async function handleUploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setIsUploadingDoc(true); setDocResult(null); setDocError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', docName || file.name)
      fd.append('document_type', docType)
      if (docLiegenschaft.trim()) fd.append('liegenschaft', docLiegenschaft.trim())
      const res = await fetch(`/api/admin/organizations/${id}/upload-document`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setDocError(json.error || 'Upload fehlgeschlagen'); return }
      setDocResult(json.data?.name || 'Dokument')
      setDocName(''); setDocLiegenschaft('')
    } catch { setDocError('Netzwerkfehler') }
    finally { setIsUploadingDoc(false); if (docFileRef.current) docFileRef.current.value = '' }
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
          <Tabs defaultValue="einheiten">
            <TabsList className="w-full">
              <TabsTrigger value="einheiten" className="flex items-center gap-1.5 flex-1">
                <FileSpreadsheet className="h-4 w-4" />
                Einheiten
              </TabsTrigger>
              <TabsTrigger value="werkstaetten" className="flex items-center gap-1.5 flex-1">
                <Wrench className="h-4 w-4" />
                Werkstätten
              </TabsTrigger>
              <TabsTrigger value="dokumente" className="flex items-center gap-1.5 flex-1">
                <FileText className="h-4 w-4" />
                Dokumente
              </TabsTrigger>
            </TabsList>

            {/* TAB: Einheiten */}
            <TabsContent value="einheiten" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Falls die HV Probleme mit dem Excel-Upload hat, können Sie die Datei hier direkt hochladen.
                Einheiten, Aktivierungscodes und Einladungsemails werden automatisch erstellt.
              </p>
              <input
                ref={unitFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                id="admin-unit-import"
                onChange={handleImportUnits}
                disabled={isImportingUnits}
              />
              <label htmlFor="admin-unit-import">
                <Button asChild variant="outline" size="sm" disabled={isImportingUnits} className="cursor-pointer">
                  <span>
                    {isImportingUnits
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird importiert...</>
                      : <><Upload className="mr-2 h-4 w-4" />Excel / CSV hochladen</>
                    }
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">.xlsx, .xls oder .csv · max. 5 MB · bis zu 1.000 Einheiten</p>

              {unitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{unitError}
                </div>
              )}
              {unitResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                    <CheckCircle2 className="h-4 w-4" />Import abgeschlossen
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Einheiten erstellt', value: unitResult.units_created },
                      { label: 'Übersprungen', value: unitResult.units_skipped },
                      { label: 'Codes generiert', value: unitResult.codes_generated },
                      { label: 'E-Mails gesendet', value: unitResult.emails_sent },
                    ].map((s) => (
                      <div key={s.label} className="rounded bg-white border px-3 py-2 text-center">
                        <p className="text-lg font-bold text-green-700">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {unitResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-amber-700">{unitResult.errors.length} Fehler:</p>
                      {unitResult.errors.slice(0, 5).map((e, i) => (
                        <p key={i} className="text-xs text-amber-700">Zeile {e.row}: {e.message}</p>
                      ))}
                      {unitResult.errors.length > 5 && (
                        <p className="text-xs text-amber-600">...und {unitResult.errors.length - 5} weitere</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB: Werkstätten */}
            <TabsContent value="werkstaetten" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Werkstätten (Handwerker) für diese Hausverwaltung importieren. Jede Werkstatt erhält
                automatisch eine Willkommens-E-Mail mit den Zugangsdaten.
              </p>
              <input
                ref={contractorFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                id="admin-contractor-import"
                onChange={handleImportContractors}
                disabled={isImportingContractors}
              />
              <label htmlFor="admin-contractor-import">
                <Button asChild variant="outline" size="sm" disabled={isImportingContractors} className="cursor-pointer">
                  <span>
                    {isImportingContractors
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird importiert...</>
                      : <><Upload className="mr-2 h-4 w-4" />Excel / CSV hochladen</>
                    }
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">
                .xlsx, .xls oder .csv · max. 5 MB · Pflichtfelder: Firmenname, Telefon, E-Mail, Tätigkeit
              </p>

              {contractorError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{contractorError}
                </div>
              )}
              {contractorResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                    <CheckCircle2 className="h-4 w-4" />Import abgeschlossen
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Werkstätten erstellt', value: contractorResult.contractors_created },
                      { label: 'Übersprungen', value: contractorResult.contractors_skipped },
                    ].map((s) => (
                      <div key={s.label} className="rounded bg-white border px-3 py-2 text-center">
                        <p className="text-lg font-bold text-green-700">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {contractorResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-amber-700">{contractorResult.errors.length} Fehler:</p>
                      {contractorResult.errors.slice(0, 5).map((e, i) => (
                        <p key={i} className="text-xs text-amber-700">Zeile {e.row}: {e.message}</p>
                      ))}
                      {contractorResult.errors.length > 5 && (
                        <p className="text-xs text-amber-600">...und {contractorResult.errors.length - 5} weitere</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB: Dokumente */}
            <TabsContent value="dokumente" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Dokumente (Mietverträge, Versicherungspolicen, sonstige Unterlagen) für diese
                Hausverwaltung hochladen — z.B. wenn die HV die Dateien per E-Mail zugeschickt hat.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-name" className="text-sm">Dokumentname (optional)</Label>
                    <Input
                      id="doc-name"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="z.B. Mietvertrag Müller"
                      disabled={isUploadingDoc}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-type" className="text-sm">Dokumenttyp</Label>
                    <Select value={docType} onValueChange={setDocType} disabled={isUploadingDoc}>
                      <SelectTrigger id="doc-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mietvertrag">Mietvertrag</SelectItem>
                        <SelectItem value="versicherung">Versicherungspolice</SelectItem>
                        <SelectItem value="rechnung">Rechnung</SelectItem>
                        <SelectItem value="protokoll">Protokoll</SelectItem>
                        <SelectItem value="sonstiges">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="doc-liegenschaft" className="text-sm">Liegenschaft (optional)</Label>
                  <Input
                    id="doc-liegenschaft"
                    value={docLiegenschaft}
                    onChange={(e) => setDocLiegenschaft(e.target.value)}
                    placeholder="z.B. Hauptstraße 12"
                    disabled={isUploadingDoc}
                  />
                </div>

                <input
                  ref={docFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  id="admin-doc-upload"
                  onChange={handleUploadDoc}
                  disabled={isUploadingDoc}
                />
                <label htmlFor="admin-doc-upload">
                  <Button asChild variant="outline" size="sm" disabled={isUploadingDoc} className="cursor-pointer">
                    <span>
                      {isUploadingDoc
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird hochgeladen...</>
                        : <><Upload className="mr-2 h-4 w-4" />Datei auswählen & hochladen</>
                      }
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">PDF, JPG oder PNG · max. 20 MB</p>
              </div>

              {docError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{docError}
                </div>
              )}
              {docResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Dokument <strong>"{docResult}"</strong> wurde erfolgreich hochgeladen.</span>
                </div>
              )}
            </TabsContent>
          </Tabs>

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
