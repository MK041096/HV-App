"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  FileText,
  MapPin,
  Wrench,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  X,
  ImageIcon,
  Droplets,
  Flame,
  Zap,
  DoorOpen,
  ShowerHead,
  HelpCircle,
  User,
  Building2,
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  CATEGORY_LABELS,
  ROOM_LABELS,
  URGENCY_LABELS,
} from "@/lib/validations/damage-report"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Photo {
  id: string
  file_name: string
  mime_type: string
  file_size: number
  sort_order: number
  url: string | null
}

interface StatusHistoryEntry {
  id: string
  old_status: string | null
  new_status: string
  display_status: string
  note: string | null
  created_at: string
  changed_by: {
    first_name: string | null
    last_name: string | null
    role: string
  } | null
}

interface Comment {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  updated_at: string
  author: {
    first_name: string | null
    last_name: string | null
    role: string
  } | null
}

interface Rating {
  id: string
  rating: boolean
  updated_count: number
  rating_deadline: string
  created_at: string
  updated_at: string
}

interface DamageReportDetail {
  id: string
  case_number: string
  title: string
  description: string | null
  category: string
  subcategory: string | null
  room: string | null
  status: string
  display_status: string
  urgency: string
  created_at: string
  updated_at: string
  closed_at: string | null
  preferred_appointment: string | null
  preferred_appointment_2: string | null
  scheduled_appointment: string | null
  access_notes: string | null
  assigned_to_name: string | null
  assigned_to_company: string | null
  unit: {
    id: string
    name: string
    address: string | null
    floor: string | null
  } | null
  reporter: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
  photos: Photo[]
  status_history: StatusHistoryEntry[]
  comments: Comment[]
  rating: Rating | null
  can_rate: boolean
  can_update_rating: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_BADGE_CONFIG: Record<string, { className: string }> = {
  Eingegangen: { className: "bg-blue-100 text-blue-700 border-blue-200" },
  "In Bearbeitung": { className: "bg-amber-100 text-amber-700 border-amber-200" },
  "Warte auf Handwerker": { className: "bg-amber-100 text-amber-700 border-amber-200" },
  "Termin vereinbart": { className: "bg-purple-100 text-purple-700 border-purple-200" },
  "Termin telefonisch vereinbart": { className: "bg-teal-100 text-teal-700 border-teal-200" },
  Abgeschlossen: { className: "bg-green-100 text-green-700 border-green-200" },
  Abgelehnt: { className: "bg-red-100 text-red-700 border-red-200" },
  // Raw DB status fallbacks
  warte_auf_handwerker: { className: "bg-amber-100 text-amber-700 border-amber-200" },
  termin_telefonisch: { className: "bg-teal-100 text-teal-700 border-teal-200" },
  abgelehnt: { className: "bg-red-100 text-red-700 border-red-200" },
}

const TIMELINE_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  neu: { icon: FileText, color: "text-blue-500 bg-blue-100" },
  in_bearbeitung: { icon: Wrench, color: "text-amber-500 bg-amber-100" },
  warte_auf_handwerker: { icon: Clock, color: "text-amber-500 bg-amber-100" },
  termin_vereinbart: { icon: CalendarDays, color: "text-purple-500 bg-purple-100" },
  termin_telefonisch: { icon: CalendarDays, color: "text-teal-500 bg-teal-100" },
  erledigt: { icon: CheckCircle2, color: "text-green-500 bg-green-100" },
  abgelehnt: { icon: AlertTriangle, color: "text-red-500 bg-red-100" },
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

const URGENCY_BADGE: Record<string, { label: string; className: string }> = {
  notfall: { label: "Notfall", className: "bg-red-100 text-red-700 border-red-200" },
  dringend: { label: "Dringend", className: "bg-amber-100 text-amber-700 border-amber-200" },
  normal: { label: "Normal", className: "bg-gray-100 text-gray-600 border-gray-200" },
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MeldungDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [report, setReport] = useState<DamageReportDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Photo gallery state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Rating state
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null)

  // Expanded comment state
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/damage-reports/${id}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Fehler ${res.status}`)
      }
      const json = await res.json()
      return json.data as DamageReportDetail
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unbekannter Fehler")
    }
  }, [id])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchReport()
        if (!cancelled) setReport(data)
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
  }, [fetchReport])

  // Submit rating
  async function handleRating(rating: boolean) {
    if (!report) return
    setIsSubmittingRating(true)
    setRatingError(null)
    setRatingSuccess(null)

    try {
      const res = await fetch(`/api/damage-reports/${id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Fehler ${res.status}`)
      }

      const json = await res.json()
      setRatingSuccess(json.message || "Bewertung abgegeben")

      // Refresh the report to update rating state
      const updated = await fetchReport()
      setReport(updated)
    } catch (err) {
      setRatingError(
        err instanceof Error ? err.message : "Fehler beim Bewerten"
      )
    } finally {
      setIsSubmittingRating(false)
    }
  }

  function toggleExpandComment(commentId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────────────

  if (error || !report) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          asChild
        >
          <Link href="/mein-bereich/meldungen">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück zu Meldungen
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">
              {error || "Schadensmeldung nicht gefunden"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setError(null)
                setIsLoading(true)
                fetchReport()
                  .then((d) => {
                    setReport(d)
                    setIsLoading(false)
                  })
                  .catch((e) => {
                    setError(e.message)
                    setIsLoading(false)
                  })
              }}
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Derived Values ─────────────────────────────────────────────────────────

  const CategoryIcon = CATEGORY_ICONS[report.category] || FileText
  const statusBadge = STATUS_BADGE_CONFIG[report.display_status] || {
    className: "bg-gray-100 text-gray-600 border-gray-200",
  }
  const urgencyBadge = URGENCY_BADGE[report.urgency]
  const categoryLabel =
    CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ||
    report.category
  const roomLabel = report.room
    ? ROOM_LABELS[report.room as keyof typeof ROOM_LABELS] || report.room
    : null
  const urgencyLabel =
    URGENCY_LABELS[report.urgency as keyof typeof URGENCY_LABELS] ||
    report.urgency

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        asChild
      >
        <Link href="/mein-bereich/meldungen">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zu Meldungen
        </Link>
      </Button>

      {/* ─── Header Card ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted shrink-0">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl leading-tight">
                {report.title}
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono">{report.case_number}</span>
                <span>
                  Erstellt am{" "}
                  {new Date(report.created_at).toLocaleDateString("de-AT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status + Urgency badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("text-sm", statusBadge.className)}
            >
              {report.display_status}
            </Badge>
            {urgencyBadge && (
              <Badge
                variant="outline"
                className={cn("text-sm", urgencyBadge.className)}
              >
                {urgencyBadge.label}
              </Badge>
            )}
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                Beschreibung
              </h3>
              <p className="text-sm whitespace-pre-wrap">
                {report.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <DetailItem label="Kategorie" value={categoryLabel} />
            {report.subcategory && (
              <DetailItem
                label="Unterkategorie"
                value={report.subcategory}
              />
            )}
            {roomLabel && <DetailItem label="Raum" value={roomLabel} />}
            <DetailItem label="Dringlichkeit" value={urgencyLabel} />
            {report.unit && (
              <DetailItem
                label="Wohneinheit"
                value={`${report.unit.name}${report.unit.address ? `, ${report.unit.address}` : ""}${report.unit.floor ? ` (${report.unit.floor})` : ""}`}
              />
            )}
            {report.preferred_appointment && (
              <DetailItem
                label={report.preferred_appointment_2 ? "Wunschtermin 1" : "Wunschtermin"}
                value={new Date(report.preferred_appointment).toLocaleDateString("de-AT", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
            {report.preferred_appointment_2 && (
              <DetailItem
                label="Wunschtermin 2"
                value={new Date(report.preferred_appointment_2).toLocaleDateString("de-AT", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
            {report.scheduled_appointment && (
              <DetailItem
                label="Vereinbarter Termin"
                value={new Date(
                  report.scheduled_appointment
                ).toLocaleDateString("de-AT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            )}
            {report.assigned_to_name && (
              <DetailItem
                label="Zugewiesen an"
                value={`${report.assigned_to_name}${report.assigned_to_company ? ` (${report.assigned_to_company})` : ""}`}
              />
            )}
            {report.access_notes && (
              <DetailItem
                label="Zugangshinweise"
                value={report.access_notes}
              />
            )}
            {report.closed_at && (
              <DetailItem
                label="Abgeschlossen am"
                value={new Date(report.closed_at).toLocaleDateString(
                  "de-AT",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Photo Gallery ─────────────────────────────────────────────────── */}
      {report.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotos ({report.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {report.photos
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      setLightboxIndex(index)
                      setLightboxOpen(true)
                    }}
                    className="aspect-square rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary/50 transition-all focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.file_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Photo Lightbox ────────────────────────────────────────────────── */}
      {lightboxOpen && report.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            aria-label="Lightbox schliessen"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation */}
          {report.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) =>
                    prev === 0 ? report.photos.length - 1 : prev - 1
                  )
                }}
                className="absolute left-2 sm:left-4 text-white/80 hover:text-white z-10 p-2"
                aria-label="Vorheriges Foto"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) =>
                    prev === report.photos.length - 1 ? 0 : prev + 1
                  )
                }}
                className="absolute right-2 sm:right-4 text-white/80 hover:text-white z-10 p-2"
                aria-label="Nächstes Foto"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {report.photos[lightboxIndex]?.url ? (
              <img
                src={report.photos[lightboxIndex].url}
                alt={report.photos[lightboxIndex].file_name}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-64 w-64 bg-muted rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <p className="text-white/60 text-center text-sm mt-2">
              {lightboxIndex + 1} / {report.photos.length}
            </p>
          </div>
        </div>
      )}

      {/* ─── Status Timeline ───────────────────────────────────────────────── */}
      {report.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Statusverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {report.status_history.map((entry, index) => {
                const timelineConfig = TIMELINE_ICON_MAP[entry.new_status] || {
                  icon: FileText,
                  color: "text-gray-500 bg-gray-100",
                }
                const Icon = timelineConfig.icon
                const isLast = index === report.status_history.length - 1

                return (
                  <div key={entry.id} className="flex gap-3 pb-6 last:pb-0">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
                          timelineConfig.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium">
                        {entry.display_status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString(
                          "de-AT",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        {entry.changed_by && (
                          <>
                            {" "}
                            &mdash;{" "}
                            {entry.changed_by.first_name}{" "}
                            {entry.changed_by.last_name}
                          </>
                        )}
                      </p>
                      {entry.note && (
                        <p className="text-sm text-muted-foreground mt-1 bg-muted/50 rounded-md px-3 py-2">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── HV Comments ───────────────────────────────────────────────────── */}
      {report.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Kommentare der Hausverwaltung ({report.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.comments.map((comment) => {
                const isExpanded = expandedComments.has(comment.id)
                const isLong = comment.content.length > 300
                const displayContent =
                  isLong && !isExpanded
                    ? comment.content.slice(0, 300) + "..."
                    : comment.content

                const isHvUser =
                  comment.author?.role === "hv_admin" ||
                  comment.author?.role === "hv_mitarbeiter"

                return (
                  <div
                    key={comment.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div
                        className={cn(
                          "flex items-center justify-center h-6 w-6 rounded-full shrink-0",
                          isHvUser
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isHvUser ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                      <span className="font-medium">
                        {comment.author
                          ? `${comment.author.first_name || ""} ${comment.author.last_name || ""}`.trim() ||
                            "Hausverwaltung"
                          : "Hausverwaltung"}
                      </span>
                      <span>&middot;</span>
                      <span>
                        {new Date(comment.created_at).toLocaleDateString(
                          "de-AT",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {displayContent}
                    </p>
                    {isLong && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-xs"
                        onClick={() => toggleExpandComment(comment.id)}
                      >
                        {isExpanded ? "Weniger anzeigen" : "Mehr anzeigen"}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Rating Section ────────────────────────────────────────────────── */}
      {(report.can_rate || report.can_update_rating || report.rating) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bewertung</CardTitle>
            <CardDescription>
              {report.rating
                ? "Ihre Bewertung für diesen Fall."
                : "War die Bearbeitung zufriedenstellend?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing rating display */}
            {report.rating && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div
                  className={cn(
                    "flex items-center justify-center h-12 w-12 rounded-full",
                    report.rating.rating
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  )}
                >
                  {report.rating.rating ? (
                    <ThumbsUp className="h-6 w-6" />
                  ) : (
                    <ThumbsDown className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {report.rating.rating
                      ? "Zufriedenstellend geloest"
                      : "Nicht zufriedenstellend"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bewertet am{" "}
                    {new Date(report.rating.created_at).toLocaleDateString(
                      "de-AT",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Rating buttons (new or update) */}
            {(report.can_rate || report.can_update_rating) && (
              <div className="space-y-3">
                {report.can_update_rating && report.rating && (
                  <p className="text-xs text-muted-foreground">
                    Sie können Ihre Bewertung noch einmal ändern (bis{" "}
                    {new Date(
                      report.rating.rating_deadline
                    ).toLocaleDateString("de-AT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    ).
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-auto py-3 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    onClick={() => handleRating(true)}
                    disabled={isSubmittingRating}
                  >
                    {isSubmittingRating ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <ThumbsUp className="mr-2 h-5 w-5" />
                    )}
                    Zufrieden
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-auto py-3 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    onClick={() => handleRating(false)}
                    disabled={isSubmittingRating}
                  >
                    {isSubmittingRating ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <ThumbsDown className="mr-2 h-5 w-5" />
                    )}
                    Nicht zufrieden
                  </Button>
                </div>
              </div>
            )}

            {/* Rating error */}
            {ratingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {ratingError}
              </div>
            )}

            {/* Rating success */}
            {ratingSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {ratingSuccess}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Helper Components ──────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  )
}
