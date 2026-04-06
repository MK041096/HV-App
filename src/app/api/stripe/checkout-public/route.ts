import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe, STRIPE_PRICES, APP_URL } from '@/lib/stripe'

const schema = z.object({
  org_name:          z.string().min(2).max(200),
  first_name:        z.string().min(1).max(100),
  last_name:         z.string().min(1).max(100),
  email:             z.string().email().max(255),
  einheiten_anzahl:  z.number().int().min(1).max(9999),
  plan:              z.enum(['monthly', 'yearly']),
  country:           z.enum(['AT', 'DE', 'CH']).default('AT'),
  privacy_accepted:  z.literal(true),
  avv_accepted:      z.literal(true),
})

// POST /api/stripe/checkout-public
// Public — no auth required. Used by the Landing Page checkout modal.
// Creates a Stripe Checkout session with all org data in metadata.
// The webhook creates the org + user after successful payment.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 })
    }

    const { org_name, first_name, last_name, email, einheiten_anzahl, plan, country } = parsed.data

    const priceId = plan === 'yearly' ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly

    // April-Aktion: 50 % Rabatt automatisch bis 30. April 2026
    const now = new Date()
    const isAprilPromo = now >= new Date('2026-04-01') && now <= new Date('2026-04-30T23:59:59Z')
    const aprilCoupon = isAprilPromo
      ? (plan === 'yearly' ? 'APRIL2026_YEARLY' : 'APRIL2026_MONTHLY')
      : null

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: `${first_name} ${last_name}`,
      metadata: {
        org_name,
        country,
        is_new_customer: 'true',
      },
    })

    // Build line items
    const lineItems: { price: string; quantity: number }[] = []
    if (STRIPE_PRICES.setupFee) {
      lineItems.push({ price: STRIPE_PRICES.setupFee, quantity: 1 })
    }
    lineItems.push({ price: priceId, quantity: einheiten_anzahl })

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${APP_URL}/registrierung/bestaetigung`,
      cancel_url:  `${APP_URL}/#preise`,
      // All org data in metadata — webhook reads this to create the org + user
      metadata: {
        is_new_customer:  'true',
        org_name,
        first_name,
        last_name,
        email,
        country,
        einheiten_anzahl: String(einheiten_anzahl),
        plan,
      },
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          is_new_customer:  'true',
          org_name,
          first_name,
          last_name,
          email,
          country,
          einheiten_anzahl: String(einheiten_anzahl),
          plan,
        },
        ...(aprilCoupon ? { coupon: aprilCoupon } : {}),
      },
      allow_promotion_codes:      true,
      billing_address_collection: 'required',
      tax_id_collection:          { enabled: true },
      locale:                     'de',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Public checkout error:', err)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Checkout-Session' }, { status: 500 })
  }
}
