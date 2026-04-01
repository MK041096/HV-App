'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, XCircle, Loader2, Phone } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  wasser: 'Wasserschaden', heizung: 'Heizung', elektrik: 'Elektrik',
  fenster_tueren: 'Fenster & Türen', schimmel: 'Schimmel', sanitaer: 'Sanitär',
  boeden: 'Böden & Wände', aussenbereich: 'Außenbereich', sonstiges: 'Sonstiges',
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
    preferred_appointment_2: string | null
    unit: { name: string; address: string } | null
  }
  contractor: { name: string; company: string } | null
  tenantContact: { name: string; phone: string | null } | null
}

type ActionType = 'confirm_1' | 'confirm_2' | 'confirm_phone' | null

export default function TerminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const searchParams = useSearchParams()
  const [data, setData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<ActionType>(null)
  const [sending, setSending] = useState(false)
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null)
  const [phoneReady, setPhoneReady] = useState(false)

  useEffect(() => {
    fetch(`/api/termin/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else {
          setData(d.data)
          // Pre-select action from URL param (?w=1, ?w=2, ?w=phone)
          const w = searchParams.get('w')
          if (w === '1') setAction('confirm_1')
          else if (w === '2') setAction('confirm_2')
          else if (w === 'phone') handlePhone()
        }
      })
      .catch(() => setError('Fehler beim Laden'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleConfirm(selectedAction: 'confirm_1' | 'confirm_2') {
    setSending(true)
    try {
      const res = await fetch(`/api/termin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: selectedAction }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setConfirmedDate(d.confirmedDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSending(false)
    }
  }

  async function handlePhone() {
    setAction('confirm_phone')
    setPhoneReady(false)
    try {
      const res = await fetch(`/api/termin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_phone' }),
      })
      if (res.ok) setPhoneReady(true)
    } catch {
      setPhoneReady(true) // show contact info even if status update fails
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('de-AT', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
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

  if (confirmedDate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-14 w-14 text-green-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">Termin bestätigt!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Der Mieter wurde automatisch per E-Mail informiert.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 w-full">
              <p className="text-xs text-muted-foreground mb-1">Bestätigter Termin</p>
              <p className="font-semibold text-green-800">{confirmedDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const report = data.damage_report
  const wunschtermin1 = formatDate(report.preferred_appointment)
  const wunschtermin2 = formatDate(report.preferred_appointment_2)

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

            {/* Keine Auswahl getroffen → 3 Buttons zeigen */}
            {action === null && (
              <div className="space-y-3">
                {wunschtermin1 && (
                  <Button
                    className="w-full bg-green-700 hover:bg-green-800 text-white h-auto py-3 px-4 text-left flex-col items-start"
                    onClick={() => setAction('confirm_1')}
                  >
                    <span className="text-xs font-normal opacity-80">Wunschtermin 1 bestätigen</span>
                    <span className="font-bold">{wunschtermin1}</span>
                  </Button>
                )}
                {wunschtermin2 && (
                  <Button
                    className="w-full bg-green-700 hover:bg-green-800 text-white h-auto py-3 px-4 text-left flex-col items-start"
                    onClick={() => setAction('confirm_2')}
                  >
                    <span className="text-xs font-normal opacity-80">Wunschtermin 2 bestätigen</span>
                    <span className="font-bold">{wunschtermin2}</span>
                  </Button>
                )}
                {!wunschtermin1 && !wunschtermin2 && (
                  <p className="text-sm text-muted-foreground">Kein Wunschtermin angegeben.</p>
                )}
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={handlePhone}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Termin persönlich mit Mieter vereinbaren
                </Button>
              </div>
            )}

            {/* Wunschtermin 1 oder 2 bestätigen */}
            {(action === 'confirm_1' || action === 'confirm_2') && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-3 text-sm">
                  <p className="text-xs text-green-700 font-medium mb-1">
                    {action === 'confirm_1' ? 'Wunschtermin 1' : 'Wunschtermin 2'} bestätigen:
                  </p>
                  <p className="text-green-900 font-bold">
                    {action === 'confirm_1' ? wunschtermin1 : wunschtermin2}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-700 hover:bg-green-800"
                    onClick={() => handleConfirm(action)}
                    disabled={sending}
                  >
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Jetzt bestätigen
                  </Button>
                  <Button variant="outline" onClick={() => setAction(null)} disabled={sending}>
                    Zurück
                  </Button>
                </div>
              </div>
            )}

            {/* Persönliche Kontaktaufnahme */}
            {action === 'confirm_phone' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4">
                  <p className="text-sm font-semibold text-amber-900 mb-3">
                    Bitte vereinbaren Sie einen Termin direkt mit dem Mieter:
                  </p>
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-muted-foreground">Mieter</p>
                    <p className="font-semibold text-amber-900">{data.tenantContact?.name || 'Mieter'}</p>
                  </div>
                  {data.tenantContact?.phone ? (
                    <a
                      href={'tel:' + data.tenantContact.phone}
                      className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-3 font-semibold text-sm w-full"
                    >
                      <Phone className="h-4 w-4" />
                      {data.tenantContact.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Telefonnummer hinterlegt — bitte über die Hausverwaltung Kontakt aufnehmen.
                    </p>
                  )}
                </div>
                {phoneReady && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-600 shrink-0" />
                    <p className="text-sm text-teal-800 font-medium">
                      Status aktualisiert — Mieter und HV wurden im Dashboard informiert.
                    </p>
                  </div>
                )}
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
