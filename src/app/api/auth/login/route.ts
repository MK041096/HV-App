import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { loginSchema } from '@/lib/validations/auth'

// POST /api/auth/login - Authenticate user with email/password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || null

    // Check rate limit using admin client (bypasses RLS for security functions)
    const adminClient = createAdminClient()

    const { data: rateLimited, error: rlError } = await adminClient.rpc('check_login_rate_limit', {
      check_ip: ip,
    })

    if (rlError) {
      console.error('Rate limit check error:', rlError)
      // Fail open but log - don't block login if rate limit check fails
    }

    if (rateLimited === true) {
      // Record the blocked attempt
      await adminClient.rpc('record_login_attempt', {
        attempt_email: email,
        attempt_ip: ip,
        attempt_success: false,
        attempt_user_agent: userAgent,
      })

      return NextResponse.json(
        { error: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es in 15 Minuten erneut.' },
        { status: 429 }
      )
    }

    // Attempt login via Supabase Auth (server client to set cookies)
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      // Record failed attempt
      await adminClient.rpc('record_login_attempt', {
        attempt_email: email,
        attempt_ip: ip,
        attempt_success: false,
        attempt_user_agent: userAgent,
      })

      // Generic error message - don't reveal if email exists (security best practice)
      return NextResponse.json(
        { error: 'E-Mail oder Passwort ist falsch.' },
        { status: 401 }
      )
    }

    // Record successful attempt
    await adminClient.rpc('record_login_attempt', {
      attempt_email: email,
      attempt_ip: ip,
      attempt_success: true,
      attempt_user_agent: userAgent,
    })

    // Check if user has a profile with an organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, role, first_name, last_name')
      .eq('id', data.user.id)
      .eq('is_deleted', false)
      .single()

    // Log the login in audit_logs (only if profile/org exists)
    if (profile?.organization_id) {
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        organization_id: profile.organization_id,
        action: 'user_login',
        entity_type: 'auth',
        entity_id: data.user.id,
        ip_address: ip,
        details: { email, user_agent: userAgent },
      })
    }

    // Determine redirect based on organization membership
    const hasOrganization = profile?.organization_id != null
    const redirectTo = hasOrganization ? '/dashboard' : '/no-organization'

    return NextResponse.json({
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          role: profile?.role || null,
          organization_id: profile?.organization_id || null,
        },
        redirectTo,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
