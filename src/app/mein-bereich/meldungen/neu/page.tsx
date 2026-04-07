"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import {
  Droplets, Flame, Zap, DoorOpen, AlertTriangle, Wrench, Layers,
  ShowerHead, HelpCircle, ArrowLeft, ArrowRight, Check, Camera,
  X, Loader2, Phone, CircleAlert, Clock, CheckCircle2, ImageIcon,
  Home, Building2, SplitSquareHorizontal, Lightbulb, Sparkles,
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
  DAMAGE_SIDES,
  DAMAGE_SIDE_LABELS,
  DAMAGE_SIDE_DESCRIPTIONS,
  CATEGORIES_WITH_SIDE,
} from "@/lib/validations/damage-report"

// ─── Types ───────────────────────────────────────────────────────────────────

type DamageCategory = (typeof DAMAGE_CATEGORIES)[number]
type DamageSide = (typeof DAMAGE_SIDES)[number]

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
  fenster_tueren: "Schließt nicht, Glasbruch, Griff",
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
  ausfall: "Heizungsausfall (kalt)",
  undicht: "Heizung undicht",
  geraeusche: "Ungewöhnliche Geräusche",
  thermostat_defekt: "Thermostat defekt",
  steckdose_defekt: "Steckdose defekt",
  lichtschalter: "Lichtschalter defekt",
  sicherung: "Sicherung fällt raus",
  kabelschaden: "Kabelschaden sichtbar",
  schliesst_nicht: "Schließt nicht richtig",
  glasbruch: "Glasbruch",
  dichtung_defekt: "Dichtung defekt / undicht",
  griff_defekt: "Griff / Schloss defekt",
  wand: "Schimmel an der Wand",
  decke: "Schimmel an der Decke",
  fensterbereich: "Schimmel im Fensterbereich",
  bad: "Schimmel im Bad",
  toilette: "Toilette defekt",
  waschbecken: "Waschbecken defekt",
  dusche_badewanne: "Dusche / Badewanne defekt",
  abfluss: "Abfluss verstopft",
  risse: "Risse / Sprünge",
  feuchtigkeit: "Feuchtigkeit / nasse Stellen",
  beschaedigung: "Beschädigung / Bruch",
  abloesungen: "Ablösungen / Blasen",
  fassade: "Fassade beschädigt",
  dach: "Dachschaden",
  balkon: "Balkon / Terrasse beschädigt",
  eingang: "Eingangsbereich",
  sonstiges: "Sonstiges",
}

// Kategorie-spezifische Leitfragen und Hilfe-Chips für CARL
const CARL_TIPS: Record<DamageCategory, { placeholder: string; chips: string[] }> = {
  wasserschaden: {
    placeholder: "z.B.: Seit gestern Abend tropft Wasser aus der Decke im Badezimmer. Die Stelle ist ca. 30 cm groß und wird größer. Es riecht nach Feuchtigkeit. Die Wohnung über mir steht leer.",
    chips: ["Tropft aktiv", "Fleck an der Decke", "Wand ist nass", "Stockwerk darüber", "Wasser läuft auf Boden"],
  },
  heizung: {
    placeholder: "z.B.: Die Heizung im Wohnzimmer bleibt kalt, obwohl der Thermostat auf 5 gestellt ist. Alle anderen Heizkörper funktionieren. Es hört sich auch gluckernd an.",
    chips: ["Komplett kalt", "Nur oben warm", "Gluckergeräusche", "Thermostat reagiert nicht", "Alle Heizkörper betroffen"],
  },
  elektrik: {
    placeholder: "z.B.: Die Steckdose in der Küche neben dem Herd funktioniert nicht mehr. Die Sicherung ist schon rausgeflogen. Andere Steckdosen im selben Raum funktionieren.",
    chips: ["Sicherung fällt raus", "Steckdose tot", "Licht flackert", "Kein Strom in Raum", "Geruch nach Verbrennung"],
  },
  fenster_tueren: {
    placeholder: "z.B.: Das Schlafzimmerfenster lässt sich nicht mehr richtig schließen. Es zieht stark und man hört den Wind. Der Griff dreht sich aber das Fenster klemmt.",
    chips: ["Schließt nicht dicht", "Griff locker", "Glas gebrochen", "Zieht Kaltluft", "Riegel/Schloss klemmt"],
  },
  schimmel: {
    placeholder: "z.B.: In der Ecke hinter dem Kleiderschrank im Schlafzimmer sind schwarze Flecken aufgetaucht. Die Fläche ist ca. 20x20 cm groß. Der Schrank steht direkt an der Außenwand.",
    chips: ["Schwarze Flecken", "Weißlicher Belag", "Modergeruch", "Außenwand betroffen", "Hinter Möbeln"],
  },
  sanitaer: {
    placeholder: "z.B.: Das WC läuft ständig nach, man hört das Wasser dauernd rauschen. Das Spülventil scheint defekt zu sein. Schon seit etwa einer Woche.",
    chips: ["Läuft ständig nach", "Tropft aus Hahn", "Abfluss verstopft", "Druckverlust", "WC spült nicht"],
  },
  boeden_waende: {
    placeholder: "z.B.: Im Wohnzimmer haben sich mehrere Bodenfliesen gelöst und wackeln. Eine ist schon gesprungen. Das ist ein Sicherheitsrisiko, besonders für Kinder.",
    chips: ["Fliesen gelöst", "Parkett quillt auf", "Risse in der Wand", "Tapete löst sich", "Feuchtigkeit sichtbar"],
  },
  aussenbereich: {
    placeholder: "z.B.: Am Balkon im 2. Stock hat sich die Abdichtung am Boden gelöst. Bei Regen läuft Wasser in die Wohnung darunter. Die betroffene Stelle ist ca. 1 Meter lang.",
    chips: ["Balkon undicht", "Fassade beschädigt", "Dachziegel fehlt", "Eingang defekt", "Geländer wackelt"],
  },
  sonstiges: {
    placeholder: "z.B.: Beschreiben Sie den Schaden so genau wie möglich: Was genau ist defekt? Wo befindet es sich? Seit wann besteht das Problem? Ist es ein Sicherheitsrisiko?",
    chips: [],
  },
}

const DAMAGE_SIDE_CONFIG: Record<DamageSide, { icon: React.ElementType; color: string; selectedColor: string }> = {
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
const MAX_FILE_SIZE = 10 * 1024 * 1024
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

  // Skip subcategory step if category has no meaningful subcategories (only "sonstiges")
  function hasUsefulSubcategories(cat: DamageCategory | null): boolean {
    if (!cat) return false
    const subs = SUBCATEGORIES[cat]
    return subs.length > 1 || (subs.length === 1 && subs[0] !== "sonstiges")
  }

  function isStepValid(step: number): boolean {
    switch (step) {
      case 1: return formData.category !== null
      case 2: return true // subcategories & rooms are optional
      case 3: return formData.description.trim().length >= 10
      case 4: return formData.reporter_phone.trim().length >= 1
      case 5: return true
      default: return false
    }
  }

  function goNext() {
    if (currentStep === 1 && !hasUsefulSubcategories(formData.category)) {
      // Skip step 2 for "sonstiges" category
      setCurrentStep(3)
      return
    }
    if (currentStep < TOTAL_STEPS && isStepValid(currentStep)) {
      setCurrentStep((s) => s + 1)
    }
  }

  function goBack() {
    if (currentStep === 3 && !hasUsefulSubcategories(formData.category)) {
      // Skip back over step 2
      setCurrentStep(1)
      return
    }
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
          setUploadError(`"${file.name}" ist zu groß (max. 10 MB pro Foto).`)
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
    if (!formData.category || !formData.description.trim()) {
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
      setSubmitResult({ id: data.id, case_number: data.case_number, title: data.title, category: data.category })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten.")
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
              <h1 className="text-2xl font-bold">Meldung erfolgreich eingereicht!</h1>
              <p className="text-muted-foreground text-sm">
                Ihre Hausverwaltung wurde benachrichtigt und wird sich so schnell wie möglich darum kümmern.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Ihre Fallnummer</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{submitResult.case_number}</p>
              <p className="text-xs text-muted-foreground">Notieren Sie diese Nummer für Rückfragen.</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 text-left flex gap-2 items-start">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
              <span>CARL analysiert Ihre Meldung gerade und schlägt der Hausverwaltung die nächsten Schritte vor — das dauert nur wenige Sekunden.</span>
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

  // ─── Form ─────────────────────────────────────────────────────────────────

  // Calculate effective step for display (step 2 may be skipped visually)
  const skipStep2 = !hasUsefulSubcategories(formData.category)
  const displayStep = skipStep2 && currentStep > 2 ? currentStep - 1 : currentStep
  const displayTotal = skipStep2 ? TOTAL_STEPS - 1 : TOTAL_STEPS
  const effectiveStepLabel = `Schritt ${displayStep} von ${displayTotal}`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" asChild>
          <Link href="/mein-bereich"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Neue Schadensmeldung</h1>
        <p className="text-muted-foreground mt-1 text-sm">{effectiveStepLabel}</p>
      </div>

      <Progress value={(displayStep / displayTotal) * 100} className="h-2" />

      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <Step1Category
              selected={formData.category}
              onSelect={(cat) => setFormData((prev) => ({ ...prev, category: cat, subcategories: [], damage_side: null }))}
            />
          )}
          {currentStep === 2 && formData.category && hasUsefulSubcategories(formData.category) && (
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
            <Step3Details
              category={formData.category}
              description={formData.description}
              damageSince={formData.damage_since}
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
            <Step5Summary formData={formData} onEditStep={setCurrentStep} hasSubcategoryStep={hasUsefulSubcategories(formData.category)} />
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
            {isSubmitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gesendet...</>
              : <><Check className="mr-2 h-4 w-4" />Meldung absenden</>
            }
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

// ─── Step 1: Kategorie ────────────────────────────────────────────────────────

function Step1Category({ selected, onSelect }: { selected: DamageCategory | null; onSelect: (cat: DamageCategory) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Was für ein Schaden liegt vor?</h2>
        <p className="text-sm text-muted-foreground mt-1">Wählen Sie die Kategorie die am besten passt.</p>
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
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Unterkategorie & Raum ────────────────────────────────────────────

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
  const subcategories = SUBCATEGORIES[category].filter(s => s !== "sonstiges")
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
          <h2 className="text-lg font-semibold">Was genau ist betroffen?</h2>
          <p className="text-sm text-muted-foreground mt-1">Mehrfachauswahl möglich — alles zutreffende auswählen.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subcategories.map((sub) => {
            const isSelected = selectedSubcategories.includes(sub)
            return (
              <button key={sub} type="button" onClick={() => toggleSubcategory(sub)}
                className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all text-left", isSelected ? "ring-2 ring-primary bg-primary/5 border-primary" : "hover:bg-accent")}>
                <div className={cn("flex items-center justify-center h-5 w-5 rounded border shrink-0 transition-colors", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="font-medium">{SUBCATEGORY_LABELS[sub] || sub}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">Nichts passt? Kein Problem — Sie können alles im nächsten Schritt beschreiben.</p>
      </div>

      <Separator />

      {/* Rooms */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">In welchem Bereich befindet sich der Schaden?</h2>
          <p className="text-sm text-muted-foreground mt-1">Mehrfachauswahl möglich.</p>
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
            <span>Schäden im Gemeinschaftsbereich (Stiegenhaus, Hausflur) werden direkt von der Hausverwaltung beauftragt.</span>
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
              <p className="text-sm text-muted-foreground mt-1">Das hilft bei der Zuständigkeitsklärung.</p>
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

// ─── Step 3: Beschreibung ─────────────────────────────────────────────────────

function Step3Details({
  category, description, damageSince, onDescriptionChange, onDamageSinceChange,
}: {
  category: DamageCategory | null
  description: string
  damageSince: string
  onDescriptionChange: (d: string) => void
  onDamageSinceChange: (d: string) => void
}) {
  const tips = category ? CARL_TIPS[category] : CARL_TIPS.sonstiges

  function appendChip(chip: string) {
    const prefix = description.trim() ? description.trim() + " " : ""
    onDescriptionChange(prefix + chip + ". ")
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Beschreiben Sie den Schaden</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Je genauer Ihre Beschreibung, desto besser kann CARL den Schaden einschätzen und die Hausverwaltung informieren.
        </p>
      </div>

      {/* CARL Tipp-Box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <Sparkles className="h-4 w-4" />
          Tipps für eine gute Meldung
        </div>
        <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
          <li>Wo genau befindet sich der Schaden? (Raum, Wand, Ecke)</li>
          <li>Wie groß ist der betroffene Bereich?</li>
          <li>Hat sich etwas verändert oder wird es schlimmer?</li>
          <li>Gibt es Wasser, Gerüche oder Geräusche?</li>
        </ul>
      </div>

      {/* Schnell-Chips */}
      {tips.chips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" /> Schnell hinzufügen — tippen Sie auf einen Begriff:
          </p>
          <div className="flex flex-wrap gap-2">
            {tips.chips.map((chip) => (
              <button key={chip} type="button" onClick={() => appendChip(chip)}
                className="text-xs rounded-full border px-3 py-1.5 bg-background hover:bg-accent transition-colors text-foreground">
                + {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Ihre Beschreibung <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder={tips.placeholder}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={1000}
          rows={7}
          className="resize-none"
        />
        <div className="flex justify-between items-center">
          <p className={cn("text-xs", description.length < 10 ? "text-muted-foreground" : "text-green-600")}>
            {description.length < 10 ? `Mindestens ${10 - description.length} Zeichen mehr eingeben` : "✓ Ausreichend detailliert"}
          </p>
          <p className="text-xs text-muted-foreground">{description.length}/1000</p>
        </div>
      </div>

      {/* Datum */}
      <div className="space-y-2">
        <Label htmlFor="damage-since">
          <Clock className="h-3.5 w-3.5 inline mr-1" />
          Seit wann besteht der Schaden? <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="damage-since"
          type="date"
          value={damageSince}
          onChange={(e) => onDamageSinceChange(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>
    </div>
  )
}

// ─── Step 4: Fotos & Termin ───────────────────────────────────────────────────

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

      {/* Fotos */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Fotos hochladen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fotos beschleunigen die Bearbeitung. Laden Sie wenn möglich Bilder des Schadens hoch.
          </p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">Gute Fotos zeigen:</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Ein Übersichtsfoto des ganzen betroffenen Bereichs</li>
            <li>Eine Nahaufnahme der Schadenstelle</li>
            <li>Wenn vorhanden: Wasserflecken, Risse oder Schimmelstellen</li>
          </ul>
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
            <label htmlFor="photo-upload" className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors", isUploading ? "opacity-60 pointer-events-none" : "hover:bg-accent/80 hover:border-primary/50")}>
              {isUploading ? (
                <><Loader2 className="h-8 w-8 text-muted-foreground animate-spin" /><span className="text-sm text-muted-foreground">Wird hochgeladen...</span></>
              ) : (
                <><Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Foto auswählen oder aufnehmen</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, HEIC · max. 10 MB pro Foto</span>
                </>
              )}
            </label>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{photos.length}/{MAX_PHOTOS} Fotos {photos.length === 0 ? "— optional, aber sehr hilfreich" : "hochgeladen"}</p>
        {uploadError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{uploadError}</div>}
      </div>

      <Separator />

      {/* Wunschtermine */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Wunschtermine für Handwerkerbesuch</h2>
          <p className="text-sm text-muted-foreground mt-1">Optional — geben Sie 1–2 Terminvorschläge an.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="appointment">1. Wunschtermin</Label>
            <Input id="appointment" type="datetime-local" value={preferredAppointment} onChange={(e) => onAppointmentChange(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appointment2">2. Wunschtermin</Label>
            <Input id="appointment2" type="datetime-local" value={preferredAppointment2} onChange={(e) => onAppointment2Change(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Telefon */}
      <div className="space-y-2">
        <Label htmlFor="reporter-phone">
          Ihre Rückrufnummer <span className="text-red-500">*</span>
        </Label>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex gap-2 items-start">
          <Phone className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Falls die Werkstatt keinen Ihrer Wunschtermine wahrnehmen kann, wird sie Sie unter dieser Nummer anrufen, um gemeinsam einen Termin zu vereinbaren.</span>
        </div>
        <Input id="reporter-phone" type="tel" placeholder="+43 664 123 456" value={reporterPhone} onChange={(e) => onReporterPhoneChange(e.target.value)} maxLength={30} />
      </div>

      <Separator />

      {/* Zugang */}
      <div className="space-y-2">
        <Label htmlFor="access-notes">
          Zugangshinweise <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="access-notes"
          placeholder="z.B. Schlüssel beim Nachbarn, Hund in der Wohnung, Klingel bei Müller, nur nachmittags erreichbar"
          value={accessNotes}
          onChange={(e) => onAccessNotesChange(e.target.value)}
          maxLength={500}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{accessNotes.length}/500</p>
      </div>
    </div>
  )
}

// ─── Step 5: Zusammenfassung ──────────────────────────────────────────────────

function Step5Summary({ formData, onEditStep, hasSubcategoryStep }: { formData: FormData; onEditStep: (step: number) => void; hasSubcategoryStep: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Alles korrekt?</h2>
        <p className="text-sm text-muted-foreground mt-1">Bitte prüfen Sie Ihre Angaben — danach sendet CARL die Meldung an Ihre Hausverwaltung.</p>
      </div>

      <SummarySection label="Kategorie" step={1} onEdit={onEditStep}>
        <div className="flex items-center gap-2">
          {formData.category && (() => { const Icon = CATEGORY_ICONS[formData.category]; return <><Icon className="h-5 w-5" /><span className="font-medium">{CATEGORY_LABELS[formData.category]}</span></> })()}
        </div>
      </SummarySection>

      {hasSubcategoryStep && (
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
                <span className="font-medium">{DAMAGE_SIDE_LABELS[formData.damage_side]}</span>
              </p>
            )}
            {formData.subcategories.length === 0 && formData.rooms.length === 0 && !formData.damage_side && (
              <p className="text-muted-foreground italic text-sm">Keine Vorauswahl — Details in der Beschreibung</p>
            )}
          </div>
        </SummarySection>
      )}

      <SummarySection label="Beschreibung" step={3} onEdit={onEditStep}>
        <div className="space-y-2 text-sm">
          {formData.damage_since && (
            <p><span className="text-muted-foreground">Seit wann:</span>{" "}
              {new Date(formData.damage_since + "T00:00:00").toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          )}
          {formData.description && <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{formData.description}</p>}
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
              <span className="text-xs text-muted-foreground self-end">{formData.photos.length} Foto{formData.photos.length !== 1 ? "s" : ""}</span>
            </div>
          ) : (
            <p className="text-muted-foreground italic flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Keine Fotos hochgeladen</p>
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
          {formData.reporter_phone && <p><span className="text-muted-foreground">Rückrufnummer:</span> {formData.reporter_phone}</p>}
          {formData.access_notes && <p><span className="text-muted-foreground">Zugang:</span> {formData.access_notes}</p>}
        </div>
      </SummarySection>

    </div>
  )
}

// ─── Summary Section Helper ───────────────────────────────────────────────────

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
