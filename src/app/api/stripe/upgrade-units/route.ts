import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const schema = z.object({
  new_unit_count: z.number().int().min(1).max(99999),
  preview: z.boolean().optional(),
})

// POST /api/stripe/upgrade-units
// Upgrades the subscription quantity with Stripe proration.
// Stripe immediately invoices the prorated difference.
// The webhook (customer.subscription.updated) then updates einheiten_anzahl.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || profile.role !== 'hv_admin') {
      return NextResponse.json({ error: 'Nur HV-Admins können das Abonnement anpassen' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }
    const { new_unit_count, preview } = parsed.data

    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('stripe_subscription_id, einheiten_anzahl, subscription_status')
      .eq('id', profile.organization_id)
      .single()

    if (!org?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Kein aktives Abonnement gefunden' }, { status: 400 })
    }

    if (!['active', 'trialing'].includes(org.subscription_status || '')) {
      return NextResponse.json({ error: 'Abonnement ist nicht aktiv' }, { status: 400 })
    }

    if (new_unit_count <= (org.einheiten_anzahl || 0)) {
      return NextResponse.json({
        error: `Neue Anzahl muss größer als die aktuelle Anzahl (${org.einheiten_anzahl}) sein`
      }, { status: 400 })
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id, {
      expand: ['items'],
    })

    // Find the unit price item (not the setup fee — that's a one-time item)
    const unitItem = subscription.items.data.find(item =>
      item.price.recurring !== null
    )

    if (!unitItem) {
      return NextResponse.json({ error: 'Kein Einheiten-Preisposten gefunden' }, { status: 400 })
    }

    // Preview proration before charging
    const previewInvoice = await stripe.invoices.createPreview({
      customer: subscription.customer as string,
      subscription: org.stripe_subscription_id,
      subscription_details: {
        items: [{ id: unitItem.id, quantity: new_unit_count }],
        proration_behavior: 'create_prorations',
      },
    })

    const prorationAmount = previewInvoice.amount_due / 100 // cents → euros

    // Preview-only mode: just return the cost estimate, don't charge
    if (preview) {
      return NextResponse.json({
        success: true,
        preview_only: true,
        new_unit_count,
        proration_amount: prorationAmount,
      })
    }

    // Update subscription quantity — Stripe creates a prorated invoice automatically
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: unitItem.id, quantity: new_unit_count }],
      proration_behavior: 'create_prorations',
    })

    // Immediately update einheiten_anzahl in DB (webhook will confirm)
    await admin.from('organizations')
      .update({ einheiten_anzahl: new_unit_count, updated_at: new Date().toISOString() })
      .eq('id', profile.organization_id)

    return NextResponse.json({
      success: true,
      new_unit_count,
      proration_amount: prorationAmount,
    })
  } catch (err) {
    console.error('Upgrade units error:', err)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Abonnements' }, { status: 500 })
  }
}
