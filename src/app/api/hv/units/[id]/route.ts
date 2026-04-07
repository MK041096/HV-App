import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

// DELETE /api/hv/units/[id] - Einheit komplett löschen (Soft-Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !HV_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Einheit prüfen
    const { data: unit } = await admin
      .from('units')
      .select('id, name')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!unit) return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 })

    // Offene Schadensmeldungen prüfen
    const { count } = await admin
      .from('damage_reports')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', id)
      .eq('is_deleted', false)
      .not('status', 'in', '("erledigt","abgelehnt")')

    if ((count ?? 0) > 0) {
      return NextResponse.json({
        error: `Diese Einheit hat noch ${count} offene Schadensmeldung(en). Bitte zuerst alle Fälle abschließen.`
      }, { status: 409 })
    }

    const now = new Date().toISOString()

    // Soft-Delete via admin (RLS auf units prüft user_roles, nicht profiles)
    const { error: deleteError } = await admin
      .from('units')
      .update({ is_deleted: true, deleted_at: now })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (deleteError) {
      console.error('Error deleting unit:', deleteError)
      return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
    }

    // Offene Aktivierungscodes für diese Einheit abbrechen
    await admin
      .from('activation_codes')
      .update({ status: 'deactivated' })
      .eq('unit_id', id)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending')

    // Verknüpfte Mieter-Profile soft-deleten
    await admin
      .from('profiles')
      .update({ is_deleted: true, deleted_at: now })
      .eq('unit_id', id)
      .eq('organization_id', profile.organization_id)
      .eq('role', 'mieter')
      .eq('is_deleted', false)

    await admin.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'unit_deleted',
      entity_type: 'unit',
      entity_id: id,
      details: { unit_name: unit.name },
    })

    return NextResponse.json({ message: 'Einheit gelöscht' })
  } catch (err) {
    console.error('DELETE /api/hv/units/[id] error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
