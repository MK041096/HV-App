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
  Upload,
  Receipt,
  Shield,
  ExternalLink,
  List,
  CheckCircle2,
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PdfViewer } from "@/components/pdf-viewer"

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
  room: string | null
  access_notes: string | null
  preferred_appointment: string | null
  preferred_appointment_2: string | null
  ki_analyse_result: string | null
  assigned_to_name: string | null
  assigned_to_phone: string | null
  assigned_to_email: string | null
  assigned_to_company: string | null
  scheduled_appointment: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  created_by_hv: boolean | null
  unit: { id: string; name: string; address: string | null; floor: string | null } | null
  reporter: { id: string; first_name: string | null; last_name: string | null; role: string } | null
  photos: Photo[]
  status_history: StatusHistoryEntry[]
  comments: Comment[]
  is_insurance_damage: boolean
  insurance_notes: string | null
  invoice_path: string | null
  invoice_filename: string | null
  invoice_uploaded_at: string | null
}

// ── CARL Analysis Parser ──

interface CarlSections {
  verantwortlich: string | null
  begruendung: string | null
  empfehlung: string | null
  dringlichkeit: string | null
  hinweis: string | null
  zustaendigkeit: string | null
  rechtsgrundlage: string | null
  versicherung: string | null
  werkstatt: string | null
  suchempfehlung: string | null
  mieterinfo: string | null
  raw: string
}

function parseCarlAnalysis(text: string): CarlSections {
  const extract = (patterns: string[]): string | null => {
    for (const pattern of patterns) {
      const regex = new RegExp(`(?:\\*\\*)?${pattern}(?:\\*\\*)?:?\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-ZÜÄÖ]|\\n[A-ZÜÄÖ_]+:|\\n\\d+\\.|$)`, 'i')
      const m = text.match(regex)
      if (m?.[1]?.trim()) return m[1].replace(/\*\*/g, '').trim()
    }
    return null
  }
  return {
    verantwortlich: extract(['VERANTWORTLICH', 'Verantwortlich']),
    begruendung: extract(['BEGRÜNDUNG', 'Begründung', 'BEGRUENDUNG']),
    empfehlung: extract(['EMPFEHLUNG', 'Empfehlung']),
    dringlichkeit: extract(['DRINGLICHKEIT', 'Dringlichkeit']),
    hinweis: extract(['HINWEIS', 'Hinweis']),
    zustaendigkeit: extract(['ZUSTÄNDIGKEIT', 'Zustaendigkeit', 'Zuständigkeit', '1\\. \\*\\*Zustaendigkeit']),
    rechtsgrundlage: extract(['RECHTSGRUNDLAGE', 'Rechtsgrundlage', '2\\. \\*\\*Rechtsgrundlage']),
    versicherung: extract(['VERSICHERUNG', 'Versicherungsrelevanz', 'Versicherung', '3\\. \\*\\*Versicherungsrelevanz']),
    werkstatt: extract(['WERKSTATT']),
    suchempfehlung: extract(['SUCHEMPFEHLUNG']),
    mieterinfo: extract(['MIETERINFO']),
    raw: text,
  }
}

function CarlAnalysisDisplay({ text, leaseFound, insuranceFound, photoCount }: {
  text: string
  leaseFound: boolean | null
  insuranceFound?: boolean
  photoCount?: number
}) {
  const s = parseCarlAnalysis(text)

  const verantwortlichLower = (s.verantwortlich || '').toLowerCase()
  const isHV = verantwortlichLower.includes('hausverwaltung') || verantwortlichLower.includes('vermieter')
  const isMieter = verantwortlichLower.includes('mieter') && !isHV
  const isUnklar = !isHV && !isMieter

  const dringLower = (s.dringlichkeit || '').toLowerCase()
  const isNotfall = dringLower.includes('notfall')
  const isDringend = dringLower.includes('dringend')

  const responsibleLabel = isHV ? 'Hausverwaltung' : isMieter ? 'Mieter' : 'Unklar'
  const responsibleBg = isHV ? 'bg-green-50 border-green-200' : isMieter ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
  const responsibleText = isHV ? 'text-green-800' : isMieter ? 'text-red-800' : 'text-amber-800'
  const responsibleIcon = isHV ? '✓' : isMieter ? '✗' : '?'

  const urgencyBg = isNotfall ? 'bg-red-600 text-white' : isDringend ? 'bg-orange-500 text-white' : 'bg-blue-100 text-blue-800'
  const urgencyLabel = isNotfall ? '⚡ NOTFALL — Sofort handeln' : isDringend ? '⏰ DRINGEND — Innerhalb 48h' : '✓ NORMAL — Innerhalb 2 Wochen'

  // If parsing didn't extract sections, show formatted raw text
  const hasStructure = !!(s.verantwortlich || s.zustaendigkeit)

  if (!hasStructure) {
    return (
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 text-sm whitespace-pre-wrap text-purple-900">
        {text}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Dringlichkeit — oben prominent */}
      <div className={`rounded-lg px-4 py-3 font-bold text-sm ${urgencyBg}`}>
        {urgencyLabel}
      </div>

      {/* Verantwortlichkeit — die wichtigste Aussage */}
      <div className={`rounded-lg border-2 p-4 ${responsibleBg}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-lg font-bold ${responsibleText}`}>{responsibleIcon}</span>
          <span className={`font-bold text-base ${responsibleText}`}>Verantwortlich: {responsibleLabel}</span>
        </div>
        {(s.begruendung || s.zustaendigkeit) && (
          <p className={`text-sm ${responsibleText} opacity-90`}>
            {s.begruendung || s.zustaendigkeit}
          </p>
        )}
      </div>

      {/* Empfehlung */}
      {s.empfehlung && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Empfohlener nächster Schritt</p>
          <p className="text-sm text-slate-800 font-medium">{s.empfehlung}</p>
        </div>
      )}

      {/* Rechtsgrundlage + Versicherung nebeneinander */}
      {(s.rechtsgrundlage || s.versicherung) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {s.rechtsgrundlage && (
            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Rechtsgrundlage</p>
              <p className="text-xs text-slate-700">{s.rechtsgrundlage}</p>
            </div>
          )}
          {s.versicherung && (
            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Versicherung</p>
              <p className="text-xs text-slate-700">{s.versicherung}</p>
            </div>
          )}
        </div>
      )}

      {/* Hinweis */}
      {s.hinweis && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-700">{s.hinweis}</p>
        </div>
      )}

      {/* Datenquellen */}
      <div className="flex flex-wrap gap-2 pt-1">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${leaseFound ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
          {leaseFound ? '✓' : '✗'} Mietvertrag
        </span>
        {insuranceFound !== undefined && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${insuranceFound ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
            {insuranceFound ? '✓' : '✗'} Versicherungspolice
          </span>
        )}
        {photoCount !== undefined && photoCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
            📷 {photoCount} Foto{photoCount > 1 ? 's' : ''} analysiert
          </span>
        )}
      </div>
    </div>
  )
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
  const configs: Record<string, { className: string; label: string }> = {
    neu: { className: "bg-sky-100 text-sky-800 border-sky-200", label: "Neu" },
    warte_auf_handwerker: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "Wartet auf Handwerker" },
    termin_vereinbart: { className: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "Termin vereinbart" },
    termin_telefonisch: { className: "bg-teal-100 text-teal-800 border-teal-200", label: "Termin telefonisch" },
    erledigt: { className: "bg-green-100 text-green-800 border-green-200", label: "Erledigt" },
    abgelehnt: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Abgelehnt" },
  }
  return configs[status] || { className: "", label: status }
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
  const [kiInsuranceFound, setKiInsuranceFound] = useState<boolean | undefined>(undefined)
  const [kiPhotoCount, setKiPhotoCount] = useState<number>(0)
  const [isRunningKi, setIsRunningKi] = useState(false)
  const [kiError, setKiError] = useState<string | null>(null)

  // Mietvertrag-Status aus dem CARL-Output parsen (CARL gibt MIETVERTRAG_STATUS:
  // AUSGEWERTET / NICHT_VORHANDEN / FEHLER zurück). Statt auf ein separates API-Feld
  // zu vertrauen, lesen wir es direkt aus dem analysisText.
  const kiLeaseFound = kiResult
    ? /MIETVERTRAG_STATUS:\s*AUSGEWERTET/i.test(kiResult)
    : null

  // Aktions-Panel state
  const [contractors, setContractors] = useState<{id: string; name: string; company: string; email: string; phone: string | null; specialties: string[]}[]>([])
  const [selectedContractorId, setSelectedContractorId] = useState('')
  const [ablehnungText, setAblehnungText] = useState('')
  const [isSendingAblehnung, setIsSendingAblehnung] = useState(false)
  const [isSendingWeiterleitung, setIsSendingWeiterleitung] = useState(false)
  const [naechsterSchrittDate, setNaechsterSchrittDate] = useState('')
  const [isSendingSchnell, setIsSendingSchnell] = useState(false)
  const [schnellError, setSchnellError] = useState<string | null>(null)
  const [schnellSuccess, setSchnellSuccess] = useState<string | null>(null)
  const [showContractorChange, setShowContractorChange] = useState(false)

  // Werkstatt-Mail-Vorschau Dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [personalNote, setPersonalNote] = useState('')

  // Rechtsgrundlage-Sheet (PROJ-23)
  const [legalSheetOpen, setLegalSheetOpen] = useState(false)
  const [legalSheetLoading, setLegalSheetLoading] = useState(false)
  const [legalSheetData, setLegalSheetData] = useState<{ paragraph: string; country: string; law: string; title: string; text: string; source_url: string; last_verified_at: string } | null>(null)
  const [legalSheetError, setLegalSheetError] = useState<string | null>(null)
  const [legalSheetParagraph, setLegalSheetParagraph] = useState<string | null>(null)

  // Versicherungs-PDF Sheet (PROJ-23)
  const [insuranceSheetOpen, setInsuranceSheetOpen] = useState(false)
  const [insuranceSheetLoading, setInsuranceSheetLoading] = useState(false)
  const [insuranceSheetData, setInsuranceSheetData] = useState<{ name: string; pdfUrl: string; clause: string | null } | null>(null)
  const [insuranceSheetError, setInsuranceSheetError] = useState<string | null>(null)

  // Mietvertrag-PDF Sheet (PROJ-23 Erweiterung)
  const [leaseSheetOpen, setLeaseSheetOpen] = useState(false)
  const [leaseSheetLoading, setLeaseSheetLoading] = useState(false)
  const [leaseSheetData, setLeaseSheetData] = useState<{ name: string; pdfUrl: string; hint: string | null } | null>(null)
  const [leaseSheetError, setLeaseSheetError] = useState<string | null>(null)

  // Abschluss-Dialog (Fall abschließen)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closeNote, setCloseNote] = useState('')
  const [isClosingCase, setIsClosingCase] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)
  const [aktionSuccess, setAktionSuccess] = useState<string | null>(null)
  const [aktionError, setAktionError] = useState<string | null>(null)

  // Contractor picker (Werkstatt-Liste)
  const [showContractorPicker, setShowContractorPicker] = useState(false)

  // Manual contractor fallback (wenn keine Werkstatt hinterlegt)
  const [manualContractorName, setManualContractorName] = useState('')
  const [manualContractorEmail, setManualContractorEmail] = useState('')
  const [manualContractorPhone, setManualContractorPhone] = useState('')
  const [useManualContractor, setUseManualContractor] = useState(false)

  // Anfrage-Workflow (keine Partnerwerkstätten vorhanden)
  const [anfrageEmail, setAnfrageEmail] = useState('')
  const [isSendingAnfrage, setIsSendingAnfrage] = useState(false)
  const [anfrageSuccess, setAnfrageSuccess] = useState(false)
  const [anfrageError, setAnfrageError] = useState<string | null>(null)
  const [showSaveAsPartner, setShowSaveAsPartner] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [isSavingPartner, setIsSavingPartner] = useState(false)
  const [partnerSaved, setPartnerSaved] = useState(false)

  // Manuelles Werkstatt-Formular
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualTaetigkeit, setManualTaetigkeit] = useState('')
  const [manualBeschreibung, setManualBeschreibung] = useState('')
  const [manualSaveToList, setManualSaveToList] = useState(true)
  const [isSendingManual, setIsSendingManual] = useState(false)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeletingCase, setIsDeletingCase] = useState(false)

  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false)
  const [invoiceSignedUrl, setInvoiceSignedUrl] = useState<string | null>(null)
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null)
  const [isInsuranceDamage, setIsInsuranceDamage] = useState(false)
  const [insuranceNotes, setInsuranceNotes] = useState("")
  const [isSavingInsurance, setIsSavingInsurance] = useState(false)
  const [insuranceSuccess, setInsuranceSuccess] = useState<string | null>(null)

  // HV-manuell: Beschreibung ergänzen vor CARL-Analyse
  const [hvDescription, setHvDescription] = useState("")
  const [isSavingHvDesc, setIsSavingHvDesc] = useState(false)
  const [hvDescSaved, setHvDescSaved] = useState(false)

  async function handleSaveHvDescription() {
    if (!hvDescription.trim()) return
    setIsSavingHvDesc(true)
    try {
      await fetch(`/api/hv/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: hvDescription.trim() }),
      })
      setHvDescSaved(true)
      await fetchCase()
    } catch { /* ignore */ } finally {
      setIsSavingHvDesc(false)
    }
  }

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
      setIsInsuranceDamage(data.is_insurance_damage ?? false)
      setInsuranceNotes(data.insurance_notes ?? "")
      // Load invoice signed URL if invoice exists
      if (data.invoice_path) {
        fetch(`/api/hv/cases/${data.id}/invoice`)
          .then(r => r.json())
          .then(j => { if (j.data?.signed_url) setInvoiceSignedUrl(j.data.signed_url) })
          .catch(() => {})
      }

      // Populate assignment form
      setAssignName(data.assigned_to_name || "")
      setAssignPhone(data.assigned_to_phone || "")
      setAssignEmail(data.assigned_to_email || "")
      setAssignCompany(data.assigned_to_company || "")

      // Populate appointment
      setAppointmentDate(
        data.scheduled_appointment ? toDateTimeLocal(data.scheduled_appointment) : ""
      )
      setNaechsterSchrittDate(
        data.scheduled_appointment
          ? toDateTimeLocal(data.scheduled_appointment)
          : data.preferred_appointment
          ? toDateTimeLocal(data.preferred_appointment)
          : ''
      )

      // Load existing KI analysis if available
      if (data.ki_analyse_result) {
        setKiResult(data.ki_analyse_result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }

  async function runKiAnalysis() {
    setIsRunningKi(true)
    setKiError(null)
    try {
      const res = await fetch(`/api/hv/cases/${id}/ki-analyse`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setKiResult(data.result)
      setKiInsuranceFound(data.insurance_found ?? false)
      setKiPhotoCount(data.photo_count ?? 0)
      // Auto-select CARL's recommended contractor if not already set
      if (data.recommended_contractor_id && !selectedContractorId) {
        setSelectedContractorId(data.recommended_contractor_id)
      }
    } catch (err) {
      setKiError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setIsRunningKi(false)
    }
  }

  useEffect(() => {
    fetchCase()
    fetch('/api/hv/contractors').then(r => r.json()).then(d => {
      if (d.data) setContractors(d.data)
    })
  }, [id])

  // Auto-run KI when case first loads without existing analysis
  // Aber NICHT bei manuell angelegten Fällen ohne Beschreibung — dort muss HV erst Infos eingeben
  useEffect(() => {
    if (!caseData || caseData.ki_analyse_result || isRunningKi || kiResult) return
    if (caseData.created_by_hv && !caseData.description) return
    runKiAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData?.id])

  // Mieter-Absage-Begründung mit CARL's MIETERINFO vorbefüllen — ABER NUR wenn
  // CARL den Schaden tatsächlich dem Mieter zuordnet. Bei Vermieter/Versicherung/Unklar
  // bleibt das Feld leer (HV soll dann bewusst entscheiden, nicht versehentlich absenden).
  useEffect(() => {
    if (!kiResult || ablehnungText.trim()) return
    const carlSections = parseCarlAnalysis(kiResult)
    const zust = (carlSections.zustaendigkeit || '').toUpperCase()
    const isMieterFall = zust.includes('MIETER') && !zust.includes('VERMIETER')
    if (isMieterFall && carlSections.mieterinfo) {
      setAblehnungText(carlSections.mieterinfo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiResult])

  // Auto-Vorauswahl der von CARL empfohlenen Werkstatt:
  // 1. Erste Wahl: CARL hat eine konkrete Werkstatt im 'WERKSTATT:'-Feld benannt → nehme die
  // 2. Fallback: keine CARL-Empfehlung → nimm die erste passende Werkstatt der Kategorie
  useEffect(() => {
    if (!caseData || contractors.length === 0 || selectedContractorId) return

    // 1. CARL-Empfehlung aus Analysetext parsen
    if (kiResult) {
      const carlSections = parseCarlAnalysis(kiResult)
      const empfohleneWerkstatt = carlSections.werkstatt?.trim()
      if (empfohleneWerkstatt
          && empfohleneWerkstatt.toLowerCase() !== 'keine passende partnerwerkstatt'
          && empfohleneWerkstatt.toLowerCase() !== 'keine werkstätten hinterlegt') {
        const carlMatch = contractors.find(c =>
          c.company.toLowerCase() === empfohleneWerkstatt.toLowerCase() ||
          empfohleneWerkstatt.toLowerCase().includes(c.company.toLowerCase()) ||
          c.company.toLowerCase().includes(empfohleneWerkstatt.toLowerCase())
        )
        if (carlMatch) {
          setSelectedContractorId(carlMatch.id)
          return
        }
      }
    }

    // 2. Fallback: Kategorie-basiertes Matching
    const categoryToSpecialty: Record<string, string> = {
      wasserschaden: 'wasserschaden',
      heizung: 'heizung',
      elektrik: 'elektrik',
      fenster_tueren: 'fenster_tueren',
      boeden_waende: 'boeden_waende',
      schimmel: 'schimmel',
      sanitaer: 'sanitaer',
      aussenbereich: 'aussenbereich',
      sonstiges: 'sonstiges',
    }
    const neededSpecialty = categoryToSpecialty[caseData.category]
    if (!neededSpecialty) return
    const match = contractors.find(c => c.specialties.includes(neededSpecialty))
    if (match) setSelectedContractorId(match.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData?.id, contractors, kiResult])

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

  async function handleDeleteCase() {
    setIsDeletingCase(true)
    try {
      const res = await fetch(`/api/hv/cases/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Fehler beim Löschen")
      router.push("/dashboard/cases")
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Fehler beim Löschen",
      })
      setShowDeleteDialog(false)
    } finally {
      setIsDeletingCase(false)
    }
  }

  async function handleSendManual() {
    setIsSendingManual(true)
    setSchnellError(null)
    setSchnellSuccess(null)
    try {
      const res = await fetch(`/api/hv/cases/${id}/weiterleiten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual_contractor: {
            name: manualName.trim(),
            email: manualEmail.trim(),
            phone: manualPhone.trim(),
            taetigkeit: manualTaetigkeit.trim(),
            beschreibung: manualBeschreibung.trim() || undefined,
          },
          save_to_list: manualSaveToList,
          scheduled_appointment: caseData?.preferred_appointment || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSchnellSuccess('✓ Werkstatt beauftragt — Mieter & Werkstatt informiert')
      setShowManualForm(false)
      setManualName(''); setManualEmail(''); setManualPhone(''); setManualTaetigkeit(''); setManualBeschreibung('')
      await fetchCase()
    } catch (err) {
      setSchnellError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setIsSendingManual(false)
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

  const statusConfig = getStatusConfig(caseData.status)

  // ── Helper: Extrahiert Paragraf aus RECHTSGRUNDLAGE-Text ──
  // z.B. "Österreich — MRG § 8 Abs. 2 i.V.m. ..." → "MRG § 8"
  // Absatz/Ziffer bewusst weglassen — DB hat den Paragraf-Volltext, der alle Absätze enthält
  const extractParagraph = (rechtsgrundlage: string | null | undefined): string | null => {
    if (!rechtsgrundlage) return null
    const match = rechtsgrundlage.match(/(MRG|ABGB|BGB|WEG)\s*§\s*(\d+)/i)
    if (!match) return null
    return `${match[1].toUpperCase()} § ${match[2]}`
  }

  // ── Lädt Volltext zu Paragraf via API ──
  const openLegalSheet = async (paragraph: string) => {
    setLegalSheetParagraph(paragraph)
    setLegalSheetOpen(true)
    setLegalSheetLoading(true)
    setLegalSheetError(null)
    setLegalSheetData(null)
    try {
      const res = await fetch(`/api/legal/${encodeURIComponent(paragraph)}`)
      if (res.status === 404) {
        setLegalSheetError(`Volltext für ${paragraph} ist noch nicht hinterlegt. Bitte direkt in der offiziellen Quelle prüfen.`)
        return
      }
      if (!res.ok) throw new Error('Fehler beim Laden')
      setLegalSheetData(await res.json())
    } catch (err) {
      setLegalSheetError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLegalSheetLoading(false)
    }
  }

  // ── Lädt Versicherungs-PDF + Klausel ──
  const openInsuranceSheet = async () => {
    setInsuranceSheetOpen(true)
    setInsuranceSheetLoading(true)
    setInsuranceSheetError(null)
    setInsuranceSheetData(null)
    try {
      const res = await fetch(`/api/hv/cases/${id}/insurance-clause`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Police nicht verfügbar')
      }
      setInsuranceSheetData(await res.json())
    } catch (err) {
      setInsuranceSheetError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setInsuranceSheetLoading(false)
    }
  }

  // ── Helper: Erkennt ob CARL den Mietvertrag in der Rechtsgrundlage zitiert ──
  // Match auf "Mietvertrag § X" oder "MV § X" — case-insensitive
  const extractMietvertragRef = (rechtsgrundlage: string | null | undefined): string | null => {
    if (!rechtsgrundlage) return null
    const match = rechtsgrundlage.match(/(?:Mietvertrag|MV)\s*§\s*\d+(?:\s*Abs\.\s*\d+)?/i)
    return match ? match[0] : null
  }

  // ── Lädt Mietvertrag-PDF + CARL-Hinweis ──
  const openLeaseSheet = async () => {
    setLeaseSheetOpen(true)
    setLeaseSheetLoading(true)
    setLeaseSheetError(null)
    setLeaseSheetData(null)
    try {
      const res = await fetch(`/api/hv/cases/${id}/mietvertrag-pdf`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Mietvertrag nicht verfügbar')
      }
      setLeaseSheetData(await res.json())
    } catch (err) {
      setLeaseSheetError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLeaseSheetLoading(false)
    }
  }


  // ── Parse CARL structured output (inline) ──
  const parseCarlAnalysis = (text: string) => {
    const get = (key: string) => text.match(new RegExp('^' + key + ':\\s*(.+)', 'mi'))?.[1]?.trim() ?? null
    const zustaendigkeit = get('ZUSTÄNDIGKEIT') || get('ZUSTäNDIGKEIT') || get('ZUSTAENDIGKEIT')
    const erklaerungMatch = text.match(/^(?:BEGRÜNDUNG|ERKLÄRUNG):\s*([\s\S]+?)(?:\n[A-ZÜÄÖ_]{3,}:|$)/mi)
    // MIETERINFO ist mehrzeilig — bis zum nächsten Schlüsselwort
    const mieterinfoMatch = text.match(/^MIETERINFO:\s*([\s\S]+?)(?:\n[A-ZÜÄÖ_]{3,}:|$)/mi)
    const suchempfehlung = get('SUCHEMPFEHLUNG')
    return {
      zustaendigkeit,
      rechtsgrundlage: get('RECHTSGRUNDLAGE'),
      versicherung: get('VERSICHERUNG'),
      versicherungBegruendung: get('VERSICHERUNG_BEGRUENDUNG'),
      empfehlung: get('EMPFEHLUNG'),
      werkstatt: get('WERKSTATT'),
      werkstattBegruendung: get('WERKSTATT_BEGRUENDUNG'),
      erklaerung: erklaerungMatch?.[1]?.trim() ?? null,
      mieterinfo: mieterinfoMatch?.[1]?.trim() ?? null,
      suchempfehlung: suchempfehlung && suchempfehlung !== 'NICHT_NOETIG' ? suchempfehlung : null,
    }
  }
  const carlData = kiResult ? parseCarlAnalysis(kiResult) : null
  const carlZustaendigkeit = carlData?.zustaendigkeit?.toUpperCase() ?? ''
  const isMieterFall = carlZustaendigkeit.includes('MIETER') && !carlZustaendigkeit.includes('VERMIETER')
  const isUnklarFall = carlZustaendigkeit.includes('UNKLAR') || carlZustaendigkeit === ''

  // Verdict bar styling
  const verdictStyle = isMieterFall
    ? { bar: 'bg-red-50 border-red-200', pill: 'bg-red-100 text-red-800 border-red-200', icon: '⚠️', label: 'MIETER zuständig' }
    : isUnklarFall && carlData
    ? { bar: 'bg-amber-50 border-amber-200', pill: 'bg-amber-100 text-amber-800 border-amber-200', icon: '❓', label: 'UNKLAR — bitte prüfen' }
    : { bar: 'bg-green-50 border-green-200', pill: 'bg-green-100 text-green-800 border-green-200', icon: '✅', label: 'VERMIETER zahlt' }


  const ManualWerkstattForm = (
    <div className="space-y-2">
      {!showManualForm ? (
        <button type="button" onClick={() => setShowManualForm(true)} className="text-xs text-primary underline hover:opacity-70">
          + Externe Werkstatt eingeben
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="rounded bg-amber-50 border border-amber-200 px-2.5 py-2">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Hinweis:</strong> Bitte kontaktieren Sie die Werkstatt vorab und teilen Sie ihr mit, dass die Beauftragung über SMARTCARL läuft — außer sie kennt das System bereits.
            </p>
          </div>
          <Input placeholder="Name *" value={manualName} onChange={e => setManualName(e.target.value)} className="text-sm h-8" />
          <Input placeholder="E-Mail *" type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} className="text-sm h-8" />
          <Input placeholder="Telefon *" type="tel" value={manualPhone} onChange={e => setManualPhone(e.target.value)} className="text-sm h-8" />
          <Input placeholder="Tätigkeit * (z.B. Sanitär, Elektrik)" value={manualTaetigkeit} onChange={e => setManualTaetigkeit(e.target.value)} className="text-sm h-8" />
          <Input placeholder="Beschreibung (optional)" value={manualBeschreibung} onChange={e => setManualBeschreibung(e.target.value)} className="text-sm h-8" />
          <div className="flex items-center gap-2 pt-0.5">
            <Checkbox id="saveToList" checked={manualSaveToList} onCheckedChange={v => setManualSaveToList(!!v)} />
            <Label htmlFor="saveToList" className="text-xs text-muted-foreground cursor-pointer">In Partnerliste speichern</Label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setShowManualForm(false)}>Abbrechen</Button>
            <Button size="sm" className="flex-1 h-7 text-xs bg-green-700 hover:bg-green-800 text-white"
              disabled={isSendingManual || !manualName.trim() || !manualEmail.trim() || !manualPhone.trim() || !manualTaetigkeit.trim()}
              onClick={handleSendManual}>
              {isSendingManual ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Send className="mr-1.5 h-3 w-3" />}
              Beauftragen
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Photo Lightbox ── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setSelectedPhoto(null)}>
            <X className="h-8 w-8" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[90vh]">
            {selectedPhoto.url ? (
              <img src={selectedPhoto.url} alt={selectedPhoto.file_name} className="max-h-[90vh] max-w-full object-contain rounded-lg" />
            ) : (
              <div className="bg-muted rounded-lg p-8 text-center"><ImageIcon className="h-16 w-16 text-muted-foreground mx-auto" /></div>
            )}
            <p className="text-white text-sm text-center mt-2 opacity-70">{selectedPhoto.file_name}</p>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Meldung löschen?</CardTitle><CardDescription>Diese Aktion kann nicht rückgängig gemacht werden.</CardDescription></CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Abbrechen</Button>
              <Button variant="destructive" disabled={isDeletingCase} onClick={handleDeleteCase}>
                {isDeletingCase ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Löschen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">

        {/* ── ① Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <button onClick={() => router.push('/dashboard/cases')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="h-4 w-4" /> Alle Fälle
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusConfig.className}`}>{statusConfig.label}</span>
              <span className="text-sm text-muted-foreground font-mono">{caseData.case_number}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground truncate">{caseData.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {caseData.unit && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{caseData.unit.address && caseData.unit.address !== caseData.unit.name ? `${caseData.unit.name} · ${caseData.unit.address}` : caseData.unit.name}</span>}
              {caseData.reporter && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{caseData.reporter.first_name} {caseData.reporter.last_name}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDateTime(caseData.created_at)}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />Löschen
          </Button>
        </div>

        {/* ── ② Mietvertrag Warning ── */}
        {kiResult && !kiLeaseFound && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Kein Mietvertrag hinterlegt — CARL analysiert nur nach Gesetz</p>
              <p className="text-xs text-amber-700 mt-0.5">Bitte <Link href={`/dashboard/tenants`} className="underline font-medium">Mietvertrag hochladen</Link> für eine vertragsgenaue Analyse.</p>
            </div>
          </div>
        )}

        {/* ── ④ Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT (2/3): Analyse + Falldetails ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* CARL Analyse — erste Priorität */}
            <Card className={kiResult ? 'border-purple-200' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  CARL-Analyse
                </CardTitle>
                {!kiResult && <p className="text-xs text-muted-foreground">Verantwortlichkeit · Mietrecht · Versicherung · Empfehlung</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                {isRunningKi && (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-sm text-muted-foreground">CARL analysiert Mietvertrag, Versicherungspolice und Fotos…</span>
                  </div>
                )}
                {kiError && <p className="text-sm text-destructive">{kiError}</p>}

                {carlData && !isRunningKi && (
                  <div className="space-y-4">
                    {/* 4 Tiles */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded-xl border p-4 ${isMieterFall ? 'bg-red-50 border-red-200' : isUnklarFall ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">👤 Zuständigkeit</p>
                        <p className={`font-bold text-base ${isMieterFall ? 'text-red-800' : isUnklarFall ? 'text-amber-800' : 'text-green-800'}`}>{carlData.zustaendigkeit || '—'}</p>
                      </div>
                      {(() => {
                        const para = extractParagraph(carlData.rechtsgrundlage)
                        const clickable = !!para
                        return (
                          <button
                            type="button"
                            onClick={clickable ? () => openLegalSheet(para!) : undefined}
                            disabled={!clickable}
                            className={`group relative text-left rounded-xl border-2 p-4 transition-all ${clickable ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-400 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400' : 'border-border bg-muted/30 cursor-default'}`}
                          >
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center justify-between gap-1.5">
                              <span>⚖️ Rechtsgrundlage</span>
                              {clickable && <span className="text-[10px] font-bold text-blue-700 normal-case bg-blue-100 px-1.5 py-0.5 rounded group-hover:bg-blue-200 transition">Volltext öffnen →</span>}
                            </p>
                            <p className="font-medium text-sm">{carlData.rechtsgrundlage || '—'}</p>
                          </button>
                        )
                      })()}
                      {(() => {
                        const v = carlData.versicherung?.toLowerCase() || ''
                        const clickable = !!carlData.versicherung && !v.startsWith('keine') && !v.startsWith('prüfen') && !v.startsWith('pruefen')
                        return (
                          <button
                            type="button"
                            onClick={clickable ? () => openInsuranceSheet() : undefined}
                            disabled={!clickable}
                            className={`group relative text-left rounded-xl border-2 p-4 transition-all ${clickable ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-400 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400' : 'border-border bg-muted/30 cursor-default'}`}
                          >
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center justify-between gap-1.5">
                              <span>🛡️ Versicherung</span>
                              {clickable && <span className="text-[10px] font-bold text-blue-700 normal-case bg-blue-100 px-1.5 py-0.5 rounded group-hover:bg-blue-200 transition">Police öffnen →</span>}
                            </p>
                            <p className="font-medium text-sm">{carlData.versicherung || '—'}</p>
                            {carlData.versicherungBegruendung && (
                              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{carlData.versicherungBegruendung}</p>
                            )}
                          </button>
                        )
                      })()}
                      <div className="rounded-xl border bg-purple-50 border-purple-200 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">🔧 Empfehlung</p>
                        <p className="font-medium text-sm text-purple-900">{carlData.empfehlung || '—'}</p>
                      </div>
                    </div>

                    {/* Erklärungstext — weiterleitbar */}
                    {carlData.erklaerung && (
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📄 Erklärung (weiterleitbar)</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(carlData.erklaerung || '')}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Kopieren
                          </button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{carlData.erklaerung}</p>
                        <div className="flex gap-2 flex-wrap pt-1">
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => { setCommentContent(carlData.erklaerung || ''); setIsInternalComment(false) }}>
                            <Send className="h-3 w-3 mr-1.5" />An Mieter senden
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => navigator.clipboard.writeText(`Betreff: Schadensmeldung ${caseData.case_number}\n\n${carlData.erklaerung || ''}`)}>
                            An Versicherung (kopieren)
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => navigator.clipboard.writeText(`Auftrag: ${caseData.title}\nAdresse: ${caseData.unit?.address || ''}\n\n${carlData.erklaerung || ''}`)}>
                            An Werkstatt (kopieren)
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!kiResult && !isRunningKi && (
                  <div className="text-center space-y-3 py-4">
                    <Button onClick={runKiAnalysis} disabled={isRunningKi} className="bg-purple-700 hover:bg-purple-800 text-white">
                      <Sparkles className="mr-2 h-4 w-4" />CARL-Analyse starten
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Prüft Mietvertrag, Versicherung & Fotos
                      {!kiLeaseFound ? ' — Kein Mietvertrag hinterlegt' : ''}
                    </p>
                  </div>
                )}

                {kiResult && !isRunningKi && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={runKiAnalysis}>
                      <RefreshCw className="h-3 w-3 mr-1.5" />Neu analysieren
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meldungsdetails + Fotos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Schadensmeldung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fotos — inline in der Karte */}
                {caseData.photos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Fotos ({caseData.photos.length})</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {caseData.photos.map((photo) => (
                        <button key={photo.id} onClick={() => setSelectedPhoto(photo)}
                          className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
                          {photo.url
                            ? <img src={photo.url} alt={photo.file_name} className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                        </button>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs mb-0.5">Kategorie</p><p className="font-medium">{CATEGORY_LABELS[caseData.category as keyof typeof CATEGORY_LABELS] || caseData.category}</p></div>
                  {caseData.subcategory && <div><p className="text-muted-foreground text-xs mb-0.5">Unterkategorie</p><p className="font-medium">{caseData.subcategory}</p></div>}
                  {caseData.room && <div><p className="text-muted-foreground text-xs mb-0.5">Raum</p><p className="font-medium">{ROOM_LABELS[caseData.room as keyof typeof ROOM_LABELS] || caseData.room}</p></div>}
                  <div><p className="text-muted-foreground text-xs mb-0.5">Erstellt</p><p className="font-medium">{formatDateTime(caseData.created_at)}</p></div>
                </div>
                {caseData.description && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground text-xs mb-1">Beschreibung des Mieters</p>
                    <p className="text-sm whitespace-pre-wrap text-foreground">{caseData.description}</p>
                  </div>
                )}
                {caseData.access_notes && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Zugangshinweise</p>
                    <p className="text-sm">{caseData.access_notes}</p>
                  </div>
                )}
                {(caseData.preferred_appointment || caseData.preferred_appointment_2) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Wunschtermin{caseData.preferred_appointment_2 ? 'e' : ''} des Mieters</p>
                    {caseData.preferred_appointment && <p className="text-sm text-blue-900">1. {formatDateTime(caseData.preferred_appointment)}</p>}
                    {caseData.preferred_appointment_2 && <p className="text-sm text-blue-900 mt-0.5">2. {formatDateTime(caseData.preferred_appointment_2)}</p>}
                  </div>
                )}
                <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Gemeldet von</p><p className="text-sm font-medium">{caseData.reporter?.first_name} {caseData.reporter?.last_name}</p></div>
                  </div>
                  {caseData.unit && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-xs text-muted-foreground">Wohneinheit</p><p className="text-sm font-medium">{caseData.unit.name}</p>{caseData.unit.address && caseData.unit.address !== caseData.unit.name && <p className="text-xs text-muted-foreground">{caseData.unit.address}</p>}{caseData.unit.floor && <p className="text-xs text-muted-foreground">Stockwerk: {caseData.unit.floor}</p>}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs: Kommentare, Verlauf, Dokumente */}
            <Card>
              <Tabs defaultValue="comments">
                <CardHeader className="pb-0">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="dokumente"><Receipt className="h-3.5 w-3.5 mr-1.5" />Dokumente</TabsTrigger>
                    <TabsTrigger value="comments" className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Kommentare ({caseData.comments.length})</TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-1.5"><Clock className="h-4 w-4" />Verlauf ({caseData.status_history.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* DOKUMENTE */}
                  <TabsContent value="dokumente" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Rechnung der Werkstatt</CardTitle><CardDescription>PDF oder Bild der Werkstatt-Rechnung hochladen</CardDescription></CardHeader>
                      <CardContent className="space-y-3">
                        {invoiceError && <Alert variant="destructive"><AlertDescription>{invoiceError}</AlertDescription></Alert>}
                        {invoiceSuccess && <Alert><AlertDescription className="text-green-700">{invoiceSuccess}</AlertDescription></Alert>}
                        {caseData?.invoice_filename ? (
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3"><Receipt className="h-5 w-5 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">{caseData.invoice_filename}</p><p className="text-xs text-muted-foreground">{caseData.invoice_uploaded_at ? new Date(caseData.invoice_uploaded_at).toLocaleString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '–'}</p></div></div>
                            <div className="flex items-center gap-2">
                              {invoiceSignedUrl && <Button variant="outline" size="sm" onClick={() => window.open(invoiceSignedUrl,'_blank')}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Öffnen</Button>}
                              <Button variant="ghost" size="sm" disabled={isDeletingInvoice} onClick={async()=>{if(!confirm('Rechnung wirklich löschen?'))return;setIsDeletingInvoice(true);setInvoiceError(null);try{const res=await fetch(`/api/hv/cases/${caseData.id}/invoice`,{method:'DELETE'});const json=await res.json();if(!res.ok){setInvoiceError(json.error||'Fehler')}else{setCaseData(p=>p?{...p,invoice_path:null,invoice_filename:null,invoice_uploaded_at:null}:p);setInvoiceSignedUrl(null);setInvoiceSuccess('Rechnung gelöscht');setTimeout(()=>setInvoiceSuccess(null),3000)}}catch{setInvoiceError('Verbindungsfehler')}finally{setIsDeletingInvoice(false)}}}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-3">PDF, JPG oder PNG — max. 10 MB</p>
                            <label className="cursor-pointer"><Button variant="outline" size="sm" disabled={isUploadingInvoice} asChild><span>{isUploadingInvoice?<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin"/>Wird hochgeladen...</>:<><Upload className="h-3.5 w-3.5 mr-1.5"/>Rechnung hochladen</>}</span></Button><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" disabled={isUploadingInvoice} onChange={async(e)=>{const file=e.target.files?.[0];if(!file||!caseData)return;setIsUploadingInvoice(true);setInvoiceError(null);try{const fd=new FormData();fd.append('file',file);const res=await fetch(`/api/hv/cases/${caseData.id}/invoice`,{method:'POST',body:fd});const json=await res.json();if(!res.ok){setInvoiceError(json.error||'Fehler')}else{setCaseData(p=>p?{...p,invoice_path:json.data.invoice_path,invoice_filename:json.data.invoice_filename||file.name,invoice_uploaded_at:json.data.invoice_uploaded_at}:p);if(json.data.signed_url)setInvoiceSignedUrl(json.data.signed_url);setInvoiceSuccess('Rechnung hochgeladen');setTimeout(()=>setInvoiceSuccess(null),3000)}}catch{setInvoiceError('Verbindungsfehler')}finally{setIsUploadingInvoice(false);e.target.value=''}}} /></label>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Versicherungsschaden</CardTitle><CardDescription>Handelt es sich um einen versicherungsrelevanten Schaden?</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><div><Label className="text-sm font-medium">Als Versicherungsschaden markieren</Label><p className="text-xs text-muted-foreground mt-0.5">Ermöglicht das Erstellen eines Versicherungsschadenblatts</p></div><Switch checked={isInsuranceDamage} onCheckedChange={setIsInsuranceDamage} /></div>
                        {isInsuranceDamage && <div className="space-y-2"><Label className="text-sm">Notizen für Versicherung (optional)</Label><Textarea placeholder="z.B. Polizzennummer, Schadensnummer..." value={insuranceNotes} onChange={e=>setInsuranceNotes(e.target.value)} rows={3} className="resize-none text-sm" /></div>}
                        {insuranceSuccess && <p className="text-sm text-green-700">{insuranceSuccess}</p>}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" disabled={isSavingInsurance} onClick={async()=>{if(!caseData)return;setIsSavingInsurance(true);try{const res=await fetch(`/api/hv/cases/${caseData.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_insurance_damage:isInsuranceDamage,insurance_notes:insuranceNotes})});if(res.ok){setCaseData(p=>p?{...p,is_insurance_damage:isInsuranceDamage,insurance_notes:insuranceNotes}:p);setInsuranceSuccess('Gespeichert');setTimeout(()=>setInsuranceSuccess(null),3000)}}catch{}finally{setIsSavingInsurance(false)}}}>{isSavingInsurance?<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin"/>Speichert...</>:<><Save className="h-3.5 w-3.5 mr-1.5"/>Speichern</>}</Button>
                          {caseData?.is_insurance_damage && <Button size="sm" onClick={()=>window.open(`/dashboard/cases/${caseData.id}/versicherungsblatt`,'_blank')}><FileSearch className="h-3.5 w-3.5 mr-1.5" />Versicherungsblatt</Button>}
                          {caseData?.is_insurance_damage && <Button size="sm" variant="outline" onClick={()=>window.open(`/api/hv/cases/${caseData.id}/versicherungsformular`,'_blank')}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Schadensanzeige</Button>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* KOMMENTARE */}
                  <TabsContent value="comments" className="mt-0 space-y-4">
                    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                      <Textarea placeholder={isInternalComment?'Interne Notiz hinzufügen (nur für HV sichtbar)...':'Kommentar an Mieter senden...'} value={commentContent} onChange={e=>setCommentContent(e.target.value)} className="min-h-[80px] resize-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch id="is-internal" checked={isInternalComment} onCheckedChange={setIsInternalComment} />
                          <Label htmlFor="is-internal" className="text-sm cursor-pointer flex items-center gap-1">{isInternalComment?<><Lock className="h-3.5 w-3.5 text-orange-500"/><span className="text-orange-600">Interne Notiz</span></>:<><Send className="h-3.5 w-3.5 text-blue-500"/><span>An Mieter senden</span></>}</Label>
                        </div>
                        <Button size="sm" disabled={!commentContent.trim()||isAddingComment} onClick={handleAddComment}>{isAddingComment?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Senden</Button>
                      </div>
                    </div>
                    {caseData.comments.length===0?(
                      <div className="text-center py-6 text-muted-foreground"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50"/><p className="text-sm">Noch keine Kommentare</p></div>
                    ):(
                      <div className="space-y-3">{caseData.comments.map(comment=>(
                        <div key={comment.id} className={`rounded-lg border p-3 ${comment.is_internal?'bg-orange-50 border-orange-200':'bg-background'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">{comment.author?.first_name} {comment.author?.last_name}</span>{comment.is_internal&&<Badge variant="outline" className="text-[10px] bg-orange-100 text-orange-700 border-orange-200"><Lock className="h-2.5 w-2.5 mr-1"/>Intern</Badge>}</div>
                            <span className="text-[11px] text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}</div>
                    )}
                  </TabsContent>

                  {/* VERLAUF */}
                  <TabsContent value="timeline" className="mt-0">
                    {caseData.status_history.length===0?(
                      <div className="text-center py-6 text-muted-foreground"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50"/><p className="text-sm">Kein Statusverlauf vorhanden</p></div>
                    ):(
                      <div className="relative space-y-0">{caseData.status_history.map((entry,idx)=>(
                        <div key={entry.id} className="flex gap-3">
                          <div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-primary border-2 border-background ring-2 ring-muted shrink-0 mt-1"/>{idx<caseData.status_history.length-1&&<div className="w-0.5 flex-1 bg-muted"/>}</div>
                          <div className="pb-6 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.old_status_label&&<><Badge variant="outline" className={`text-[10px] ${getStatusConfig(entry.old_status!).className}`}>{entry.old_status_label}</Badge><span className="text-xs text-muted-foreground">→</span></>}
                              <Badge variant="outline" className={`text-[10px] ${getStatusConfig(entry.new_status).className}`}>{entry.new_status_label}</Badge>
                            </div>
                            {entry.note&&<p className="text-sm mt-1 text-muted-foreground">{entry.note}</p>}
                            <p className="text-[11px] text-muted-foreground mt-1">{entry.changed_by?`${entry.changed_by.first_name} ${entry.changed_by.last_name}`:'System'} — {formatDateTime(entry.created_at)}</p>
                          </div>
                        </div>
                      ))}</div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

          </div>{/* end left column */}

          {/* ── RIGHT (1/3): Was ist zu tun? ── */}
          <div className="space-y-4">

            {/* Nächster Schritt — Smart Action Panel */}
            {!['abgelehnt','erledigt'].includes(caseData.status) && (
              <Card className="border-2 border-primary/40 bg-primary/5 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {caseData.status==='neu'&&<span>🔵</span>}
                    {caseData.status==='warte_auf_handwerker'&&<span>🟡</span>}
                    {caseData.status==='termin_vereinbart'&&<span>🟢</span>}
                    Nächster Schritt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schnellSuccess&&<div className="rounded-lg bg-green-100 border border-green-300 px-3 py-2 text-sm text-green-800 font-medium">{schnellSuccess}</div>}
                  {schnellError&&<div className="rounded-lg bg-red-100 border border-red-300 px-3 py-2 text-sm text-red-800">{schnellError}</div>}

                  {/* NEU */}
                  {caseData.status==='neu'&&(()=>{
                    const recommended=contractors.find(ct=>ct.id===selectedContractorId)
                    const carlSections = kiResult ? parseCarlAnalysis(kiResult) : null
                    const suchempfehlung = carlSections?.suchempfehlung && carlSections.suchempfehlung !== 'NICHT_NOETIG' ? carlSections.suchempfehlung : null

                    // ── Keine Werkstätten hinterlegt ──
                    if (contractors.length === 0) return (
                      <div className="space-y-3">
                        {suchempfehlung && (
                          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
                            <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">CARL empfiehlt zu suchen nach</p>
                            <p className="text-sm text-blue-900">{suchempfehlung}</p>
                          </div>
                        )}
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <p className="text-xs text-amber-800 font-medium">⚠ Keine Partnerwerkstätten hinterlegt — bitte Werkstatt manuell eingeben</p>
                        </div>
                        {ManualWerkstattForm}
                        {/* Ablehnen */}
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Mieter zuständig?</p>
                          <Textarea className="text-sm min-h-[180px] resize-y" placeholder="Begründung für den Mieter..." value={ablehnungText} onChange={e=>setAblehnungText(e.target.value)}/>
                          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5" disabled={isSendingAblehnung||!ablehnungText.trim()}
                            onClick={async()=>{setIsSendingAblehnung(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(`/api/hv/cases/${id}/ablehnen`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({begruendung:ablehnungText})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Absage gesendet — Mieter per E-Mail informiert');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingAblehnung(false)}}}>
                            {isSendingAblehnung?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:null}Ablehnen — Mieter zuständig
                          </Button>
                        </div>
                      </div>
                    )

                    // ── Werkstätten vorhanden ──
                    return (
                      <div className="space-y-3">
                        {/* Werkstatt */}
                        {recommended&&!showContractorChange?(
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">CARL empfiehlt</p>
                            <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                              <p className="text-sm font-medium">{recommended.name}</p>
                              <button type="button" onClick={()=>setShowContractorChange(true)} className="text-xs text-primary underline ml-3 shrink-0">Ändern</button>
                            </div>
                          </div>
                        ):(
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Werkstatt wählen</p>
                            <Select value={selectedContractorId} onValueChange={v=>{setSelectedContractorId(v);setShowContractorChange(false)}}>
                              <SelectTrigger className="text-sm"><SelectValue placeholder="Werkstatt wählen..."/></SelectTrigger>
                              <SelectContent>{contractors.map(ct=><SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        )}
                        {(caseData.preferred_appointment || caseData.preferred_appointment_2) && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {caseData.preferred_appointment && (
                              <p>Wunschtermin{caseData.preferred_appointment_2 ? ' 1' : ''}: <span className="font-medium text-foreground">{formatDateTime(caseData.preferred_appointment)}</span></p>
                            )}
                            {caseData.preferred_appointment_2 && (
                              <p>Wunschtermin 2: <span className="font-medium text-foreground">{formatDateTime(caseData.preferred_appointment_2)}</span></p>
                            )}
                          </div>
                        )}

                        {/* Analyse bestätigen — öffnet Mail-Vorschau Dialog */}
                        <div className="space-y-1">
                          <Button className="w-full bg-green-700 hover:bg-green-800 text-white" disabled={isSendingSchnell||!selectedContractorId}
                            onClick={async()=>{
                              setPreviewError(null);setPreviewData(null);setPersonalNote('');setPreviewOpen(true);setPreviewLoading(true);
                              try{
                                const res=await fetch(`/api/hv/cases/${id}/weiterleiten/preview`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractor_id:selectedContractorId})})
                                if(!res.ok) throw new Error((await res.json()).error||'Vorschau fehlgeschlagen')
                                setPreviewData(await res.json())
                              }catch(err){setPreviewError(err instanceof Error?err.message:'Fehler')}finally{setPreviewLoading(false)}
                            }}>
                            <Send className="mr-2 h-4 w-4"/>Analyse bestätigen
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">Werkstatt wird beauftragt · Mieter wird informiert</p>
                        </div>

                        {/* Externe Werkstatt — nur wenn CARL keine Empfehlung hat */}
                        {!recommended&&(
                          <div className="border-t pt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">Keine passende Werkstatt in der Liste?</p>
                            {ManualWerkstattForm}
                          </div>
                        )}

                        {/* Ablehnen */}
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Mieter zuständig?</p>
                          <Textarea
                            className="text-sm min-h-[180px]"
                            placeholder="Begründung für den Mieter..."
                            value={ablehnungText}
                            onChange={e=>setAblehnungText(e.target.value)}
                          />
                          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5" disabled={isSendingAblehnung||!ablehnungText.trim()}
                            onClick={async()=>{setIsSendingAblehnung(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(`/api/hv/cases/${id}/ablehnen`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({begruendung:ablehnungText})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Absage gesendet — Mieter per E-Mail informiert');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingAblehnung(false)}}}>
                            {isSendingAblehnung?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:null}Ablehnen — Mieter zuständig
                          </Button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* WARTE_AUF_HANDWERKER — Werkstatt informiert, wartet auf Termin-Bestätigung */}
                  {caseData.status==='warte_auf_handwerker'&&(
                    <div className="space-y-3">
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5">
                        <p className="text-sm font-semibold text-blue-900">✓ Werkstatt wurde informiert</p>
                        {caseData.assigned_to_company&&<p className="text-xs text-blue-800">{caseData.assigned_to_company} hat eine E-Mail mit Termin-Buttons erhalten.</p>}
                        <p className="text-xs text-blue-700">Sobald die Werkstatt einen Termin in der Mail bestätigt, ändert sich der Status automatisch und der Mieter wird informiert.</p>
                      </div>

                      <details className="group rounded-lg border bg-muted/20">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground px-3 py-2 list-none flex items-center justify-between">
                          <span>📞 Werkstatt hat telefonisch geantwortet?</span>
                          <span className="group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="px-3 pb-3 space-y-2 pt-1">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Falls die Werkstatt sich telefonisch direkt mit dem Mieter abgestimmt hat, kannst du den Termin hier intern eintragen — nur Status-Update, keine zusätzliche Mail an den Mieter (der weiß ja schon Bescheid von der Werkstatt).</p>
                          <Input type="datetime-local" value={naechsterSchrittDate} onChange={e=>setNaechsterSchrittDate(e.target.value)} className="text-sm"/>
                          <Button size="sm" className="w-full" variant="outline" disabled={isSendingSchnell||!naechsterSchrittDate}
                            onClick={async()=>{setIsSendingSchnell(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(`/api/hv/cases/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'termin_vereinbart',comment:`Termin telefonisch vereinbart: ${new Date(naechsterSchrittDate).toLocaleString('de-AT')}`,scheduled_appointment:new Date(naechsterSchrittDate).toISOString()})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Termin gespeichert');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingSchnell(false)}}}>
                            {isSendingSchnell?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Calendar className="mr-2 h-4 w-4"/>}Termin intern speichern
                          </Button>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* TERMIN_VEREINBART oder TERMIN_TELEFONISCH — beide Wege fuehren zu "Fall abschliessen" */}
                  {(caseData.status==='termin_vereinbart' || caseData.status==='termin_telefonisch')&&(
                    <div className="space-y-3">
                      {caseData.status==='termin_vereinbart' && caseData.scheduled_appointment && (
                        <p className="text-sm text-muted-foreground">Termin: <span className="font-medium text-foreground">{formatDateTime(caseData.scheduled_appointment)}</span></p>
                      )}
                      {caseData.status==='termin_telefonisch' && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
                          <p className="text-sm font-semibold text-blue-900">📞 Werkstatt vereinbart Termin telefonisch</p>
                          {caseData.assigned_to_company && <p className="text-xs text-blue-800">{caseData.assigned_to_company} meldet sich direkt beim Mieter.</p>}
                          <p className="text-xs text-blue-700">Sobald die Reparatur erledigt ist, kannst du den Fall hier abschließen.</p>
                        </div>
                      )}
                      <Button className="w-full bg-green-700 hover:bg-green-800 text-white"
                        onClick={() => { setCloseError(null); setCloseNote(''); setCloseDialogOpen(true) }}>
                        <CheckCircle2 className="mr-2 h-4 w-4"/>Schaden behoben — Fall abschließen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Abgeschlossen / Abgelehnt */}
            {['erledigt','abgelehnt'].includes(caseData.status)&&(
              <Card className="border-muted">
                <CardContent className="py-6 text-center space-y-2">
                  <p className="text-2xl">{caseData.status==='erledigt'?'✅':'❌'}</p>
                  <p className="font-semibold">{caseData.status==='erledigt'?'Fall abgeschlossen':'Meldung abgelehnt'}</p>
                  {caseData.closed_at&&<p className="text-xs text-muted-foreground">{formatDateTime(caseData.closed_at)}</p>}
                </CardContent>
              </Card>
            )}

            {/* Erweiterte Optionen */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-1 py-2 list-none select-none">
                <List className="h-4 w-4" />Erweiterte Optionen
                <span className="ml-auto text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="space-y-4 pt-2">

                {/* Status manuell */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Status manuell ändern</CardTitle><CardDescription className="text-xs">Aktuell: {caseData.status_label}</CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Status wählen..."/></SelectTrigger>
                      <SelectContent>{CASE_STATUSES.filter(s=>s!==caseData.status).map(s=><SelectItem key={s} value={s}>{CASE_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                    </Select>
                    <Textarea placeholder="Kommentar (Pflichtfeld)" value={statusComment} onChange={e=>setStatusComment(e.target.value)} className="resize-none min-h-[60px] text-sm"/>
                    <Button className="w-full" size="sm" disabled={!newStatus||!statusComment.trim()||isUpdatingStatus} onClick={handleStatusUpdate}>
                      {isUpdatingStatus?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Save className="mr-2 h-4 w-4"/>}Status speichern
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </details>

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>{/* end max-w container */}

      {/* Werkstatt-Mail-Vorschau Dialog */}
      <Dialog open={previewOpen} onOpenChange={(o)=>{ setPreviewOpen(o); if(!o){ setPreviewData(null); setPreviewError(null); setPersonalNote('') } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>Mail-Vorschau an Werkstatt</DialogTitle>
            <DialogDescription>Diese Mail wird an die Werkstatt gesendet, sobald du auf "Senden" klickst. Optional: persönliche Nachricht ergänzen.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {previewLoading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin"/>Vorschau wird erstellt…
              </div>
            )}
            {previewError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{previewError}</div>}
            {previewData && (
              <>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                  <div className="flex gap-2"><span className="text-muted-foreground w-16 shrink-0">An:</span><span className="font-medium break-all">{previewData.to}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-16 shrink-0">Betreff:</span><span className="font-medium">{previewData.subject}</span></div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="personal-note" className="text-sm">Persönliche Nachricht (optional)</Label>
                  <Textarea id="personal-note" placeholder="z.B. „Hallo Frau Müller, wie immer freundliche Grüße — bitte direkt mit dem Mieter koordinieren." value={personalNote} onChange={async(e)=>{
                    const v=e.target.value;setPersonalNote(v);
                    if(!selectedContractorId)return;
                    try{
                      const res=await fetch(`/api/hv/cases/${id}/weiterleiten/preview`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractor_id:selectedContractorId,personal_note:v})})
                      if(res.ok){ setPreviewData(await res.json()) }
                    }catch{}
                  }} rows={3} className="resize-none text-sm" />
                  <p className="text-[11px] text-muted-foreground">Wird oben in der Mail eingebaut, gelb hervorgehoben.</p>
                </div>
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="px-3 py-1.5 bg-muted/40 border-b text-[11px] text-muted-foreground uppercase tracking-wide">Vorschau</div>
                  <iframe srcDoc={previewData.html} className="w-full h-[450px] border-0" sandbox="" title="E-Mail Vorschau" />
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-muted/20">
            <Button variant="outline" onClick={()=>setPreviewOpen(false)} disabled={isSendingSchnell}>Abbrechen</Button>
            <Button className="bg-green-700 hover:bg-green-800 text-white" disabled={isSendingSchnell||!previewData||!!previewError}
              onClick={async()=>{
                setIsSendingSchnell(true);setSchnellError(null);setSchnellSuccess(null);
                try{
                  const res=await fetch(`/api/hv/cases/${id}/weiterleiten`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractor_id:selectedContractorId,scheduled_appointment:caseData?.preferred_appointment||null,personal_note:personalNote||null})})
                  if(!res.ok)throw new Error((await res.json()).error)
                  setSchnellSuccess('✓ Analyse bestätigt — Werkstatt + Mieter informiert')
                  setPreviewOpen(false)
                  await fetchCase()
                }catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingSchnell(false)}
              }}>
              {isSendingSchnell?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Senden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROJ-23: Rechtsgrundlage-Sheet */}
      <Sheet open={legalSheetOpen} onOpenChange={setLegalSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              {legalSheetData?.paragraph || legalSheetParagraph || 'Rechtsgrundlage'}
            </SheetTitle>
            <SheetDescription>
              {legalSheetData?.law || 'Original-Gesetzestext'}
              {legalSheetData?.country && (
                <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium uppercase tracking-wide">{legalSheetData.country}</span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {legalSheetLoading && (
              <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>Lade Volltext…
              </div>
            )}
            {legalSheetError && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                {legalSheetError}
                {legalSheetParagraph && (
                  <p className="mt-2 text-xs">
                    Suche auf{' '}
                    <a className="underline" href={`https://www.ris.bka.gv.at/Ergebnis.wxe?Abfrage=Bundesnormen&Suchworte=${encodeURIComponent(legalSheetParagraph)}`} target="_blank" rel="noopener noreferrer">RIS (AT)</a>{' '} oder{' '}
                    <a className="underline" href={`https://www.gesetze-im-internet.de/`} target="_blank" rel="noopener noreferrer">gesetze-im-internet.de (DE)</a>
                  </p>
                )}
              </div>
            )}
            {legalSheetData && (
              <>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-semibold mb-2">{legalSheetData.title}</p>
                  <p className="text-sm whitespace-pre-line leading-relaxed text-foreground">{legalSheetData.text}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={legalSheetData.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1.5"/>Auf {legalSheetData.country === 'AT' ? 'ris.bka.gv.at' : 'gesetze-im-internet.de'} öffnen
                    </a>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground pt-2 border-t">
                  Quelle: {legalSheetData.country === 'AT' ? 'Republik Österreich · Rechtsinformationssystem (RIS)' : 'Bundesministerium der Justiz · gesetze-im-internet.de'} · Zuletzt verifiziert: {new Date(legalSheetData.last_verified_at).toLocaleDateString('de-AT')}
                </p>

                {/* Mietvertrag-Verweis: zeigt Button wenn CARL einen MV-Paragraf zitiert hat */}
                {(() => {
                  const mvRef = extractMietvertragRef(carlData?.rechtsgrundlage)
                  if (!mvRef) return null
                  return (
                    <div className="rounded-lg border-2 border-amber-200 bg-amber-50/50 p-4 mt-4 space-y-2">
                      <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                        📜 CARL zitiert auch den Mietvertrag
                      </p>
                      <p className="text-sm text-amber-900">
                        Die Rechtsgrundlage verweist zusätzlich auf <strong>{mvRef}</strong>. Im Mietvertrag-PDF prüfen?
                      </p>
                      <Button
                        size="sm"
                        className="bg-amber-700 hover:bg-amber-800 text-white text-xs"
                        onClick={() => {
                          setLegalSheetOpen(false)
                          openLeaseSheet()
                        }}
                      >
                        <FileSearch className="h-3.5 w-3.5 mr-1.5"/>Mietvertrag öffnen ({mvRef})
                      </Button>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Abschluss-Dialog: Fall abschließen mit Dokumenten-Checkliste */}
      <Dialog open={closeDialogOpen} onOpenChange={(o) => { if (!isClosingCase) setCloseDialogOpen(o) }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>Fall abschließen</DialogTitle>
            <DialogDescription>Vor dem Abschluss prüfen, ob alle Unterlagen für die Akte hinterlegt sind.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Checkliste */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Optional vor Abschluss</p>

              {/* Versicherungsblatt — nur wenn Versicherungsfall */}
              {caseData.is_insurance_damage && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">🛡️</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Versicherungsblatt</p>
                      <p className="text-xs text-muted-foreground">Schadensanzeige für die Versicherung</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs shrink-0"
                    onClick={() => window.open(`/dashboard/cases/${caseData.id}/versicherungsblatt`, '_blank')}>
                    <ExternalLink className="h-3 w-3 mr-1" />Erstellen
                  </Button>
                </div>
              )}

              {/* Rechnung-Status */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">📄</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Werkstatt-Rechnung</p>
                    {caseData.invoice_filename ? (
                      <p className="text-xs text-green-700">✓ {caseData.invoice_filename}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Noch keine hochgeladen</p>
                    )}
                  </div>
                </div>
                {!caseData.invoice_filename && (
                  <Button size="sm" variant="outline" className="text-xs shrink-0"
                    onClick={() => {
                      // Tab "Dokumente" aktivieren + Dialog schließen
                      const tab = document.querySelector('[role="tab"][value="dokumente"]') as HTMLElement | null
                      tab?.click()
                      setCloseDialogOpen(false)
                    }}>
                    <Upload className="h-3 w-3 mr-1" />Hochladen
                  </Button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground pt-1 border-t">
                Beides ist optional — der Fall kann auch ohne Rechnung abgeschlossen werden, falls die Werkstatt direkt mit der Versicherung abrechnet.
              </p>
            </div>

            {/* Abschluss-Notiz */}
            <div className="space-y-1.5">
              <Label htmlFor="close-note" className="text-sm">Abschluss-Notiz <span className="text-muted-foreground font-normal">(optional, für die Akte)</span></Label>
              <Textarea id="close-note" placeholder="z.B. Reparatur durch Werkstatt erfolgreich durchgeführt am ..., Rechnung erhalten, Schadensanzeige bei UNIQA eingereicht."
                value={closeNote} onChange={e => setCloseNote(e.target.value)} rows={4} className="resize-none text-sm" />
              <p className="text-[11px] text-muted-foreground">Diese Notiz erscheint im Verlauf des Falls.</p>
            </div>

            {closeError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">{closeError}</div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-muted/20">
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={isClosingCase}>Abbrechen</Button>
            <Button className="bg-green-700 hover:bg-green-800 text-white" disabled={isClosingCase}
              onClick={async () => {
                setIsClosingCase(true); setCloseError(null)
                try {
                  const note = closeNote.trim() || 'Schaden behoben — Fall abgeschlossen.'
                  const res = await fetch(`/api/hv/cases/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_status: 'erledigt', comment: note })
                  })
                  if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
                  setSchnellSuccess('✓ Fall erfolgreich abgeschlossen')
                  setCloseDialogOpen(false)
                  await fetchCase()
                } catch (err) {
                  setCloseError(err instanceof Error ? err.message : 'Fehler')
                } finally {
                  setIsClosingCase(false)
                }
              }}>
              {isClosingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Fall jetzt abschließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROJ-23 Erweiterung: Mietvertrag-PDF Sheet */}
      <Sheet open={leaseSheetOpen} onOpenChange={setLeaseSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-lg">📜</span>
              {leaseSheetData?.name || 'Mietvertrag'}
            </SheetTitle>
            <SheetDescription>
              Original-Mietvertrag dieser Wohneinheit — relevant für die juristische Einschätzung
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {leaseSheetLoading && (
              <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>Lade Mietvertrag…
              </div>
            )}
            {leaseSheetError && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                {leaseSheetError}
              </div>
            )}
            {leaseSheetData && (
              <>
                {leaseSheetData.hint && (() => {
                  const mvRef = extractMietvertragRef(carlData?.rechtsgrundlage)
                  return (
                    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">CARL hat aus dem Mietvertrag entnommen:</p>
                      <p className="text-sm text-amber-900 leading-relaxed">{leaseSheetData.hint}</p>
                      {mvRef && (
                        <p className="text-xs text-amber-700 pt-1">
                          Relevant: <strong>{mvRef}</strong> — im PDF unten mit Strg+F suchen
                        </p>
                      )}
                    </div>
                  )
                })()}
                <PdfViewer pdfUrl={leaseSheetData.pdfUrl} highlightText={extractMietvertragRef(carlData?.rechtsgrundlage)} />
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={leaseSheetData.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1.5"/>In neuem Tab öffnen
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={leaseSheetData.pdfUrl} download>
                      <FileSearch className="h-3 w-3 mr-1.5"/>Herunterladen
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* PROJ-23: Versicherungs-PDF Sheet */}
      <Sheet open={insuranceSheetOpen} onOpenChange={setInsuranceSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              {insuranceSheetData?.name || 'Versicherungspolice'}
            </SheetTitle>
            <SheetDescription>
              Police-Volltext mit markierter relevanter Klausel
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {insuranceSheetLoading && (
              <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>Lade Police…
              </div>
            )}
            {insuranceSheetError && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                {insuranceSheetError}
              </div>
            )}
            {insuranceSheetData && (
              <>
                {insuranceSheetData.clause && (
                  <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-3">
                    <p className="text-[11px] font-semibold text-yellow-800 uppercase tracking-wide mb-1.5">CARL hat folgende Klausel als relevant identifiziert:</p>
                    <p className="text-sm text-yellow-900 italic leading-relaxed">„{insuranceSheetData.clause}"</p>
                  </div>
                )}
                <PdfViewer pdfUrl={insuranceSheetData.pdfUrl} highlightText={insuranceSheetData.clause} />
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={insuranceSheetData.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1.5"/>In neuem Tab öffnen
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={insuranceSheetData.pdfUrl} download>
                      <FileSearch className="h-3 w-3 mr-1.5"/>Herunterladen
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
