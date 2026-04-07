"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, Loader2, Home, X,
  UserCheck, Clock, CircleDashed, ClipboardList, MapPin,
  Users, FileSpreadsheet, Copy, Check, Mail, AlertTriangle, Trash2, FileText, Plus, TrendingUp, CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  imported_first_name: string | null
  imported_last_name: string | null
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
  vacant_no_email: number
  einheiten_limit: number
}

type SortField = "name" | "address" | "created_at"
type SortOrder = "asc" | "desc"

// ── Helpers ──

function getTenantStatusConfig(status: string) {
  switch (status) {
    case "occupied": return { label: "Aktiv", icon: UserCheck, className: "bg-green-100 text-green-800 border-green-200" }
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
    if (open && unit) {
      // Pre-fill name from import if available
      const importedName = [unit.imported_first_name, unit.imported_last_name].filter(Boolean).join(" ")
      setTenantName(importedName)
      setEmail("")
      setError(null)
    } else if (!open) {
      setEmail(""); setTenantName(""); setError(null)
    }
  }, [open, unit])

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
  const [deleteUnitOpen, setDeleteUnitOpen] = useState(false)
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<UnitItem | null>(null)
  const [isDeletingUnit, setIsDeletingUnit] = useState(false)
  const [deleteUnitError, setDeleteUnitError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [tenantStatusFilter, setTenantStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [newUnitOpen, setNewUnitOpen] = useState(false)
  const [isCreatingUnit, setIsCreatingUnit] = useState(false)
  const [newUnitError, setNewUnitError] = useState<string | null>(null)
  const [newUnitForm, setNewUnitForm] = useState({ name: "", address: "", floor: "", first_name: "", last_name: "", email: "", phone: "" })

  // Upgrade state
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeNewCount, setUpgradeNewCount] = useState("")
  const [upgradeStep, setUpgradeStep] = useState<'input' | 'preview' | 'success'>('input')
  const [upgradePreviewAmount, setUpgradePreviewAmount] = useState<number | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  // Bulk selection state
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())
  const [bulkDeleteUnitsOpen, setBulkDeleteUnitsOpen] = useState(false)
  const [isBulkDeletingUnits, setIsBulkDeletingUnits] = useState(false)
  const [bulkDeleteErrors, setBulkDeleteErrors] = useState<string[]>([])
  const [isSelectingAll, setIsSelectingAll] = useState(false)

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

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault()
    setIsCreatingUnit(true)
    setNewUnitError(null)
    try {
      const res = await fetch("/api/hv/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUnitForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler beim Erstellen der Einheit")
      setNewUnitOpen(false)
      setNewUnitForm({ name: "", address: "", floor: "", first_name: "", last_name: "", email: "", phone: "" })
      fetchUnits()
    } catch (err) {
      setNewUnitError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsCreatingUnit(false)
    }
  }

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

  async function handleDeleteUnit(unit: UnitItem) {
    setIsDeletingUnit(true)
    setDeleteUnitError(null)
    try {
      const res = await fetch(`/api/hv/units/${unit.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { setDeleteUnitError(json.error || 'Fehler beim Löschen'); return }
      setUnits((prev) => prev.filter((u) => u.id !== unit.id))
      setDeleteUnitOpen(false)
      setDeleteUnitTarget(null)
    } catch {
      setDeleteUnitError('Netzwerkfehler')
    } finally {
      setIsDeletingUnit(false)
    }
  }

  function toggleSelectUnit(id: string) {
    setSelectedUnitIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllUnits() {
    if (selectedUnitIds.size === units.length) {
      setSelectedUnitIds(new Set())
    } else {
      setSelectedUnitIds(new Set(units.map(u => u.id)))
    }
  }

  async function handleSelectAllAcrossPages() {
    setIsSelectingAll(true)
    try {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("per_page", "5000")
      params.set("sort_by", sortBy)
      params.set("sort_order", sortOrder)
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (tenantStatusFilter) params.set("tenant_status", tenantStatusFilter)
      const res = await fetch(`/api/hv/units?${params.toString()}`)
      const json = await res.json()
      const allIds = new Set<string>((json.data || []).map((u: UnitItem) => u.id))
      setSelectedUnitIds(allIds)
    } catch {
      // fallback: just select current page
      setSelectedUnitIds(new Set(units.map(u => u.id)))
    } finally {
      setIsSelectingAll(false)
    }
  }

  async function handleBulkDeleteUnits() {
    setIsBulkDeletingUnits(true)
    setBulkDeleteErrors([])
    try {
      const res = await fetch('/api/hv/units', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedUnitIds) }),
      })
      const json = await res.json()
      if (!res.ok) {
        setBulkDeleteErrors([json.error || 'Fehler beim Löschen'])
      } else {
        const skipped: string[] = json.skipped || []
        if (skipped.length > 0) {
          setBulkDeleteErrors(skipped.map((name: string) => `${name}: Hat offene Schadensmeldungen`))
        } else {
          setBulkDeleteUnitsOpen(false)
          setSelectedUnitIds(new Set())
        }
        fetchUnits()
      }
    } catch {
      setBulkDeleteErrors(['Netzwerkfehler beim Löschen'])
    } finally {
      setIsBulkDeletingUnits(false)
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

  async function handleUpgradePreview() {
    const count = parseInt(upgradeNewCount)
    if (isNaN(count) || count <= totalUnits) return
    setUpgradeLoading(true)
    setUpgradeError(null)
    try {
      const res = await fetch('/api/stripe/upgrade-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_unit_count: count, preview: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Laden der Vorschau')
      setUpgradePreviewAmount(json.proration_amount)
      setUpgradeStep('preview')
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setUpgradeLoading(false)
    }
  }

  async function handleUpgradeConfirm() {
    const count = parseInt(upgradeNewCount)
    setUpgradeLoading(true)
    setUpgradeError(null)
    try {
      const res = await fetch('/api/stripe/upgrade-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_unit_count: count }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Upgraden')
      setUpgradeStep('success')
      fetchUnits()
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setUpgradeLoading(false)
    }
  }

  function handleUpgradeClose() {
    setUpgradeOpen(false)
    setUpgradeStep('input')
    setUpgradeNewCount("")
    setUpgradePreviewAmount(null)
    setUpgradeError(null)
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
  const vacantNoEmailCount = summary?.vacant_no_email ?? 0
  const unitLimit = summary?.einheiten_limit ?? 0
  const totalUnits = summary?.total_units ?? 0
  const atLimit = unitLimit > 0 && totalUnits >= unitLimit

  function clearFilters() { setTenantStatusFilter(""); setSearchQuery(""); setPage(1) }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mieter &amp; Einheiten</h1>
          <p className="text-muted-foreground mt-1">
            Übersicht aller Einheiten, Mieter und Aktivierungscodes
            {summary && <span className="ml-1">({summary.total_units} gesamt)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/units/import">
              <FileSpreadsheet className="mr-2 h-4 w-4" />Excel / CSV importieren
            </Link>
          </Button>
          <Button onClick={() => { setNewUnitOpen(true); setNewUnitError(null) }} disabled={atLimit}>
            <Plus className="mr-2 h-4 w-4" />Neue Einheit
          </Button>
        </div>
      </div>

      {/* Unit Limit Bar */}
      {unitLimit > 0 && (
        <div className="rounded-lg border px-4 py-3 border-border bg-muted/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">
              {totalUnits} von {unitLimit} Einheiten genutzt
            </span>
            <button onClick={() => setUpgradeOpen(true)} className="text-xs text-primary underline underline-offset-2">
              Limit erhöhen
            </button>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all bg-foreground"
              style={{ width: `${Math.min((totalUnits / unitLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

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

      {/* Vacant no email hint */}
      {vacantNoEmailCount > 0 && tenantStatusFilter !== 'vacant_no_email' && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-yellow-800 space-y-2 flex-1">
            <p className="font-medium">
              {vacantNoEmailCount} {vacantNoEmailCount !== 1 ? "Einheiten wurden importiert, aber kein Aktivierungscode wurde versendet" : "Einheit wurde importiert, aber kein Aktivierungscode wurde versendet"}
            </p>
            <p>
              Im Import {vacantNoEmailCount !== 1 ? "fehlte bei diesen Einheiten" : "fehlte bei dieser Einheit"} die E-Mail-Adresse — deshalb konnte der Code nicht automatisch verschickt werden.
              Klicken Sie bei der jeweiligen Einheit auf <span className="font-medium">„Einladen"</span>, tragen Sie die E-Mail nach und der Code wird sofort versendet.
            </p>
            <button
              onClick={() => { setTenantStatusFilter('vacant_no_email'); setPage(1) }}
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:opacity-80"
            >
              Nur diese {vacantNoEmailCount} {vacantNoEmailCount !== 1 ? "Einheiten" : "Einheit"} anzeigen →
            </button>
          </div>
        </div>
      )}

      {/* Active vacant_no_email filter indicator */}
      {tenantStatusFilter === 'vacant_no_email' && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm">
          <span className="text-yellow-800 font-medium">
            Filter aktiv: Einheiten ohne E-Mail-Adresse ({vacantNoEmailCount})
          </span>
          <button onClick={() => { setTenantStatusFilter(""); setPage(1) }} className="text-yellow-700 hover:text-yellow-900 flex items-center gap-1 text-xs underline underline-offset-2">
            <X className="h-3.5 w-3.5" />Filter aufheben
          </button>
        </div>
      )}

      {/* Vacant hint */}
      {vacantCount > 0 && tenantStatusFilter !== 'vacant' && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-yellow-800 space-y-2 flex-1">
            <p className="font-medium">
              {vacantCount} {vacantCount !== 1 ? "Einheiten haben noch keinen Mieter" : "Einheit hat noch keinen Mieter"}
            </p>
            <p>
              Klicken Sie bei der jeweiligen Einheit auf <span className="font-medium">„Einladen"</span>, geben Sie die E-Mail-Adresse des Mieters ein und der Aktivierungscode wird automatisch versendet.
            </p>
            <button
              onClick={() => { setTenantStatusFilter('vacant'); setPage(1) }}
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:opacity-80"
            >
              Nur diese {vacantCount} {vacantCount !== 1 ? "Einheiten" : "Einheit"} anzeigen →
            </button>
          </div>
        </div>
      )}

      {/* Active vacant filter indicator */}
      {tenantStatusFilter === 'vacant' && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm">
          <span className="text-yellow-800 font-medium">
            Filter aktiv: Einheiten ohne Mieter ({vacantCount})
          </span>
          <button onClick={() => { setTenantStatusFilter(""); setPage(1) }} className="text-yellow-700 hover:text-yellow-900 flex items-center gap-1 text-xs underline underline-offset-2">
            <X className="h-3.5 w-3.5" />Filter aufheben
          </button>
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

      {/* Bulk Action Bar */}
      {selectedUnitIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2.5 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selectedUnitIds.size} ausgewählt</span>
            {pagination && selectedUnitIds.size < (summary?.total_units ?? 0) && (
              <button
                onClick={handleSelectAllAcrossPages}
                disabled={isSelectingAll}
                className="text-xs text-primary underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
              >
                {isSelectingAll ? 'Wird geladen...' : `Alle ${summary?.total_units} auswählen`}
              </button>
            )}
          </div>
          <Button variant="destructive" size="sm" onClick={() => { setBulkDeleteErrors([]); setBulkDeleteUnitsOpen(true) }}>
            <Trash2 className="mr-2 h-4 w-4" />Ausgewählte löschen
          </Button>
        </div>
      )}

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
                <TableHead className="w-10">
                  <Checkbox checked={units.length > 0 && selectedUnitIds.size === units.length} onCheckedChange={toggleSelectAllUnits} aria-label="Alle auswählen" />
                </TableHead>
                <TableHead><button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">Einheit <SortIcon field="name" /></button></TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mieter</TableHead>
                <TableHead>Aktivierungscode</TableHead>
                <TableHead>Meldungen</TableHead>
                <TableHead className="w-[80px]">Aktionen</TableHead>
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
                    className={`transition-colors ${selectedUnitIds.has(unit.id) ? "bg-muted/40" : unit.tenant ? "cursor-pointer hover:bg-accent/50" : "hover:bg-accent/50"}`}
                    onClick={() => unit.tenant && router.push(`/dashboard/tenants/${unit.tenant.id}`)}
                    onMouseEnter={unit.tenant ? (e) => { (e.currentTarget as HTMLElement).style.outline = '2px solid rgba(0,0,0,0.7)'; (e.currentTarget as HTMLElement).style.outlineOffset = '-2px' } : undefined}
                    onMouseLeave={unit.tenant ? (e) => { (e.currentTarget as HTMLElement).style.outline = '' } : undefined}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedUnitIds.has(unit.id)} onCheckedChange={() => toggleSelectUnit(unit.id)} aria-label={`${unit.name} auswählen`} />
                    </TableCell>
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
                          <Link href={`/dashboard/tenants/${unit.tenant.id}`} className="text-sm font-medium text-primary hover:underline">{unit.tenant.full_name}</Link>
                        </div>
                      ) : (unit.imported_first_name || unit.imported_last_name) ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {[unit.imported_first_name, unit.imported_last_name].filter(Boolean).join(" ")}
                          </span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {unit.tenant_status === "occupied" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : unit.pending_code ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded tracking-wider">{unit.pending_code.code}</code>
                            <CopyCodeButton code={unit.pending_code.code} />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Gültig bis {new Date(unit.pending_code.expires_at).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            {new Date(unit.pending_code.expires_at) < new Date() && (
                              <span className="ml-1 text-red-600 font-medium">· Abgelaufen</span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setInviteUnit(unit); setInviteOpen(true) }}>
                          {unit.imported_first_name || unit.imported_last_name ? "E-Mail ergänzen" : "Einladen"}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{unit.damage_report_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); window.location.href = '/dashboard/dokumente?unit_id=' + unit.id }} title="Dokumente"><FileText className="h-4 w-4" /></Button>
                        {unit.tenant_status !== "vacant" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={(e) => { e.stopPropagation(); setDeleteUnit(unit); setDeleteOpen(true) }} title="Mieter entfernen"><Users className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteUnitTarget(unit); setDeleteUnitError(null); setDeleteUnitOpen(true) }} title="Einheit löschen"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
              className={`transition-all ${unit.tenant ? "cursor-pointer hover:bg-accent/50 hover:ring-2 hover:ring-inset hover:ring-black/70" : "hover:bg-accent/50"}`}
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
                    <div className="flex items-center gap-1">
                      {unit.tenant_status !== "occupied" && (
                        unit.pending_code ? (
                          <div className="space-y-0.5 text-right">
                            <div className="flex items-center gap-1">
                              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded tracking-wider">{unit.pending_code.code}</code>
                              <CopyCodeButton code={unit.pending_code.code} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              bis {new Date(unit.pending_code.expires_at).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              {new Date(unit.pending_code.expires_at) < new Date() && <span className="ml-1 text-red-600 font-medium">· Abgelaufen</span>}
                            </p>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setInviteUnit(unit); setInviteOpen(true) }}>Einladen</Button>
                        )
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteUnitTarget(unit); setDeleteUnitError(null); setDeleteUnitOpen(true) }} title="Einheit löschen">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <Button variant="outline" size="sm" disabled={!pagination.has_prev || isLoading} onClick={() => setPage(1)}>
              <ChevronLeft className="h-4 w-4" /><ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_prev || isLoading} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Zurück
            </Button>
            {/* Page number buttons */}
            {(() => {
              const total = pagination.total_pages
              const current = pagination.page
              const pages: (number | '...')[] = []
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i)
              } else {
                pages.push(1)
                if (current > 3) pages.push('...')
                for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
                if (current < total - 2) pages.push('...')
                pages.push(total)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === current ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    disabled={isLoading}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )
            })()}
            <Button variant="outline" size="sm" disabled={!pagination.has_next || isLoading} onClick={() => setPage(page + 1)}>
              Weiter<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_next || isLoading} onClick={() => setPage(pagination.total_pages)}>
              <ChevronRight className="h-4 w-4" /><ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteUnitsOpen} onOpenChange={(o) => { if (!o) { setBulkDeleteUnitsOpen(false); setBulkDeleteErrors([]) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Einheiten löschen</DialogTitle>
            <DialogDescription>
              {selectedUnitIds.size} {selectedUnitIds.size === 1 ? "Einheit wird" : "Einheiten werden"} dauerhaft gelöscht. Einheiten mit offenen Schadensmeldungen können nicht gelöscht werden.
            </DialogDescription>
          </DialogHeader>
          {bulkDeleteErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 space-y-1">
              <p className="font-medium">Folgende Einheiten konnten nicht gelöscht werden:</p>
              {bulkDeleteErrors.map((e, i) => <p key={i} className="text-xs">{e}</p>)}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBulkDeleteUnitsOpen(false); setBulkDeleteErrors([]) }} disabled={isBulkDeletingUnits}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleBulkDeleteUnits} disabled={isBulkDeletingUnits}>
              {isBulkDeletingUnits ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gelöscht...</> : <><Trash2 className="mr-2 h-4 w-4" />Löschen</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Einheit löschen Dialog */}
      <Dialog open={deleteUnitOpen} onOpenChange={(o) => { if (!o) { setDeleteUnitOpen(false); setDeleteUnitError(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Einheit löschen</DialogTitle>
            <DialogDescription>
              <span className="font-medium">&bdquo;{deleteUnitTarget?.name}&ldquo;</span> wird dauerhaft gelöscht — inklusive aller Aktivierungscodes.
              Schadensmeldungen bleiben im Archiv erhalten. Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          {deleteUnitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{deleteUnitError}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteUnitOpen(false); setDeleteUnitError(null) }} disabled={isDeletingUnit}>Abbrechen</Button>
            <Button variant="destructive" onClick={() => deleteUnitTarget && handleDeleteUnit(deleteUnitTarget)} disabled={isDeletingUnit}>
              {isDeletingUnit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gelöscht...</> : <><Trash2 className="mr-2 h-4 w-4" />Einheit löschen</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mieter entfernen Dialog */}
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


      {/* New Unit Dialog */}
      <Dialog open={newUnitOpen} onOpenChange={(o) => { if (!o) { setNewUnitOpen(false); setNewUnitError(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Einheit anlegen</DialogTitle>
            <DialogDescription>Erstellen Sie eine neue Wohneinheit und laden Sie optional sofort einen Mieter ein.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUnit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nu-name">Einheit (Adresse) <span className="text-destructive">*</span></Label>
              <Input id="nu-name" placeholder="z.B. Mariahilfer Straße 88/Top 1, 1060 Wien" value={newUnitForm.name} onChange={(e) => setNewUnitForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nu-firstname">Vorname</Label>
                <Input id="nu-firstname" placeholder="Max" value={newUnitForm.first_name} onChange={(e) => setNewUnitForm((f) => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nu-lastname">Nachname</Label>
                <Input id="nu-lastname" placeholder="Mustermann" value={newUnitForm.last_name} onChange={(e) => setNewUnitForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-email">E-Mail <span className="text-destructive">*</span></Label>
              <Input id="nu-email" type="email" placeholder="mieter@beispiel.at" value={newUnitForm.email} onChange={(e) => setNewUnitForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-phone">Telefonnummer <span className="text-destructive">*</span></Label>
              <Input id="nu-phone" type="tel" placeholder="+43 664 123 456" value={newUnitForm.phone} onChange={(e) => setNewUnitForm((f) => ({ ...f, phone: e.target.value }))} />
              <p className="text-xs text-muted-foreground">E-Mail oder Telefon: mindestens eines muss ausgefüllt sein.</p>
            </div>
            {newUnitError && <p className="text-sm text-destructive">{newUnitError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewUnitOpen(false)} disabled={isCreatingUnit}>Abbrechen</Button>
              <Button type="submit" disabled={isCreatingUnit || (!newUnitForm.email && !newUnitForm.phone)}>
                {isCreatingUnit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird angelegt...</> : <><Plus className="mr-2 h-4 w-4" />Einheit anlegen</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <InviteDialog
        unit={inviteUnit}
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteUnit(null) }}
        onSuccess={handleInviteSuccess}
      />

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={(o) => { if (!o) handleUpgradeClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Einheitenlimit erhöhen
            </DialogTitle>
            <DialogDescription>
              {upgradeStep === 'success'
                ? 'Ihr Abonnement wurde erfolgreich aktualisiert.'
                : 'Erhöhen Sie Ihr Einheitenlimit — Sie bezahlen nur die anteilige Differenz für den laufenden Monat.'}
            </DialogDescription>
          </DialogHeader>

          {upgradeStep === 'input' && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
                <p className="text-muted-foreground">Aktuelles Limit</p>
                <p className="text-2xl font-bold">{unitLimit} <span className="text-base font-normal text-muted-foreground">Einheiten</span></p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="upgrade-count">Neues Limit</Label>
                <Input
                  id="upgrade-count"
                  type="number"
                  min={unitLimit + 1}
                  max={99999}
                  placeholder={`Mindestens ${unitLimit + 1}`}
                  value={upgradeNewCount}
                  onChange={(e) => { setUpgradeNewCount(e.target.value); setUpgradeError(null) }}
                />
                <p className="text-xs text-muted-foreground">Muss größer als {unitLimit} sein</p>
              </div>
              {upgradeError && <p className="text-sm text-destructive">{upgradeError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={handleUpgradeClose} disabled={upgradeLoading}>Abbrechen</Button>
                <Button
                  onClick={handleUpgradePreview}
                  disabled={upgradeLoading || !upgradeNewCount || parseInt(upgradeNewCount) <= unitLimit}
                >
                  {upgradeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird berechnet...</> : 'Kosten berechnen'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {upgradeStep === 'preview' && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Aktuelles Limit</span>
                  <span className="font-medium">{unitLimit} Einheiten</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Neues Limit</span>
                  <span className="font-medium text-primary">{upgradeNewCount} Einheiten</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-medium">Jetzt fällig (anteilig)</span>
                  <span className="text-lg font-bold">
                    {upgradePreviewAmount !== null
                      ? new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(upgradePreviewAmount)
                      : '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stripe berechnet nur die verbleibenden Tage im aktuellen Abrechnungszeitraum. Ab dem nächsten Monat gilt der neue Preis.
                </p>
              </div>
              {upgradeError && <p className="text-sm text-destructive">{upgradeError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setUpgradeStep('input'); setUpgradeError(null) }} disabled={upgradeLoading}>Zurück</Button>
                <Button onClick={handleUpgradeConfirm} disabled={upgradeLoading}>
                  {upgradeLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird verarbeitet...</> : 'Jetzt upgraden & bezahlen'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {upgradeStep === 'success' && (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-medium">Limit auf {upgradeNewCount} Einheiten erhöht!</p>
              <p className="text-sm text-muted-foreground">Die Zahlung wurde von Stripe verarbeitet. Das neue Limit ist sofort aktiv.</p>
              <Button className="mt-2" onClick={handleUpgradeClose}>Schließen</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}