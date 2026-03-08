"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  ClipboardList,
  Plus,
  Loader2,
  Search,
  AlertTriangle,
  ChevronRight,
  Droplets,
  Flame,
  Zap,
  DoorOpen,
  ShowerHead,
  Wrench,
  HelpCircle,
  ArrowLeft,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CATEGORY_LABELS } from "@/lib/validations/damage-report"
import type { StatusFilter } from "@/lib/validations/damage-report-dashboard"

// ─── Types ──────────────────────────────────────────────────────────────────

interface DamageReportListItem {
  id: string
  case_number: string
  title: string
  category: string
  status: string
  display_status: string
  urgency: string
  created_at: string
  closed_at: string | null
  updated_at: string
  unit: { id: string; name: string; address: string | null } | null
  rating: { id: string; rating: boolean }[] | null
  photos: { id: string }[] | null
}

interface PaginationInfo {
  next_cursor: string | null
  has_more: boolean
  limit: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_BADGE_CONFIG: Record<
  string,
  { className: string }
> = {
  Eingegangen: {
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "In Bearbeitung": {
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  "Warte auf Handwerker": {
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  "Termin vereinbart": {
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  Abgeschlossen: {
    className: "bg-green-100 text-green-700 border-green-200",
  },
  Abgelehnt: {
    className: "bg-red-100 text-red-700 border-red-200",
  },
  // Raw DB status fallbacks (in case display_status is not mapped)
  warte_auf_handwerker: {
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  abgelehnt: {
    className: "bg-red-100 text-red-700 border-red-200",
  },
}

const URGENCY_BADGE: Record<string, { label: string; className: string }> = {
  notfall: { label: "Notfall", className: "bg-red-100 text-red-700 border-red-200" },
  dringend: { label: "Dringend", className: "bg-amber-100 text-amber-700 border-amber-200" },
  normal: { label: "Normal", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  wasserschaden: Droplets,
  heizung: Flame,
  elektrik: Zap,
  fenster_tueren: DoorOpen,
  schimmel: AlertTriangle,
  sanitaer: ShowerHead,
  boeden_waende: Wrench,
  aussenbereich: Wrench,
  sonstiges: HelpCircle,
}

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "offen", label: "Offen" },
  { value: "abgeschlossen", label: "Abgeschlossen" },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function MeldungenPage() {
  const [reports, setReports] = useState<DamageReportListItem[]>([])
  const [filter, setFilter] = useState<StatusFilter>("alle")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  const fetchReports = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams({
          mode: "dashboard",
          filter,
          limit: "20",
        })
        if (cursor) params.set("cursor", cursor)

        const res = await fetch(`/api/damage-reports?${params}`)
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || `Fehler ${res.status}`)
        }

        const json = await res.json()
        return {
          items: json.data as DamageReportListItem[],
          pagination: json.pagination as PaginationInfo,
        }
      } catch (err) {
        throw err instanceof Error ? err : new Error("Unbekannter Fehler")
      }
    },
    [filter]
  )

  // Initial load & filter change
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchReports()
        if (!cancelled) {
          setReports(result.items)
          setPagination(result.pagination)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Fehler beim Laden"
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [fetchReports])

  // Load more (cursor pagination)
  async function handleLoadMore() {
    if (!pagination?.next_cursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const result = await fetchReports(pagination.next_cursor)
      setReports((prev) => [...prev, ...result.items])
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden")
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Client-side search filtering (title, case_number, category)
  const filteredReports = searchQuery.trim()
    ? reports.filter((r) => {
        const q = searchQuery.toLowerCase()
        return (
          r.title.toLowerCase().includes(q) ||
          r.case_number.toLowerCase().includes(q) ||
          (CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS] || r.category)
            .toLowerCase()
            .includes(q) ||
          r.display_status.toLowerCase().includes(q)
        )
      })
    : reports

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground"
          asChild
        >
          <Link href="/mein-bereich">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Übersicht
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Meine Meldungen
            </h1>
            <p className="text-muted-foreground mt-1">
              Alle Ihre Schadensmeldungen auf einen Blick.
            </p>
          </div>
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/mein-bereich/meldungen/neu">
              <Plus className="mr-2 h-4 w-4" />
              Neue Meldung
            </Link>
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Titel, Fallnummer, Kategorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as StatusFilter)}
        >
          <TabsList className="w-full sm:w-auto">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 sm:flex-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setError(null)
                setIsLoading(true)
                fetchReports().then((r) => {
                  setReports(r.items)
                  setPagination(r.pagination)
                  setIsLoading(false)
                }).catch((e) => {
                  setError(e.message)
                  setIsLoading(false)
                })
              }}
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && reports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Noch keine Schadensmeldungen
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === "offen"
                ? "Sie haben derzeit keine offenen Schadensmeldungen."
                : filter === "abgeschlossen"
                ? "Sie haben noch keine abgeschlossenen Schadensmeldungen."
                : "Erstellen Sie Ihre erste Schadensmeldung, um den Status hier zu verfolgen."}
            </p>
            {filter === "alle" && (
              <Button asChild>
                <Link href="/mein-bereich/meldungen/neu">
                  <Plus className="mr-2 h-4 w-4" />
                  Jetzt melden
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {!isLoading && !error && reports.length > 0 && filteredReports.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine Meldungen gefunden für &quot;{searchQuery}&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report List */}
      {!isLoading && !error && filteredReports.length > 0 && (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Load More */}
      {!isLoading && pagination?.has_more && !searchQuery.trim() && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird geladen...
              </>
            ) : (
              "Weitere Meldungen laden"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Report Card ────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: DamageReportListItem }) {
  const CategoryIcon =
    CATEGORY_ICONS[report.category] || ClipboardList
  const statusBadge = STATUS_BADGE_CONFIG[report.display_status] || {
    className: "bg-gray-100 text-gray-600 border-gray-200",
  }
  const urgencyBadge = URGENCY_BADGE[report.urgency]
  const categoryLabel =
    CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ||
    report.category

  return (
    <Link
      href={`/mein-bereich/meldungen/${report.id}`}
      className="block group"
    >
      <Card className="transition-all hover:shadow-md hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Category Icon */}
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted shrink-0">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-tight truncate">
                  {report.title}
                </h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">{report.case_number}</span>
                <span>{categoryLabel}</span>
                <span>
                  {new Date(report.created_at).toLocaleDateString("de-AT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusBadge.className)}
                >
                  {report.display_status}
                </Badge>
                {urgencyBadge && report.urgency !== "normal" && (
                  <Badge
                    variant="outline"
                    className={cn("text-xs", urgencyBadge.className)}
                  >
                    {urgencyBadge.label}
                  </Badge>
                )}
                {report.photos && report.photos.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {report.photos.length} Foto{report.photos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
