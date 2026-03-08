import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { updateProfileSchema } from '@/lib/validations/profile'

// GET /api/profiles - Get current user's profile
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(id, name, slug, plan, einheiten_anzahl, is_active)
      `)
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Profil nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH /api/profiles - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(parsed.data)
      .eq('id', user.id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Profils' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Profil nicht gefunden' },
        { status: 404 }
      )
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: data.organization_id,
      action: 'profile_updated',
      entity_type: 'profile',
      entity_id: data.id,
      details: { updated_fields: Object.keys(parsed.data) },
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
