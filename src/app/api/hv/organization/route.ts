import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const updateOrgSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100).optional(),
  phone: z.string().max(30).nullable().optional(),
})

// GET /api/hv/organization - Get current org data
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, phone')
      .eq('id', profile.organization_id)
      .single()

    return NextResponse.json({ data: org })
  } catch (err) {
    console.error('GET /api/hv/organization error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

// PATCH /api/hv/organization - Update org (hv_admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || profile.role !== 'hv_admin') {
      return NextResponse.json({ error: 'Nur Administratoren können die Organisation bearbeiten' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(parsed.data)
      .eq('id', profile.organization_id)
      .select('id, name, phone')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'organization_updated',
      entity_type: 'organization',
      entity_id: profile.organization_id,
      details: { updated_fields: Object.keys(parsed.data) },
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('PATCH /api/hv/organization error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
