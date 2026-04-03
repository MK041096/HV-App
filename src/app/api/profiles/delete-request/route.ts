import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/profiles/delete-request — DSGVO Art. 17: Recht auf Löschung
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, organization_id, first_name, last_name')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
    if (profile.role !== 'mieter') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    // Prüfen ob bereits ein aktiver Antrag existiert
    const { data: existing } = await supabase
      .from('deletion_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Es gibt bereits einen aktiven Löschantrag.' }, { status: 409 })
    }

    // Offene Fälle zählen
    const { count: openCases } = await supabase
      .from('damage_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .not('status', 'in', '("erledigt","abgelehnt")')

    // Scheduled deletion date: 30 Tage
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + 30)

    // Löschantrag erstellen
    const { error: insertError } = await supabase
      .from('deletion_requests')
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        status: 'pending',
        has_open_cases: (openCases ?? 0) > 0,
        scheduled_deletion_at: scheduledAt.toISOString(),
      })

    if (insertError) {
      console.error('Deletion request insert error:', insertError)
      return NextResponse.json({ error: 'Antrag konnte nicht erstellt werden' }, { status: 500 })
    }

    // Profil als "löschung beantragt" markieren (Soft-Lock: kein Login mehr möglich nach 30 Tagen)
    await supabase
      .from('profiles')
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq('id', user.id)

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'deletion_requested',
      entity_type: 'profile',
      entity_id: user.id,
      details: { has_open_cases: (openCases ?? 0) > 0, scheduled_deletion_at: scheduledAt.toISOString() },
    })

    return NextResponse.json({
      success: true,
      scheduled_deletion_at: scheduledAt.toISOString(),
      has_open_cases: (openCases ?? 0) > 0,
    })
  } catch (err) {
    console.error('Delete request error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/profiles/delete-request — Löschantrag widerrufen
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    await supabase
      .from('deletion_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    await supabase
      .from('profiles')
      .update({ deletion_requested_at: null })
      .eq('id', user.id)

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'deletion_request_cancelled',
      entity_type: 'profile',
      entity_id: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel delete request error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
