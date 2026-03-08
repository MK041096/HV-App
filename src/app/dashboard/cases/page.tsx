"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
  X,
  Wrench,
  Calendar,
  Eye,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import {
  CASE_STATUS_LABELS,
  CASE_STATUSES,
  type CaseStatus,
} from "@/lib/validations/hv-case-management"
import {
  DAMAGE_CATEGORIES,
  CATEGORY_LABELS,
  URGENCY_LEVELS,
  URGENCY_LABELS,
} from "@/lib/validations/damage-report"

// ── Types ──

interface CaseItem {
  id: string
  case_number: string
  title: string
  category: string
  category_label: string
  subcategory: string | null
  status: string
  status_label: string
  urgency: string
  urgency_label: string
  created_at: string
  updated_at: string
  assigned_to_name: string | null
  assigned_to_company: string | null
  scheduled_appointment: string | null
  photo_count: number
  unit: { id: string; name: string; address: string | null; floor: string | null } | null
  reporter: { id: string; first_name: string | null; last_name: string | null } | null
}

interface Pagination {
  page: number
  per_page: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

type SortField = "urgency" | "created_at" | "status" | "category" | "case_number"
type SortOrder = "asc" | "desc"

// ── Helpers ──

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

// ── Page ──

export default function CasesListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [cases, setCases] = useState<CaseItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [urgencyFilter, setUrgencyFilter] = useState(searchParams.get("urgency") || "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "")
  const [sortBy, setSortBy] = useState<SortField>(
    (searchParams.get("sort_by") as SortField) || "urgency"
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get("sort_order") as SortOrder) || "asc"
  )
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10))
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset page on search change
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch cases
  const fetchCases = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("per_page", "25")
      params.set("sort_by", sortBy)
      params.set("sort_order", sortOrder)

      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      if (urgencyFilter) params.set("urgency", urgencyFilter)
      if (categoryFilter) params.set("category", categoryFilter)

      const res = await fetch(`/api/hv/cases?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden der Fälle")
      }

      const json = await res.json()
      setCases(json.data || [])
      setPagination(json.pagination || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortOrder, debouncedSearch, statusFilter, urgencyFilter, categoryFilter])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Sorting handler
  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder(field === "created_at" ? "desc" : "asc")
    }
    setPage(1)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  }

  // Active filter count
  const activeFilters = [statusFilter, urgencyFilter, categoryFilter].filter(Boolean).length

  function clearFilters() {
    setStatusFilter("")
    setUrgencyFilter("")
    setCategoryFilter("")
    setSearchQuery("")
    setPage(1)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fälle</h1>
        <p className="text-muted-foreground mt-1">
          Alle Schadensmeldungen Ihrer Organisation
          {pagination && (
            <span className="ml-1">
              ({pagination.total_count} gesamt)
            </span>
          )}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Fallnummer, Titel oder Mietername suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Suche löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Filter Row (collapsible) */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v === "alle" ? "" : v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Status</SelectItem>
                      {CASE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {CASE_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Dringlichkeit
                  </label>
                  <Select
                    value={urgencyFilter}
                    onValueChange={(v) => {
                      setUrgencyFilter(v === "alle" ? "" : v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Dringlichkeiten" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Dringlichkeiten</SelectItem>
                      {URGENCY_LEVELS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {URGENCY_LABELS[u]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Kategorie
                  </label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(v) => {
                      setCategoryFilter(v === "alle" ? "" : v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Kategorien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Kategorien</SelectItem>
                      {DAMAGE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFilters > 0 && (
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Alle Filter zurücksetzen
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchCases}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cases Table (Desktop) */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <button
                      onClick={() => handleSort("case_number")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Fall-Nr.
                      <SortIcon field="case_number" />
                    </button>
                  </TableHead>
                  <TableHead>Titel / Mieter</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Kategorie
                      <SortIcon field="category" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("urgency")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Dringlichkeit
                      <SortIcon field="urgency" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Status
                      <SortIcon field="status" />
                    </button>
                  </TableHead>
                  <TableHead>Zugewiesen</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Erstellt
                      <SortIcon field="created_at" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardList className="h-10 w-10 opacity-50" />
                        <p>Keine Fälle gefunden</p>
                        {(debouncedSearch || activeFilters > 0) && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((c) => {
                    const urgencyConfig = getUrgencyConfig(c.urgency)
                    const statusConfig = getStatusConfig(c.status)

                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => router.push(`/dashboard/cases/${c.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {c.case_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[250px]">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.reporter?.first_name} {c.reporter?.last_name}
                              {c.unit?.name && (
                                <span className="ml-1">- {c.unit.name}</span>
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{c.category_label}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={urgencyConfig.className}
                          >
                            {urgencyConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig.className}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.assigned_to_name ? (
                            <div className="flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[120px]">
                                {c.assigned_to_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                          {c.scheduled_appointment && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateTime(c.scheduled_appointment)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(c.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/cases/${c.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Fall öffnen</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cases Cards (Mobile) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : cases.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Keine Fälle gefunden</p>
              {(debouncedSearch || activeFilters > 0) && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
                  Filter zurücksetzen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          cases.map((c) => {
            const urgencyConfig = getUrgencyConfig(c.urgency)
            const statusConfig = getStatusConfig(c.status)

            return (
              <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">
                            {c.case_number}
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
                          {c.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.reporter?.first_name} {c.reporter?.last_name}
                          {c.unit?.name && ` - ${c.unit.name}`}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{c.category_label}</span>
                          <span>{formatDate(c.created_at)}</span>
                        </div>
                        {c.assigned_to_name && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Wrench className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {c.assigned_to_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Seite {pagination.page} von {pagination.total_pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_prev || isLoading}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_next || isLoading}
              onClick={() => setPage(page + 1)}
            >
              Weiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
