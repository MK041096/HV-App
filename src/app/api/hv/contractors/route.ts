import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

async function getAuthenticatedProfile(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert', status: 401, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .eq('is_deleted', false)
    .single()

  if (!profile) return { error: 'Profil nicht gefunden', status: 403, profile: null }
  if (!HV_ROLES.includes(profile.role)) return { error: 'Keine Berechtigung', status: 403, profile: null }

  return { error: null, status: 200, profile }
}

// GET /api/hv/contractors
// Returns all active contractors for the user's organization, sorted by name
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error, status, profile } = await getAuthenticatedProfile(supabase)
    if (error || !profile) return NextResponse.json({ error }, { status })

    const { data: contractors, error: dbError } = await supabase
      .from('contractors')
      .select('id, name, company, email, phone, specialties, notes, is_active, created_at, updated_at')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (dbError) {
      console.error('Error fetching contractors:', dbError)
      return NextResponse.json({ error: 'Fehler beim Laden der Werkstätten' }, { status: 500 })
    }

    return NextResponse.json({ data: contractors || [] })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// POST /api/hv/contractors
// Creates a new contractor. Body: { name, company, email, phone, specialties, notes }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()
    const { error, status, profile } = await getAuthenticatedProfile(supabase)
    if (error || !profile) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { name, company, email, phone, specialties, notes } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name ist ein Pflichtfeld' }, { status: 400 })
    }

    const { data: contractor, error: dbError } = await adminSupabase
      .from('contractors')
      .insert({
        organization_id: profile.organization_id,
        name: name.trim(),
        company: company?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        specialties: Array.isArray(specialties) ? specialties : [],
        notes: notes?.trim() || null,
        is_active: true,
      })
      .select('id, name, company, email, phone, specialties, notes, is_active, created_at, updated_at')
      .single()

    if (dbError) {
      console.error('Error creating contractor:', dbError)
      return NextResponse.json({ error: 'Fehler beim Erstellen der Werkstatt' }, { status: 500 })
    }

    return NextResponse.json({ data: contractor }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
