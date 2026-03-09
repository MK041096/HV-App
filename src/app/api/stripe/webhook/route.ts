import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

// Stripe requires raw body for signature verification
export const runtime = 'nodejs'

async function updateOrgSubscription(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const orgId = subscription.metadata?.organization_id
  if (!orgId) return

  const status = subscription.status // active, trialing, past_due, canceled, etc.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSub = subscription as any
  const periodEnd = rawSub.current_period_end
    ? new Date(rawSub.current_period_end * 1000).toISOString()
    : null
  const isFounder = subscription.metadata?.is_founder === 'true'

  await adminClient
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      current_period_end: periodEnd,
      is_founder: isFounder,
      is_active: status === 'active' || status === 'trialing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any
        const orgId = session.metadata?.organization_id
        if (orgId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await updateOrgSubscription(adminClient, subscription)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await updateOrgSubscription(adminClient, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.organization_id
        if (orgId) {
          await adminClient
            .from('organizations')
            .update({
              subscription_status: 'canceled',
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId)
        }
        break
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const orgId = subscription.metadata?.organization_id
          if (orgId) {
            await adminClient
              .from('organizations')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orgId)
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          await updateOrgSubscription(adminClient, subscription)
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error handling webhook ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
