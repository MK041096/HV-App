import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const registerHvSchema = z.object({
  org_name: z
    .string()
    .min(2, 'Firmenname muss mindestens 2 Zeichen lang sein')
    .max(200, 'Firmenname darf maximal 200 Zeichen lang sein'),
  first_name: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname darf maximal 100 Zeichen lang sein'),
  last_name: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname darf maximal 100 Zeichen lang sein'),
  email: z
    .string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .max(128, 'Passwort darf maximal 128 Zeichen lang sein'),
  privacy_accepted: z.literal(true, {
    error: 'Datenschutzerklärung muss akzeptiert werden',
  }),
  avv_accepted: z.literal(true, {
    error: 'AVV muss akzeptiert werden',
  }),
  country: z.enum(['AT', 'DE', 'CH']).default('AT'),
})

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

// POST /api/auth/register-hv - Public: create a new Hausverwaltung + admin account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerHvSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { org_name, first_name, last_name, email, password, country } = parsed.data

    // Capture client IP for AVV audit trail (Art. 28 DSGVO)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const admin = createAdminClient()

    // Check if email is already registered
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const emailTaken = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )
    if (emailTaken) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
        { status: 409 }
      )
    }

    // Generate unique slug
    const baseSlug = slugify(org_name)
    let slug = baseSlug
    let attempt = 0

    while (attempt < 10) {
      const { data: existing } = await admin
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .limit(1)

      if (!existing || existing.length === 0) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    // Create organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: org_name,
        slug,
        country,
        is_deleted: false,
        avv_accepted_at: new Date().toISOString(),
        avv_accepted_ip: clientIp,
      })
      .select('id, name, slug')
      .single()

    if (orgError || !org) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Organisation.' },
        { status: 500 }
      )
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // require email confirmation
        user_metadata: {
          first_name,
          last_name,
        },
      })

    if (authError || !authData.user) {
      // Rollback: delete organization
      await admin.from('organizations').delete().eq('id', org.id)
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Fehler beim Erstellen des Kontos.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      organization_id: org.id,
      first_name,
      last_name,
      role: 'hv_admin',
      is_deleted: false,
    })

    if (profileError) {
      // Rollback: delete auth user + organization
      await admin.auth.admin.deleteUser(userId)
      await admin.from('organizations').delete().eq('id', org.id)
      console.error('Error creating profile:', profileError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Profils.' },
        { status: 500 }
      )
    }

    // Audit log
    await admin.from('audit_logs').insert({
      user_id: userId,
      organization_id: org.id,
      action: 'hv_registered',
      entity_type: 'organization',
      entity_id: org.id,
      details: { org_name, slug, email },
    })

    // Generate confirmation link and send via Resend
    // (Admin createUser does NOT auto-send confirmation emails)
    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
      })
      if (!linkError && linkData?.properties?.action_link) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const confirmUrl = linkData.properties.action_link
        await resend.emails.send({
          from: 'SchadensMelder <no-reply@zerodamage.de>',
          to: email,
          subject: 'E-Mail-Adresse bestätigen – SchadensMelder',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <div style="background:#1a1a2e;padding:16px 24px;border-radius:8px 8px 0 0">
                <h1 style="color:#ffffff;margin:0;font-size:20px">SchadensMelder</h1>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 8px 8px">
                <h2 style="color:#111827;margin:0 0 16px">Willkommen, ${first_name}!</h2>
                <p style="color:#374151;margin:0 0 24px">
                  Ihr Konto für <strong>${org_name}</strong> wurde erfolgreich angelegt.<br>
                  Bitte bestätigen Sie jetzt Ihre E-Mail-Adresse um loszulegen.
                </p>
                <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px">
                  E-Mail-Adresse bestätigen
                </a>
                <p style="color:#6b7280;margin:24px 0 0;font-size:14px">
                  Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
                  <a href="${confirmUrl}" style="color:#2563eb;word-break:break-all">${confirmUrl}</a>
                </p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
                <p style="color:#9ca3af;font-size:12px;margin:0">
                  SchadensMelder – Digitales Schadensmeldungs-Management für Hausverwaltungen<br>
                  Bei Fragen: <a href="mailto:Kracherdigital@gmail.com" style="color:#6b7280">Kracherdigital@gmail.com</a>
                </p>
              </div>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      // Email error must not block the registration response
      console.error('Confirmation email error:', emailErr)
    }

    return NextResponse.json(
      { message: 'Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse.' },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error in register-hv:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
