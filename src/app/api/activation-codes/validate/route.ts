import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { validateCodeSchema } from '@/lib/validations/activation-code'

// POST /api/activation-codes/validate - Check if an activation code is valid (public endpoint)
// This is rate-limited to prevent brute force code guessing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = validateCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { code } = parsed.data

    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '0.0.0.0'

    // Use admin client (this is a public endpoint, no user session)
    const adminClient = createAdminClient()

    // Check rate limit: max 5 attempts per IP per 10 minutes
    // check_rate_limit returns TRUE = allowed, FALSE = blocked
    const { data: isAllowed } = await adminClient.rpc('check_rate_limit', {
      check_action: 'activation_code_validate',
      check_identifier: ip,
      max_attempts: 5,
      window_minutes: 10,
    })

    if (isAllowed === false) {
      await adminClient.rpc('record_rate_limit_attempt', {
        attempt_action: 'activation_code_validate',
        attempt_identifier: ip,
        attempt_success: false,
      })

      return NextResponse.json(
        { error: 'Zu viele Versuche. Bitte warten Sie 10 Minuten.' },
        { status: 429 }
      )
    }

    // Look up the code
    const { data: codeData, error } = await adminClient
      .from('activation_codes')
      .select(`
        id,
        status,
        expires_at,
        invited_first_name,
        invited_last_name,
        invited_email,
        organization:organizations(name),
        unit:units(name, address, floor)
      `)
      .eq('code', code.toUpperCase())
      .single()

    if (error || !codeData) {
      // Record failed attempt
      await adminClient.rpc('record_rate_limit_attempt', {
        attempt_action: 'activation_code_validate',
        attempt_identifier: ip,
        attempt_success: false,
      })

      return NextResponse.json(
        { error: 'Aktivierungscode nicht gefunden oder ungültig' },
        { status: 404 }
      )
    }

    // Check if code is usable
    if (codeData.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        used: 'Dieser Code wurde bereits verwendet.',
        deactivated: 'Dieser Code wurde deaktiviert. Bitte kontaktieren Sie Ihre Hausverwaltung.',
        expired: 'Dieser Code ist abgelaufen. Bitte kontaktieren Sie Ihre Hausverwaltung.',
        reserved: 'Dieser Code wird gerade für eine Registrierung verwendet.',
      }

      return NextResponse.json(
        { error: statusMessages[codeData.status] || 'Code ist nicht gültig.' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(codeData.expires_at) < new Date()) {
      // Auto-expire the code
      await adminClient
        .from('activation_codes')
        .update({ status: 'expired' })
        .eq('id', codeData.id)

      return NextResponse.json(
        { error: 'Dieser Code ist abgelaufen. Bitte kontaktieren Sie Ihre Hausverwaltung.' },
        { status: 400 }
      )
    }

    // Record successful validation
    await adminClient.rpc('record_rate_limit_attempt', {
      attempt_action: 'activation_code_validate',
      attempt_identifier: ip,
      attempt_success: true,
    })

    // Return limited info (organization name & unit name -- no sensitive data)
    const org = codeData.organization as unknown as { name: string } | null
    const unit = codeData.unit as unknown as { name: string; address: string | null; floor: string | null } | null

    return NextResponse.json({
      data: {
        valid: true,
        organization_name: org?.name || null,
        unit_name: unit?.name || null,
        invited_first_name: (codeData as any).invited_first_name || null,
        invited_last_name: (codeData as any).invited_last_name || null,
        invited_email: (codeData as any).invited_email || null,
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
