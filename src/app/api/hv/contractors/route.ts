import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 403 })

    const { data: contractors } = await supabase
      .from('contractors')
      .select('id, name, company, email, phone, specialties')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('company')

    return NextResponse.json({ data: contractors || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
