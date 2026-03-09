"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Loader2, Home, X,
  UserCheck, Clock, CircleDashed, ClipboardList, MapPin,
  Users, FileSpreadsheet, Copy, Check, Mail, AlertTriangle, Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"

// ── Types ──

interface UnitTenant {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string
}

interface UnitItem {
  id: string
  name: string
  address: string | null
  floor: string | null
  created_at: string
  tenant_status: "occupied" | "vacant" | "pending"
  tenant_status_label: string
  tenant: UnitTenant | null
  pending_code: { id: string; code: string; invited_first_name: string | null; invited_last_name: string | null; invited_email: string | null; created_at: string; expires_at: string } | null
  damage_report_count: number
}

interface Pagination {
  page: number
  per_page: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

interface Summary {
  total_units: number
  occupied: number
  pending: number
  vacant: number
}

type SortField = "name" | "address" | "created_at"
type SortOrder = "asc" | "desc"

// ── Helpers ──

function getTenantStatusConfig(status: string) {
  switch (status) {
    case "occupied": return { label: "Aktiver Mieter", icon: UserCheck, className: "bg-green-100 text-green-800 border-green-200" }
    case "pending": return { label: "Ausstehend", icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    default: return { label: "Kein Mieter", icon: CircleDashed, className: "bg-gray-100 text-gray-600 border-gray-200" }
  }
}

// ── Copy Button ──

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="ml-1 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Code kopieren">
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ── Invite Dialog ──

interface InviteDialogProps {
  unit: UnitItem | null
  open: boolean
  onClose: () => void
  onSuccess: (unitId: string, code: string, expiresAt: string) => void
}

function InviteDialog({ unit, open, onClose, onSuccess }: InviteDialogProps) {
  const [email, setEmail] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setEmail(""); setTenantName(""); setError(null) }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!unit) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/hv/units/${unit.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined, tenant_name: tenantName.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler beim Erstellen des Codes")
      onSuccess(unit.id, json.data.code, json.data.expires_at)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mieter einladen</DialogTitle>
          <DialogDescription>
            {unit ? `Aktivierungscode für "${unit.name}" erstellen` : ""}
            {unit?.address && <span className="block text-xs mt-0.5 text-muted-foreground">{unit.address}</span>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tenantName">Name des Mieters (optional)</Label>
            <Input id="tenantName" placeholder="z.B. Max Mustermann" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail-Adresse (optional)</Label>
            <Input id="email" type="email" placeholder="mieter@beispiel.at" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              {email ? "Einladungs-E-Mail mit Aktivierungscode wird versendet." : "Ohne E-Mail wird nur der Code erstellt — Sie können ihn dann manuell weitergeben."}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Abbrechen</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird erstellt...</>
                : email ? <><Mail className="mr-2 h-4 w-4" />Code erstellen &amp; senden</>
                : "Code erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──

export default function UnitsListPage() {
  const router = useRouter()
  const [units, setUnits] = useState<UnitItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteUnit, setInviteUnit] = useState<UnitItem | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteUnit, setDeleteUnit] = useState<UnitItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tenantStatusFilter, setTenantStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1) }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchUnits = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("per_page", "50")
      params.set("sort_by", sortBy)
      params.set("sort_order", sortOrder)
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (tenantStatusFilter) params.set("tenant_status", tenantStatusFilter)
      const res = await fetch(`/api/hv/units?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden der Einheiten")
      }
      const json = await res.json()
      setUnits(json.data || [])
      setPagination(json.pagination || null)
      setSummary(json.summary || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortOrder, debouncedSearch, tenantStatusFilter])

  useEffect(() => { fetchUnits() }, [fetchUnits])

  async function handleDelete(unit: UnitItem) {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/hv/units/${unit.id}/tenant`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Löschen')
      // Update unit to vacant
      setUnits((prev) => prev.filter((u) => u.id !== unit.id))
      setDeleteOpen(false)
      setDeleteUnit(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Löschen')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleInviteSuccess(unitId: string, code: string, expiresAt: string) {
    setUnits((prev) => prev.map((u) => u.id === unitId ? {
      ...u,
      tenant_status: "pending" as const,
      tenant_status_label: "Registrierung ausstehend",
      pending_code: { id: "", code, invited_first_name: null, invited_last_name: null, invited_email: null, created_at: new Date().toISOString(), expires_at: expiresAt },
    } : u))
  }

  function handleSort(field: SortField) {
    if (sortBy === field) { setSortOrder(sortOrder === "asc" ? "desc" : "asc") }
    else { setSortBy(field); setSortOrder(field === "created_at" ? "desc" : "asc") }
    setPage(1)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    return sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
  }

  const activeFilters = [tenantStatusFilter].filter(Boolean).length
  const vacantCount = summary?.vacant ?? 0

  function clearFilters() { setTenantStatusFilter(""); setSearchQuery(""); setPage(1) }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mieter &amp; Einheiten</h1>
          <p className="text-muted-foreground mt-1">
            Alle Wohneinheiten mit Mieterstatus und Aktivierungscodes
            {summary && <span className="ml-1">({summary.total_units} gesamt)</span>}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/units/import">
            <FileSpreadsheet className="mr-2 h-4 w-4" />Excel importieren
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-3">
          {[
            { key: "occupied", label: "Belegt", count: summary.occupied, icon: UserCheck, color: "text-green-600" },
            { key: "pending", label: "Ausstehend", count: summary.pending, icon: Clock, color: "text-yellow-600" },
            { key: "vacant", label: "Leer", count: summary.vacant, icon: CircleDashed, color: "text-gray-600" },
          ].map(({ key, label, count, icon: Icon, color }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${tenantStatusFilter === key ? "ring-2 ring-primary" : "hover:bg-accent/50"}`}
              onClick={() => { setTenantStatusFilter(tenantStatusFilter === key ? "" : key); setPage(1) }}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vacant hint */}
      {vacantCount > 0 && !tenantStatusFilter && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-yellow-800">
            <span className="font-medium">{vacantCount} Einheit{vacantCount !== 1 ? "en" : ""} ohne Mieter</span>
            {" — klicken Sie auf Einladen, um einen Aktivierungscode zu erstellen."}
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Einheit oder Adresse suchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Suche löschen">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Filter className="mr-2 h-4 w-4" />Filter
                  {activeFilters > 0 && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilters}</Badge>}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <Separator className="my-2" />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Mieterstatus</label>
                <Select value={tenantStatusFilter || "alle"} onValueChange={(v) => { setTenantStatusFilter(v === "alle" ? "" : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Alle Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Status</SelectItem>
                    <SelectItem value="occupied">Aktiver Mieter</SelectItem>
                    <SelectItem value="pending">Registrierung ausstehend</SelectItem>
                    <SelectItem value="vacant">Kein Mieter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeFilters > 0 && (
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-3.5 w-3.5" />Alle Filter zurücksetzen</Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchUnits}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">Einheit <SortIcon field="name" /></button></TableHead>
                <TableHead><button onClick={() => handleSort("address")} className="flex items-center gap-1 hover:text-foreground transition-colors">Adresse <SortIcon field="address" /></button></TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mieter</TableHead>
                <TableHead>Aktivierungscode</TableHead>
                <TableHead>Meldungen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                ))
              ) : units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Home className="h-10 w-10 opacity-50" /><p>Keine Einheiten gefunden</p>
                      {(debouncedSearch || activeFilters > 0) && <Button variant="ghost" size="sm" onClick={clearFilters}>Filter zurücksetzen</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : units.map((unit) => {
                const sc = getTenantStatusConfig(unit.tenant_status)
                const SI = sc.icon
                return (
                  <TableRow
                    key={unit.id}
                    className={`transition-all ${unit.tenant ? "cursor-pointer hover:bg-accent/50 hover:shadow-[inset_4px_0_0_0_rgba(0,0,0,0.75)]" : "hover:bg-accent/50"}`}
                    onClick={() => unit.tenant && router.push(`/dashboard/tenants/${unit.tenant.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{unit.name}</span>
                        {unit.floor && <span className="text-xs text-muted-foreground">({unit.floor})</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {unit.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate max-w-[180px]">{unit.address}</span>
                        </div>
                      ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                    )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sc.className}><SI className="mr-1 h-3 w-3" />{sc.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {unit.tenant ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <Link href={`/dashboard/tenants/${unit.tenant.id}`} className="text-sm text-primary hover:underline">{unit.tenant.full_name}</Link>
                        </div>
                      ) : unit.pending_code ? (
                        <div className="flex items-center gap-1.5">
                          {unit.pending_code.invited_first_name || unit.pending_code.invited_last_name
                            ? <span className="text-xs text-muted-foreground">{[unit.pending_code.invited_first_name, unit.pending_code.invited_last_name].filter(Boolean).join(" ")}</span>
                            : <span className="text-xs text-muted-foreground italic">Eingeladen</span>}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {unit.tenant_status === "occupied" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : unit.pending_code ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded tracking-wider">{unit.pending_code.code}</code>
                          <CopyCodeButton code={unit.pending_code.code} />
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setInviteUnit(unit); setInviteOpen(true) }}>Einladen</Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{unit.damage_report_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteUnit(unit); setDeleteOpen(true) }} title="Einheit löschen"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 space-y-2">
              <Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-32" />
            </CardContent></Card>
          ))
        ) : units.length === 0 ? (
          <Card><CardContent className="py-10 text-center">
            <Home className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Keine Einheiten gefunden</p>
            {(debouncedSearch || activeFilters > 0) && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>Filter zurücksetzen</Button>
            )}
          </CardContent></Card>
        ) : units.map((unit) => {
          const sc = getTenantStatusConfig(unit.tenant_status)
          return (
            <Card
              key={unit.id}
              className={`transition-all ${unit.tenant ? "cursor-pointer hover:bg-accent/50 hover:shadow-[inset_4px_0_0_0_rgba(0,0,0,0.75)]" : "hover:bg-accent/50"}`}
              onClick={() => unit.tenant && router.push(`/dashboard/tenants/${unit.tenant.id}`)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm">{unit.name}</span>
                    {unit.floor && <span className="text-xs text-muted-foreground">({unit.floor})</span>}
                    <Badge variant="outline" className={sc.className + " text-[10px]"}>{sc.label}</Badge>
                  </div>
                  {unit.address && <p className="text-xs text-muted-foreground mt-1">{unit.address}</p>}
                  {unit.tenant && (
                    <Link href={`/dashboard/tenants/${unit.tenant.id}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                      <Users className="h-3 w-3" />{unit.tenant.full_name}
                    </Link>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ClipboardList className="h-3 w-3" />{unit.damage_report_count} Meldungen
                    </span>
                    {unit.tenant_status !== "occupied" && (
                      unit.pending_code ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded tracking-wider">{unit.pending_code.code}</code>
                          <CopyCodeButton code={unit.pending_code.code} />
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setInviteUnit(unit); setInviteOpen(true) }}>Einladen</Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Seite {pagination.page} von {pagination.total_pages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.has_prev || isLoading} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Zurück
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_next || isLoading} onClick={() => setPage(page + 1)}>
              Weiter<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mieter entfernen</DialogTitle>
            <DialogDescription>
              {deleteUnit?.tenant_status === 'occupied'
                ? `"${deleteUnit?.name}": Der Mieter wird entfernt und der Account deaktiviert. Diese Aktion kann nicht rückgängig gemacht werden.`
                : `"${deleteUnit?.name}": Die ausstehende Einladung wird zurückgezogen.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Abbrechen</Button>
            <Button variant="destructive" onClick={() => deleteUnit && handleDelete(deleteUnit)} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird entfernt...</> : 'Entfernen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InviteDialog
        unit={inviteUnit}
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteUnit(null) }}
        onSuccess={handleInviteSuccess}
      />
    </div>
  )
}