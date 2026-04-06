import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-server'
import Stripe from 'stripe'
import { Resend } from 'resend'

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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63)
}

async function handleNewCustomerCheckout(
  adminClient: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  meta: Record<string, string>
) {
  const { org_name, first_name, last_name, email, country, einheiten_anzahl, plan } = meta
  const customerId: string = session.customer as string
  const subscriptionId: string | null = session.subscription as string | null

  // Generate unique slug
  const baseSlug = slugify(org_name || 'hausverwaltung')
  let slug = baseSlug
  for (let i = 1; i <= 10; i++) {
    const { data: ex } = await adminClient.from('organizations').select('id').eq('slug', slug).limit(1)
    if (!ex || ex.length === 0) break
    slug = `${baseSlug}-${i}`
  }

  // Create organization (already paid — status active/trialing)
  const { data: org, error: orgErr } = await adminClient
    .from('organizations')
    .insert({
      name: org_name,
      slug,
      country: country || 'AT',
      status: 'active',
      is_active: true,
      einheiten_anzahl: parseInt(einheiten_anzahl || '0', 10),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'trialing',
      avv_accepted_at: new Date().toISOString(),
      is_deleted: false,
    })
    .select('id')
    .single()

  if (orgErr || !org) {
    console.error('Webhook: org creation failed', orgErr)
    return
  }

  // Update Stripe customer with org_id
  await stripe.customers.update(customerId, { metadata: { organization_id: org.id } })

  // Update subscription metadata with org_id
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await updateOrgSubscription(adminClient, subscription)
    await stripe.subscriptions.update(subscriptionId, {
      metadata: { organization_id: org.id, plan: plan || 'monthly', is_new_customer: 'done' },
    })
    // Also update the org with the full subscription info
    await adminClient.from('organizations').update({
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current_period_end: (subscription as any).current_period_end
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
    }).eq('id', org.id)
  }

  // Create auth user (no password yet — user will set it via the invite email)
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true, // pre-confirmed since they verified via Stripe
    user_metadata: { first_name, last_name },
  })

  if (authErr || !authData.user) {
    console.error('Webhook: user creation failed', authErr)
    return
  }

  const userId = authData.user.id

  // Create profile
  await adminClient.from('profiles').insert({
    id: userId,
    organization_id: org.id,
    first_name,
    last_name,
    role: 'hv_admin',
    is_deleted: false,
  })

  // Update Stripe customer with user_id
  await stripe.customers.update(customerId, {
    metadata: { organization_id: org.id, supabase_user_id: userId },
  })

  // Audit log
  await adminClient.from('audit_logs').insert({
    user_id: userId,
    organization_id: org.id,
    action: 'hv_registered_via_stripe',
    entity_type: 'organization',
    entity_id: org.id,
    details: { org_name, email, plan, einheiten_anzahl, stripe_session: session.id },
  })

  // Generate password-set link and send welcome email
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
    const { data: linkData } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${appUrl}/dashboard` },
    })
    const passwordLink = linkData?.properties?.action_link || `${appUrl}/login`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SMARTCARL <no-reply@smartcarl.com>',
      to: email,
      subject: 'Willkommen bei SMARTCARL – Passwort festlegen',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#1a1a2e;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#ffffff;margin:0;font-size:20px">SMARTCARL</h1>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 8px 8px">
    <h2 style="color:#111827;margin:0 0 16px">Willkommen, ${first_name}!</h2>
    <p style="color:#374151;margin:0 0 8px">Ihre Zahlung war erfolgreich. Das Konto für <strong>${org_name}</strong> wurde bereits angelegt.</p>
    <p style="color:#374151;margin:0 0 24px">Jetzt müssen Sie nur noch Ihr Passwort festlegen — dann können Sie sofort loslegen.</p>
    <a href="${passwordLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px">Passwort festlegen &amp; einloggen</a>
    <p style="color:#6b7280;margin:24px 0 0;font-size:14px">Falls der Button nicht funktioniert:<br><a href="${passwordLink}" style="color:#2563eb;word-break:break-all">${passwordLink}</a></p>
    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600">Ihr Abonnement</p>
      <p style="margin:6px 0 0;color:#166534;font-size:14px">${einheiten_anzahl} Einheiten · ${plan === 'yearly' ? 'Jahresabo' : 'Monatsabo'} · 14 Tage gratis testen</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">SMARTCARL – Digitales Schadensmeldungs-Management<br>Bei Fragen: <a href="mailto:Kracherdigital@gmail.com" style="color:#6b7280">Kracherdigital@gmail.com</a></p>
  </div>
</div>`,
    })

    // Notify owner
    await resend.emails.send({
      from: 'SMARTCARL <no-reply@smartcarl.com>',
      to: 'Kracherdigital@gmail.com',
      subject: `Neuer zahlender Kunde: ${org_name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
  <h2 style="color:#166534">Neuer zahlender Kunde!</h2>
  <p><strong>Firma:</strong> ${org_name}</p>
  <p><strong>Name:</strong> ${first_name} ${last_name}</p>
  <p><strong>E-Mail:</strong> ${email}</p>
  <p><strong>Plan:</strong> ${plan === 'yearly' ? 'Jahresabo' : 'Monatsabo'}</p>
  <p><strong>Einheiten:</strong> ${einheiten_anzahl}</p>
  <p><strong>Land:</strong> ${country}</p>
</div>`,
    })
  } catch (emailErr) {
    console.error('Webhook: welcome email failed', emailErr)
    // Don't throw — org + user are already created
  }
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
        const meta = session.metadata || {}

        // ── New customer via public checkout (Landing Page) ──
        if (meta.is_new_customer === 'true') {
          await handleNewCustomerCheckout(adminClient, session, meta)
          break
        }

        // ── Existing customer (logged-in checkout from billing page) ──
        const orgId = session.metadata?.organization_id
        if (orgId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await updateOrgSubscription(adminClient, subscription)
        }

        // April-Promo: nach 3 Käufen automatisch deaktivieren
        const PROMO_PRICE_ID = process.env.STRIPE_PRICE_SETUP_FEE
        const MAX_PROMO_USES = 3
        if (PROMO_PRICE_ID && session.payment_status === 'paid') {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 })
          const usedPromo = lineItems.data.some((item: Stripe.LineItem) => item.price?.id === PROMO_PRICE_ID)
          if (usedPromo) {
            // Anzahl abgeschlossener Käufe mit diesem Preis zählen
            const { count } = await adminClient
              .from('organizations')
              .select('id', { count: 'exact', head: true })
              .eq('is_founder', true)
              .in('subscription_status', ['active', 'trialing'])
            if ((count ?? 0) >= MAX_PROMO_USES) {
              await stripe.prices.update(PROMO_PRICE_ID, { active: false })
              console.log(`Promo-Preis ${PROMO_PRICE_ID} nach ${MAX_PROMO_USES} Käufen deaktiviert.`)
            }
          }
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
