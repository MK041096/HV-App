"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  Home,
  X,
  UserCheck,
  Clock,
  CircleDashed,
  ClipboardList,
  MapPin,
  Users,
  FileSpreadsheet,
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
  pending_code: { id: string; created_at: string; expires_at: string } | null
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getTenantStatusConfig(status: string) {
  switch (status) {
    case "occupied":
      return {
        label: "Aktiver Mieter",
        icon: UserCheck,
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      }
    case "pending":
      return {
        label: "Registrierung ausstehend",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      }
    case "vacant":
      return {
        label: "Kein Mieter",
        icon: CircleDashed,
        className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
      }
    default:
      return {
        label: status,
        icon: CircleDashed,
        className: "",
      }
  }
}

// ── Page ──

export default function UnitsListPage() {
  const router = useRouter()

  // State
  const [units, setUnits] = useState<UnitItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [tenantStatusFilter, setTenantStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch units
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

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

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
  const activeFilters = [tenantStatusFilter].filter(Boolean).length

  function clearFilters() {
    setTenantStatusFilter("")
    setSearchQuery("")
    setPage(1)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Page Header */}\n      <div className="flex items-start justify-between gap-4">\n        <div>\n          <h1 className="text-2xl font-bold tracking-tight">Wohneinheiten</h1>\n          <p className="text-muted-foreground mt-1">
          Alle Wohneinheiten Ihrer Organisation
          {summary && (
            <span className="ml-1">
              ({summary.total_units} gesamt)
            </span>
          )}
        </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/units/import">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel importieren
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-3">
          <Card
            className={`cursor-pointer transition-colors ${
              tenantStatusFilter === "occupied" ? "ring-2 ring-primary" : "hover:bg-accent/50"
            }`}
            onClick={() => {
              setTenantStatusFilter(tenantStatusFilter === "occupied" ? "" : "occupied")
              setPage(1)
            }}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Belegt</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{summary.occupied}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              tenantStatusFilter === "pending" ? "ring-2 ring-primary" : "hover:bg-accent/50"
            }`}
            onClick={() => {
              setTenantStatusFilter(tenantStatusFilter === "pending" ? "" : "pending")
              setPage(1)
            }}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium text-muted-foreground">Ausstehend</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{summary.pending}</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              tenantStatusFilter === "vacant" ? "ring-2 ring-primary" : "hover:bg-accent/50"
            }`}
            onClick={() => {
              setTenantStatusFilter(tenantStatusFilter === "vacant" ? "" : "vacant")
              setPage(1)
            }}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CircleDashed className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-muted-foreground">Leer</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-gray-600">{summary.vacant}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Einheit oder Adresse suchen..."
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Mieterstatus
                  </label>
                  <Select
                    value={tenantStatusFilter || "alle"}
                    onValueChange={(v) => {
                      setTenantStatusFilter(v === "alle" ? "" : v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Status</SelectItem>
                      <SelectItem value="occupied">Aktiver Mieter</SelectItem>
                      <SelectItem value="pending">Registrierung ausstehend</SelectItem>
                      <SelectItem value="vacant">Kein Mieter</SelectItem>
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
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchUnits}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Units Table (Desktop) */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Einheit
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("address")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Adresse
                      <SortIcon field="address" />
                    </button>
                  </TableHead>
                  <TableHead>Stockwerk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mieter</TableHead>
                  <TableHead>Meldungen</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Erstellt
                      <SortIcon field="created_at" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Home className="h-10 w-10 opacity-50" />
                        <p>Keine Einheiten gefunden</p>
                        {(debouncedSearch || activeFilters > 0) && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => {
                    const statusConfig = getTenantStatusConfig(unit.tenant_status)
                    const StatusIcon = statusConfig.icon

                    return (
                      <TableRow
                        key={unit.id}
                        className={
                          unit.tenant
                            ? "cursor-pointer hover:bg-accent/50"
                            : "hover:bg-accent/50"
                        }
                        onClick={() => {
                          if (unit.tenant) {
                            router.push(`/dashboard/tenants/${unit.tenant.id}`)
                          }
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{unit.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {unit.address ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate max-w-[200px]">
                                {unit.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {unit.floor || "--"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig.className}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {unit.tenant ? (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <Link
                                href={`/dashboard/tenants/${unit.tenant.id}`}
                                className="text-sm text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {unit.tenant.full_name}
                              </Link>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{unit.damage_report_count}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(unit.created_at)}
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

      {/* Units Cards (Mobile) */}
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
        ) : units.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Home className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Keine Einheiten gefunden</p>
              {(debouncedSearch || activeFilters > 0) && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
                  Filter zurücksetzen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          units.map((unit) => {
            const statusConfig = getTenantStatusConfig(unit.tenant_status)

            return (
              <Card
                key={unit.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{unit.name}</span>
                        <Badge
                          variant="outline"
                          className={statusConfig.className + " text-[10px]"}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {unit.address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {unit.address}
                          {unit.floor && ` - Stockwerk: ${unit.floor}`}
                        </p>
                      )}
                      {unit.tenant && (
                        <div className="mt-2">
                          <Link
                            href={`/dashboard/tenants/${unit.tenant.id}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Users className="h-3 w-3" />
                            {unit.tenant.full_name}
                          </Link>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {unit.damage_report_count} Meldungen
                        </span>
                        <span>{formatDate(unit.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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


