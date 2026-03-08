import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/activation-codes/:id - Get a single activation code (HV staff)
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
      .from('activation_codes')
      .select(`
        *,
        unit:units(id, name, address, floor)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Aktivierungscode nicht gefunden' },
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

// PATCH /api/activation-codes/:id - Deactivate an activation code (HV staff)
export async function PATCH(
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

    // Only allow deactivation of pending codes
    const { data: existing, error: fetchError } = await supabase
      .from('activation_codes')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Aktivierungscode nicht gefunden' },
        { status: 404 }
      )
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: `Code kann nicht deaktiviert werden. Aktueller Status: ${existing.status}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('activation_codes')
      .update({ status: 'deactivated' })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) {
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Deaktivieren dieses Codes' },
          { status: 403 }
        )
      }
      console.error('Error deactivating code:', error)
      return NextResponse.json(
        { error: 'Fehler beim Deaktivieren des Codes' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Aktivierungscode nicht gefunden oder bereits verwendet' },
        { status: 404 }
      )
    }

    // Audit log
    const { data: orgId } = await supabase.rpc('get_user_organization_id')
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: orgId,
      action: 'activation_code_deactivated',
      entity_type: 'activation_code',
      entity_id: data.id,
      details: { code: data.code, unit_id: data.unit_id },
    })

    return NextResponse.json({ data, message: 'Aktivierungscode deaktiviert' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
