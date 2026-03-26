import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/admin/organizations/[id]/activate — activate a pending organization
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check: must be platform_admin
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Ungültige Organisations-ID' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Update organization status to active
    const { data: org, error: updateError } = await admin
      .from('organizations')
      .update({ status: 'active' })
      .eq('id', id)
      .select('id, name')
      .single()

    if (updateError || !org) {
      console.error('Error activating organization:', updateError)
      return NextResponse.json({ error: 'Fehler beim Aktivieren der Organisation' }, { status: 500 })
    }

    // Fetch HV admin profile for this org
    const { data: hvAdminProfile } = await admin
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('organization_id', id)
      .eq('role', 'hv_admin')
      .eq('is_deleted', false)
      .limit(1)
      .single()

    if (!hvAdminProfile) {
      // Org activated but couldn't find admin — return success without email
      return NextResponse.json({ success: true })
    }

    // Get email from auth
    let hvAdminEmail: string | null = null
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(hvAdminProfile.id)
      hvAdminEmail = authUser?.user?.email ?? null
    } catch {
      console.error('Could not fetch HV admin email')
    }

    // Send activation email
    if (hvAdminEmail) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'
        const loginUrl = `${appUrl}/login`
        const resend = new Resend(process.env.RESEND_API_KEY)

        const { error: emailError } = await resend.emails.send({
          from: 'SchadensMelder <no-reply@zerodamage.de>',
          to: hvAdminEmail,
          subject: 'Ihr SchadensMelder-Zugang ist jetzt aktiv',
          html: `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#9A6B3C,#B5834A);padding:32px 40px;text-align:center">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">SchadensMelder</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Digitales Schadensmeldungs-Management</p>
    </div>

    <!-- Body -->
    <div style="padding:40px">
      <!-- Checkmark -->
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:#f0fdf4;border:2px solid #bbf7d0">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      <h2 style="margin:0 0 12px;color:#111827;font-size:24px;text-align:center;font-weight:700">
        Ihr Zugang ist jetzt aktiv!
      </h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;text-align:center;line-height:1.6">
        Hallo ${hvAdminProfile.first_name || ''},<br>Ihre Hausverwaltung <strong style="color:#111827">${org.name}</strong> wurde erfolgreich freigeschaltet.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:32px">
        <a
          href="${loginUrl}"
          style="display:inline-block;background:#9A6B3C;color:#ffffff;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.2px"
        >
          Jetzt anmelden →
        </a>
      </div>

      <!-- Info box -->
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:28px">
        <p style="margin:0;color:#92400e;font-size:13px;font-weight:600">So geht es weiter:</p>
        <ul style="margin:8px 0 0;padding-left:18px;color:#78350f;font-size:13px;line-height:1.8">
          <li>Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an</li>
          <li>Legen Sie Ihre ersten Einheiten an</li>
          <li>Laden Sie Ihre Mieter per Aktivierungscode ein</li>
        </ul>
      </div>

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center">
        Bei Fragen stehen wir Ihnen gerne zur Verfügung:<br>
        <a href="mailto:Kracherdigital@gmail.com" style="color:#9A6B3C">Kracherdigital@gmail.com</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:12px">
        © 2026 SchadensMelder · zerodamage.de
      </p>
    </div>
  </div>
</body>
</html>`,
        })

        if (emailError) {
          console.error('Activation email error:', emailError)
        }
      } catch (emailErr) {
        console.error('Activation email exception:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Activate organization error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
