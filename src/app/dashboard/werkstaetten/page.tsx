"use client"

import { useEffect, useState } from "react"
import {
  Wrench,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Mail,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Alert, AlertDescription } from "@/components/ui/alert"

// ── Types ──

interface Contractor {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  specialties: string[]
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FormState {
  name: string
  company: string
  email: string
  phone: string
  specialties: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  specialties: "",
  notes: "",
}

const SPECIALTY_HINTS = [
  "wasser", "sanitaer", "heizung", "elektrik", "schimmel",
  "boeden", "fenster_tueren", "aussenbereich", "dach",
  "maler", "aufzug", "reinigung", "allgemein",
]

const SPECIALTY_LABELS: Record<string, string> = {
  wasser: "Wasser",
  sanitaer: "Sanitär",
  heizung: "Heizung",
  elektrik: "Elektrik",
  schimmel: "Schimmel",
  boeden: "Böden",
  fenster_tueren: "Fenster/Türen",
  aussenbereich: "Außenbereich",
  dach: "Dach",
  maler: "Maler",
  aufzug: "Aufzug",
  reinigung: "Reinigung",
  allgemein: "Allgemein",
}

function specialtyLabel(s: string): string {
  return SPECIALTY_LABELS[s] || s
}

function parseSpecialties(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean)
}

// ── Page ──

export default function WerkstaettenPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadContractors() {
    setIsLoading(true)
    setPageError(null)
    try {
      const res = await fetch("/api/hv/contractors")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden")
      setContractors(json.data || [])
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadContractors()
  }, [])

  function openAddDialog() {
    setEditingContractor(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEditDialog(contractor: Contractor) {
    setEditingContractor(contractor)
    setForm({
      name: contractor.name,
      company: contractor.company || "",
      email: contractor.email || "",
      phone: contractor.phone || "",
      specialties: contractor.specialties.join(", "),
      notes: contractor.notes || "",
    })
    setFormError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingContractor(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError("Name ist ein Pflichtfeld")
      return
    }

    setIsSaving(true)
    setFormError(null)

    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      specialties: parseSpecialties(form.specialties),
      notes: form.notes.trim() || null,
    }

    try {
      let res: Response
      if (editingContractor) {
        res = await fetch(`/api/hv/contractors/${editingContractor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/hv/contractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler beim Speichern")

      closeDialog()
      await loadContractors()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Werkstatt wirklich löschen?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/hv/contractors/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Fehler beim Löschen")
      await loadContractors()
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Fehler beim Löschen")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Werkstätten</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verwalten Sie Ihre Handwerker und Dienstleister
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Werkstatt
        </Button>
      </div>

      {/* Page Error */}
      {pageError && (
        <Alert variant="destructive">
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : contractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Wrench className="h-14 w-14 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-lg">Noch keine Werkstätten angelegt</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fügen Sie Ihre Handwerker und Dienstleister hinzu, um sie schnell bei Schadensfällen zuzuweisen.
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Erste Werkstatt anlegen
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead className="hidden md:table-cell">Gewerk / Spezialität</TableHead>
                <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                <TableHead className="hidden lg:table-cell">E-Mail</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractors.map((contractor) => (
                <TableRow key={contractor.id}>
                  <TableCell className="font-medium">{contractor.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contractor.company || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contractor.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {contractor.specialties.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[11px]">
                            {specialtyLabel(s)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {contractor.phone ? (
                      <a
                        href={`tel:${contractor.phone}`}
                        className="flex items-center gap-1 text-sm hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {contractor.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {contractor.email ? (
                      <a
                        href={`mailto:${contractor.email}`}
                        className="flex items-center gap-1 text-sm hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {contractor.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(contractor)}
                        title="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contractor.id)}
                        disabled={deletingId === contractor.id}
                        title="Löschen"
                      >
                        {deletingId === contractor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingContractor ? "Werkstatt bearbeiten" : "Neue Werkstatt anlegen"}
            </DialogTitle>
            <DialogDescription>
              {editingContractor
                ? "Ändern Sie die Daten der Werkstatt und speichern Sie."
                : "Fügen Sie einen neuen Handwerker oder Dienstleister hinzu."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="wk-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wk-name"
                placeholder="z.B. Johann Müller"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wk-company">Firma</Label>
              <Input
                id="wk-company"
                placeholder="z.B. Müller Installationen GmbH"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wk-phone">Telefon</Label>
                <Input
                  id="wk-phone"
                  type="tel"
                  placeholder="+43 664 ..."
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wk-email">E-Mail</Label>
                <Input
                  id="wk-email"
                  type="email"
                  placeholder="office@..."
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wk-specialties">Spezialitäten</Label>
              <Input
                id="wk-specialties"
                placeholder="z.B. wasser, heizung, sanitaer"
                value={form.specialties}
                onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Kommagetrennt. Mögliche Werte:{" "}
                <span className="font-mono">
                  {SPECIALTY_HINTS.join(", ")}
                </span>
              </p>
              {form.specialties.trim() && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {parseSpecialties(form.specialties).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[11px]">
                      {specialtyLabel(s)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wk-notes">Notizen</Label>
              <Textarea
                id="wk-notes"
                placeholder="Interne Notizen, Konditionen, Kontaktzeiten..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                editingContractor ? "Speichern" : "Anlegen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
