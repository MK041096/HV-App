"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Upload, FileSpreadsheet, X, Loader2, CheckCircle2,
  AlertCircle, ChevronLeft, Download, Wrench, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface ImportResult {
  contractors_created: number
  contractors_skipped: number
  errors: { row: number; message: string }[]
}

function downloadTemplate() {
  const csvContent = [
    "Name,Firma,Telefon,E-Mail,Gewerk,Notiz",
    'Thomas Huber,Huber Sanitaer GmbH,+43 664 111 2233,huber@example.at,"wasserschaden,sanitaer",Rohrbruch und Wasserinstallation',
    "Klaus Brandner,Elektro Brandner eU,+43 664 222 3344,brandner@example.at,elektrik,Elektroinstallation und Reparaturen",
    "Maria Fuchs,Fuchs Bau KG,+43 664 333 4455,fuchs@example.at,schimmel,Schimmelsanierung",
  ].join("\n")

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "SchadensMelder_Werkstaetten_Vorlage.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function WerkstaettenImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    const name = f.name.toLowerCase()
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      setError("Bitte nur .xlsx, .xls oder .csv Dateien hochladen")
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Datei ist zu groß (max. 5 MB)")
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleImport() {
    if (!file) return
    setIsImporting(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/hv/contractors/import", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Import fehlgeschlagen"); return }
      setResult(json.data)
      setFile(null)
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 text-muted-foreground">
          <Link href="/dashboard/werkstaetten">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Zurück zu Werkstätten
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Werkstätten importieren</h1>
        <p className="text-muted-foreground mt-1">
          Importieren Sie Ihre Handwerker und Dienstleister aus einer Excel- oder CSV-Datei.
          Die Gewerkszuordnung ermöglicht automatische Vorschläge bei Schadensmeldungen.
        </p>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            So funktioniert&apos;s
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            {[
              { n: "1", title: "Excel ausfüllen", desc: "Name, Firma, Kontaktdaten und Gewerk pro Werkstatt" },
              { n: "2", title: "Datei hochladen", desc: "Drag & Drop oder Klick. Alle Werkstätten werden sofort angelegt." },
              { n: "3", title: "Vorschläge aktiviert", desc: "Bei Schadensmeldungen schlägt das System passende Werkstätten vor" },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{n}</div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template + Column Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Vorlage herunterladen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CSV mit allen Spalten inkl. Beispieldaten
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Vorlage (CSV)
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Unterstützte Spalten:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span><span className="text-foreground font-medium">Name</span> — Pflichtfeld</span>
              <span><span className="text-foreground">Firma</span> — optional</span>
              <span><span className="text-foreground">Telefon</span> — optional</span>
              <span><span className="text-foreground">E-Mail</span> — optional</span>
              <span><span className="text-foreground">Gewerk</span> — für Vorschläge</span>
              <span><span className="text-foreground">Notiz</span> — optional</span>
            </div>
            <Separator className="my-2" />
            <p className="font-medium text-foreground">Gültige Gewerk-Werte (Komma-getrennt):</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {["wasserschaden","heizung","elektrik","fenster_tueren","schimmel","sanitaer","boeden_waende","aussenbereich","sonstiges"].map(s => (
                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datei hochladen</CardTitle>
          <CardDescription>.xlsx, .xls oder .csv — max. 5 MB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver ? "border-primary bg-primary/5"
              : file ? "border-green-400 bg-green-50 dark:bg-green-900/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = "" }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Datei hier ablegen oder <span className="text-primary underline underline-offset-2">auswählen</span></p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx · .xls · .csv — max. 5 MB</p>
              </>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button className="w-full" size="lg" onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird importiert...</>
              : <><Upload className="mr-2 h-4 w-4" />Jetzt importieren</>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Import abgeschlossen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Wrench className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{result.contractors_created}</p>
                <p className="text-xs text-muted-foreground">Werkstätten erstellt</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <AlertCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{result.contractors_skipped}</p>
                <p className="text-xs text-muted-foreground">Bereits vorhanden</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {result.errors.length} Fehler beim Import
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs rounded-lg border bg-muted/30 p-3">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex gap-2">
                      <Badge variant="outline" className="shrink-0 text-[10px] h-4">Zeile {e.row}</Badge>
                      <span className="text-muted-foreground">{e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button asChild className="w-full">
              <Link href="/dashboard/werkstaetten">
                <Wrench className="mr-2 h-4 w-4" />
                Alle Werkstätten ansehen
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
