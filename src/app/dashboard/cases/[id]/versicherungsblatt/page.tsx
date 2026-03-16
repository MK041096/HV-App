"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Printer,
  Loader2,
  Building2,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type InsuranceReport = {
  id: string
  case_number: string
  title: string
  description: string | null
  category: string
  category_label: string
  urgency: string
  urgency_label: string
  room: string | null
  status: string
  status_label: string
  created_at: string
  updated_at: string
  closed_at: string | null
  is_insurance_damage: boolean
  insurance_notes: string | null
  assigned_to_name: string | null
  assigned_to_company: string | null
  assigned_to_phone: string | null
  assigned_to_email: string | null
  scheduled_appointment: string | null
  invoice_filename: string | null
  invoice_uploaded_at: string | null
  unit: { id: string; name: string; address: string; floor: string | null }
  reporter: { id: string; first_name: string | null; last_name: string | null; role: string }
  photos: { id: string; url: string | null; file_name: string }[]
}

function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "–"
  const d = new Date(iso)
  if (withTime) {
    return d.toLocaleString("de-AT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function VersicherungsblattPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [report, setReport] = useState<InsuranceReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string>("Hausverwaltung")

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/hv/cases/${id}`)
        if (!res.ok) {
          const json = await res.json()
          setError(json.error || "Fehler beim Laden")
          return
        }
        const json = await res.json()
        setReport(json.data)

        // Fetch org name
        const orgRes = await fetch("/api/hv/profile")
        if (orgRes.ok) {
          const orgJson = await orgRes.json()
          setOrgName(orgJson.data?.organization_name || "Hausverwaltung")
        }
      } catch {
        setError("Verbindungsfehler")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{error || "Fall nicht gefunden"}</p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/cases/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Fall
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b px-4 h-14 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/cases/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Versicherungsschadenblatt · Fall {report.case_number}
          </span>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken / PDF
          </Button>
        </div>
      </div>

      {/* Print content */}
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-8 print:px-6 print:py-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary print:hidden" />
              <h1 className="text-2xl font-bold">Versicherungsschadenblatt</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Erstellt am {formatDate(new Date().toISOString(), true)} von SchadensMelder
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-semibold text-lg">{orgName}</p>
            <Badge variant="destructive" className="print:border print:border-red-500 print:text-red-600 print:bg-transparent">
              Versicherungsschaden
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Section 1: Fall-Grunddaten */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 print:hidden" />
            1. Grunddaten der Schadensmeldung
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Fallnummer</span>
              <span className="font-mono font-semibold">{report.case_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Schadensdatum (Meldung)</span>
              <span>{formatDate(report.created_at, true)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Titel der Meldung</span>
              <span className="font-medium">{report.title}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Kategorie</span>
              <span>{report.category_label}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Dringlichkeit</span>
              <span>{report.urgency_label}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Status</span>
              <span>{report.status_label}</span>
            </div>
            {report.room && (
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Betroffener Raum</span>
                <span>{report.room}</span>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Section 2: Schadenbeschreibung */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Schadenbeschreibung</h2>
          <div className="border rounded-lg p-4 min-h-[120px] text-sm whitespace-pre-wrap print:border-gray-300">
            {report.description || (
              <span className="text-muted-foreground italic">Keine Beschreibung angegeben</span>
            )}
          </div>
          {report.insurance_notes && (
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-1">Notizen Versicherungsschaden</span>
              <div className="border rounded-lg p-4 text-sm whitespace-pre-wrap bg-amber-50 border-amber-200 print:bg-transparent print:border-gray-300">
                {report.insurance_notes}
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* Section 3: Objektdaten */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Objekt- und Mieterdaten</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Wohneinheit</span>
              <span className="font-medium">{report.unit?.name || "–"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Stockwerk</span>
              <span>{report.unit?.floor || "–"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Adresse</span>
              <span>{report.unit?.address || "–"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Mieter (Melder)</span>
              <span>
                {report.reporter
                  ? `${report.reporter.first_name || ""} ${report.reporter.last_name || ""}`.trim() || "–"
                  : "–"}
              </span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 4: Handwerker */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. Beauftragter Handwerker / Dienstleister</h2>
          {report.assigned_to_name ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Name</span>
                <span>{report.assigned_to_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Firma</span>
                <span>{report.assigned_to_company || "–"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Telefon</span>
                <span>{report.assigned_to_phone || "–"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">E-Mail</span>
                <span>{report.assigned_to_email || "–"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Noch kein Handwerker zugewiesen</p>
          )}
        </section>

        <Separator />

        {/* Section 5: Termin */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Reparaturtermin</h2>
          <div className="text-sm">
            <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Geplanter Termin</span>
            <span className="font-medium">{formatDate(report.scheduled_appointment, true)}</span>
          </div>
          {report.closed_at && (
            <div className="text-sm">
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Abschluss</span>
              <span>{formatDate(report.closed_at, true)}</span>
            </div>
          )}
        </section>

        <Separator />

        {/* Section 6: Rechnung */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Rechnung</h2>
          {report.invoice_filename ? (
            <div className="text-sm">
              <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Rechnungsdatei</span>
              <span>{report.invoice_filename}</span>
              <span className="text-muted-foreground ml-2">
                (hochgeladen am {formatDate(report.invoice_uploaded_at, true)})
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Noch keine Rechnung hochgeladen</p>
          )}
        </section>

        <Separator />

        {/* Section 7: Fotos */}
        {report.photos && report.photos.length > 0 && (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">7. Schadensfotos</h2>
              <div className="grid grid-cols-3 gap-3">
                {report.photos.slice(0, 6).map((photo) => (
                  photo.url ? (
                    <div key={photo.id} className="aspect-square rounded border overflow-hidden print:border-gray-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null
                ))}
              </div>
              {report.photos.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  + {report.photos.length - 6} weitere Fotos im System
                </p>
              )}
            </section>
            <Separator />
          </>
        )}

        {/* Section 8: Unterschriften */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">8. Unterschriften</h2>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="border-b border-gray-400 pb-1 h-16 print:border-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">Datum / Hausverwaltung</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-b border-gray-400 pb-1 h-16 print:border-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">Datum / Versicherungsnehmer</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t text-xs text-muted-foreground space-y-1 print:border-gray-300">
          <p>Erstellt mit SchadensMelder · zerodamage.de</p>
          <p>Dokument-ID: {report.id} · Fall: {report.case_number}</p>
        </div>
      </div>
    </div>
  )
}
