import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

// PATCH /api/hv/contractors/[id]
// Update contractor fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { error, status, profile } = await getAuthenticatedProfile(supabase)
    if (error || !profile) return NextResponse.json({ error }, { status })

    // Verify contractor belongs to this organization
    const { data: existing } = await supabase
      .from('contractors')
      .select('id')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { name, company, email, phone, specialties, notes, is_active } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name darf nicht leer sein' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    if (company !== undefined) updateData.company = company?.trim() || null
    if (email !== undefined) updateData.email = email?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (specialties !== undefined) updateData.specialties = Array.isArray(specialties) ? specialties : []
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (is_active !== undefined) updateData.is_active = Boolean(is_active)

    const { data: contractor, error: dbError } = await supabase
      .from('contractors')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select('id, name, company, email, phone, specialties, notes, is_active, created_at, updated_at')
      .single()

    if (dbError) {
      console.error('Error updating contractor:', dbError)
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Werkstatt' }, { status: 500 })
    }

    return NextResponse.json({ data: contractor })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/hv/contractors/[id]
// Soft-delete: sets is_active = false
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { error, status, profile } = await getAuthenticatedProfile(supabase)
    if (error || !profile) return NextResponse.json({ error }, { status })

    // Verify contractor belongs to this organization
    const { data: existing } = await supabase
      .from('contractors')
      .select('id')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const { error: dbError } = await supabase
      .from('contractors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (dbError) {
      console.error('Error deleting contractor:', dbError)
      return NextResponse.json({ error: 'Fehler beim Löschen der Werkstatt' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Werkstatt erfolgreich gelöscht' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
