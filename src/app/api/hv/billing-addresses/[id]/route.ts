// PROJ-24: Einzelne Rechnungsadresse — Update + Soft-Delete.
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const UpdateSchema = z.object({
  liegenschaft_address: z.string().min(3).optional(),
  billing_name: z.string().min(2).optional(),
  billing_street: z.string().min(2).optional(),
  billing_zip: z.string().min(3).optional(),
  billing_city: z.string().min(2).optional(),
  billing_country: z.string().optional(),
  billing_uid: z.string().optional().nullable(),
  billing_email: z.string().email().optional().nullable().or(z.literal('')),
  billing_reference: z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) update[k] = typeof v === 'string' ? v.trim() || null : v
    }

    const { data, error } = await supabase
      .from('billing_addresses')
      .update(update)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Für diese Liegenschaft existiert bereits eine andere Rechnungsadresse.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('PATCH billing-address error:', err)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { error } = await supabase
      .from('billing_addresses')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) throw error

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'billing_address_deleted',
      entity_type: 'billing_address',
      entity_id: id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE billing-address error:', err)
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
