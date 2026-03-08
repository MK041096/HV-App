import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createUnitSchema } from '@/lib/validations/unit'

// GET /api/units - List units for the user's organization
export async function GET(request: NextRequest) {
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

    // Optional query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('is_deleted', false)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching units:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Wohneinheiten' },
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

// POST /api/units - Create a new unit (HV staff only via RLS)
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
    const parsed = createUnitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Get user's organization_id
    const { data: orgId, error: orgError } = await supabase.rpc('get_user_organization_id')

    if (orgError || !orgId) {
      return NextResponse.json(
        { error: 'Keine Organisation zugeordnet' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('units')
      .insert({
        ...parsed.data,
        organization_id: orgId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Erstellen von Wohneinheiten' },
          { status: 403 }
        )
      }
      console.error('Error creating unit:', error)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Wohneinheit' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: orgId,
      action: 'unit_created',
      entity_type: 'unit',
      entity_id: data.id,
      details: { name: data.name },
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
