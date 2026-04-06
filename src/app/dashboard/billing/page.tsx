'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase'
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Building2,
  CreditCard,
  Calendar,
  Users,
  Mail,
  Check,
  Tag,
} from 'lucide-react'

interface OrgBilling {
  name: string
  einheiten_anzahl: number
  subscription_status: string
  subscription_plan: string
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_unit_count?: number
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktiv',
  trialing: 'Probezeitraum (30 Tage)',
  past_due: 'Zahlung ausstehend',
  canceled: 'Gekündigt',
  inactive: 'Kein Abonnement',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-700',
  inactive: 'bg-gray-100 text-gray-700',
}

// Preise pro Einheit
const PRICE_MONTHLY = 1.00      // 1,00 €/Einheit/Monat (regulär)
const PRICE_YEARLY  = 0.85      // 0,85 €/Einheit/Monat = 10,20 €/Jahr (regulär)
const PROMO_MONTHLY = 0.50      // April-Aktion: 50% off → 0,50 € (1. Monat)
const PROMO_YEARLY  = 0.425     // April-Aktion: 50% off → 0,43 € × 12 (1. Jahr)
const SETUP_FEE_PROMO   = 349   // April-Aktionspreis (einmalig)
const SETUP_FEE_REGULAR = 699   // Regulär (einmalig)

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',')
}

// April-Aktion läuft bis 30. April 2026
function isAprilPromoActive() {
  const now = new Date()
  return now >= new Date('2026-04-01') && now <= new Date('2026-04-30T23:59:59Z')
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [org, setOrg] = useState<OrgBilling | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [unitCount, setUnitCount] = useState<number>(1)

  const successParam = searchParams.get('success')
  const canceledParam = searchParams.get('canceled')
  const isPromo = isAprilPromoActive()

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      if (!profile?.organization_id) return
      const { data } = await supabase
        .from('organizations')
        .select('name, einheiten_anzahl, subscription_status, subscription_plan, current_period_end, stripe_customer_id, stripe_subscription_id')
        .eq('id', profile.organization_id)
        .single()
      if (data) {
        // Also fetch current real unit count
        const { count: realCount } = await supabase
          .from('units')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .eq('is_deleted', false)
        setOrg({ ...data, current_unit_count: realCount ?? 0 })
        setUnitCount(Math.max(data.einheiten_anzahl || 1, 1))
      }
      setLoading(false)
    }
    loadOrg()
  }, [successParam])

  async function handleCheckout() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, unitCount: Math.max(unitCount, 1) }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Fehler beim Weiterleiten zu Stripe')
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePortal() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Fehler beim Öffnen des Portals')
    } finally {
      setActionLoading(false)
    }
  }

  const hasActiveSub = org?.subscription_status === 'active' || org?.subscription_status === 'trialing'
  const isEnterprise = unitCount >= 1500
  const safeUnitCount = Math.max(unitCount || 1, 1)

  // Aktuelle Preise je nach Aktion + Plan
  const pricePerUnitMonthly = isPromo ? PROMO_MONTHLY : PRICE_MONTHLY
  const pricePerUnitYearly  = isPromo ? PROMO_YEARLY  : PRICE_YEARLY
  const setupFee = isPromo ? SETUP_FEE_PROMO : SETUP_FEE_REGULAR

  const monthlyTotal = pricePerUnitMonthly * safeUnitCount
  const yearlyTotal  = pricePerUnitYearly * safeUnitCount * 12

  const selectedMonthlyDisplay = plan === 'yearly' ? pricePerUnitYearly : pricePerUnitMonthly
  const selectedTotal          = plan === 'yearly' ? yearlyTotal : monthlyTotal

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnement & Abrechnung</h1>
        <p className="text-muted-foreground text-sm mt-1">Verwalten Sie Ihr SMARTCARL-Abonnement</p>
      </div>

      {successParam && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Abonnement erfolgreich gestartet! Ihr 30-tägiger kostenloser Testzeitraum läuft — die erste Abbuchung erfolgt erst nach 30 Tagen.
          </AlertDescription>
        </Alert>
      )}
      {canceledParam && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">Checkout abgebrochen. Sie wurden nicht belastet.</AlertDescription>
        </Alert>
      )}

      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {org?.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[org?.subscription_status || 'inactive']}`}>
              {STATUS_LABEL[org?.subscription_status || 'inactive']}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Einheiten belegt</span>
            <span className="text-sm font-medium">
              {org?.current_unit_count ?? 0}
              {(org?.einheiten_anzahl ?? 0) > 0 && ` / ${org?.einheiten_anzahl}`}
            </span>
          </div>
          {(org?.einheiten_anzahl ?? 0) > 0 && (
            <div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    (org!.current_unit_count ?? 0) >= org!.einheiten_anzahl
                      ? 'bg-red-500'
                      : (org!.current_unit_count ?? 0) / org!.einheiten_anzahl > 0.8
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(((org!.current_unit_count ?? 0) / org!.einheiten_anzahl) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          {org?.current_period_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Nächste Abbuchung</span>
              <span className="text-sm font-medium">{new Date(org.current_period_end).toLocaleDateString('de-AT')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {!hasActiveSub ? (
        <>
          {/* April-Aktion Banner */}
          {isPromo && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-3">
              <Tag className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">April-Aktion — 50% Rabatt</p>
                <p className="text-xs text-orange-700">
                  Nur bis 30. April 2026: Monatlich 50% günstiger im ersten Monat · Jährlich 50% günstiger im ersten Jahr · Einrichtung nur 349 € statt 699 €
                </p>
              </div>
            </div>
          )}

          {isEnterprise ? (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Individuelles Angebot anfragen
                </CardTitle>
                <CardDescription>
                  Ab 1.500 Einheiten erstellen wir ein maßgeschneidertes Angebot mit besonders günstigen Konditionen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  {['Persönliches Onboarding', 'Dedizierter Ansprechpartner', 'Sonderkonditionen ab 1.500 Einheiten', 'Individuelle Vertragsgestaltung'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0" /> {item}
                    </div>
                  ))}
                </div>
                <Button className="w-full" size="lg" asChild>
                  <a href="mailto:kracherdigital@gmail.com?subject=Individuelles%20Angebot%20SMARTCARL">
                    Angebot anfragen <Mail className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Abonnement starten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Einheiten-Eingabe */}
                <div className="space-y-2">
                  <Label htmlFor="unitCount" className="text-sm font-medium">Anzahl verwalteter Wohneinheiten</Label>
                  <Input
                    id="unitCount"
                    type="number"
                    min={1}
                    max={1499}
                    value={unitCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setUnitCount(Math.max(1, Math.min(1499, val)))
                    }}
                    className="w-40"
                  />
                  <p className="text-xs text-muted-foreground">Dieses Limit können Sie jederzeit per E-Mail anpassen lassen.</p>
                </div>

                {/* Plan-Auswahl */}
                <RadioGroup value={plan} onValueChange={(v) => setPlan(v as 'monthly' | 'yearly')}>
                  {/* Monatlich */}
                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${plan === 'monthly' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setPlan('monthly')}
                  >
                    <RadioGroupItem value="monthly" id="monthly" className="mt-0.5" />
                    <Label htmlFor="monthly" className="cursor-pointer flex-1 space-y-1">
                      <div className="font-semibold">Monatlich</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        {isPromo ? (
                          <>
                            <span className="font-bold text-foreground">{fmt(PROMO_MONTHLY)} € / Einheit</span>
                            <span className="line-through text-xs">{fmt(PRICE_MONTHLY)} €</span>
                            <Badge variant="secondary" className="text-xs text-orange-700 border-orange-200 bg-orange-50">1. Monat</Badge>
                          </>
                        ) : (
                          <span className="font-bold text-foreground">{fmt(PRICE_MONTHLY)} € / Einheit / Monat</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        = {fmt(monthlyTotal)} € / Monat
                        {isPromo && <span className="text-xs font-normal text-muted-foreground ml-1">(danach {fmt(PRICE_MONTHLY * safeUnitCount)} €)</span>}
                      </div>
                    </Label>
                  </div>

                  {/* Jährlich */}
                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${plan === 'yearly' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setPlan('yearly')}
                  >
                    <RadioGroupItem value="yearly" id="yearly" className="mt-0.5" />
                    <Label htmlFor="yearly" className="cursor-pointer flex-1 space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        Jährlich
                        <Badge variant="secondary" className="text-xs">15% günstiger</Badge>
                        {isPromo && <Badge className="text-xs bg-orange-500 hover:bg-orange-500">50% Rabatt</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                        {isPromo ? (
                          <>
                            <span className="font-bold text-foreground">{fmt(PROMO_YEARLY)} € / Einheit / Monat</span>
                            <span className="line-through text-xs">{fmt(PRICE_YEARLY)} €</span>
                            <Badge variant="secondary" className="text-xs text-orange-700 border-orange-200 bg-orange-50">1. Jahr</Badge>
                          </>
                        ) : (
                          <span className="font-bold text-foreground">{fmt(PRICE_YEARLY)} € / Einheit / Monat</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        = {fmt(yearlyTotal)} € / Jahr
                        {isPromo && <span className="text-xs font-normal text-muted-foreground ml-1">(danach {fmt(PRICE_YEARLY * safeUnitCount * 12)} €)</span>}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Separator />

                {/* Kostenübersicht */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Onboarding & Einrichtung (einmalig)
                    </span>
                    <div className="text-right">
                      <span className="font-semibold">{setupFee} €</span>
                      {isPromo && (
                        <span className="line-through text-xs text-muted-foreground ml-2">{SETUP_FEE_REGULAR} €</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {safeUnitCount} Einheit{safeUnitCount !== 1 ? 'en' : ''} × {fmt(selectedMonthlyDisplay)} €
                      {plan === 'yearly' ? ' × 12 Monate' : ' / Monat'}
                    </span>
                    <span className="font-semibold">
                      {plan === 'yearly' ? `${fmt(yearlyTotal)} € / Jahr` : `${fmt(monthlyTotal)} € / Monat`}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Alle Preise zzgl. MwSt.</span>
                    <span>Erste Abbuchung nach 30 Tagen</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Im Abonnement enthalten</p>
                  {[
                    'Unbegrenzte Schadensmeldungen',
                    'CARL KI-Analyse pro Schadensfall',
                    'Automatischer Werkstätten-Vorschlag',
                    'Mietvertrag & Versicherungsverwaltung',
                    'E-Mail-Benachrichtigungen für Mieter',
                    'Mieter-Portal mit Foto-Upload',
                    'Excel / CSV Import für Einheiten & Werkstätten',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Akzeptiert: Kreditkarte · SEPA-Lastschrift · Apple Pay · Google Pay
                </p>

                <Button className="w-full" size="lg" onClick={handleCheckout} disabled={actionLoading || isEnterprise}>
                  {actionLoading ? 'Weiterleitung...' : '30 Tage kostenlos testen → Jetzt starten'}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  30-Tage Geld-zurück-Garantie · Jederzeit kündbar · Keine versteckten Kosten
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Abonnement verwalten
            </CardTitle>
            <CardDescription>Zahlungsmethode ändern, Rechnungen herunterladen oder kündigen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{org?.subscription_plan === 'yearly' ? 'Jährlich' : 'Monatlich'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Einheiten</span>
                <span className="font-medium">{org?.einheiten_anzahl}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handlePortal} disabled={actionLoading}>
              {actionLoading ? 'Weiterleitung...' : 'Zahlung & Rechnungen verwalten'}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="ghost" className="w-full mt-2" asChild>
              <a href={`mailto:kracherdigital@gmail.com?subject=Einheitenlimit%20erhöhen%20SMARTCARL&body=Hallo%2C%0A%0Aich%20möchte%20mein%20Einheitenlimit%20erhöhen.%0A%0AOrganisation%3A%20${encodeURIComponent(org?.name || '')}%0ANeue%20Anzahl%20Einheiten%3A%20%0A%0AMit%20freundlichen%20Grüßen`}>
                <Mail className="h-4 w-4 mr-2" />
                Mehr Einheiten anfragen
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Zahlungsmethode, Rechnungen und Kündigung über das Abrechnungsportal verwalten.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
