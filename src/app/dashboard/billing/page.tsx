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

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [org, setOrg] = useState<OrgBilling | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const isFounder = true // First customers always get founder pricing

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
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Fehler beim Weiterleiten zu Stripe')
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePortal() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Fehler beim Öffnen des Portals')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const hasActiveSub = org?.subscription_status === 'active' || org?.subscription_status === 'trialing'
  const unitCount = Math.max(org?.einheiten_anzahl || 1, 1)
  const monthlyPrice = isFounder ? 0.5 : 1.0
  const yearlyPrice = isFounder ? 0.43 : 0.85
  const selectedPrice = plan === 'yearly' ? yearlyPrice : monthlyPrice
  const monthlyTotal = selectedPrice * unitCount
  const yearlyTotal = yearlyPrice * unitCount * 12
  const setupFee = isFounder ? 349 : 699

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
        <p className="text-muted-foreground text-sm mt-1">
          Verwalten Sie Ihr SchadensMelder-Abonnement
        </p>
      </div>

      {/* Success / Cancel alerts */}
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
          <AlertDescription className="text-yellow-800">
            Checkout abgebrochen. Sie wurden nicht belastet.
          </AlertDescription>
        </Alert>
      )}

      {/* Current subscription status */}
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
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Einheiten
            </span>
            <span className="text-sm font-medium">{unitCount}</span>
          </div>
          {org?.is_founder && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Gründungsrabatt
              </span>
              <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">
                Aktiv (Jahr 1)
              </Badge>
            </div>
          )}
          {org?.current_period_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Nächste Abbuchung
              </span>
              <span className="text-sm font-medium">
                {new Date(org.current_period_end).toLocaleDateString('de-AT')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout or Portal */}
      {!hasActiveSub ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Abonnement starten
            </CardTitle>
            <CardDescription>
              {isFounder && (
                <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
                  <Zap className="h-3 w-3" /> Gründungskundenpreis aktiv — 50% Rabatt im ersten Jahr
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan selection */}
            <RadioGroup value={plan} onValueChange={(v) => setPlan(v as 'monthly' | 'yearly')}>
              <div className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${plan === 'monthly' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setPlan('monthly')}>
                <RadioGroupItem value="monthly" id="monthly" className="mt-0.5" />
                <Label htmlFor="monthly" className="cursor-pointer flex-1">
                  <div className="font-semibold">Monatlich</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {monthlyPrice.toFixed(2).replace('.', ',')} € / Einheit / Monat
                    {' '}= <strong>{(monthlyPrice * unitCount).toFixed(2).replace('.', ',')} € / Monat</strong>
                  </div>
                </Label>
              </div>
              <div className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${plan === 'yearly' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setPlan('yearly')}>
                <RadioGroupItem value="yearly" id="yearly" className="mt-0.5" />
                <Label htmlFor="yearly" className="cursor-pointer flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Jährlich
                    <Badge variant="secondary" className="text-xs">15% günstiger</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {yearlyPrice.toFixed(2).replace('.', ',')} € / Einheit / Monat
                    {' '}= <strong>{yearlyTotal.toFixed(2).replace('.', ',')} € / Jahr</strong>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <Separator />

            {/* Price summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Einrichtungsgebühr (einmalig)</span>
                <span className="font-medium">{setupFee} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {unitCount} Einheit{unitCount !== 1 ? 'en' : ''} × {selectedPrice.toFixed(2).replace('.', ',')} €
                </span>
                <span className="font-medium">
                  {monthlyTotal.toFixed(2).replace('.', ',')} € / Monat
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground border-t pt-2 mt-2">
                <span>30-Tage Geld-zurück-Garantie — erste Abbuchung nach 30 Tagen</span>
              </div>
            </div>

            {/* Payment methods note */}
            <p className="text-xs text-muted-foreground">
              Akzeptierte Zahlungsmethoden: Kreditkarte, SEPA-Lastschrift, Apple Pay, Google Pay, PayPal — sicher über Stripe
            </p>

            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={actionLoading}>
              {actionLoading ? 'Weiterleitung...' : `Jetzt starten → Stripe Checkout`}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Abonnement verwalten
            </CardTitle>
            <CardDescription>
              Zahlungsmethode ändern, Rechnungen herunterladen oder kündigen
            </CardDescription>
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
