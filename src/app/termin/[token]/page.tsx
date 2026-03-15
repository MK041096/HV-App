'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, XCircle, Loader2 } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  wasserschaden: 'Wasserschaden', heizung: 'Heizung', elektrik: 'Elektrik',
  fenster_tueren: 'Fenster & Türen', schimmel: 'Schimmel', sanitaer: 'Sanitär',
  boeden_waende: 'Böden & Wände', aussenbereich: 'Außenbereich', sonstiges: 'Sonstiges',
}

interface TokenData {
  id: string
  status: string
  damage_report: {
    case_number: string
    title: string
    category: string
    description: string | null
    preferred_appointment: string | null
    unit: { name: string; address: string } | null
  }
  contractor: { name: string; company: string } | null
}

export default function TerminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'confirm' | 'reschedule' | null>(null)
  const [newDate, setNewDate] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ isRescheduled: boolean; confirmedDate: string } | null>(null)

  useEffect(() => {
    fetch(`/api/termin/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d.data)
      })
      .catch(() => setError('Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit() {
    if (action === 'reschedule' && !newDate) return
    setSending(true)
    try {
      const res = await fetch(`/api/termin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, proposed_date: newDate || null }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setDone({ isRescheduled: d.isRescheduled, confirmedDate: d.confirmedDate })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Link nicht verfügbar</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-14 w-14 text-green-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {done.isRescheduled ? 'Neuer Termin vorgeschlagen' : 'Termin bestätigt!'}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {done.isRescheduled
                ? 'Ihre Antwort wurde übermittelt. Die Hausverwaltung und der Mieter wurden informiert.'
                : 'Vielen Dank! Der Mieter und die Hausverwaltung wurden über den bestätigten Termin informiert.'}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 w-full">
              <p className="text-xs text-muted-foreground mb-1">Termin</p>
              <p className="font-semibold text-green-800">{done.confirmedDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const report = data.damage_report
  const wunschtermin = report.preferred_appointment
    ? new Date(report.preferred_appointment).toLocaleDateString('de-AT', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">SchadensMelder</h1>
          <p className="text-muted-foreground text-sm mt-1">Reparaturauftrag — Terminbestätigung</p>
        </div>

        {/* Auftrag Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auftragsdetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Fall-Nr.</p>
                <p className="font-mono font-semibold">{report.case_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Schadensart</p>
                <p className="font-medium">{CATEGORY_LABELS[report.category] || report.category}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beschreibung</p>
              <p className="font-medium">{report.title}</p>
              {report.description && <p className="text-muted-foreground mt-1">{report.description}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Adresse</p>
              <p className="font-medium">{report.unit?.address} — {report.unit?.name}</p>
            </div>
            {wunschtermin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-600 font-medium">Wunschtermin des Mieters</p>
                <p className="font-semibold text-blue-900 mt-0.5">{wunschtermin}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ihre Antwort
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {action === null && (
              <div className="grid grid-cols-1 gap-3">
                <Button
                  className="bg-green-700 hover:bg-green-800 text-white h-12"
                  onClick={() => setAction('confirm')}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Wunschtermin bestätigen
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => setAction('reschedule')}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Anderen Termin vorschlagen
                </Button>
              </div>
            )}

            {action === 'confirm' && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                  <p className="text-green-700 font-medium">Bestätigung: {wunschtermin || 'Wunschtermin'}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-700 hover:bg-green-800" onClick={handleSubmit} disabled={sending}>
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Jetzt bestätigen
                  </Button>
                  <Button variant="outline" onClick={() => setAction(null)} disabled={sending}>Zurück</Button>
                </div>
              </div>
            )}

            {action === 'reschedule' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Ihr Terminvorschlag</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={sending || !newDate}
                  >
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                    Termin vorschlagen
                  </Button>
                  <Button variant="outline" onClick={() => setAction(null)} disabled={sending}>Zurück</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          SchadensMelder · zerodamage.de · Dieser Link ist 7 Tage gültig
        </p>
      </div>
    </div>
  )
}
