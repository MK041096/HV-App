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

    // Save to status history so begründung appears in portal
    const { error: historyError } = await adminClient.from('damage_report_status_history').insert({
      damage_report_id: id,
      old_status: currentReport?.status ?? null,
      new_status: 'abgelehnt',
      note: begruendung.trim(),
      changed_by: user.id,
    })

    if (historyError) {
      console.error('Ablehnen Status-History-Fehler (non-blocking):', historyError)
    }

    // Fire-and-forget: send rejection email to tenant
    ;(async () => {
      try {
        const adminClient = createAdminClient()
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
        }
      } catch (err) {
        console.error('Absage E-Mail Fehler:', err)
      }
    })()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Ablehnen Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
