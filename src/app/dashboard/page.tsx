"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  Loader2,
  Home,
  Users,
  Wrench,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Info,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  total: number
  neu: number
  in_bearbeitung: number
  warte_auf_handwerker: number
  termin_vereinbart: number
  erledigt: number
  notfall: number
  dringend: number
}

interface RecentCase {
  id: string
  case_number: string
  title: string
  urgency: string
  status: string
  created_at: string
  reporter: { first_name: string | null; last_name: string | null } | null
  unit: { name: string } | null
}

interface OnboardingState {
  hasUnits: boolean
  hasWerkstaetten: boolean
  hasVersicherung: boolean
  hasMietvertraege: boolean
  hasMieter: boolean
  hasCases: boolean
  loaded: boolean
}

interface OnboardingStep {
  id: keyof Omit<OnboardingState, "loaded">
  number: number
  title: string
  description: string
  whyBox: string
  href: string
  linkText: string
  icon: React.ElementType
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "hasUnits",
    number: 1,
    title: "Einheiten anlegen",
    description:
      "Tragen Sie alle Einheiten ein, die Sie verwalten, zum Beispiel „Wohnung Top 1“, „Büro EG links“ oder „Gewerbefläche 3. OG“. Mit dem Excel-Import können Sie hunderte Einheiten auf einmal hochladen. Geben Sie pro Einheit den Namen, die vollständige Adresse (z.B. Hauptstraße 12/3, 1010 Wien) sowie die E-Mail-Adresse des Mieters an, damit der Aktivierungscode automatisch versendet wird.",
    whyBox:
      "Ohne angelegte Einheiten kann kein Mieter eine Schadensmeldung abschicken. Sobald Sie beim Import eine Mieter-E-Mail angeben, verschickt die App den Aktivierungscode automatisch an den Mieter. Kein extra Schritt notwendig.",
    href: "/dashboard/units",
    linkText: "Zu den Einheiten",
    icon: Home,
  },
  {
    id: "hasWerkstaetten",
    number: 2,
    title: "Handwerker / Werkstätten eintragen",
    description:
      "Fügen Sie Ihre Vertrauenshandwerker ein — Elektriker, Installateur, Maler usw. Sie hinterlegen Name, Gewerk, Telefon und E-Mail. Die App schlägt Ihnen dann bei jeder Schadensmeldung automatisch den passenden Handwerker vor.",
    whyBox:
      "So sparen Sie bei jeder Meldung das lästige Suchen nach der richtigen Nummer. Mit einem Klick sehen Sie, wer für diesen Schadenstyp zuständig ist.",
    href: "/dashboard/werkstaetten",
    linkText: "Zu den Handwerkern",
    icon: Wrench,
  },
  {
    id: "hasVersicherung",
    number: 3,
    title: "Versicherungspolice hochladen",
    description:
      "Laden Sie die Versicherungspolice(n) Ihrer Liegenschaft hoch. Die App liest das Dokument automatisch aus und erkennt, was versichert ist — z.B. Glasbruch, Leitungswasser, Sturmschäden. Bei einer neuen Schadensmeldung zeigt die App dann direkt an: \"Dieser Schaden ist versichert.\"",
    whyBox:
      "Sie verlieren nie wieder Zeit damit, die Police zu suchen oder zu lesen. Die App sagt Ihnen sofort ob und was versichert ist.",
    href: "/dashboard/dokumente",
    linkText: "Dokumente hochladen",
    icon: ShieldCheck,
  },
  {
    id: "hasMietvertraege",
    number: 4,
    title: "Mietverträge hochladen",
    description:
      "Laden Sie die Mietverträge für Ihre Einheiten hoch. Die App analysiert automatisch wichtige Klauseln — z.B. wer ist für Kleinreparaturen zuständig, gibt es eine Glasklausel, welche Haustierhaltung ist erlaubt. Das spart bei jeder Meldung das Nachschlagen im Vertrag.",
    whyBox:
      "Wenn ein Mieter meldet \"Fensterscheibe kaputt\" sehen Sie sofort: Glasklausel vorhanden → Versicherungsfall. Kein manuelles Suchen mehr.",
    href: "/dashboard/dokumente",
    linkText: "Mietverträge hochladen",
    icon: FileText,
  },
  {
    id: "hasCases",
    number: 5,
    title: "Erste Schadensmeldung",
    description:
      "Sobald ein Mieter registriert ist, kann er über sein Portal (mein-bereich) eine Schadensmeldung abschicken. Sie sehen die Meldung sofort in Ihrem Dashboard und können mit einem Klick: Status setzen, Handwerker zuweisen, Notizen hinzufügen und die Meldung abschließen.",
    whyBox:
      "Das Ziel: eine Schadensmeldung von Eingang bis Abschluss in unter 3 Minuten — statt wie bisher 20 Minuten mit Telefonaten, WhatsApp und Excel.",
    href: "/dashboard/cases",
    linkText: "Zu den Schadensmeldungen",
    icon: ClipboardList,
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCases, setRecentCases] = useState<RecentCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    hasUnits: false,
    hasWerkstaetten: false,
    hasVersicherung: false,
    hasMietvertraege: false,
    hasMieter: false,
    hasCases: false,
    loaded: false,
  })
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single()

        if (!profile) return
        const orgId = profile.organization_id

        // Load everything in parallel
        const [
          unitsRes,
          werkRes,
          docsRes,
          mieterRes,
          casesRes,
          allCasesRes,
          recentRes,
        ] = await Promise.all([
          supabase
            .from("units")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("is_deleted", false),
          supabase
            .from("contractors")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("is_active", true),
          supabase
            .from("documents")
            .select("id, document_type")
            .eq("organization_id", orgId)
            .eq("is_deleted", false),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("role", "mieter"),
          supabase
            .from("damage_reports")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("is_deleted", false),
          supabase
            .from("damage_reports")
            .select("id, status, urgency")
            .eq("organization_id", orgId)
            .eq("is_deleted", false),
          supabase
            .from("damage_reports")
            .select(
              `id, case_number, title, urgency, status, created_at,
              reporter:profiles!damage_reports_reporter_id_fkey(first_name, last_name),
              unit:units(name)`
            )
            .eq("organization_id", orgId)
            .eq("is_deleted", false)
            .in("status", [
              "neu",
              "in_bearbeitung",
              "warte_auf_handwerker",
              "termin_vereinbart",
            ])
            .order("created_at", { ascending: false })
            .limit(5),
        ])

        // Onboarding state
        const docs = docsRes.data || []
        const hasVersicherung = docs.some(
          (d) => d.document_type === "versicherung"
        )
        const hasMietvertraege = docs.some(
          (d) => d.document_type === "mietvertrag"
        )

        const newOnboarding: OnboardingState = {
          hasUnits: (unitsRes.count ?? 0) > 0,
          hasWerkstaetten: (werkRes.count ?? 0) > 0,
          hasVersicherung,
          hasMietvertraege,
          hasMieter: (mieterRes.count ?? 0) > 0,
          hasCases: (casesRes.count ?? 0) > 0,
          loaded: true,
        }
        setOnboarding(newOnboarding)

        // Auto-expand first incomplete step
        const firstIncomplete = ONBOARDING_STEPS.findIndex(
          (s) => !newOnboarding[s.id]
        )
        if (firstIncomplete !== -1) {
          setExpandedStep(firstIncomplete)
        }

        // Stats
        const cases = allCasesRes.data || []
        setStats({
          total: cases.length,
          neu: cases.filter((c) => c.status === "neu").length,
          in_bearbeitung: cases.filter((c) => c.status === "in_bearbeitung").length,
          warte_auf_handwerker: cases.filter(
            (c) => c.status === "warte_auf_handwerker"
          ).length,
          termin_vereinbart: cases.filter(
            (c) => c.status === "termin_vereinbart"
          ).length,
          erledigt: cases.filter((c) => c.status === "erledigt").length,
          notfall: cases.filter((c) => c.urgency === "notfall").length,
          dringend: cases.filter((c) => c.urgency === "dringend").length,
        })

        if (recentRes.data) {
          setRecentCases(recentRes.data as unknown as RecentCase[])
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const openCount = stats
    ? stats.neu +
      stats.in_bearbeitung +
      stats.warte_auf_handwerker +
      stats.termin_vereinbart
    : 0

  const completedSteps = onboarding.loaded
    ? ONBOARDING_STEPS.filter((s) => onboarding[s.id]).length
    : 0
  const allDone = completedSteps === ONBOARDING_STEPS.length
  const showOnboarding = onboarding.loaded && !allDone

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
        <p className="text-muted-foreground mt-1">
          Willkommen im Case-Management Dashboard
        </p>
      </div>

      {/* Onboarding Guide */}
      {onboarding.loaded && (
        <Card className={allDone ? "border-green-500/30 bg-green-50/50" : "border-primary/20 bg-primary/5"}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {allDone ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">Einrichtung abgeschlossen!</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary">Schritt-für-Schritt Einrichtung</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {completedSteps} von {ONBOARDING_STEPS.length} erledigt
                    </span>
                  </>
                )}
              </CardTitle>
              {/* Progress dots */}
              <div className="flex gap-1.5">
                {ONBOARDING_STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-colors",
                      onboarding[step.id]
                        ? "bg-green-500"
                        : "bg-gray-300"
                    )}
                    title={step.title}
                  />
                ))}
              </div>
            </div>
            {allDone && (
              <CardDescription className="text-green-700">
                Ihre App ist vollständig eingerichtet. Alle Meldungen, Dokumente und Handwerker sind bereit.
              </CardDescription>
            )}
            {!allDone && (
              <CardDescription>
                Richten Sie die App einmalig ein — danach läuft alles automatisch. Klicken Sie auf einen Schritt für mehr Details.
              </CardDescription>
            )}
          </CardHeader>

          {showOnboarding && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {ONBOARDING_STEPS.map((step, idx) => {
                  const isDone = onboarding[step.id]
                  const isExpanded = expandedStep === idx
                  const Icon = step.icon

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "rounded-lg border transition-colors",
                        isDone
                          ? "border-green-200 bg-green-50"
                          : isExpanded
                          ? "border-primary/30 bg-white"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      {/* Step Header (always visible) */}
                      <button
                        className="w-full flex items-center gap-3 p-3 text-left"
                        onClick={() =>
                          setExpandedStep(isExpanded ? null : idx)
                        }
                      >
                        {/* Icon + Number */}
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                            isDone
                              ? "bg-green-100"
                              : "bg-primary/10"
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Icon className="h-4 w-4 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Schritt {step.number}
                            </span>
                            {isDone && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-green-400 text-green-700"
                              >
                                Erledigt
                              </Badge>
                            )}
                          </div>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isDone && "text-green-800"
                            )}
                          >
                            {step.title}
                          </p>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-3 pb-4 space-y-3 border-t pt-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>

                          {/* Why box */}
                          <div className="flex gap-2 p-3 rounded-md bg-blue-50 border border-blue-100">
                            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 leading-relaxed">
                              <span className="font-semibold">Warum ist das wichtig?</span>{" "}
                              {step.whyBox}
                            </p>
                          </div>

                          {/* Video placeholder */}
                          <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-dashed border-gray-300">
                            <PlayCircle className="h-5 w-5 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-500">
                              Video-Anleitung folgt — persönliches Onboarding inklusive
                            </p>
                          </div>

                          <Button asChild size="sm">
                            <Link href={step.href}>
                              {step.linkText}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Fälle</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total || 0} gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notfälle</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.notfall || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sofortige Bearbeitung erforderlich
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Meldungen</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.neu || 0}</div>
            <p className="text-xs text-muted-foreground">
              Noch nicht bearbeitet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erledigt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.erledigt || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Abgeschlossene Fälle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Neueste offene Fälle</CardTitle>
            <CardDescription>
              Die letzten 5 offenen Schadensmeldungen
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/cases">
              Alle Fälle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Keine offenen Fälle vorhanden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/cases/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UrgencyDot urgency={c.urgency} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {c.case_number}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">
                        {c.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.reporter?.first_name} {c.reporter?.last_name}
                        {c.unit?.name ? ` - ${c.unit.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDate(c.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UrgencyDot({ urgency }: { urgency: string }) {
  const colors: Record<string, string> = {
    notfall: "bg-red-500",
    dringend: "bg-orange-500",
    normal: "bg-blue-500",
  }
  return (
    <div
      className={cn(
        "h-3 w-3 rounded-full shrink-0",
        colors[urgency] || "bg-gray-400"
      )}
      title={
        urgency === "notfall"
          ? "Notfall"
          : urgency === "dringend"
            ? "Dringend"
            : "Normal"
      }
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    neu: { label: "Neu", variant: "default" },
    in_bearbeitung: { label: "In Bearbeitung", variant: "secondary" },
    warte_auf_handwerker: { label: "Warte auf Handwerker", variant: "outline" },
    termin_vereinbart: { label: "Termin vereinbart", variant: "outline" },
    erledigt: { label: "Erledigt", variant: "secondary" },
    abgelehnt: { label: "Abgelehnt", variant: "destructive" },
  }
  const c = config[status] || { label: status, variant: "outline" as const }
  return (
    <Badge variant={c.variant} className="text-[10px] px-1.5 py-0">
      {c.label}
    </Badge>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
