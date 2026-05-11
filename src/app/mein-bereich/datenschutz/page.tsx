'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, Download, Trash2, AlertTriangle, CheckCircle2,
  ShieldCheck, FileText, Edit3, ExternalLink, Building2, Info,
} from 'lucide-react'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  deletion_requested_at: string | null
}

interface Organization {
  id: string
  name: string
}

export default function DatenschutzPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, deletion_requested_at, organization_id')
        .eq('id', user.id)
        .single()
      if (!prof) { setIsLoading(false); return }

      setProfile({
        id: prof.id,
        first_name: prof.first_name,
        last_name: prof.last_name,
        deletion_requested_at: prof.deletion_requested_at,
      })

      if (prof.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', prof.organization_id)
          .single()
        if (org) setOrganization(org)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  async function handleExport() {
    setIsExporting(true)
    setExportError('')
    try {
      const res = await fetch('/api/profiles/export')
      if (!res.ok) {
        setExportError('Export fehlgeschlagen. Bitte später erneut versuchen.')
        return
      }
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
    setDeleteError('')
    try {
      const res = await fetch('/api/profiles/delete-request', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        setDeleteError(err.error || 'Antrag konnte nicht gestellt werden.')
      } else {
        setShowDeleteConfirm(false)
        setProfile(p => p ? { ...p, deletion_requested_at: new Date().toISOString() } : p)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleCancelDelete() {
    await fetch('/api/profiles/delete-request', { method: 'DELETE' })
    setProfile(p => p ? { ...p, deletion_requested_at: null } : p)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const deletionRequested = !!profile?.deletion_requested_at
  const deletionDate = profile?.deletion_requested_at
    ? new Date(new Date(profile.deletion_requested_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Datenschutz &amp; meine Rechte</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gemäß DSGVO haben Sie als Mieter umfassende Rechte über Ihre Daten. Hier können Sie diese ausüben.
        </p>
      </div>

      {/* Aktiver Löschantrag */}
      {deletionRequested && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              Löschantrag läuft
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-orange-800">
              Sie haben die Löschung Ihres Accounts beantragt.
              {deletionDate && (
                <> Die endgültige Löschung erfolgt am{' '}
                  <strong>{deletionDate.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
                </>
              )}
            </p>
            <Button variant="outline" size="sm" onClick={handleCancelDelete}>
              Antrag widerrufen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Daten einsehen / herunterladen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-600" />
            Daten herunterladen
          </CardTitle>
          <CardDescription>
            Art. 15 DSGVO — Recht auf Auskunft. Sie erhalten alle über Sie gespeicherten Daten als maschinenlesbare JSON-Datei.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            Enthalten sind: Ihre Profildaten, alle Schadensmeldungen, alle Kommentare. Der Download erfolgt sofort.
          </div>
          {exportError && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {exportError}
            </p>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Meine Daten als JSON herunterladen
          </Button>
        </CardContent>
      </Card>

      {/* Daten berichtigen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-green-600" />
            Daten berichtigen
          </CardTitle>
          <CardDescription>
            Art. 16 DSGVO — Recht auf Berichtigung. Falsche oder unvollständige Daten können Sie in den Einstellungen ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/mein-bereich/einstellungen">
              <Edit3 className="mr-2 h-4 w-4" />
              Zu meinen Einstellungen
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Account löschen */}
      <Card className={deletionRequested ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Account löschen
          </CardTitle>
          <CardDescription>
            Art. 17 DSGVO — Recht auf Löschung. Nach 30 Tagen werden Ihr Account und Ihre persönlichen Daten gelöscht.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 space-y-2">
            <p className="font-medium text-foreground">Was passiert bei der Löschung:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ihr Login wird dauerhaft entfernt — Sie können sich nicht mehr anmelden</li>
              <li>Ihre persönlichen Daten (Name, Telefon) werden anonymisiert</li>
              <li>Ihre Schadensmeldungen bleiben aus rechtlichen Gründen für 7 Jahre gespeichert (§ 132 BAO), aber ohne Bezug zu Ihnen</li>
              <li>Bis zur Löschung (30 Tage) können Sie den Antrag jederzeit widerrufen</li>
            </ul>
          </div>

          {deleteError && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {deleteError}
            </p>
          )}

          {deletionRequested ? (
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <CheckCircle2 className="h-4 w-4" />
              Löschantrag bereits gestellt
            </div>
          ) : showDeleteConfirm ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium">Sind Sie sicher?</p>
              <p className="text-sm text-muted-foreground">
                Diese Aktion startet den 30-Tage-Löschprozess.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteRequest}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ja, Löschung beantragen
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
        </CardContent>
      </Card>

      <Separator />

      {/* Verantwortliche & Aufsichtsbehörde */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Wer verarbeitet meine Daten?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="flex items-center gap-2 font-medium mb-1">
              <Building2 className="h-3.5 w-3.5" />
              Verantwortlicher
            </div>
            <p className="text-muted-foreground">
              {organization?.name || 'Ihre Hausverwaltung'} — entscheidet über Zweck und Mittel der Datenverarbeitung.
              Mietvertrag und Schadensbearbeitung erfolgen über diese Stelle.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 font-medium mb-1">
              <FileText className="h-3.5 w-3.5" />
              Auftragsverarbeiter
            </div>
            <p className="text-muted-foreground">
              SMARTCARL (Mathias Kracher, Oberwart) stellt die Software bereit und verarbeitet Daten ausschließlich
              im Auftrag Ihrer Hausverwaltung — mit Auftragsverarbeitungsvertrag (Art. 28 DSGVO).
            </p>
            <Link
              href="/datenschutz"
              className="text-primary hover:underline text-xs inline-flex items-center gap-1 mt-1"
            >
              Vollständige Datenschutzerklärung lesen
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 font-medium mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Beschwerde / Aufsichtsbehörde
            </div>
            <p className="text-muted-foreground">
              Sie können jederzeit Beschwerde bei der österreichischen Datenschutzbehörde einreichen:
            </p>
            <a
              href="https://www.dsb.gv.at/meldungen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs inline-flex items-center gap-1 mt-1"
            >
              dsb.gv.at — Meldungen einreichen
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Aktueller Kontext */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Angemeldet als <strong className="text-foreground">{profile?.first_name} {profile?.last_name}</strong>
        {email && <> · {email}</>}
      </div>
    </div>
  )
}
