import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { updateOrganizationSchema } from '@/lib/validations/organization'

// GET /api/organizations/:id - Get a single organization
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
      .from('organizations')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Organisation nicht gefunden' },
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

// PATCH /api/organizations/:id - Update an organization
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
    const parsed = updateOrganizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(parsed.data)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Eine Organisation mit diesem Slug existiert bereits' },
          { status: 409 }
        )
      }
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Aktualisieren dieser Organisation' },
          { status: 403 }
        )
      }
      console.error('Error updating organization:', error)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Organisation' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Organisation nicht gefunden' },
        { status: 404 }
      )
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: data.id,
      action: 'organization_updated',
      entity_type: 'organization',
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

// DELETE /api/organizations/:id - Soft-delete an organization
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

    // Soft-delete: set is_deleted = true and deleted_at = now()
    const { data, error } = await supabase
      .from('organizations')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Löschen dieser Organisation' },
          { status: 403 }
        )
      }
      console.error('Error deleting organization:', error)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Organisation' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Organisation nicht gefunden' },
        { status: 404 }
      )
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: data.id,
      action: 'organization_deleted',
      entity_type: 'organization',
      entity_id: data.id,
      details: { name: data.name, slug: data.slug },
    })

    return NextResponse.json({ message: 'Organisation geloescht' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
