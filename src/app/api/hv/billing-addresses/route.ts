// PROJ-24: Rechnungsadressen pro Liegenschaft — Liste + Anlegen.
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const CreateSchema = z.object({
  liegenschaft_address: z.string().min(3, 'Liegenschaft erforderlich'),
  billing_name: z.string().min(2, 'Name erforderlich'),
  billing_street: z.string().min(2, 'Straße erforderlich'),
  billing_zip: z.string().min(3, 'PLZ erforderlich'),
  billing_city: z.string().min(2, 'Ort erforderlich'),
  billing_country: z.string().optional().default('Österreich'),
  billing_uid: z.string().optional().nullable(),
  billing_email: z.string().email('Ungültige E-Mail').optional().nullable().or(z.literal('')),
  billing_reference: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('billing_addresses')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('liegenschaft_address', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error('GET billing-addresses error:', err)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const input = parsed.data

    const { data, error } = await supabase
      .from('billing_addresses')
      .insert({
        organization_id: profile.organization_id,
        liegenschaft_address: input.liegenschaft_address.trim(),
        billing_name: input.billing_name.trim(),
        billing_street: input.billing_street.trim(),
        billing_zip: input.billing_zip.trim(),
        billing_city: input.billing_city.trim(),
        billing_country: input.billing_country?.trim() || 'Österreich',
        billing_uid: input.billing_uid?.trim() || null,
        billing_email: input.billing_email?.trim() || null,
        billing_reference: input.billing_reference?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Für diese Liegenschaft existiert bereits eine Rechnungsadresse.' }, { status: 409 })
      }
      throw error
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'billing_address_created',
      entity_type: 'billing_address',
      entity_id: data.id,
      details: { liegenschaft: input.liegenschaft_address },
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('POST billing-addresses error:', err)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
