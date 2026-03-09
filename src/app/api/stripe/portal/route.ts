import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { stripe, APP_URL } from '@/lib/stripe'

// POST /api/stripe/portal — Create Stripe Customer Portal Session
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || profile.role !== 'hv_admin') {
      return NextResponse.json({ error: 'Nur HV-Admins können das Billing-Portal öffnen' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { data: org } = await adminClient
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', profile.organization_id)
      .single()

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: 'Kein Stripe-Konto verknüpft' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: 'Fehler beim Öffnen des Billing-Portals' }, { status: 500 })
  }
}
