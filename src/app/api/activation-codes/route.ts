import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createActivationCodeSchema } from '@/lib/validations/activation-code'
import crypto from 'crypto'

// Generate a cryptographically secure 8-char alphanumeric code
function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/1/O/0 to avoid confusion
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

// GET /api/activation-codes - List activation codes for the user's organization
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // filter by status
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('activation_codes')
      .select(`
        *,
        unit:units(id, name, address, floor)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching activation codes:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Aktivierungscodes' },
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

// POST /api/activation-codes - Generate a new activation code (HV staff only)
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
    const parsed = createActivationCodeSchema.safeParse(body)

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

    // Verify the unit belongs to the same organization
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, organization_id')
      .eq('id', parsed.data.unit_id)
      .eq('is_deleted', false)
      .single()

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Wohneinheit nicht gefunden' },
        { status: 404 }
      )
    }

    // Deactivate any existing pending codes for this unit (one active code per unit)
    await supabase
      .from('activation_codes')
      .update({ status: 'deactivated', updated_at: new Date().toISOString() })
      .eq('unit_id', parsed.data.unit_id)
      .eq('status', 'pending')

    // Generate unique code with retry logic
    let code: string = ''
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      code = generateActivationCode()
      const { data: existing } = await supabase
        .from('activation_codes')
        .select('id')
        .eq('code', code)
        .limit(1)

      if (!existing || existing.length === 0) {
        break
      }
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Code-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (parsed.data.expires_in_days || 30))

    const { data, error } = await supabase
      .from('activation_codes')
      .insert({
        organization_id: orgId,
        unit_id: parsed.data.unit_id,
        code,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select(`
        *,
        unit:units(id, name, address, floor)
      `)
      .single()

    if (error) {
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Erstellen von Aktivierungscodes' },
          { status: 403 }
        )
      }
      console.error('Error creating activation code:', error)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Aktivierungscodes' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: orgId,
      action: 'activation_code_created',
      entity_type: 'activation_code',
      entity_id: data.id,
      details: { unit_id: parsed.data.unit_id, expires_at: expiresAt.toISOString() },
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
