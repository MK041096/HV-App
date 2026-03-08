import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createOrganizationSchema } from '@/lib/validations/organization'

// GET /api/organizations - List organizations (user sees only their own via RLS)
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
      .from('organizations')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Organisationen' },
        { status: 500 }
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

// POST /api/organizations - Create a new organization (platform_admin only via RLS)
export async function POST(request: NextRequest) {
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
    const parsed = createOrganizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Eine Organisation mit diesem Slug existiert bereits' },
          { status: 409 }
        )
      }
      // RLS violation returns empty result or permission error
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Erstellen von Organisationen' },
          { status: 403 }
        )
      }
      console.error('Error creating organization:', error)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Organisation' },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: data.id,
      action: 'organization_created',
      entity_type: 'organization',
      entity_id: data.id,
      details: { name: data.name, slug: data.slug },
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
