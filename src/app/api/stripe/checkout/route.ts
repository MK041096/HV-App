import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { stripe, STRIPE_PRICES, APP_URL } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  isFounder: z.boolean().optional().default(false),
  unitCount: z.number().int().min(1).max(9999).optional(),
})

// POST /api/stripe/checkout — Create a Stripe Checkout Session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get profile + organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, email')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || profile.role !== 'hv_admin') {
      return NextResponse.json({ error: 'Nur HV-Admins können ein Abonnement abschließen' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }

    const { plan, isFounder, unitCount: requestedUnitCount } = parsed.data

    // Get organization details
    const adminClient = createAdminClient()
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, name, stripe_customer_id, einheiten_anzahl, subscription_status')
      .eq('id', profile.organization_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })
    }

    if (org.subscription_status === 'active') {
      return NextResponse.json({ error: 'Bereits aktives Abonnement vorhanden' }, { status: 400 })
    }

    // Create or reuse Stripe customer
    let customerId = org.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile.email,
        name: org.name,
        metadata: {
          organization_id: org.id,
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      await adminClient
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id)
    }

    // Choose price based on plan and founder status
    const unitCount = requestedUnitCount ?? Math.max(org.einheiten_anzahl || 1, 1)
    if (requestedUnitCount && requestedUnitCount !== org.einheiten_anzahl) {
      await adminClient.from('organizations').update({ einheiten_anzahl: requestedUnitCount }).eq('id', org.id)
    }
    let priceId: string
    if (plan === 'yearly') {
      priceId = isFounder ? STRIPE_PRICES.founderYearly : STRIPE_PRICES.yearly
    } else {
      priceId = isFounder ? STRIPE_PRICES.founderMonthly : STRIPE_PRICES.monthly
    }

    // Build line items: setup fee + subscription
    const lineItems: { price: string; quantity: number }[] = []

    // One-time setup fee
    if (STRIPE_PRICES.setupFee) {
      lineItems.push({
        price: STRIPE_PRICES.setupFee,
        quantity: 1,
      })
    }

    // Recurring subscription (quantity = number of units)
    lineItems.push({
      price: priceId,
      quantity: unitCount,
    })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${APP_URL}/dashboard/billing?canceled=1`,
      metadata: {
        organization_id: org.id,
        plan,
        is_founder: String(isFounder),
      },
      subscription_data: {
        metadata: {
          organization_id: org.id,
          plan,
          is_founder: String(isFounder),
        },
        // 30-day payment delay for money-back guarantee
        trial_period_days: 30,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      locale: 'de',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Checkout-Session' }, { status: 500 })
  }
}
