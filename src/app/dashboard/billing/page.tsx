'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
} from 'lucide-react'

interface OrgBilling {
  name: string
  einheiten_anzahl: number
  subscription_status: string
  subscription_plan: string
  is_founder: boolean
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
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

// Volume pricing tiers — Gründerpreis / Normalpreis per unit/month
const VOLUME_TIERS = [
  { label: '1 – 499 Einheiten',     founder: 0.50, regular: 1.00, discount: null },
  { label: '500 – 1.499 Einheiten', founder: 0.42, regular: 0.85, discount: '16%' },
  { label: '1.500+ Einheiten',      founder: null,  regular: null,  discount: 'individuell' },
]

function getVolumeTier(units: number) {
  if (units >= 1500) return VOLUME_TIERS[2]
  if (units >= 500)  return VOLUME_TIERS[1]
  return VOLUME_TIERS[0]
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',')
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [org, setOrg] = useState<OrgBilling | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const isFounder = org?.is_founder ?? false

  const successParam = searchParams.get('success')
  const canceledParam = searchParams.get('canceled')

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
        .select('name, einheiten_anzahl, subscription_status, subscription_plan, is_founder, current_period_end, stripe_customer_id, stripe_subscription_id')
        .eq('id', profile.organization_id)
        .single()
      setOrg(data)
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
        body: JSON.stringify({ plan, isFounder }),
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
  const unitCount = Math.max(org?.einheiten_anzahl || 1, 1)
  const isEnterprise = unitCount >= 1500
  const tier = getVolumeTier(unitCount)

  const founderMonthly = tier.founder ?? 0
  const founderYearly  = founderMonthly * 0.85
  const regularMonthly = tier.regular ?? 0
  const regularYearly  = regularMonthly * 0.85

  const selectedFounderPrice = plan === 'yearly' ? founderYearly : founderMonthly
  const monthlyTotal = selectedFounderPrice * unitCount
  const yearlyTotal  = founderYearly * unitCount * 12
  const setupFee = 349
  const setupFeeRegular = 699

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
        <p className="text-muted-foreground text-sm mt-1">Verwalten Sie Ihr SchadensMelder-Abonnement</p>
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
            <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Einheiten</span>
            <span className="text-sm font-medium">{unitCount}</span>
          </div>
          {org?.is_founder && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Gründungsrabatt</span>
              <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">Aktiv (Jahr 1)</Badge>
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
          {isFounder && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 flex items-center gap-3">
              <Zap className="h-5 w-5 text-purple-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-800">Gründungskundenpreis aktiv</p>
                <p className="text-xs text-purple-700">Sie sparen 50% im ersten Jahr — danach gelten die Normalpreise.</p>
              </div>
            </div>
          )}

          {/* Volume tiers table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preisstaffeln nach Einheitenanzahl</CardTitle>
              <CardDescription>Je mehr Einheiten, desto günstiger der Stückpreis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {VOLUME_TIERS.map((t, i) => {
                  const isActive = t.label === tier.label
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}
                    >
                      <span className="font-medium">{t.label}</span>
                      {t.founder !== null ? (
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <span className="font-bold">{fmt(t.founder)} €</span>
                          <span className={`line-through text-xs ${isActive ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {fmt(t.regular!)} €
                          </span>
                          {t.discount && (
                            <Badge variant="secondary" className="text-xs">{t.discount} Rabatt</Badge>
                          )}
                        </div>
                      ) : (
                        <span className={`font-semibold ${isActive ? '' : 'text-primary'}`}>Individuelles Angebot</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Preise in € / Einheit / Monat (zzgl. MwSt.) · Gründerpreis / <span className="line-through">Normalpreis</span>
              </p>
            </CardContent>
          </Card>

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
                  <a href="mailto:kracherdigital@gmail.com?subject=Individuelles%20Angebot%20SchadensMelder">
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
                <RadioGroup value={plan} onValueChange={(v) => setPlan(v as 'monthly' | 'yearly')}>
                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${plan === 'monthly' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setPlan('monthly')}
                  >
                    <RadioGroupItem value="monthly" id="monthly" className="mt-0.5" />
                    <Label htmlFor="monthly" className="cursor-pointer flex-1">
                      <div className="font-semibold">Monatlich</div>
                      <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{fmt(founderMonthly)} € / Einheit / Monat</span>
                        <span className="line-through text-xs">{fmt(regularMonthly)} €</span>
                        <span>= <strong>{fmt(founderMonthly * unitCount)} € / Monat</strong></span>
                      </div>
                    </Label>
                  </div>
                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${plan === 'yearly' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setPlan('yearly')}
                  >
                    <RadioGroupItem value="yearly" id="yearly" className="mt-0.5" />
                    <Label htmlFor="yearly" className="cursor-pointer flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        Jährlich <Badge variant="secondary" className="text-xs">15% günstiger</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{fmt(founderYearly)} € / Einheit / Monat</span>
                        <span className="line-through text-xs">{fmt(regularYearly)} €</span>
                        <span>= <strong>{fmt(yearlyTotal)} € / Jahr</strong></span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Onboarding & Einrichtung (einmalig)</span>
                    <div className="text-right">
                      <span className="font-semibold">{setupFee} €</span>
                      <span className="line-through text-xs text-muted-foreground ml-2">{setupFeeRegular} €</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {unitCount} Einheit{unitCount !== 1 ? 'en' : ''} × {fmt(selectedFounderPrice)} €
                    </span>
                    <span className="font-semibold">{fmt(monthlyTotal)} € / Monat</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Alle Preise zzgl. MwSt.</span>
                    <span>Erste Abbuchung nach 30 Tagen</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Akzeptiert: Kreditkarte · SEPA-Lastschrift · Apple Pay · Google Pay · PayPal
                </p>

                <Button className="w-full" size="lg" onClick={handleCheckout} disabled={actionLoading}>
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
            <Button variant="outline" className="w-full" onClick={handlePortal} disabled={actionLoading}>
              {actionLoading ? 'Weiterleitung...' : 'Stripe Kundenportal öffnen'}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Im Portal können Sie Zahlungsmethode, Rechnungen und Kündigung verwalten.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
