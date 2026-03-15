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
  Users,
  X,
  Eye,
  UserCheck,
  UserX,
  ClipboardList,
  FileText,
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

interface TenantItem {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string
  is_active: boolean
  unit: { id: string; name: string; address: string | null; floor: string | null } | null
  unit_id: string | null
  damage_report_count: number
  created_at: string
  updated_at: string
}

interface Pagination {
  page: number
  per_page: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

type SortField = "name" | "created_at" | "unit"
type SortOrder = "asc" | "desc"

// ── Helpers ──

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// ── Page ──

export default function TenantsListPage() {
  const router = useRouter()

  // State
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
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

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("per_page", "50")
      params.set("sort_by", sortBy)
      params.set("sort_order", sortOrder)

      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/hv/tenants?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden der Mieter")
      }

      const json = await res.json()
      setTenants(json.data || [])
      setPagination(json.pagination || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortOrder, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

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
  const activeFilters = [statusFilter].filter(Boolean).length

  function clearFilters() {
    setStatusFilter("")
    setSearchQuery("")
    setPage(1)
  }

  // Summary counts
  const totalCount = pagination?.total_count || 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mieter</h1>
        <p className="text-muted-foreground mt-1">
          Alle registrierten Mieter Ihrer Organisation
          {pagination && (
            <span className="ml-1">
              ({totalCount} gesamt)
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
                placeholder="Mieter nach Name suchen..."
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
                    Status
                  </label>
                  <Select
                    value={statusFilter || "alle"}
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
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Deaktiviert</SelectItem>
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
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchTenants}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tenants Table (Desktop) */}
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
                      Name
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("unit")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Wohneinheit
                      <SortIcon field="unit" />
                    </button>
                  </TableHead>
                  <TableHead>Schadensmeldungen</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Registriert
                      <SortIcon field="created_at" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-50" />
                        <p>Keine Mieter gefunden</p>
                        {(debouncedSearch || activeFilters > 0) && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Filter zurücksetzen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground shrink-0">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-sm">
                            {tenant.full_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400"
                          >
                            <UserX className="mr-1 h-3 w-3" />
                            Deaktiviert
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {tenant.unit ? (
                          <div>
                            <p className="text-sm font-medium">{tenant.unit.name}</p>
                            {tenant.unit.address && (
                              <p className="text-xs text-muted-foreground">{tenant.unit.address}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Keine Einheit zugewiesen</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{tenant.damage_report_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tenant.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {tenant.unit_id && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                              <Link href={`/dashboard/dokumente?unit_id=${tenant.unit_id}`} onClick={(e) => e.stopPropagation()}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Dokumente</span>
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/tenants/${tenant.id}`} onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Mieter öffnen</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Cards (Mobile) */}
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
        ) : tenants.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Keine Mieter gefunden</p>
              {(debouncedSearch || activeFilters > 0) && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
                  Filter zurücksetzen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          tenants.map((tenant) => (
            <Link key={tenant.id} href={`/dashboard/tenants/${tenant.id}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {tenant.full_name}
                        </span>
                        {tenant.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200 text-[10px]"
                          >
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800 border-gray-200 text-[10px]"
                          >
                            Deaktiviert
                          </Badge>
                        )}
                      </div>
                      {tenant.unit && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {tenant.unit.name}
                          {tenant.unit.address && ` - ${tenant.unit.address}`}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {tenant.damage_report_count} Meldungen
                        </span>
                        <span>Registriert: {formatDate(tenant.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
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
