import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Diagnose-Endpoint: prüft ob Resend funktioniert + sendet Test-Mail an aktuellen User
// GET → zeigt Setup-Status (env-var vorhanden?)
// POST → sendet Test-Mail
//
// Tenant-isoliert: nur eingeloggte User dürfen testen, Mail geht an eigene Adresse

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY
  return NextResponse.json({
    has_api_key: !!apiKey,
    api_key_prefix: apiKey ? apiKey.slice(0, 6) + '...' : null,
    expected_from_address: 'noreply@smartcarl.com',
    hint: apiKey
      ? 'API-Key vorhanden. Sende eine POST-Anfrage an diesen Endpoint, um eine Test-Mail an deine eigene Adresse zu senden.'
      : 'RESEND_API_KEY ist NICHT in Vercel Environment Variables gesetzt. Vercel → Settings → Environment Variables → RESEND_API_KEY hinzufügen → Redeploy.',
  })
}

export async function POST(_request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'RESEND_API_KEY fehlt in Environment Variables',
    }, { status: 500 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ ok: false, error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const resend = new Resend(apiKey)

  try {
    const result = await resend.emails.send({
      from: 'SMARTCARL Test <noreply@smartcarl.com>',
      to: user.email,
      subject: '[SMARTCARL] Test-Mail – Resend-Setup funktioniert',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 24px auto; padding: 24px; background: #f4f4f5; border-radius: 12px;">
          <h2 style="margin: 0 0 12px; color: #16a34a;">✅ Mail-System funktioniert</h2>
          <p style="color: #18181b; line-height: 1.6; margin: 0 0 8px;">Diese Test-Mail wurde erfolgreich von smartcarl.com via Resend an dich versendet.</p>
          <p style="color: #71717a; font-size: 13px; margin: 16px 0 0;">Wenn du diese Mail siehst, ist das Mail-System einsatzbereit. Werkstatt- und Mieter-Mails sollten ebenfalls funktionieren.</p>
          <p style="color: #71717a; font-size: 11px; margin-top: 16px;">Zeitstempel: ${new Date().toISOString()}</p>
        </div>
      `,
    })

    return NextResponse.json({
      ok: true,
      message: `Test-Mail an ${user.email} gesendet. Prüfe Posteingang + Spam-Ordner.`,
      resend_id: result.data?.id || null,
      resend_error: result.error || null,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      hint: 'Häufigste Ursache: Domain smartcarl.com ist nicht bei Resend verifiziert. Prüfe https://resend.com/domains.',
    }, { status: 500 })
  }
}
