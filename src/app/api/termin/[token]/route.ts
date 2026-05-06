import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendTerminBestaetigung } from '@/lib/email'

// GET: Load token info for the public page
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const adminClient = createAdminClient()

  const { data: tokenData } = await adminClient
    .from('appointment_tokens')
    .select(`
      id, status, expires_at, damage_report_id, organization_id, contractor_id,
      damage_report:damage_reports(case_number, title, category, description, preferred_appointment, preferred_appointment_2, unit_id, reporter_id,
        unit:units(name, address))
    `)
    .eq('token', token)
    .single()

  if (!tokenData) return NextResponse.json({ error: 'Ungültiger Link' }, { status: 404 })
  if (tokenData.status !== 'pending') return NextResponse.json({ error: 'Dieser Link wurde bereits verwendet', status: tokenData.status }, { status: 410 })
  if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Dieser Link ist abgelaufen' }, { status: 410 })

  const report = tokenData.damage_report as any

  const [{ data: contractor }, { data: reporterProfile }] = await Promise.all([
    adminClient.from('contractors').select('name, company').eq('id', tokenData.contractor_id).single(),
    report?.reporter_id
      ? adminClient.from('profiles').select('first_name, last_name, phone').eq('id', report.reporter_id).single()
      : Promise.resolve({ data: null }),
  ])

  const tenantContact = reporterProfile ? {
    name: [reporterProfile.first_name, reporterProfile.last_name].filter(Boolean).join(' ') || 'Mieter',
    phone: (reporterProfile as any).phone || null,
  } : null

  return NextResponse.json({ data: { ...tokenData, contractor, tenantContact } })
}

// POST: Contractor responds to appointment
// action: 'confirm_1' | 'confirm_2' | 'confirm_phone'
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const adminClient = createAdminClient()
  const body = await request.json()
  const { action } = body

  if (action !== 'confirm_1' && action !== 'confirm_2' && action !== 'confirm_phone') {
    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  }

  const { data: tokenData } = await adminClient
    .from('appointment_tokens')
    .select('id, status, expires_at, damage_report_id, organization_id, contractor_id')
    .eq('token', token)
    .single()

  if (!tokenData) return NextResponse.json({ error: 'Ungültiger Link' }, { status: 404 })
  if (tokenData.status !== 'pending') return NextResponse.json({ error: 'Bereits verwendet' }, { status: 410 })
  if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Abgelaufen' }, { status: 410 })

  const [{ data: report }, { data: contractor }, { data: org }] = await Promise.all([
    adminClient.from('damage_reports')
      .select('case_number, title, reporter_id, preferred_appointment, preferred_appointment_2')
      .eq('id', tokenData.damage_report_id)
      .single(),
    adminClient.from('contractors').select('name, company, phone').eq('id', tokenData.contractor_id).single(),
    adminClient.from('organizations').select('name').eq('id', tokenData.organization_id).single(),
  ])

  const isPhone = action === 'confirm_phone'

  // Determine the confirmed date based on which button was clicked
  let finalDate: string | null = null
  if (action === 'confirm_1') finalDate = report?.preferred_appointment || null
  if (action === 'confirm_2') finalDate = report?.preferred_appointment_2 || null

  const finalDateLabel = finalDate
    ? new Date(finalDate).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Termin folgt'

  const { data: currentDR } = await adminClient
    .from('damage_reports')
    .select('status')
    .eq('id', tokenData.damage_report_id)
    .single()

  // Mark token as used
  await adminClient.from('appointment_tokens').update({
    status: 'confirmed',
    proposed_date: finalDate,
    responded_at: new Date().toISOString(),
  }).eq('token', token)

  // Update damage report status
  const newStatus = isPhone ? 'termin_telefonisch' : 'termin_vereinbart'
  await adminClient.from('damage_reports').update({
    status: newStatus,
    scheduled_appointment: finalDate,
    updated_at: new Date().toISOString(),
  }).eq('id', tokenData.damage_report_id)

  // Status-History: Trigger fn_damage_report_status_change() hat bereits einen
  // Eintrag erstellt (note=null). Wir updaten ihn mit der note statt einen
  // doppelten Eintrag anzulegen (gleiches Pattern wie /weiterleiten und /ablehnen).
  const historyNote = isPhone
    ? 'Werkstatt vereinbart Termin persönlich mit Mieter'
    : `Termin bestätigt durch Werkstatt: ${finalDateLabel}`

  const { data: triggerEntry } = await adminClient
    .from('damage_report_status_history')
    .select('id')
    .eq('damage_report_id', tokenData.damage_report_id)
    .eq('new_status', newStatus)
    .is('note', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (triggerEntry) {
    await adminClient
      .from('damage_report_status_history')
      .update({ note: historyNote })
      .eq('id', triggerEntry.id)
  } else {
    await adminClient.from('damage_report_status_history').insert({
      damage_report_id: tokenData.damage_report_id,
      old_status: currentDR?.status ?? null,
      new_status: newStatus,
      note: historyNote,
      changed_by: null,
    })
  }

  // Notify HV-Admins + Mieter for ALL 3 actions
  if (report?.reporter_id) {
    ;(async () => {
      try {
        const [
          { data: { users } },
          { data: tenantProfile },
          { data: hvProfiles },
        ] = await Promise.all([
          adminClient.auth.admin.listUsers({ perPage: 1000 }),
          adminClient.from('profiles').select('first_name, last_name').eq('id', report.reporter_id).single(),
          adminClient.from('profiles')
            .select('id')
            .eq('organization_id', tokenData.organization_id)
            .in('role', ['hv_admin', 'hv_mitarbeiter'])
            .eq('is_deleted', false),
        ])

        const tenantUser = users?.find((u: any) => u.id === report.reporter_id)
        const tenantEmail = tenantUser?.email || null
        const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'

        const hvIds = new Set((hvProfiles || []).map((p: { id: string }) => p.id))
        const hvEmails = (users || [])
          .filter((u: any) => hvIds.has(u.id) && u.email)
          .map((u: any) => u.email as string)

        await sendTerminBestaetigung({
          hvEmails,
          tenantEmail,
          tenantName,
          caseNumber: report.case_number || '',
          caseTitle: report.title || '',
          contractorCompany: contractor?.company || contractor?.name || '',
          contractorPhone: (contractor as any)?.phone || null,
          confirmedDate: finalDateLabel,
          isRescheduled: false,
          isPhone,
          orgName: org?.name || 'Hausverwaltung',
        })
      } catch (err) {
        console.error('Termin E-Mail Fehler:', err)
      }
    })()
  }

  return NextResponse.json({ success: true, confirmedDate: finalDateLabel, isPhone })
}
