import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { updateUnitSchema } from '@/lib/validations/unit'

// GET /api/units/:id - Get a single unit
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .from('units')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Wohneinheit nicht gefunden' },
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

// PATCH /api/units/:id - Update a unit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const parsed = updateUnitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('units')
      .update(parsed.data)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Aktualisieren dieser Wohneinheit' },
          { status: 403 }
        )
      }
      console.error('Error updating unit:', error)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Wohneinheit' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Wohneinheit nicht gefunden' },
        { status: 404 }
      )
    }

    // Audit log
    const { data: orgId } = await supabase.rpc('get_user_organization_id')
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: orgId,
      action: 'unit_updated',
      entity_type: 'unit',
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

// DELETE /api/units/:id - Soft-delete a unit
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .from('units')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Löschen dieser Wohneinheit' },
          { status: 403 }
        )
      }
      console.error('Error deleting unit:', error)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Wohneinheit' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Wohneinheit nicht gefunden' },
        { status: 404 }
      )
    }

    // Audit log
    const { data: orgId } = await supabase.rpc('get_user_organization_id')
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: orgId,
      action: 'unit_deleted',
      entity_type: 'unit',
      entity_id: data.id,
      details: { name: data.name },
    })

    return NextResponse.json({ message: 'Wohneinheit geloescht' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
