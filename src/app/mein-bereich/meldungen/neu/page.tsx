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
  Layers,
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
  Home,
  Building2,
  SplitSquareHorizontal,
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
  ROOMS_EXTENDED,
  ROOM_LABELS_EXTENDED,
  URGENCY_LEVELS,
  URGENCY_LABELS,
  DAMAGE_SIDES,
  DAMAGE_SIDE_LABELS,
  DAMAGE_SIDE_DESCRIPTIONS,
  CATEGORIES_WITH_SIDE,
} from "@/lib/validations/damage-report"

// ─── Types ───────────────────────────────────────────────────────────────────

type DamageCategory = (typeof DAMAGE_CATEGORIES)[number]
type DamageSide = (typeof DAMAGE_SIDES)[number]
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
  subcategories: string[]
  rooms: string[]
  damage_side: DamageSide | null
  urgency: Urgency | null
  title: string
  description: string
  damage_since: string
  photos: UploadedPhoto[]
  preferred_appointment: string
  preferred_appointment_2: string
  reporter_phone: string
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
  boeden_waende: Layers,
  aussenbereich: Wrench,
  sonstiges: HelpCircle,
}

const CATEGORY_EXAMPLES: Record<DamageCategory, string> = {
  wasserschaden: "Rohrbruch, Leck, Überflutung",
  heizung: "Heizung kalt, Thermostat defekt",
  elektrik: "Steckdose, Licht, Sicherung",
  fenster_tueren: "Schliesst nicht, Glasbruch, Griff",
  schimmel: "Schwarze Flecken an Wand oder Decke",
  sanitaer: "Wasserhahn, WC, Dusche, Abfluss",
  boeden_waende: "Fliesen, Parkett, Risse, Tapete",
  aussenbereich: "Fassade, Dach, Balkon, Eingang",
  sonstiges: "Passt in keine andere Kategorie",
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
  fassade: "Fassade beschädigt",
  dach: "Dachschaden",
  balkon: "Balkon beschädigt",
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

const DAMAGE_SIDE_CONFIG: Record<
  DamageSide,
  { icon: React.ElementType; color: string; selectedColor: string }
> = {
  innen: {
    icon: Home,
    color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
    selectedColor: "ring-2 ring-blue-500 bg-blue-100 border-blue-400",
  },
  aussen: {
    icon: Building2,
    color: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100",
    selectedColor: "ring-2 ring-orange-500 bg-orange-100 border-orange-400",
  },
  beides: {
    icon: SplitSquareHorizontal,
    color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
    selectedColor: "ring-2 ring-purple-500 bg-purple-100 border-purple-400",
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
    subcategories: [],
    rooms: [],
    damage_side: null,
    urgency: null,
    title: "",
    description: "",
    damage_since: "",
    photos: [],
    preferred_appointment: "",
    preferred_appointment_2: "",
    reporter_phone: "",
    access_notes: "",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function isStepValid(step: number): boolean {
    switch (step) {
      case 1: return formData.category !== null
      case 2: return true
      case 3: return formData.urgency !== null && formData.description.trim().length >= 1
      case 4: return formData.reporter_phone.trim().length >= 1
      case 5: return true
      default: return false
    }
  }

  function goNext() {
    if (currentStep < TOTAL_STEPS && isStepValid(currentStep)) {
      setCurrentStep((s) => s + 1)
    }
  }

  function goBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      setUploadError(null)
      const remaining = MAX_PHOTOS - formData.photos.length
      if (remaining <= 0) { setUploadError(`Maximal ${MAX_PHOTOS} Fotos erlaubt.`); return }
      const filesToUpload = Array.from(files).slice(0, remaining)
      for (const file of filesToUpload) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setUploadError(`"${file.name}" hat ein ungültiges Format. Erlaubt: JPG, PNG, HEIC.`)
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`"${file.name}" ist zu gross (max. 10 MB pro Foto).`)
          continue
        }
        setIsUploading(true)
        try {
          const fd = new FormData()
          fd.append("file", file)
          const res = await fetch("/api/damage-reports/upload", { method: "POST", body: fd })
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.error || `Upload fehlgeschlagen (${res.status})`)
          }
          const { data } = await res.json()
          const previewUrl = URL.createObjectURL(file)
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, { id: data.id, file_name: data.file_name, mime_type: data.mime_type, file_size: data.file_size, preview_url: previewUrl }],
          }))
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Fehler beim Hochladen. Bitte erneut versuchen.")
        } finally {
          setIsUploading(false)
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [formData.photos.length]
  )

  function removePhoto(photoId: string) {
    setFormData((prev) => {
      const photo = prev.photos.find((p) => p.id === photoId)
      if (photo) URL.revokeObjectURL(photo.preview_url)
      return { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) }
    })
  }

  async function handleSubmit() {
    if (!formData.category || !formData.urgency || !formData.description.trim()) {
      setSubmitError("Bitte füllen Sie alle Pflichtfelder aus.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const firstSub = formData.subcategories[0]
      const autoTitle = firstSub
        ? `${CATEGORY_LABELS[formData.category]}: ${SUBCATEGORY_LABELS[firstSub] || firstSub}`
        : CATEGORY_LABELS[formData.category]
      const payload = {
        category: formData.category,
        subcategory: formData.subcategories[0] || null,
        subcategories: formData.subcategories,
        room: null,
        rooms: formData.rooms,
        damage_side: formData.damage_side || null,
        title: autoTitle,
        description: formData.description.trim(),
        urgency: formData.urgency,
        preferred_appointment: formData.preferred_appointment ? new Date(formData.preferred_appointment).toISOString() : null,
        preferred_appointment_2: formData.preferred_appointment_2 ? new Date(formData.preferred_appointment_2).toISOString() : null,
        damage_since: formData.damage_since || null,
        access_notes: formData.access_notes.trim() || null,
        photo_ids: formData.photos.map((p) => p.id),
        reporter_phone: formData.reporter_phone.trim() || null,
      }
      const res = await fetch("/api/damage-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Fehler beim Absenden (${res.status})`)
      }
      const { data } = await res.json()
      setSubmitResult({ id: data.id, case_number: data.case_number, title: data.title, category: data.category, urgency: data.urgency })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <p className="text-muted-foreground">Ihre Schadensmeldung wurde erfolgreich übermittelt. Ihre Hausverwaltung wird sich in Kürze darum kümmern.</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Ihre Fallnummer</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{submitResult.case_number}</p>
              <p className="text-sm text-muted-foreground">Bitte notieren Sie sich diese Nummer für Rückfragen.</p>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild><Link href="/mein-bereich/meldungen">Meine Meldungen ansehen</Link></Button>
              <Button variant="outline" asChild><Link href="/mein-bereich">Zurück zur Übersicht</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" asChild>
          <Link href="/mein-bereich"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Neue Schadensmeldung</h1>
        <p className="text-muted-foreground mt-1">Schritt {currentStep} von {TOTAL_STEPS}</p>
      </div>

      <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />

      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <Step1Category
              selected={formData.category}
              onSelect={(cat) => setFormData((prev) => ({ ...prev, category: cat, subcategories: [], damage_side: null }))}
            />
          )}
          {currentStep === 2 && formData.category && (
            <Step2SubcategoryRoom
              category={formData.category}
              selectedSubcategories={formData.subcategories}
              selectedRooms={formData.rooms}
              damageSide={formData.damage_side}
              onSubcategoriesChange={(subs) => setFormData((prev) => ({ ...prev, subcategories: subs }))}
              onRoomsChange={(rooms) => setFormData((prev) => ({ ...prev, rooms }))}
              onDamageSideChange={(side) => setFormData((prev) => ({ ...prev, damage_side: side }))}
            />
          )}
          {currentStep === 3 && (
            <Step3UrgencyDetails
              urgency={formData.urgency}
              description={formData.description}
              damageSince={formData.damage_since}
              onUrgencySelect={(u) => setFormData((prev) => ({ ...prev, urgency: u }))}
              onDescriptionChange={(d) => setFormData((prev) => ({ ...prev, description: d }))}
              onDamageSinceChange={(d) => setFormData((prev) => ({ ...prev, damage_since: d }))}
            />
          )}
          {currentStep === 4 && (
            <Step4PhotosAppointment
              photos={formData.photos}
              preferredAppointment={formData.preferred_appointment}
              preferredAppointment2={formData.preferred_appointment_2}
              reporterPhone={formData.reporter_phone}
              accessNotes={formData.access_notes}
              isUploading={isUploading}
              uploadError={uploadError}
              fileInputRef={fileInputRef}
              onPhotoSelect={handlePhotoSelect}
              onRemovePhoto={removePhoto}
              onAppointmentChange={(d) => setFormData((prev) => ({ ...prev, preferred_appointment: d }))}
              onAppointment2Change={(d) => setFormData((prev) => ({ ...prev, preferred_appointment_2: d }))}
              onReporterPhoneChange={(p) => setFormData((prev) => ({ ...prev, reporter_phone: p }))}
              onAccessNotesChange={(n) => setFormData((prev) => ({ ...prev, access_notes: n }))}
            />
          )}
          {currentStep === 5 && (
            <Step5Summary formData={formData} onEditStep={setCurrentStep} />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={currentStep === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />Zurück
        </Button>
        {currentStep < TOTAL_STEPS ? (
          <Button onClick={goNext} disabled={!isStepValid(currentStep)}>
            Weiter<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gesendet...</>) : (<><Check className="mr-2 h-4 w-4" />Meldung absenden</>)}
          </Button>
        )}
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" /><span>{submitError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1Category({ selected, onSelect }: { selected: DamageCategory | null; onSelect: (cat: DamageCategory) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Was für ein Schaden liegt vor?</h2>
        <p className="text-sm text-muted-foreground mt-1">Wählen Sie die passende Kategorie aus.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DAMAGE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat]
          const isSelected = selected === cat
          return (
            <button key={cat} type="button" onClick={() => onSelect(cat)}
              className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center", isSelected ? CATEGORY_SELECTED[cat] : CATEGORY_COLORS[cat])}>
              <Icon className="h-8 w-8" />
              <span className="text-sm font-medium leading-tight">{CATEGORY_LABELS[cat]}</span>
              <span className="text-xs text-muted-foreground leading-tight">{CATEGORY_EXAMPLES[cat]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2SubcategoryRoom({
  category, selectedSubcategories, selectedRooms, damageSide,
  onSubcategoriesChange, onRoomsChange, onDamageSideChange,
}: {
  category: DamageCategory
  selectedSubcategories: string[]
  selectedRooms: string[]
  damageSide: DamageSide | null
  onSubcategoriesChange: (subs: string[]) => void
  onRoomsChange: (rooms: string[]) => void
  onDamageSideChange: (side: DamageSide | null) => void
}) {
  const subcategories = SUBCATEGORIES[category]
  const showDamageSide = (CATEGORIES_WITH_SIDE as readonly string[]).includes(category)
  const communalSelected = selectedRooms.includes("gemeinschaftsbereich")

  function toggleSubcategory(sub: string) {
    if (selectedSubcategories.includes(sub)) {
      onSubcategoriesChange(selectedSubcategories.filter((s) => s !== sub))
    } else {
      onSubcategoriesChange([...selectedSubcategories, sub])
    }
  }

  function toggleRoom(room: string) {
    if (selectedRooms.includes(room)) {
      onRoomsChange(selectedRooms.filter((r) => r !== room))
    } else {
      onRoomsChange([...selectedRooms, room])
    }
  }

  return (
    <div className="space-y-6">
      {/* Subcategories */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Was genau ist beschädigt?</h2>
          <p className="text-sm text-muted-foreground mt-1">Mehrfachauswahl möglich (optional).</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subcategories.map((sub) => {
            const isSelected = selectedSubcategories.includes(sub)
            return (
              <button key={sub} type="button" onClick={() => toggleSubcategory(sub)}
                className={cn("flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all text-left", isSelected ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-accent")}>
                <div className={cn("flex items-center justify-center h-5 w-5 rounded border shrink-0 transition-colors", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <span>{SUBCATEGORY_LABELS[sub] || sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Rooms */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">In welchem Bereich?</h2>
          <p className="text-sm text-muted-foreground mt-1">Mehrfachauswahl möglich (optional).</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROOMS_EXTENDED.map((room) => {
            const isSelected = selectedRooms.includes(room)
            return (
              <button key={room} type="button" onClick={() => toggleRoom(room)}
                className={cn("flex items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-all text-left", isSelected ? "ring-2 ring-primary bg-primary/5 border-primary font-medium" : "hover:bg-accent")}>
                <div className={cn("flex items-center justify-center h-4 w-4 rounded border shrink-0 transition-colors", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="leading-tight">{ROOM_LABELS_EXTENDED[room]}</span>
              </button>
            )
          })}
        </div>
        {communalSelected && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex gap-2 items-start">
            <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Schäden im Gemeinschaftsbereich (Stiegenhaus, Hausflur) gehören zur Liegenschaft und werden von der Hausverwaltung beauftragt.</span>
          </div>
        )}
      </div>

      {/* Innen/Außen */}
      {showDamageSide && (
        <>
          <Separator />
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Innen- oder Außenseite?</h2>
              <p className="text-sm text-muted-foreground mt-1">Das bestimmt wer für die Reparatur zuständig ist (optional).</p>
            </div>
            <div className="space-y-2">
              {DAMAGE_SIDES.map((side) => {
                const config = DAMAGE_SIDE_CONFIG[side]
                const Icon = config.icon
                const isSelected = damageSide === side
                return (
                  <button key={side} type="button" onClick={() => onDamageSideChange(isSelected ? null : side)}
                    className={cn("flex items-start gap-4 w-full rounded-xl border-2 p-4 text-left transition-all", isSelected ? config.selectedColor : config.color)}>
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-sm block">{DAMAGE_SIDE_LABELS[side]}</span>
                      <span className="text-xs opacity-80 block">{DAMAGE_SIDE_DESCRIPTIONS[side]}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 ml-auto shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3UrgencyDetails({
  urgency, description, damageSince, onUrgencySelect, onDescriptionChange, onDamageSinceChange,
}: {
  urgency: Urgency | null
  description: string
  damageSince: string
  onUrgencySelect: (u: Urgency) => void
  onDescriptionChange: (d: string) => void
  onDamageSinceChange: (d: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Wie dringend ist es? <span className="text-red-500">*</span></h2>
          <p className="text-sm text-muted-foreground mt-1">Bitte schätzen Sie die Dringlichkeit realistisch ein.</p>
        </div>
        <div className="space-y-3">
          {URGENCY_LEVELS.map((level) => {
            const config = URGENCY_CONFIG[level]
            const Icon = config.icon
            const isSelected = urgency === level
            return (
              <button key={level} type="button" onClick={() => onUrgencySelect(level)}
                className={cn("flex items-start gap-4 w-full rounded-xl border-2 p-4 text-left transition-all", isSelected ? config.selectedColor : config.color)}>
                <Icon className="h-6 w-6 mt-0.5 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <span className="font-semibold text-sm block">{URGENCY_LABELS[level]}</span>
                  <span className="text-xs opacity-80 block">{config.description}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {urgency === "notfall" && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <Phone className="h-4 w-4" />Wichtiger Hinweis bei Notfällen
          </div>
          <p className="text-sm text-red-600">
            Bei akuter Gefahr (Wasserrohrbruch, Gasgeruch, Stromausfall) rufen Sie bitte SOFORT die Notfall-Hotline Ihrer Hausverwaltung an. Diese Schadensmeldung ersetzt keinen Notruf!
          </p>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung <span className="text-red-500">*</span></Label>
        <Textarea
          id="description"
          placeholder="Beschreiben Sie den Schaden so genau wie möglich: Was ist passiert? Wo genau befindet sich der Schaden?"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={1000}
          rows={5}
        />
        <p className="text-xs text-muted-foreground text-right">{description.length}/1000 Zeichen</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="damage-since">Seit wann besteht der Schaden? (optional)</Label>
        <Input
          id="damage-since"
          type="date"
          value={damageSince}
          onChange={(e) => onDamageSinceChange(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
        <p className="text-xs text-muted-foreground">Hilft der Hausverwaltung bei der Priorisierung.</p>
      </div>
    </div>
  )
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4PhotosAppointment({
  photos, preferredAppointment, preferredAppointment2, reporterPhone, accessNotes,
  isUploading, uploadError, fileInputRef, onPhotoSelect, onRemovePhoto,
  onAppointmentChange, onAppointment2Change, onReporterPhoneChange, onAccessNotesChange,
}: {
  photos: UploadedPhoto[]
  preferredAppointment: string
  preferredAppointment2: string
  reporterPhone: string
  accessNotes: string
  isUploading: boolean
  uploadError: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (id: string) => void
  onAppointmentChange: (d: string) => void
  onAppointment2Change: (d: string) => void
  onReporterPhoneChange: (p: string) => void
  onAccessNotesChange: (n: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Fotos hochladen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fotos beschleunigen die Bearbeitung erheblich. Laden Sie bis zu {MAX_PHOTOS} Fotos des Schadens hoch. Max. 10 MB pro Foto.
          </p>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                <img src={photo.preview_url} alt={photo.file_name} className="h-full w-full object-cover" />
                <button type="button" onClick={() => onRemovePhoto(photo.id)}
                  className="absolute top-1 right-1 flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label={`${photo.file_name} entfernen`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < MAX_PHOTOS && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/heic" multiple onChange={onPhotoSelect} className="sr-only" id="photo-upload" />
            <label htmlFor="photo-upload" className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors", isUploading ? "opacity-60 pointer-events-none" : "hover:bg-accent/50 hover:border-primary/50")}>
              {isUploading ? (
                <><Loader2 className="h-8 w-8 text-muted-foreground animate-spin" /><span className="text-sm text-muted-foreground">Wird hochgeladen...</span></>
              ) : (
                <><Camera className="h-8 w-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">Foto auswählen oder aufnehmen</span><span className="text-xs text-muted-foreground">JPG, PNG, HEIC - max. 10 MB</span></>
              )}
            </label>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{photos.length}/{MAX_PHOTOS} Fotos hochgeladen</p>
        {uploadError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{uploadError}</div>}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="appointment">1. Wunschtermin (optional)</Label>
        <Input id="appointment" type="datetime-local" value={preferredAppointment} onChange={(e) => onAppointmentChange(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment2">2. Wunschtermin (optional)</Label>
        <Input id="appointment2" type="datetime-local" value={preferredAppointment2} onChange={(e) => onAppointment2Change(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
        <p className="text-xs text-muted-foreground">Wann wäre ein Handwerkerbesuch für Sie am besten?</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reporter-phone">Ihre Telefonnummer <span className="text-red-500">*</span></Label>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex gap-2 items-start">
          <Phone className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Falls die Werkstatt keinen Ihrer Wunschtermine wahrnehmen kann, wird sie Sie direkt unter dieser Nummer anrufen, um gemeinsam einen passenden Termin zu vereinbaren.</span>
        </div>
        <Input id="reporter-phone" type="tel" placeholder="+43 664 123 456" value={reporterPhone} onChange={(e) => onReporterPhoneChange(e.target.value)} maxLength={30} />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="access-notes">Zugangshinweise (optional)</Label>
        <Textarea id="access-notes" placeholder="z.B. Schluessel beim Nachbarn, Hund in der Wohnung, Klingel bei Mueller" value={accessNotes} onChange={(e) => onAccessNotesChange(e.target.value)} maxLength={500} rows={3} />
        <p className="text-xs text-muted-foreground text-right">{accessNotes.length}/500 Zeichen</p>
      </div>
    </div>
  )
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

function Step5Summary({ formData, onEditStep }: { formData: FormData; onEditStep: (step: number) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Zusammenfassung</h2>
        <p className="text-sm text-muted-foreground mt-1">Bitte prüfen Sie Ihre Angaben vor dem Absenden.</p>
      </div>

      <SummarySection label="Kategorie" step={1} onEdit={onEditStep}>
        <div className="flex items-center gap-2">
          {formData.category && (() => { const Icon = CATEGORY_ICONS[formData.category]; return <><Icon className="h-5 w-5" /><span className="font-medium">{CATEGORY_LABELS[formData.category]}</span></> })()}
        </div>
      </SummarySection>

      <SummarySection label="Details" step={2} onEdit={onEditStep}>
        <div className="space-y-1.5 text-sm">
          {formData.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-muted-foreground shrink-0">Was:</span>
              {formData.subcategories.map((s) => <Badge key={s} variant="secondary" className="text-xs">{SUBCATEGORY_LABELS[s] || s}</Badge>)}
            </div>
          )}
          {formData.rooms.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-muted-foreground shrink-0">Wo:</span>
              {formData.rooms.map((r) => <Badge key={r} variant="outline" className="text-xs">{ROOM_LABELS_EXTENDED[r] || r}</Badge>)}
            </div>
          )}
          {formData.damage_side && (
            <p><span className="text-muted-foreground">Seite:</span>{" "}
              <span className={cn("font-medium", formData.damage_side === "aussen" && "text-orange-700", formData.damage_side === "innen" && "text-blue-700", formData.damage_side === "beides" && "text-purple-700")}>
                {DAMAGE_SIDE_LABELS[formData.damage_side]}
              </span>
            </p>
          )}
          {formData.subcategories.length === 0 && formData.rooms.length === 0 && !formData.damage_side && (
            <p className="text-muted-foreground italic">Keine Angaben</p>
          )}
        </div>
      </SummarySection>

      <SummarySection label="Dringlichkeit & Beschreibung" step={3} onEdit={onEditStep}>
        <div className="space-y-2 text-sm">
          {formData.urgency && (
            <Badge variant={formData.urgency === "notfall" ? "destructive" : formData.urgency === "dringend" ? "default" : "secondary"}>
              {URGENCY_LABELS[formData.urgency]}
            </Badge>
          )}
          {formData.damage_since && (
            <p><span className="text-muted-foreground">Seit wann:</span>{" "}
              {new Date(formData.damage_since + "T00:00:00").toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          )}
          {formData.description && <p className="text-muted-foreground whitespace-pre-wrap">{formData.description}</p>}
        </div>
      </SummarySection>

      <SummarySection label="Fotos & Termin" step={4} onEdit={onEditStep}>
        <div className="space-y-3 text-sm">
          {formData.photos.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {formData.photos.map((photo) => (
                <div key={photo.id} className="h-16 w-16 rounded-lg overflow-hidden border bg-muted">
                  <img src={photo.preview_url} alt={photo.file_name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Keine Fotos</p>
          )}
          {formData.preferred_appointment && (
            <p><span className="text-muted-foreground">Wunschtermin 1:</span>{" "}
              {new Date(formData.preferred_appointment).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {formData.preferred_appointment_2 && (
            <p><span className="text-muted-foreground">Wunschtermin 2:</span>{" "}
              {new Date(formData.preferred_appointment_2).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {formData.reporter_phone && <p><span className="text-muted-foreground">Telefonnummer:</span> {formData.reporter_phone}</p>}
          {formData.access_notes && <p><span className="text-muted-foreground">Zugangshinweise:</span> {formData.access_notes}</p>}
        </div>
      </SummarySection>
    </div>
  )
}

// ─── Summary Section Helper ──────────────────────────────────────────────────

function SummarySection({ label, step, onEdit, children }: { label: string; step: number; onEdit: (step: number) => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEdit(step)}>Bearbeiten</Button>
      </div>
      {children}
    </div>
  )
}
