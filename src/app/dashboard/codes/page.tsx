"use client"

import { useEffect, useState, useCallback } from "react"
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  Home,
  Clock,
  CheckCircle2,
  Ban,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ── Types ──

interface Unit {
  id: string
  name: string
  address: string | null
  floor: string | null
}

interface ActivationCode {
  id: string
  code: string
  status: "pending" | "used" | "deactivated" | "expired"
  created_at: string
  expires_at: string
  unit: {
    id: string
    name: string
    address: string | null
    floor: string | null
  } | null
}

// ── Helpers ──

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date()
}

function getStatusConfig(code: ActivationCode) {
  const status =
    code.status === "pending" && isExpired(code.expires_at)
      ? "expired"
      : code.status

  switch (status) {
    case "pending":
      return {
        label: "Ausstehend",
        icon: Clock,
        className:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      }
    case "used":
      return {
        label: "Verwendet",
        icon: CheckCircle2,
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      }
    case "deactivated":
      return {
        label: "Deaktiviert",
        icon: Ban,
        className:
          "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
      }
    case "expired":
      return {
        label: "Abgelaufen",
        icon: AlertCircle,
        className:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      }
    default:
      return {
        label: status,
        icon: Clock,
        className: "",
      }
  }
}

// ── Copy Button ──

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Code kopieren"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

// ── Page ──

export default function CodesPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Deactivate
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [codesRes, unitsRes] = await Promise.all([
        fetch("/api/activation-codes?limit=200"),
        fetch("/api/hv/units?per_page=500&sort_by=name&sort_order=asc"),
      ])

      if (!codesRes.ok) throw new Error("Fehler beim Laden der Codes")
      if (!unitsRes.ok) throw new Error("Fehler beim Laden der Einheiten")

      const codesJson = await codesRes.json()
      const unitsJson = await unitsRes.json()

      setCodes(codesJson.data || [])
      setUnits(unitsJson.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleGenerate() {
    if (!selectedUnitId) return
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const res = await fetch("/api/activation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_id: selectedUnitId, expires_in_days: 30 }),
      })

      const json = await res.json()
      if (!res.ok) {
        setGenerateError(json.error || "Fehler beim Erstellen des Codes")
        return
      }

      setDialogOpen(false)
      setSelectedUnitId("")
      await fetchData()
    } catch {
      setGenerateError("Verbindungsfehler. Bitte versuchen Sie es erneut.")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDeactivate(id: string) {
    setDeactivatingId(id)
    try {
      const res = await fetch(`/api/activation-codes/${id}`, {
        method: "PATCH",
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || "Fehler beim Deaktivieren")
        return
      }
      await fetchData()
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.")
    } finally {
      setDeactivatingId(null)
    }
  }

  // Stats
  const pending = codes.filter(
    (c) => c.status === "pending" && !isExpired(c.expires_at)
  ).length
  const used = codes.filter((c) => c.status === "used").length
  const expired = codes.filter(
    (c) =>
      c.status === "deactivated" ||
      (c.status === "pending" && isExpired(c.expires_at))
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Aktivierungscodes
          </h1>
          <p className="text-muted-foreground mt-1">
            Codes für Mieter-Registrierung generieren und verwalten
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Aktiv
              </span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-600">
              {isLoading ? <Skeleton className="h-8 w-8" /> : pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Verwendet
              </span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {isLoading ? <Skeleton className="h-8 w-8" /> : used}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Inaktiv
              </span>
            </div>
            <p className="text-2xl font-bold mt-1 text-gray-600">
              {isLoading ? <Skeleton className="h-8 w-8" /> : expired}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={() => {
                setError(null)
                fetchData()
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Erneut
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Table (Desktop) */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead>Läuft ab</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <KeyRound className="h-10 w-10 opacity-50" />
                        <p>Noch keine Aktivierungscodes generiert</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDialogOpen(true)}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Ersten Code erstellen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => {
                    const config = getStatusConfig(code)
                    const StatusIcon = config.icon
                    const isPending =
                      code.status === "pending" &&
                      !isExpired(code.expires_at)

                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-mono font-semibold text-sm tracking-wider">
                              {code.code}
                            </span>
                            <CopyButton text={code.code} />
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.unit ? (
                            <div className="flex items-center gap-1.5">
                              <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-sm font-medium">
                                  {code.unit.name}
                                </p>
                                {code.unit.address && (
                                  <p className="text-xs text-muted-foreground">
                                    {code.unit.address}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={config.className}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(code.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(code.expires_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deactivatingId === code.id}
                              onClick={() => handleDeactivate(code.id)}
                            >
                              {deactivatingId === code.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1">Deaktivieren</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cards (Mobile) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : codes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <KeyRound className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Keine Codes vorhanden</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Code erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          codes.map((code) => {
            const config = getStatusConfig(code)
            const StatusIcon = config.icon
            const isPending =
              code.status === "pending" && !isExpired(code.expires_at)

            return (
              <Card key={code.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold tracking-wider text-sm">
                          {code.code}
                        </span>
                        <CopyButton text={code.code} />
                        <Badge
                          variant="outline"
                          className={config.className + " text-[10px]"}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      {code.unit && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Home className="h-3 w-3 shrink-0" />
                          {code.unit.name}
                          {code.unit.address && ` – ${code.unit.address}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Läuft ab: {formatDate(code.expires_at)}
                      </p>
                    </div>
                    {isPending && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={deactivatingId === code.id}
                        onClick={() => handleDeactivate(code.id)}
                      >
                        {deactivatingId === code.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Generate Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isGenerating) {
            setDialogOpen(open)
            if (!open) {
              setSelectedUnitId("")
              setGenerateError(null)
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aktivierungscode generieren</DialogTitle>
            <DialogDescription>
              Wählen Sie eine Wohneinheit aus. Der Code ist 30 Tage gültig und
              ermöglicht dem Mieter die Registrierung.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {generateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Wohneinheit</label>
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Einheit auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {units.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Keine Einheiten vorhanden
                    </SelectItem>
                  ) : (
                    units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <span className="flex items-center gap-2">
                          <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {unit.name}
                          {unit.address && (
                            <span className="text-muted-foreground">
                              – {unit.address}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Hinweis: Ein bestehender aktiver Code für diese Einheit wird
              automatisch deaktiviert.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isGenerating}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedUnitId || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird generiert...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Code generieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
