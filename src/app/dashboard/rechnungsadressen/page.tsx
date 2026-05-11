'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Receipt, Plus, Pencil, Trash2, Loader2, AlertTriangle,
  Building2, CheckCircle2, X,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface BillingAddress {
  id: string
  liegenschaft_address: string
  billing_name: string
  billing_street: string
  billing_zip: string
  billing_city: string
  billing_country: string
  billing_uid: string | null
  billing_email: string | null
  billing_reference: string | null
  created_at: string
}

interface Liegenschaft {
  address: string
  unitCount: number
}

type FormState = {
  liegenschaft_address: string
  billing_name: string
  billing_street: string
  billing_zip: string
  billing_city: string
  billing_country: string
  billing_uid: string
  billing_email: string
  billing_reference: string
}

const EMPTY_FORM: FormState = {
  liegenschaft_address: '',
  billing_name: '',
  billing_street: '',
  billing_zip: '',
  billing_city: '',
  billing_country: 'Österreich',
  billing_uid: '',
  billing_email: '',
  billing_reference: '',
}

export default function RechnungsadressenPage() {
  const [addresses, setAddresses] = useState<BillingAddress[]>([])
  const [liegenschaften, setLiegenschaften] = useState<Liegenschaft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [resAddr, resLg] = await Promise.all([
        fetch('/api/hv/billing-addresses'),
        fetch('/api/hv/liegenschaften'),
      ])
      if (resAddr.ok) {
        const json = await resAddr.json()
        setAddresses(json.data || [])
      }
      if (resLg.ok) {
        const json = await resLg.json()
        setLiegenschaften(json.liegenschaften || [])
      }
    } catch {
      setError('Daten konnten nicht geladen werden')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate(preset?: string) {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, liegenschaft_address: preset || '' })
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(a: BillingAddress) {
    setEditingId(a.id)
    setForm({
      liegenschaft_address: a.liegenschaft_address,
      billing_name: a.billing_name,
      billing_street: a.billing_street,
      billing_zip: a.billing_zip,
      billing_city: a.billing_city,
      billing_country: a.billing_country,
      billing_uid: a.billing_uid || '',
      billing_email: a.billing_email || '',
      billing_reference: a.billing_reference || '',
    })
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    setIsSaving(true)
    setFormError('')
    try {
      const url = editingId
        ? `/api/hv/billing-addresses/${editingId}`
        : '/api/hv/billing-addresses'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Speichern fehlgeschlagen')
        return
      }
      setDialogOpen(false)
      await load()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Diese Rechnungsadresse wirklich löschen? Werkstatt-Mails für diese Liegenschaft enthalten danach keine Rechnungsadresse mehr.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/hv/billing-addresses/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
    } finally {
      setDeletingId(null)
    }
  }

  const lgWithAddress = new Set(addresses.map(a => a.liegenschaft_address))
  const lgWithoutAddress = liegenschaften.filter(l => !lgWithAddress.has(l.address))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Rechnungsadressen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pro Liegenschaft eine Rechnungsadresse — wird automatisch in Werkstatt-Mails eingefügt,
            damit die Werkstatt die Rechnung korrekt schreiben kann.
          </p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Rechnungsadresse
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Warnung: Liegenschaften ohne Rechnungsadresse */}
      {lgWithoutAddress.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-4 w-4" />
              {lgWithoutAddress.length} Liegenschaft{lgWithoutAddress.length === 1 ? '' : 'en'} ohne Rechnungsadresse
            </CardTitle>
            <CardDescription className="text-orange-800">
              Werkstatt-Mails für diese Liegenschaften enthalten keine Rechnungsadresse. Bitte nachtragen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lgWithoutAddress.slice(0, 12).map(l => (
                <Button
                  key={l.address}
                  size="sm"
                  variant="outline"
                  className="h-auto py-1.5 text-xs bg-white"
                  onClick={() => openCreate(l.address)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {l.address}
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                    {l.unitCount} Einh.
                  </Badge>
                </Button>
              ))}
              {lgWithoutAddress.length > 12 && (
                <span className="text-xs text-orange-800 self-center">
                  + {lgWithoutAddress.length - 12} weitere
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vorhandene Rechnungsadressen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Erfasste Rechnungsadressen</CardTitle>
          <CardDescription>
            {addresses.length === 0
              ? 'Noch keine Rechnungsadressen erfasst.'
              : `${addresses.length} ${addresses.length === 1 ? 'Adresse' : 'Adressen'} gespeichert.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Receipt className="h-10 w-10 mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Noch keine Rechnungsadressen</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Sobald Sie pro Liegenschaft eine Rechnungsadresse anlegen, wird diese automatisch in die
                Werkstatt-Mails eingefügt — die Werkstatt kann die Rechnung dann direkt korrekt schreiben.
              </p>
              <Button className="mt-4" onClick={() => openCreate()}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Rechnungsadresse anlegen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Liegenschaft</TableHead>
                    <TableHead>Rechnungsempfänger</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>UID / E-Mail</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addresses.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{a.liegenschaft_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{a.billing_name}</div>
                        {a.billing_reference && (
                          <div className="text-xs text-muted-foreground">Ref: {a.billing_reference}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{a.billing_street}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.billing_zip} {a.billing_city}, {a.billing_country}
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.billing_uid && <div className="text-xs">UID: {a.billing_uid}</div>}
                        {a.billing_email && <div className="text-xs text-muted-foreground">{a.billing_email}</div>}
                        {!a.billing_uid && !a.billing_email && <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(a)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(a.id)}
                            disabled={deletingId === a.id}
                          >
                            {deletingId === a.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
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
        </CardContent>
      </Card>

      {/* Hinweis: Bulk-Import (kommt in Phase 2) */}
      {liegenschaften.length > 3 && addresses.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tipp:</strong> Sie haben {liegenschaften.length} Liegenschaften.
                Tragen Sie pro Liegenschaft die WEG-Rechnungsadresse ein — meist steht diese auf Ihren Versicherungspolicen
                als Versicherungsnehmer. Sobald eine Rechnungsadresse hinterlegt ist, wird sie automatisch in jeder
                Werkstatt-Mail für die jeweilige Liegenschaft mitgesendet.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Anlegen / Bearbeiten */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Rechnungsadresse bearbeiten' : 'Neue Rechnungsadresse'}</DialogTitle>
            <DialogDescription>
              Diese Adresse wird in Werkstatt-Mails für die ausgewählte Liegenschaft eingefügt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lg">Liegenschaft *</Label>
              <Select
                value={form.liegenschaft_address}
                onValueChange={v => setForm({ ...form, liegenschaft_address: v })}
                disabled={!!editingId}
              >
                <SelectTrigger id="lg">
                  <SelectValue placeholder="Liegenschaft auswählen…" />
                </SelectTrigger>
                <SelectContent>
                  {liegenschaften.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Keine Einheiten/Liegenschaften — bitte erst Einheiten anlegen.
                    </div>
                  ) : (
                    liegenschaften.map(l => (
                      <SelectItem key={l.address} value={l.address}>
                        {l.address} ({l.unitCount} {l.unitCount === 1 ? 'Einheit' : 'Einheiten'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {editingId && (
                <p className="text-xs text-muted-foreground">
                  Liegenschaft kann nicht geändert werden. Bei Bedarf alte Adresse löschen und neu anlegen.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Rechnungsempfänger *</Label>
              <Input
                id="name"
                value={form.billing_name}
                onChange={e => setForm({ ...form, billing_name: e.target.value })}
                placeholder="z.B. Eigentümergemeinschaft Hauptstraße 5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="street">Straße &amp; Hausnummer *</Label>
                <Input
                  id="street"
                  value={form.billing_street}
                  onChange={e => setForm({ ...form, billing_street: e.target.value })}
                  placeholder="Hauptstraße 5"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">PLZ *</Label>
                <Input
                  id="zip"
                  value={form.billing_zip}
                  onChange={e => setForm({ ...form, billing_zip: e.target.value })}
                  placeholder="7400"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Ort *</Label>
                <Input
                  id="city"
                  value={form.billing_city}
                  onChange={e => setForm({ ...form, billing_city: e.target.value })}
                  placeholder="Oberwart"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                value={form.billing_country}
                onChange={e => setForm({ ...form, billing_country: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="uid">UID (optional)</Label>
                <Input
                  id="uid"
                  value={form.billing_uid}
                  onChange={e => setForm({ ...form, billing_uid: e.target.value })}
                  placeholder="ATU12345678"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.billing_email}
                  onChange={e => setForm({ ...form, billing_email: e.target.value })}
                  placeholder="buchhaltung@hv-mueller.at"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ref">Interne Referenz (optional)</Label>
              <Input
                id="ref"
                value={form.billing_reference}
                onChange={e => setForm({ ...form, billing_reference: e.target.value })}
                placeholder="z.B. WEG-2024-001"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" /> {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {editingId ? 'Aktualisieren' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
