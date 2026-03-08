import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { resetPasswordSchema } from '@/lib/validations/auth'

// POST /api/auth/reset-password - Set new password (user must have valid reset token in session)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { password } = parsed.data

    const supabase = await createServerSupabaseClient()

    // Verify the user has a valid session (set by the reset token callback)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Reset-Link. Bitte fordern Sie einen neuen an.' },
        { status: 401 }
      )
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Passworts. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
    }

    // Log the password change in audit_logs
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (profile?.organization_id) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: 'password_reset',
        entity_type: 'auth',
        entity_id: user.id,
        details: { email: user.email },
      })
    }

    return NextResponse.json({
      data: {
        message: 'Passwort erfolgreich geändert. Sie können sich jetzt anmelden.',
        redirectTo: '/login',
      },
    })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
