"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import {
  Droplets,
  Flame,
  Zap,
  DoorOpen,
  AlertTriangle,
  Wrench,
  ShowerHead,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Camera,
  X,
  Loader2,
  Phone,
  CircleAlert,
  Clock,
  CheckCircle2,
  ImageIcon,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  DAMAGE_CATEGORIES,
  CATEGORY_LABELS,
  SUBCATEGORIES,
  ROOMS,
  ROOM_LABELS,
  URGENCY_LEVELS,
  URGENCY_LABELS,
} from "@/lib/validations/damage-report"

// ─── Types ───────────────────────────────────────────────────────────────────

type DamageCategory = (typeof DAMAGE_CATEGORIES)[number]
type Room = (typeof ROOMS)[number]
type Urgency = (typeof URGENCY_LEVELS)[number]

interface UploadedPhoto {
  id: string
  file_name: string
  mime_type: string
  file_size: number
  preview_url: string
}

interface FormData {
  category: DamageCategory | null
  subcategory: string | null
  room: Room | null
  urgency: Urgency | null
  title: string
  description: string
  photos: UploadedPhoto[]
  preferred_appointment: string
  preferred_appointment_2: string
  access_notes: string
}

interface SubmitResult {
  id: string
  case_number: string
  title: string
  category: string
  urgency: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<DamageCategory, React.ElementType> = {
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

const CATEGORY_COLORS: Record<DamageCategory, string> = {
  wasserschaden: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
  heizung: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100",
  elektrik: "text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
  fenster_tueren: "text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100",
  schimmel: "text-green-700 bg-green-50 border-green-200 hover:bg-green-100",
  sanitaer: "text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
  boeden_waende: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
  aussenbereich: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  sonstiges: "text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100",
}

const CATEGORY_SELECTED: Record<DamageCategory, string> = {
  wasserschaden: "ring-2 ring-blue-500 bg-blue-100 border-blue-400",
  heizung: "ring-2 ring-orange-500 bg-orange-100 border-orange-400",
  elektrik: "ring-2 ring-yellow-500 bg-yellow-100 border-yellow-400",
  fenster_tueren: "ring-2 ring-teal-500 bg-teal-100 border-teal-400",
  schimmel: "ring-2 ring-green-500 bg-green-100 border-green-400",
  sanitaer: "ring-2 ring-cyan-500 bg-cyan-100 border-cyan-400",
  boeden_waende: "ring-2 ring-amber-500 bg-amber-100 border-amber-400",
  aussenbereich: "ring-2 ring-emerald-500 bg-emerald-100 border-emerald-400",
  sonstiges: "ring-2 ring-gray-500 bg-gray-100 border-gray-400",
}

const SUBCATEGORY_LABELS: Record<string, string> = {
  rohrbruch: "Rohrbruch",
  undichte_leitung: "Undichte Leitung",
  ueberflutung: "Überflutung",
  kondenswasser: "Kondenswasser",
  ausfall: "Heizungsausfall",
  undicht: "Heizung undicht",
  geraeusche: "Ungewöhnliche Geräusche",
  thermostat_defekt: "Thermostat defekt",
  steckdose_defekt: "Steckdose defekt",
  lichtschalter: "Lichtschalter defekt",
  sicherung: "Sicherung fällt raus",
  kabelschaden: "Kabelschaden",
  schliesst_nicht: "Schliesst nicht richtig",
  glasbruch: "Glasbruch",
  dichtung_defekt: "Dichtung defekt",
  griff_defekt: "Griff defekt",
  wand: "Schimmel an der Wand",
  decke: "Schimmel an der Decke",
  fensterbereich: "Schimmel im Fensterbereich",
  bad: "Schimmel im Bad",
  toilette: "Toilette defekt",
  waschbecken: "Waschbecken defekt",
  dusche_badewanne: "Dusche / Badewanne defekt",
  abfluss: "Abfluss verstopft",
  risse: "Risse",
  feuchtigkeit: "Feuchtigkeit",
  beschaedigung: "Beschädigung",
  abloesungen: "Ablösungen",
  fassade: "Fassade beschaedigt",
  dach: "Dachschaden",
  balkon: "Balkon beschaedigt",
  eingang: "Eingangsbereich",
  sonstiges: "Sonstiges",
}

const URGENCY_CONFIG: Record<
  Urgency,
  {
    icon: React.ElementType
    description: string
    color: string
    selectedColor: string
  }
> = {
  notfall: {
    icon: CircleAlert,
    description: "Sofortige Reaktion erforderlich. Wasserrohrbruch, Stromausfall, Sicherheitsrisiko.",
    color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100",
    selectedColor: "ring-2 ring-red-500 bg-red-100 border-red-400",
  },
  dringend: {
    icon: Clock,
    description: "Reaktion innerhalb von 48 Stunden. Eingeschränkte Nutzbarkeit der Wohnung.",
    color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
    selectedColor: "ring-2 ring-amber-500 bg-amber-100 border-amber-400",
  },
  normal: {
    icon: CheckCircle2,
    description: "Reaktion innerhalb von 2 Wochen. Kein akuter Handlungsbedarf.",
    color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100",
    selectedColor: "ring-2 ring-green-500 bg-green-100 border-green-400",
  },
}

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic"]

const TOTAL_STEPS = 5

// ─── Component ───────────────────────────────────────────────────────────────

export default function NeueMeldungPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    category: null,
    subcategory: null,
    room: null,
    urgency: null,
    title: "",
    description: "",
    photos: [],
    preferred_appointment: "",
    preferred_appointment_2: "",
    access_notes: "",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Validation ────────────────────────────────────────────────────────────

  function isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return formData.category !== null
      case 2:
        return true // subcategory and room are optional
      case 3:
        return (
          formData.urgency !== null &&
          formData.description.trim().length >= 1
        )
      case 4:
        return true // photos, appointment, access notes are all optional
      case 5:
        return true // summary step is always valid if we got here
      default:
        return false
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  function goNext() {
    if (currentStep < TOTAL_STEPS && isStepValid(currentStep)) {
      setCurrentStep((s) => s + 1)
    }
  }

  function goBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  // ─── Photo Upload ──────────────────────────────────────────────────────────

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploadError(null)

      const remaining = MAX_PHOTOS - formData.photos.length
      if (remaining <= 0) {
        setUploadError(`Maximal ${MAX_PHOTOS} Fotos erlaubt.`)
        return
      }

      const filesToUpload = Array.from(files).slice(0, remaining)

      for (const file of filesToUpload) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setUploadError(
            `"${file.name}" hat ein ungültiges Format. Erlaubt: JPG, PNG, HEIC.`
          )
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(
            `"${file.name}" ist zu gross (max. 10 MB pro Foto).`
          )
          continue
        }

        setIsUploading(true)
        try {
          const fd = new FormData()
          fd.append("file", file)

          const res = await fetch("/api/damage-reports/upload", {
            method: "POST",
            body: fd,
          })

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(
              errData.error || `Upload fehlgeschlagen (${res.status})`
            )
          }

          const { data } = await res.json()

          // Create local preview URL
          const previewUrl = URL.createObjectURL(file)

          setFormData((prev) => ({
            ...prev,
            photos: [
              ...prev.photos,
              {
                id: data.id,
                file_name: data.file_name,
                mime_type: data.mime_type,
                file_size: data.file_size,
                preview_url: previewUrl,
              },
            ],
          }))
        } catch (err) {
          setUploadError(
            err instanceof Error
              ? err.message
              : "Fehler beim Hochladen. Bitte erneut versuchen."
          )
        } finally {
          setIsUploading(false)
        }
      }

      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [formData.photos.length]
  )

  function removePhoto(photoId: string) {
    setFormData((prev) => {
      const photo = prev.photos.find((p) => p.id === photoId)
      if (photo) {
        URL.revokeObjectURL(photo.preview_url)
      }
      return {
        ...prev,
        photos: prev.photos.filter((p) => p.id !== photoId),
      }
    })
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!formData.category || !formData.urgency || !formData.description.trim()) {
      setSubmitError("Bitte füllen Sie alle Pflichtfelder aus.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Auto-generate title from category + subcategory
      const autoTitle = formData.subcategory
        ? `${CATEGORY_LABELS[formData.category]}: ${SUBCATEGORY_LABELS[formData.subcategory] || formData.subcategory}`
        : CATEGORY_LABELS[formData.category]

      const payload = {
        category: formData.category,
        subcategory: formData.subcategory || null,
        room: formData.room || null,
        title: autoTitle,
        description: formData.description.trim(),
        urgency: formData.urgency,
        preferred_appointment: formData.preferred_appointment
          ? new Date(formData.preferred_appointment).toISOString()
          : null,
        preferred_appointment_2: formData.preferred_appointment_2
          ? new Date(formData.preferred_appointment_2).toISOString()
          : null,
        access_notes: formData.access_notes.trim() || null,
        photo_ids: formData.photos.map((p) => p.id),
      }

      const res = await fetch("/api/damage-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.error || `Fehler beim Absenden (${res.status})`
        )
      }

      const { data } = await res.json()
      setSubmitResult({
        id: data.id,
        case_number: data.case_number,
        title: data.title,
        category: data.category,
        urgency: data.urgency,
      })
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Ein unerwarteter Fehler ist aufgetreten."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Success Screen ────────────────────────────────────────────────────────

  if (submitResult) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Meldung erfolgreich erstellt!</h1>
              <p className="text-muted-foreground">
                Ihre Schadensmeldung wurde erfolgreich übermittelt. Ihre Hausverwaltung wird sich in Kürze darum kümmern.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Ihre Fallnummer</p>
              <p className="text-2xl font-mono font-bold tracking-wider">
                {submitResult.case_number}
              </p>
              <p className="text-sm text-muted-foreground">
                Bitte notieren Sie sich diese Nummer für Rückfragen.
              </p>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/mein-bereich/meldungen">
                  Meine Meldungen ansehen
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/mein-bereich">
                  Zurück zur Übersicht
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
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
            Zurück
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Neue Schadensmeldung
        </h1>
        <p className="text-muted-foreground mt-1">
          Schritt {currentStep} von {TOTAL_STEPS}
        </p>
      </div>

      {/* Progress Bar */}
      <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <Step1Category
              selected={formData.category}
              onSelect={(cat) =>
                setFormData((prev) => ({
                  ...prev,
                  category: cat,
                  subcategory: null, // reset subcategory on category change
                }))
              }
            />
          )}
          {currentStep === 2 && formData.category && (
            <Step2SubcategoryRoom
              category={formData.category}
              selectedSubcategory={formData.subcategory}
              selectedRoom={formData.room}
              onSubcategorySelect={(sub) =>
                setFormData((prev) => ({ ...prev, subcategory: sub }))
              }
              onRoomSelect={(room) =>
                setFormData((prev) => ({ ...prev, room }))
              }
            />
          )}
          {currentStep === 3 && (
            <Step3UrgencyDetails
              urgency={formData.urgency}
              title={formData.title}
              description={formData.description}
              onUrgencySelect={(u) =>
                setFormData((prev) => ({ ...prev, urgency: u }))
              }
              onTitleChange={(t) =>
                setFormData((prev) => ({ ...prev, title: t }))
              }
              onDescriptionChange={(d) =>
                setFormData((prev) => ({ ...prev, description: d }))
              }
            />
          )}
          {currentStep === 4 && (
            <Step4PhotosAppointment
              photos={formData.photos}
              preferredAppointment={formData.preferred_appointment}
              preferredAppointment2={formData.preferred_appointment_2}
              accessNotes={formData.access_notes}
              isUploading={isUploading}
              uploadError={uploadError}
              fileInputRef={fileInputRef}
              onPhotoSelect={handlePhotoSelect}
              onRemovePhoto={removePhoto}
              onAppointmentChange={(d) =>
                setFormData((prev) => ({ ...prev, preferred_appointment: d }))
              }
              onAppointment2Change={(d) =>
                setFormData((prev) => ({ ...prev, preferred_appointment_2: d }))
              }
              onAccessNotesChange={(n) =>
                setFormData((prev) => ({ ...prev, access_notes: n }))
              }
            />
          )}
          {currentStep === 5 && (
            <Step5Summary formData={formData} onEditStep={setCurrentStep} />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button onClick={goNext} disabled={!isStepValid(currentStep)}>
            Weiter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Meldung absenden
              </>
            )}
          </Button>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 1: Category Selection ──────────────────────────────────────────────

function Step1Category({
  selected,
  onSelect,
}: {
  selected: DamageCategory | null
  onSelect: (cat: DamageCategory) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Was für ein Schaden liegt vor?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Wählen Sie die passende Kategorie aus.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DAMAGE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat]
          const isSelected = selected === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center",
                isSelected
                  ? CATEGORY_SELECTED[cat]
                  : CATEGORY_COLORS[cat]
              )}
            >
              <Icon className="h-8 w-8" />
              <span className="text-sm font-medium leading-tight">
                {CATEGORY_LABELS[cat]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Subcategory + Room ──────────────────────────────────────────────

function Step2SubcategoryRoom({
  category,
  selectedSubcategory,
  selectedRoom,
  onSubcategorySelect,
  onRoomSelect,
}: {
  category: DamageCategory
  selectedSubcategory: string | null
  selectedRoom: Room | null
  onSubcategorySelect: (sub: string | null) => void
  onRoomSelect: (room: Room | null) => void
}) {
  const subcategories = SUBCATEGORIES[category]

  return (
    <div className="space-y-6">
      {/* Subcategory */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">
            Genauere Beschreibung
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Was genau ist passiert? (optional)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() =>
                onSubcategorySelect(
                  selectedSubcategory === sub ? null : sub
                )
              }
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all text-left",
                selectedSubcategory === sub
                  ? "ring-2 ring-primary bg-primary/5 border-primary"
                  : "hover:bg-accent"
              )}
            >
              {selectedSubcategory === sub && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
              <span>{SUBCATEGORY_LABELS[sub] || sub}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Room */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">In welchem Raum?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Wo befindet sich der Schaden? (optional)
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROOMS.map((room) => (
            <button
              key={room}
              type="button"
              onClick={() =>
                onRoomSelect(selectedRoom === room ? null : room)
              }
              className={cn(
                "rounded-lg border px-4 py-3 text-sm transition-all",
                selectedRoom === room
                  ? "ring-2 ring-primary bg-primary/5 border-primary font-medium"
                  : "hover:bg-accent"
              )}
            >
              {ROOM_LABELS[room]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Urgency + Title + Description ───────────────────────────────────

function Step3UrgencyDetails({
  urgency,
  title,
  description,
  onUrgencySelect,
  onTitleChange,
  onDescriptionChange,
}: {
  urgency: Urgency | null
  title: string
  description: string
  onUrgencySelect: (u: Urgency) => void
  onTitleChange: (t: string) => void
  onDescriptionChange: (d: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Urgency */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">
            Wie dringend ist es? <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bitte schätzen Sie die Dringlichkeit realistisch ein.
          </p>
        </div>
        <div className="space-y-3">
          {URGENCY_LEVELS.map((level) => {
            const config = URGENCY_CONFIG[level]
            const Icon = config.icon
            const isSelected = urgency === level
            return (
              <button
                key={level}
                type="button"
                onClick={() => onUrgencySelect(level)}
                className={cn(
                  "flex items-start gap-4 w-full rounded-xl border-2 p-4 text-left transition-all",
                  isSelected ? config.selectedColor : config.color
                )}
              >
                <Icon className="h-6 w-6 mt-0.5 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <span className="font-semibold text-sm block">
                    {URGENCY_LABELS[level]}
                  </span>
                  <span className="text-xs opacity-80 block">
                    {config.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Emergency Warning */}
      {urgency === "notfall" && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <Phone className="h-4 w-4" />
            Wichtiger Hinweis bei Notfällen
          </div>
          <p className="text-sm text-red-600">
            Bei akuter Gefahr (Wasserrohrbruch, Gasgeruch, Stromausfall)
            rufen Sie bitte SOFORT die Notfall-Hotline Ihrer Hausverwaltung
            an. Diese Schadensmeldung ersetzt keinen Notruf!
          </p>
        </div>
      )}

      <Separator />

      {/* Description - single combined field */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Beschreibung <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Beschreiben Sie den Schaden: Was ist passiert? Seit wann besteht er? Wo genau?"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={1000}
          rows={5}
        />
        <p className="text-xs text-muted-foreground text-right">
          {description.length}/1000 Zeichen
        </p>
      </div>
    </div>
  )
}

// ─── Step 4: Photos + Appointment + Access Notes ─────────────────────────────

function Step4PhotosAppointment({
  photos,
  preferredAppointment,
  preferredAppointment2,
  accessNotes,
  isUploading,
  uploadError,
  fileInputRef,
  onPhotoSelect,
  onRemovePhoto,
  onAppointmentChange,
  onAppointment2Change,
  onAccessNotesChange,
}: {
  photos: UploadedPhoto[]
  preferredAppointment: string
  preferredAppointment2: string
  accessNotes: string
  isUploading: boolean
  uploadError: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (id: string) => void
  onAppointmentChange: (d: string) => void
  onAppointment2Change: (d: string) => void
  onAccessNotesChange: (n: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Fotos hochladen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Laden Sie bis zu {MAX_PHOTOS} Fotos des Schadens hoch (optional). Max. 10 MB pro Foto.
          </p>
        </div>

        {/* Photo Thumbnails */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={photo.preview_url}
                  alt={photo.file_name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  className="absolute top-1 right-1 flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label={`${photo.file_name} entfernen`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {photos.length < MAX_PHOTOS && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              multiple
              onChange={onPhotoSelect}
              className="sr-only"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
                isUploading
                  ? "opacity-60 pointer-events-none"
                  : "hover:bg-accent/50 hover:border-primary/50"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Wird hochgeladen...
                  </span>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Foto auswählen oder aufnehmen
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, HEIC - max. 10 MB
                  </span>
                </>
              )}
            </label>
          </div>
        )}

        {/* Upload count */}
        <p className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PHOTOS} Fotos hochgeladen
        </p>

        {/* Upload Error */}
        {uploadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {uploadError}
          </div>
        )}
      </div>

      <Separator />

      {/* Preferred Appointment 1 */}
      <div className="space-y-2">
        <Label htmlFor="appointment">1. Wunschtermin (optional)</Label>
        <Input
          id="appointment"
          type="datetime-local"
          value={preferredAppointment}
          onChange={(e) => onAppointmentChange(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>

      {/* Preferred Appointment 2 */}
      <div className="space-y-2">
        <Label htmlFor="appointment2">2. Wunschtermin (optional)</Label>
        <Input
          id="appointment2"
          type="datetime-local"
          value={preferredAppointment2}
          onChange={(e) => onAppointment2Change(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
        <p className="text-xs text-muted-foreground">
          Wann wäre ein Handwerkerbesuch für Sie am besten?
        </p>
      </div>

      <Separator />

      {/* Access Notes */}
      <div className="space-y-2">
        <Label htmlFor="access-notes">Zugangshinweise (optional)</Label>
        <Textarea
          id="access-notes"
          placeholder="z.B. Schluessel beim Nachbarn, Hund in der Wohnung, Klingel bei Mueller"
          value={accessNotes}
          onChange={(e) => onAccessNotesChange(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">
          {accessNotes.length}/500 Zeichen
        </p>
      </div>
    </div>
  )
}

// ─── Step 5: Summary ─────────────────────────────────────────────────────────

function Step5Summary({
  formData,
  onEditStep,
}: {
  formData: FormData
  onEditStep: (step: number) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Zusammenfassung</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bitte prüfen Sie Ihre Angaben vor dem Absenden.
        </p>
      </div>

      {/* Category */}
      <SummarySection
        label="Kategorie"
        step={1}
        onEdit={onEditStep}
      >
        <div className="flex items-center gap-2">
          {formData.category && (
            <>
              {(() => {
                const Icon = CATEGORY_ICONS[formData.category]
                return <Icon className="h-5 w-5" />
              })()}
              <span className="font-medium">
                {CATEGORY_LABELS[formData.category]}
              </span>
            </>
          )}
        </div>
      </SummarySection>

      {/* Subcategory & Room */}
      <SummarySection
        label="Details"
        step={2}
        onEdit={onEditStep}
      >
        <div className="space-y-1 text-sm">
          {formData.subcategory && (
            <p>
              <span className="text-muted-foreground">Unterkategorie:</span>{" "}
              {SUBCATEGORY_LABELS[formData.subcategory] || formData.subcategory}
            </p>
          )}
          {formData.room && (
            <p>
              <span className="text-muted-foreground">Raum:</span>{" "}
              {ROOM_LABELS[formData.room]}
            </p>
          )}
          {!formData.subcategory && !formData.room && (
            <p className="text-muted-foreground italic">Keine Angaben</p>
          )}
        </div>
      </SummarySection>

      {/* Urgency + Title + Description */}
      <SummarySection
        label="Dringlichkeit & Beschreibung"
        step={3}
        onEdit={onEditStep}
      >
        <div className="space-y-2 text-sm">
          {formData.urgency && (
            <Badge
              variant={
                formData.urgency === "notfall"
                  ? "destructive"
                  : formData.urgency === "dringend"
                  ? "default"
                  : "secondary"
              }
            >
              {URGENCY_LABELS[formData.urgency]}
            </Badge>
          )}
          <p className="font-medium">{formData.title}</p>
          {formData.description && (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {formData.description}
            </p>
          )}
        </div>
      </SummarySection>

      {/* Photos + Appointment + Access */}
      <SummarySection
        label="Fotos & Termin"
        step={4}
        onEdit={onEditStep}
      >
        <div className="space-y-3 text-sm">
          {/* Photo thumbnails */}
          {formData.photos.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {formData.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="h-16 w-16 rounded-lg overflow-hidden border bg-muted"
                >
                  <img
                    src={photo.preview_url}
                    alt={photo.file_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic flex items-center gap-1">
              <ImageIcon className="h-4 w-4" /> Keine Fotos
            </p>
          )}
          {formData.preferred_appointment && (
            <p>
              <span className="text-muted-foreground">Wunschtermin:</span>{" "}
              {new Date(formData.preferred_appointment).toLocaleString(
                "de-AT",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>
          )}
          {formData.access_notes && (
            <p>
              <span className="text-muted-foreground">Zugangshinweise:</span>{" "}
              {formData.access_notes}
            </p>
          )}
        </div>
      </SummarySection>
    </div>
  )
}

// ─── Summary Section Helper ──────────────────────────────────────────────────

function SummarySection({
  label,
  step,
  onEdit,
  children,
}: {
  label: string
  step: number
  onEdit: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onEdit(step)}
        >
          Bearbeiten
        </Button>
      </div>
      {children}
    </div>
  )
}
