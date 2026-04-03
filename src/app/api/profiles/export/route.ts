import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

// GET /api/profiles/export — DSGVO Art. 15: Datenauskunft
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, role, organization_id, created_at, updated_at')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
    if (profile.role !== 'mieter') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    // Alle Schadensmeldungen
    const { data: reports } = await supabase
      .from('damage_reports')
      .select('id, case_number, title, description, category, subcategory, status, urgency, room, created_at, updated_at, closed_at')
      .eq('reporter_id', user.id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // Alle Kommentare
    const { data: comments } = await supabase
      .from('damage_report_comments')
      .select('id, content, is_internal, created_at, damage_report_id')
      .eq('author_id', user.id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'data_export_requested',
      entity_type: 'profile',
      entity_id: user.id,
    })

    const exportData = {
      export_date: new Date().toISOString(),
      export_info: 'Datenauskunft gemäß Art. 15 DSGVO',
      profil: {
        id: profile.id,
        vorname: profile.first_name,
        nachname: profile.last_name,
        telefon: profile.phone,
        email: user.email,
        rolle: 'Mieter',
        konto_erstellt: profile.created_at,
        zuletzt_geaendert: profile.updated_at,
      },
      schadensmeldungen: reports || [],
      kommentare: (comments || []).filter(c => !c.is_internal),
    }

    const json = JSON.stringify(exportData, null, 2)
    const filename = `meine-daten-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Export fehlgeschlagen' }, { status: 500 })
  }
}
