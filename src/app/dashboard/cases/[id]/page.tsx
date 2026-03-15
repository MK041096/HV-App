"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Wrench,
  Calendar,
  MessageSquare,
  Lock,
  Send,
  Image as ImageIcon,
  AlertTriangle,
  X,
  Save,
  Trash2,
  RefreshCw,
  Sparkles,
  FileSearch,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  type CaseStatus,
} from "@/lib/validations/hv-case-management"
import { CATEGORY_LABELS, URGENCY_LABELS, ROOM_LABELS } from "@/lib/validations/damage-report"

// ── Types ──

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
  old_status_label: string | null
  new_status_label: string
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

interface CaseDetail {
  id: string
  case_number: string
  title: string
  description: string | null
  category: string
  category_label: string
  subcategory: string | null
  status: string
  status_label: string
  urgency: string
  urgency_label: string
  room: string | null
  access_notes: string | null
  preferred_appointment: string | null
  assigned_to_name: string | null
  assigned_to_phone: string | null
  assigned_to_email: string | null
  assigned_to_company: string | null
  scheduled_appointment: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  unit: { id: string; name: string; address: string | null; floor: string | null } | null
  reporter: { id: string; first_name: string | null; last_name: string | null; role: string } | null
  photos: Photo[]
  status_history: StatusHistoryEntry[]
  comments: Comment[]
}

// ── Helpers ──

function getUrgencyConfig(urgency: string) {
  switch (urgency) {
    case "notfall":
      return { label: "Notfall", className: "bg-red-100 text-red-800 border-red-200" }
    case "dringend":
      return { label: "Dringend", className: "bg-orange-100 text-orange-800 border-orange-200" }
    default:
      return { label: "Normal", className: "bg-blue-100 text-blue-800 border-blue-200" }
  }
}

function getStatusConfig(status: string) {
  const configs: Record<string, { className: string }> = {
    neu: { className: "bg-sky-100 text-sky-800 border-sky-200" },
    in_bearbeitung: { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    warte_auf_handwerker: { className: "bg-purple-100 text-purple-800 border-purple-200" },
    termin_vereinbart: { className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    erledigt: { className: "bg-green-100 text-green-800 border-green-200" },
    abgelehnt: { className: "bg-gray-100 text-gray-800 border-gray-200" },
  }
  return configs[status] || { className: "" }
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function toDateTimeLocal(dateStr: string) {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// ── Page ──

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Status update state
  const [newStatus, setNewStatus] = useState("")
  const [statusComment, setStatusComment] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Comment state
  const [commentContent, setCommentContent] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Assignment state
  const [assignName, setAssignName] = useState("")
  const [assignPhone, setAssignPhone] = useState("")
  const [assignEmail, setAssignEmail] = useState("")
  const [assignCompany, setAssignCompany] = useState("")
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)

  // Appointment state
  const [appointmentDate, setAppointmentDate] = useState("")
  const [isSavingAppointment, setIsSavingAppointment] = useState(false)

  // Photo viewer
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  // KI-Analyse state
  const [kiResult, setKiResult] = useState<string | null>(null)
  const [kiLeaseFound, setKiLeaseFound] = useState<boolean | null>(null)
  const [isRunningKi, setIsRunningKi] = useState(false)
  const [kiError, setKiError] = useState<string | null>(null)

  // Aktions-Panel state
  const [contractors, setContractors] = useState<{id: string; name: string; company: string; email: string; phone: string | null; specialties: string[]}[]>([])
  const [selectedContractorId, setSelectedContractorId] = useState('')
  const [ablehnungText, setAblehnungText] = useState('')
  const [isSendingAblehnung, setIsSendingAblehnung] = useState(false)
  const [isSendingWeiterleitung, setIsSendingWeiterleitung] = useState(false)
  const [aktionSuccess, setAktionSuccess] = useState<string | null>(null)
  const [aktionError, setAktionError] = useState<string | null>(null)

  // Fetch case
  async function fetchCase() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/hv/cases/${id}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden des Falls")
      }
      const json = await res.json()
      const data = json.data as CaseDetail
      setCaseData(data)

      // Populate assignment form
      setAssignName(data.assigned_to_name || "")
      setAssignPhone(data.assigned_to_phone || "")
      setAssignEmail(data.assigned_to_email || "")
      setAssignCompany(data.assigned_to_company || "")

      // Populate appointment
      setAppointmentDate(
        data.scheduled_appointment ? toDateTimeLocal(data.scheduled_appointment) : ""
      )

      // Load existing KI analysis if available
      if ((data as CaseDetail & { ki_analyse_result?: string }).ki_analyse_result) {
        setKiResult((data as CaseDetail & { ki_analyse_result?: string }).ki_analyse_result!)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCase()
    fetch('/api/hv/contractors').then(r => r.json()).then(d => {
      if (d.data) setContractors(d.data)
    })
  }, [id])

  // ── Actions ──

  async function handleStatusUpdate() {
    if (!newStatus || !statusComment.trim()) return
    setIsUpdatingStatus(true)
    setStatusMessage(null)

    try {
      const res = await fetch(`/api/hv/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: newStatus, comment: statusComment }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler")

      setStatusMessage({ type: "success", text: json.message || "Status aktualisiert" })
      setNewStatus("")
      setStatusComment("")
      await fetchCase()
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Aktualisieren",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handleAddComment() {
    if (!commentContent.trim()) return
    setIsAddingComment(true)

    try {
      const res = await fetch(`/api/hv/cases/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent,
          is_internal: isInternalComment,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Fehler")
      }

      setCommentContent("")
      setIsInternalComment(false)
      await fetchCase()
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Erstellen des Kommentars",
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  async function handleSaveAssignment() {
    if (!assignName.trim()) return
    setIsSavingAssignment(true)

    try {
      const res = await fetch(`/api/hv/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_to_name: assignName,
          assigned_to_phone: assignPhone || null,
          assigned_to_email: assignEmail || null,
          assigned_to_company: assignCompany || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Fehler")
      }
      await fetchCase()
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Zuweisen",
      })
    } finally {
      setIsSavingAssignment(false)
    }
  }

  async function handleClearAssignment() {
    setIsSavingAssignment(true)
    try {
      const res = await fetch(`/api/hv/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Fehler")
      }
      setAssignName("")
      setAssignPhone("")
      setAssignEmail("")
      setAssignCompany("")
      await fetchCase()
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Entfernen der Zuweisung",
      })
    } finally {
      setIsSavingAssignment(false)
    }
  }

  async function handleSaveAppointment() {
    setIsSavingAppointment(true)
    try {
      const body = appointmentDate
        ? { scheduled_appointment: new Date(appointmentDate).toISOString() }
        : { scheduled_appointment: null }

      const res = await fetch(`/api/hv/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Fehler")
      }
      await fetchCase()
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Setzen des Termins",
      })
    } finally {
      setIsSavingAppointment(false)
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
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
            <p className="text-destructive font-medium">{error || "Fall nicht gefunden"}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => router.push("/dashboard/cases")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
              <Button variant="outline" onClick={fetchCase}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const urgencyConfig = getUrgencyConfig(caseData.urgency)
  const statusConfig = getStatusConfig(caseData.status)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Foto schliessen"
          >
            <X className="h-8 w-8" />
          </button>
          {selectedPhoto.url ? (
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.file_name}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="bg-muted rounded-lg p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <ImageIcon className="h-16 w-16 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Foto konnte nicht geladen werden</p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cases">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Zurück</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">
                {caseData.case_number}
              </span>
              <Badge variant="outline" className={urgencyConfig.className}>
                {urgencyConfig.label}
              </Badge>
              <Badge variant="outline" className={statusConfig.className}>
                {caseData.status_label}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              {caseData.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <Alert variant={statusMessage.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="flex items-center justify-between">
            {statusMessage.text}
            <button onClick={() => setStatusMessage(null)}>
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Case Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schadensmeldung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Kategorie</p>
                  <p className="font-medium">
                    {CATEGORY_LABELS[caseData.category as keyof typeof CATEGORY_LABELS] || caseData.category}
                  </p>
                </div>
                {caseData.subcategory && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Unterkategorie</p>
                    <p className="font-medium">{caseData.subcategory}</p>
                  </div>
                )}
                {caseData.room && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Raum</p>
                    <p className="font-medium">
                      {ROOM_LABELS[caseData.room as keyof typeof ROOM_LABELS] || caseData.room}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Erstellt</p>
                  <p className="font-medium">{formatDateTime(caseData.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Aktualisiert</p>
                  <p className="font-medium">{formatDateTime(caseData.updated_at)}</p>
                </div>
                {caseData.closed_at && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Geschlossen</p>
                    <p className="font-medium">{formatDateTime(caseData.closed_at)}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {caseData.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Beschreibung</p>
                    <p className="text-sm whitespace-pre-wrap">{caseData.description}</p>
                  </div>
                </>
              )}

              {/* Access Notes */}
              {caseData.access_notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Zugangshinweise
                  </p>
                  <p className="text-sm">{caseData.access_notes}</p>
                </div>
              )}

              {/* Preferred Appointment */}
              {caseData.preferred_appointment && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Wunschtermin des Mieters
                  </p>
                  <p className="text-sm">{formatDateTime(caseData.preferred_appointment)}</p>
                </div>
              )}

              {/* Reporter & Unit Info */}
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gemeldet von</p>
                    <p className="text-sm font-medium">
                      {caseData.reporter?.first_name} {caseData.reporter?.last_name}
                    </p>
                  </div>
                </div>
                {caseData.unit && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Wohneinheit</p>
                      <p className="text-sm font-medium">{caseData.unit.name}</p>
                      {caseData.unit.address && (
                        <p className="text-xs text-muted-foreground">{caseData.unit.address}</p>
                      )}
                      {caseData.unit.floor && (
                        <p className="text-xs text-muted-foreground">Stockwerk: {caseData.unit.floor}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Photos */}
              {caseData.photos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Fotos ({caseData.photos.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {caseData.photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo)}
                          className="aspect-square rounded-lg overflow-hidden border bg-muted hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.file_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Kommentare & Verlauf */}
          <Card>
            <Tabs defaultValue="comments">
              <CardHeader className="pb-0">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="comments" className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    Kommentare ({caseData.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Verlauf ({caseData.status_history.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Comments Tab */}
                <TabsContent value="comments" className="mt-0 space-y-4">
                  {/* Add Comment Form */}
                  <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                    <Textarea
                      placeholder={
                        isInternalComment
                          ? "Interne Notiz hinzufügen (nur für HV sichtbar)..."
                          : "Kommentar an Mieter senden..."
                      }
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is-internal"
                          checked={isInternalComment}
                          onCheckedChange={setIsInternalComment}
                        />
                        <Label
                          htmlFor="is-internal"
                          className="text-sm cursor-pointer flex items-center gap-1"
                        >
                          {isInternalComment ? (
                            <>
                              <Lock className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-orange-600">Interne Notiz</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 text-blue-500" />
                              <span>An Mieter senden</span>
                            </>
                          )}
                        </Label>
                      </div>
                      <Button
                        size="sm"
                        disabled={!commentContent.trim() || isAddingComment}
                        onClick={handleAddComment}
                      >
                        {isAddingComment ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Senden
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {caseData.comments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Noch keine Kommentare</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {caseData.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`rounded-lg border p-3 ${
                            comment.is_internal
                              ? "bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800"
                              : "bg-background"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {comment.author?.first_name} {comment.author?.last_name}
                              </span>
                              {comment.is_internal && (
                                <Badge variant="outline" className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">
                                  <Lock className="h-2.5 w-2.5 mr-1" />
                                  Intern
                                </Badge>
                              )}
                              {comment.author?.role && (
                                <span className="text-[10px] text-muted-foreground">
                                  {comment.author.role === "mieter"
                                    ? "Mieter"
                                    : comment.author.role === "hv_admin"
                                      ? "Admin"
                                      : "HV"}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="mt-0">
                  {caseData.status_history.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Kein Statusverlauf vorhanden</p>
                    </div>
                  ) : (
                    <div className="relative space-y-0">
                      {caseData.status_history.map((entry, idx) => (
                        <div key={entry.id} className="flex gap-3">
                          {/* Timeline Line */}
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full bg-primary border-2 border-background ring-2 ring-muted shrink-0 mt-1" />
                            {idx < caseData.status_history.length - 1 && (
                              <div className="w-0.5 flex-1 bg-muted" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="pb-6 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.old_status_label && (
                                <>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${getStatusConfig(entry.old_status!).className}`}
                                  >
                                    {entry.old_status_label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">→</span>
                                </>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${getStatusConfig(entry.new_status).className}`}
                              >
                                {entry.new_status_label}
                              </Badge>
                            </div>
                            {entry.note && (
                              <p className="text-sm mt-1 text-muted-foreground">
                                {entry.note}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {entry.changed_by
                                ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                                : "System"}
                              {" - "}
                              {formatDateTime(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status aktualisieren</CardTitle>
              <CardDescription>
                Aktueller Status: {caseData.status_label}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">Neuer Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_STATUSES.filter((s) => s !== caseData.status).map((s) => (
                      <SelectItem key={s} value={s}>
                        {CASE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">
                  Kommentar (Pflichtfeld)
                </Label>
                <Textarea
                  placeholder="Grund für die Status-Änderung..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="resize-none min-h-[70px]"
                />
              </div>
              <Button
                className="w-full"
                disabled={!newStatus || !statusComment.trim() || isUpdatingStatus}
                onClick={handleStatusUpdate}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Status speichern
              </Button>
            </CardContent>
          </Card>

          {/* Handwerker Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Handwerker zuweisen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">Name *</Label>
                <Input
                  placeholder="Name des Handwerkers"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Firma</Label>
                <Input
                  placeholder="Firmenname (optional)"
                  value={assignCompany}
                  onChange={(e) => setAssignCompany(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block">Telefon</Label>
                  <Input
                    type="tel"
                    placeholder="+43..."
                    value={assignPhone}
                    onChange={(e) => setAssignPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">E-Mail</Label>
                  <Input
                    type="email"
                    placeholder="email@..."
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!assignName.trim() || isSavingAssignment}
                  onClick={handleSaveAssignment}
                >
                  {isSavingAssignment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Speichern
                </Button>
                {caseData.assigned_to_name && (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isSavingAssignment}
                    onClick={handleClearAssignment}
                    title="Zuweisung entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KI-Analyse */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                KI-Analyse
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Mietrecht & Verantwortlichkeit automatisch prüfen
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {kiResult ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm whitespace-pre-wrap text-purple-900 max-h-64 overflow-y-auto">
                    {kiResult}
                  </div>
                  {kiLeaseFound === false && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <FileSearch className="h-3.5 w-3.5" />
                      Kein Mietvertrag hinterlegt — Analyse nach MRG
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isRunningKi}
                    onClick={async () => {
                      setIsRunningKi(true)
                      setKiError(null)
                      try {
                        const res = await fetch(`/api/hv/cases/${id}/ki-analyse`, { method: "POST" })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                        setKiResult(data.result)
                        setKiLeaseFound(data.lease_found)
                      } catch (err) {
                        setKiError(err instanceof Error ? err.message : 'Fehler')
                      } finally {
                        setIsRunningKi(false)
                      }
                    }}
                  >
                    {isRunningKi ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                    Neu analysieren
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {kiError && (
                    <p className="text-xs text-destructive">{kiError}</p>
                  )}
                  <Button
                    className="w-full"
                    disabled={isRunningKi}
                    onClick={async () => {
                      setIsRunningKi(true)
                      setKiError(null)
                      try {
                        const res = await fetch(`/api/hv/cases/${id}/ki-analyse`, { method: "POST" })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                        setKiResult(data.result)
                        setKiLeaseFound(data.lease_found)
                      } catch (err) {
                        setKiError(err instanceof Error ? err.message : 'Fehler')
                      } finally {
                        setIsRunningKi(false)
                      }
                    }}
                  >
                    {isRunningKi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analysiere...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        KI-Analyse starten
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Prüft Mietvertrag & österreichisches MRG
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Schnellaktionen ── */}
          {kiResult && !['abgelehnt', 'erledigt'].includes(caseData.status) && (() => {
            const kiLower = kiResult.toLowerCase()
            const isMieterVerantwortlich = kiLower.includes('verantwortlich: mieter') || kiLower.includes('verantwortung: mieter') || (kiLower.includes('mieter') && kiLower.includes('verantwortlich') && !kiLower.includes('hausverwaltung verantwortlich') && !kiLower.includes('vermieter verantwortlich'))
            const matchingContractors = contractors.filter(c => c.specialties.includes(caseData.category))
            const suggestedContractor = matchingContractors[0] || contractors[0]

            // Auto-set suggested contractor
            if (suggestedContractor && !selectedContractorId) {
              setTimeout(() => setSelectedContractorId(suggestedContractor.id), 0)
            }

            // Auto-fill ablehnung text from KI
            if (isMieterVerantwortlich && !ablehnungText) {
              const lines = kiResult.split('\n').filter(l => l.trim() && !l.includes('**') || l.includes('Begründung') || l.includes('Mieter'))
              const autoText = lines.slice(0, 5).join(' ').replace(/\*\*/g, '').trim().substring(0, 500)
              if (autoText) setTimeout(() => setAblehnungText(autoText), 0)
            }

            return (
              <Card className={isMieterVerantwortlich ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {isMieterVerantwortlich ? (
                      <><span className="text-red-600">⚠</span> Aktion: Mieter verantwortlich</>
                    ) : (
                      <><span className="text-green-600">✓</span> Aktion: Vermieter verantwortlich</>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {isMieterVerantwortlich
                      ? 'KI empfiehlt: Meldung ablehnen — Kosten beim Mieter'
                      : 'KI empfiehlt: Werkstatt beauftragen — Kosten beim Vermieter'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aktionSuccess && (
                    <div className="rounded-lg bg-green-100 border border-green-300 px-3 py-2 text-sm text-green-800 font-medium">{aktionSuccess}</div>
                  )}
                  {aktionError && (
                    <div className="rounded-lg bg-red-100 border border-red-300 px-3 py-2 text-sm text-red-800">{aktionError}</div>
                  )}

                  {isMieterVerantwortlich ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Begründung an Mieter</label>
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
                          value={ablehnungText}
                          onChange={e => setAblehnungText(e.target.value)}
                          placeholder="Begründung aus KI-Analyse wird automatisch übernommen..."
                        />
                      </div>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={isSendingAblehnung || !ablehnungText.trim()}
                        onClick={async () => {
                          setIsSendingAblehnung(true)
                          setAktionError(null)
                          try {
                            const res = await fetch(`/api/hv/cases/${id}/ablehnen`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ begruendung: ablehnungText }),
                            })
                            if (!res.ok) throw new Error((await res.json()).error)
                            setAktionSuccess('Absage gesendet — Mieter wurde per E-Mail informiert')
                            await fetchCase()
                          } catch (err) {
                            setAktionError(err instanceof Error ? err.message : 'Fehler')
                          } finally {
                            setIsSendingAblehnung(false)
                          }
                        }}
                      >
                        {isSendingAblehnung ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Absage senden
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Werkstatt</label>
                        <Select value={selectedContractorId} onValueChange={setSelectedContractorId}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Werkstatt wählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {matchingContractors.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Passend zur Kategorie</div>
                                {matchingContractors.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.company} ({c.name})</SelectItem>
                                ))}
                                {contractors.filter(c => !c.specialties.includes(caseData.category)).length > 0 && (
                                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-1">Alle anderen</div>
                                )}
                              </>
                            )}
                            {contractors.filter(c => !c.specialties.includes(caseData.category)).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.company} ({c.name})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {caseData.preferred_appointment && (
                        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm">
                          <span className="text-xs text-muted-foreground">Wunschtermin Mieter: </span>
                          <span className="font-medium">{formatDateTime(caseData.preferred_appointment)}</span>
                          <span className="text-xs text-blue-600 ml-2">(wird automatisch übernommen)</span>
                        </div>
                      )}

                      <Button
                        className="w-full bg-green-700 hover:bg-green-800 text-white"
                        disabled={isSendingWeiterleitung || !selectedContractorId}
                        onClick={async () => {
                          setIsSendingWeiterleitung(true)
                          setAktionError(null)
                          try {
                            const res = await fetch(`/api/hv/cases/${id}/weiterleiten`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                contractor_id: selectedContractorId,
                                scheduled_appointment: caseData.preferred_appointment,
                              }),
                            })
                            if (!res.ok) throw new Error((await res.json()).error)
                            setAktionSuccess('Weiterleitung gesendet — Mieter & Werkstatt wurden per E-Mail informiert')
                            await fetchCase()
                          } catch (err) {
                            setAktionError(err instanceof Error ? err.message : 'Fehler')
                          } finally {
                            setIsSendingWeiterleitung(false)
                          }
                        }}
                      >
                        {isSendingWeiterleitung ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Weiterleiten & informieren
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Appointment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Termin festlegen
              </CardTitle>
              {caseData.scheduled_appointment && (
                <CardDescription>
                  Aktuell: {formatDateTime(caseData.scheduled_appointment)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">Datum & Uhrzeit</Label>
                <Input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={isSavingAppointment}
                  onClick={handleSaveAppointment}
                >
                  {isSavingAppointment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {appointmentDate ? "Termin speichern" : "Termin entfernen"}
                </Button>
                {caseData.scheduled_appointment && appointmentDate && (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isSavingAppointment}
                    onClick={() => {
                      setAppointmentDate("")
                    }}
                    title="Termin löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Der Mieter wird per E-Mail über den Termin informiert.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
