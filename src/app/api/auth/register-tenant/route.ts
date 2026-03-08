import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { tenantRegisterSchema } from '@/lib/validations/activation-code'

// POST /api/auth/register-tenant - Register a new tenant using activation code
// This is a PUBLIC endpoint (no auth required) with rate limiting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = tenantRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { code, email, password, first_name, last_name } = parsed.data

    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '0.0.0.0'

    const adminClient = createAdminClient()

    // Check rate limit: max 5 registration attempts per IP per 10 minutes
    // check_rate_limit returns TRUE = allowed, FALSE = blocked
    const { data: isAllowed } = await adminClient.rpc('check_rate_limit', {
      check_action: 'tenant_registration',
      check_identifier: ip,
      max_attempts: 5,
      window_minutes: 10,
    })

    if (isAllowed === false) {
      await adminClient.rpc('record_rate_limit_attempt', {
        attempt_action: 'tenant_registration',
        attempt_identifier: ip,
        attempt_success: false,
      })

      return NextResponse.json(
        { error: 'Zu viele Registrierungsversuche. Bitte warten Sie 10 Minuten.' },
        { status: 429 }
      )
    }

    // Look up and validate the activation code
    const { data: codeData, error: codeError } = await adminClient
      .from('activation_codes')
      .select('id, organization_id, unit_id, status, expires_at')
      .eq('code', code.toUpperCase())
      .single()

    if (codeError || !codeData) {
      await adminClient.rpc('record_rate_limit_attempt', {
        attempt_action: 'tenant_registration',
        attempt_identifier: ip,
        attempt_success: false,
      })

      return NextResponse.json(
        { error: 'Aktivierungscode nicht gefunden oder ungültig.' },
        { status: 404 }
      )
    }

    // Check code status
    if (codeData.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        used: 'Dieser Code wurde bereits verwendet.',
        deactivated: 'Dieser Code wurde deaktiviert.',
        expired: 'Dieser Code ist abgelaufen.',
        reserved: 'Dieser Code wird gerade für eine Registrierung verwendet.',
      }

      return NextResponse.json(
        { error: statusMessages[codeData.status] || 'Code ist nicht gültig.' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(codeData.expires_at) < new Date()) {
      await adminClient
        .from('activation_codes')
        .update({ status: 'expired' })
        .eq('id', codeData.id)

      return NextResponse.json(
        { error: 'Dieser Code ist abgelaufen. Bitte kontaktieren Sie Ihre Hausverwaltung.' },
        { status: 400 }
      )
    }

    // Reserve the code atomically (first-write-wins for concurrent requests)
    const { data: reserved, error: reserveError } = await adminClient
      .from('activation_codes')
      .update({
        status: 'reserved',
        reserved_at: new Date().toISOString(),
      })
      .eq('id', codeData.id)
      .eq('status', 'pending') // Only update if still pending (optimistic lock)
      .select('id')
      .single()

    if (reserveError || !reserved) {
      return NextResponse.json(
        { error: 'Dieser Code wird gerade von jemand anderem verwendet. Bitte versuchen Sie es erneut.' },
        { status: 409 }
      )
    }

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now (activation code serves as verification)
      user_metadata: {
        first_name,
        last_name,
        role: 'mieter',
        organization_id: codeData.organization_id,
      },
    })

    if (authError || !authData.user) {
      // Rollback: un-reserve the code
      await adminClient
        .from('activation_codes')
        .update({ status: 'pending', reserved_at: null })
        .eq('id', codeData.id)

      // Check for duplicate email
      if (authError?.message?.includes('already been registered') || authError?.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
          { status: 409 }
        )
      }

      console.error('Error creating user:', authError)
      return NextResponse.json(
        { error: 'Fehler bei der Registrierung. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Create profile for the tenant
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        organization_id: codeData.organization_id,
        first_name,
        last_name,
        role: 'mieter',
        unit_id: codeData.unit_id,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Rollback: delete the orphaned auth user to keep auth and profiles in sync
      await adminClient.auth.admin.deleteUser(userId)
      // Also un-reserve the activation code
      await adminClient
        .from('activation_codes')
        .update({ status: 'pending', reserved_at: null })
        .eq('id', codeData.id)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Profils. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
    }

    // Create user_role entry
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        organization_id: codeData.organization_id,
        role: 'mieter',
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
    }

    // Mark the activation code as used
    const { error: updateError } = await adminClient
      .from('activation_codes')
      .update({
        status: 'used',
        used_by: userId,
        used_at: new Date().toISOString(),
        reserved_at: null,
      })
      .eq('id', codeData.id)

    if (updateError) {
      console.error('Error updating activation code status:', updateError)
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      user_id: userId,
      organization_id: codeData.organization_id,
      action: 'tenant_registered',
      entity_type: 'activation_code',
      entity_id: codeData.id,
      ip_address: ip,
      details: {
        email,
        unit_id: codeData.unit_id,
        activation_code_id: codeData.id,
      },
    })

    // Record successful registration
    await adminClient.rpc('record_rate_limit_attempt', {
      attempt_action: 'tenant_registration',
      attempt_identifier: ip,
      attempt_success: true,
    })

    return NextResponse.json(
      {
        data: {
          user_id: userId,
          email,
          organization_id: codeData.organization_id,
          unit_id: codeData.unit_id,
          message: 'Registrierung erfolgreich. Sie können sich jetzt anmelden.',
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
