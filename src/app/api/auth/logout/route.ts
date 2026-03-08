import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/auth/logout - Sign out and clear session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user before logout for audit logging
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Get user's organization for audit log
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .eq('is_deleted', false)
        .single()

      if (profile?.organization_id) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
          || request.headers.get('x-real-ip')
          || '0.0.0.0'

        await supabase.from('audit_logs').insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          action: 'user_logout',
          entity_type: 'auth',
          entity_id: user.id,
          ip_address: ip,
          details: { email: user.email },
        })
      }
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Fehler beim Abmelden' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'Erfolgreich abgemeldet', redirectTo: '/login' },
    })
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
