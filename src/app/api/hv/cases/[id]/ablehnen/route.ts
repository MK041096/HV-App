import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendAblehnungEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const body = await request.json()
    const { begruendung } = body
    if (!begruendung?.trim()) {
      return NextResponse.json({ error: 'Begründung ist erforderlich' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Load current status + update via admin client (Tenant manuell geprüft)
    const { data: currentReport } = await adminClient
      .from('damage_reports')
      .select('status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    const { data: report, error: updateError } = await adminClient
      .from('damage_reports')
      .update({ status: 'abgelehnt', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select('id, case_number, title, reporter_id, unit_id, preferred_appointment')
      .single()

    if (updateError || !report) {
      console.error('Ablehnen Update-Fehler:', updateError)
      return NextResponse.json({ error: 'Fall nicht gefunden', details: updateError?.message }, { status: 404 })
    }

    // Status-History: Trigger fn_damage_report_status_change() hat bereits einen Eintrag
    // erstellt (note=null, changed_by=null). Wir updaten diesen mit Begründung + User-ID.
    const { data: triggerEntry } = await adminClient
      .from('damage_report_status_history')
      .select('id')
      .eq('damage_report_id', id)
      .eq('new_status', 'abgelehnt')
      .is('changed_by', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (triggerEntry) {
      const { error: histErr } = await adminClient
        .from('damage_report_status_history')
        .update({ note: begruendung.trim(), changed_by: user.id })
        .eq('id', triggerEntry.id)
      if (histErr) console.error('Status-History-Update-Fehler:', histErr)
    } else {
      // Fallback: kein Trigger-Eintrag gefunden — selbst einen anlegen
      const { error: insErr } = await adminClient.from('damage_report_status_history').insert({
        damage_report_id: id,
        old_status: currentReport?.status ?? null,
        new_status: 'abgelehnt',
        note: begruendung.trim(),
        changed_by: user.id,
      })
      if (insErr) console.error('Status-History-Insert-Fehler:', insErr)
    }

    // Mieter-Mail SYNCHRON (sicherer als fire-and-forget)
    let mailSent = false
    let mailError: string | null = null
    try {
      const [{ data: tenantProfile }, { data: org }, { data: { users } }] = await Promise.all([
        adminClient.from('profiles').select('id, first_name, last_name').eq('id', report.reporter_id).single(),
        adminClient.from('organizations').select('name, phone').eq('id', profile.organization_id).single(),
        adminClient.auth.admin.listUsers({ perPage: 1000 }),
      ])

      const tenantUser = users?.find(u => u.id === report.reporter_id)
      const tenantEmail = tenantUser?.email
      const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'

      if (tenantEmail) {
        await sendAblehnungEmail({
          to: tenantEmail,
          tenantName,
          caseNumber: report.case_number,
          caseTitle: report.title,
          begruendung: begruendung.trim(),
          reportId: id,
          orgName: org?.name || 'Hausverwaltung',
          orgPhone: (org as any)?.phone,
        })
        mailSent = true
      }
    } catch (err) {
      console.error('Absage E-Mail Fehler:', err)
      mailError = err instanceof Error ? err.message : 'Mail-Fehler'
    }

    return NextResponse.json({ success: true, mail_sent: mailSent, mail_error: mailError })
  } catch (err) {
    console.error('Ablehnen Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
