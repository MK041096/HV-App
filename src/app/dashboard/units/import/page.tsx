"use client"

import { useState, useRef, useCallback } from "react"
import * as XLSX from "xlsx"
import Link from "next/link"
import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Download,
  Mail,
  Home,
  KeyRound,
  Info,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ── Types ──

interface ImportResult {
  units_created: number
  units_skipped: number
  codes_generated: number
  emails_sent: number
  errors: { row: number; message: string }[]
}

// ── Download Template helper ──

function downloadTemplate() {
  const rows = [
    ["Einheit", "Mieter", "E-Mail", "Telefon"],
    ["1060 Wien Mariahilfer Str. 45/Top 1", "Max Mustermann", "max@example.com", ""],
    ["1060 Wien Mariahilfer Str. 45/Top 2", "Erika Musterfrau", "erika@example.com", "+43 664 123 456"],
    ["1060 Wien Mariahilfer Str. 45/Top 3", "Hans Maier", "", "+43 676 987 654"],
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws["!cols"] = [
    { wch: 42 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Einheiten")

  XLSX.writeFile(wb, "SchadensMelder_Vorlage.xlsx")
}

// ── Page ──

export default function ImportPage() {
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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  async function handleImport() {
    if (!file) return
    setIsImporting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/hv/units/import", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || "Import fehlgeschlagen")
        return
      }

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
          <Link href="/dashboard/units">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Zurück zu Einheiten
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Excel-Massenimport</h1>
        <p className="text-muted-foreground mt-1">
          Importieren Sie bis zu 1.000 Einheiten auf einmal. Für jede Einheit wird automatisch
          ein Aktivierungscode generiert und die Einladung direkt an den Mieter versendet.
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
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Datei vorbereiten</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Excel oder CSV mit Einheiten, Adressen und E-Mail oder Telefonnummer der Mieter
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Datei hochladen</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Einheiten werden sofort angelegt.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">E-Mail wird versendet</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Mieter erhalten ihren Aktivierungscode
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Vorlage herunterladen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sie haben bereits eine Excel? Laden Sie sie direkt hoch, die App erkennt die Spalten automatisch. Oder laden Sie diese Vorlage herunter und füllen Sie sie aus.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Vorlage (Excel)
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Unterstützte Spalten:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span><span className="text-foreground font-medium">Einheit</span> — Pflichtfeld</span>
              <span><span className="text-foreground font-medium">Mieter</span> mit Vor- und Nachname — Pflichtfeld</span>
              <span><span className="text-foreground font-medium">E-Mail</span> — Pflichtfeld</span>
              <span><span className="text-foreground font-medium">Telefon</span> — Pflichtfeld wenn keine E-Mail vorhanden</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datei hochladen</CardTitle>
          <CardDescription>.xlsx, .xls oder .csv — max. 5 MB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${isDragOver
                ? "border-primary bg-primary/5"
                : file
                  ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer hover:bg-muted/30"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setResult(null)
                    setError(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Datei hier ablegen oder{" "}
                  <span className="text-primary underline underline-offset-2">
                    auswählen
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  .xlsx · .xls · .csv — max. 5 MB
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleImport}
            disabled={!file || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird importiert...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Jetzt importieren
              </>
            )}
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
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Home className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{result.units_created}</p>
                <p className="text-xs text-muted-foreground">Einheiten erstellt</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <KeyRound className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                <p className="text-2xl font-bold">{result.codes_generated}</p>
                <p className="text-xs text-muted-foreground">Codes generiert</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Mail className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-2xl font-bold">{result.emails_sent}</p>
                <p className="text-xs text-muted-foreground">E-Mails gesendet</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <AlertCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{result.units_skipped}</p>
                <p className="text-xs text-muted-foreground">Bereits vorhanden</p>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {result.errors.length} Fehler beim Import
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs rounded-lg border bg-muted/30 p-3">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex gap-2">
                      <Badge variant="outline" className="shrink-0 text-[10px] h-4">
                        Zeile {e.row}
                      </Badge>
                      <span className="text-muted-foreground">{e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button asChild className="flex-1">
                <Link href="/dashboard/units">
                  <Home className="mr-2 h-4 w-4" />
                  Alle Einheiten ansehen
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard/codes">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Aktivierungscodes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
