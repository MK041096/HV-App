import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { forgotPasswordSchema } from '@/lib/validations/auth'

// POST /api/auth/forgot-password - Request password reset email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Get IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '0.0.0.0'

    // Rate limit: max 3 attempts per IP per 15 minutes
    // check_rate_limit returns TRUE = allowed, FALSE = blocked
    const adminClient = createAdminClient()
    const { data: isAllowed, error: rlError } = await adminClient.rpc('check_rate_limit', {
      check_action: 'forgot_password',
      check_identifier: ip,
      max_attempts: 3,
      window_minutes: 15,
    })

    if (rlError) {
      console.error('Rate limit check error:', rlError)
      // Fail open but log
    }

    if (isAllowed === false) {
      await adminClient.rpc('record_rate_limit_attempt', {
        attempt_action: 'forgot_password',
        attempt_identifier: ip,
        attempt_success: false,
      })

      // Return generic success to prevent enumeration even when rate limited
      return NextResponse.json({
        data: {
          message:
            'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
        },
      })
    }

    const supabase = await createServerSupabaseClient()

    // Supabase handles:
    // - Checking if email exists (silently does nothing if not)
    // - Sending the reset email
    // - Token generation with expiry
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists or not - always return success message
    }

    // Record successful attempt for rate limit tracking
    await adminClient.rpc('record_rate_limit_attempt', {
      attempt_action: 'forgot_password',
      attempt_identifier: ip,
      attempt_success: true,
    })

    // Always return success to prevent email enumeration
    return NextResponse.json({
      data: {
        message:
          'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
      },
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
