'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Download, Trash2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  deletion_requested_at: string | null
}

export default function EinstellungenPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')

      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, deletion_requested_at')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setPhone(data.phone || '')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setIsSaving(true)
    setSaveSuccess(false)
    setError('')
    try {
      const res = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone: phone || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Fehler beim Speichern')
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const res = await fetch('/api/profiles/export')
      if (!res.ok) { setError('Export fehlgeschlagen'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meine-daten-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDeleteRequest() {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/profiles/delete-request', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Fehler beim Antrag')
      } else {
        setDeleteSuccess(true)
        setShowDeleteConfirm(false)
        setProfile(prev => prev ? { ...prev, deletion_requested_at: new Date().toISOString() } : prev)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleCancelDelete() {
    await fetch('/api/profiles/delete-request', { method: 'DELETE' })
    setProfile(prev => prev ? { ...prev, deletion_requested_at: null } : prev)
    setDeleteSuccess(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const deletionRequested = !!profile?.deletion_requested_at

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">Profil verwalten und Datenschutzrechte ausüben</p>
      </div>

      {/* Profil bearbeiten */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Mein Profil</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">Vorname</Label>
            <Input
              id="first_name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Vorname"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Nachname</Label>
            <Input
              id="last_name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Nachname"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefon (optional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+43 664 123 456"
          />
        </div>
        <div className="space-y-1.5">
          <Label>E-Mail-Adresse</Label>
          <Input value={email} disabled className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">E-Mail-Änderungen bitte direkt bei Ihrer Hausverwaltung beantragen.</p>
        </div>
        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Profil gespeichert.
          </div>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Speichern
        </Button>
      </section>

      <Separator />

      {/* Datenauskunft */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Meine Daten exportieren</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gemäß Art. 15 DSGVO können Sie alle über Sie gespeicherten Daten als JSON-Datei herunterladen.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Daten herunterladen
        </Button>
      </section>

      <Separator />

      {/* Account löschen */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-destructive">Account löschen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gemäß Art. 17 DSGVO können Sie die Löschung Ihres Accounts beantragen.
            Ihr Account wird nach 30 Tagen unwiderruflich gelöscht.
          </p>
        </div>

        {deletionRequested || deleteSuccess ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-orange-700 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              Löschantrag gestellt
            </div>
            <p className="text-sm text-orange-700">
              Ihr Account wird in 30 Tagen gelöscht. Sie können den Antrag bis dahin widerrufen.
            </p>
            <Button variant="outline" size="sm" onClick={handleCancelDelete}>
              Antrag widerrufen
            </Button>
          </div>
        ) : showDeleteConfirm ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <p className="text-sm font-medium">Sind Sie sicher?</p>
            <p className="text-sm text-muted-foreground">
              Ihr Account und alle persönlichen Daten werden nach 30 Tagen unwiderruflich gelöscht.
              Offene Schadensmeldungen werden anonymisiert und bleiben für die Hausverwaltung erhalten.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteRequest}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ja, Account löschen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Account löschen beantragen
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Zuständige Aufsichtsbehörde: Österreichische Datenschutzbehörde (DSB), dsb.gv.at
        </p>
      </section>
    </div>
  )
}
