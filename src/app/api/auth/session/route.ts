import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/auth/session - Get current session and user profile
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert', authenticated: false },
        { status: 401 }
      )
    }

    // Get profile with organization data
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        organization_id,
        organization:organizations(id, name, slug, plan, is_active)
      `)
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    const hasOrganization = profile?.organization_id != null

    return NextResponse.json({
      data: {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          role: profile?.role || null,
          organization_id: profile?.organization_id || null,
          organization: profile?.organization || null,
        },
        hasOrganization,
      },
    })
  } catch (err) {
    console.error('Session check error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
