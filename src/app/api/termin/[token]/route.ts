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
      damage_report:damage_reports(case_number, title, category, description, preferred_appointment, unit_id,
        unit:units(name, address))
    `)
    .eq('token', token)
    .single()

  if (!tokenData) return NextResponse.json({ error: 'Ungültiger Link' }, { status: 404 })
  if (tokenData.status !== 'pending') return NextResponse.json({ error: 'Dieser Link wurde bereits verwendet', status: tokenData.status }, { status: 410 })
  if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Dieser Link ist abgelaufen' }, { status: 410 })

  const { data: contractor } = await adminClient
    .from('contractors')
    .select('name, company')
    .eq('id', tokenData.contractor_id)
    .single()

  return NextResponse.json({ data: { ...tokenData, contractor } })
}

// POST: Contractor confirms or proposes new date
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const adminClient = createAdminClient()
  const body = await request.json()
  const { action, proposed_date } = body // action: 'confirm' | 'reschedule'

  const { data: tokenData } = await adminClient
    .from('appointment_tokens')
    .select('id, status, expires_at, damage_report_id, organization_id, contractor_id')
    .eq('token', token)
    .single()

  if (!tokenData) return NextResponse.json({ error: 'Ungültiger Link' }, { status: 404 })
  if (tokenData.status !== 'pending') return NextResponse.json({ error: 'Bereits verwendet' }, { status: 410 })
  if (new Date(tokenData.expires_at) < new Date()) return NextResponse.json({ error: 'Abgelaufen' }, { status: 410 })

  const isRescheduled = action === 'reschedule'
  const confirmedDate = isRescheduled ? proposed_date : null

  // Load all needed data
  const [{ data: report }, { data: contractor }, { data: org }, { data: { users } }] = await Promise.all([
    adminClient.from('damage_reports')
      .select('case_number, title, reporter_id, preferred_appointment')
      .eq('id', tokenData.damage_report_id)
      .single(),
    adminClient.from('contractors').select('name, company').eq('id', tokenData.contractor_id).single(),
    adminClient.from('organizations').select('name').eq('id', tokenData.organization_id).single(),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const finalDate = isRescheduled ? confirmedDate : report?.preferred_appointment
  const finalDateLabel = finalDate
    ? new Date(finalDate).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Termin folgt'

  // Load current status for history
  const { data: currentDR } = await adminClient
    .from('damage_reports')
    .select('status')
    .eq('id', tokenData.damage_report_id)
    .single()

  // Update token
  await adminClient.from('appointment_tokens').update({
    status: isRescheduled ? 'rescheduled' : 'confirmed',
    proposed_date: finalDate,
    responded_at: new Date().toISOString(),
  }).eq('token', token)

  // Update damage report
  await adminClient.from('damage_reports').update({
    status: 'termin_vereinbart',
    scheduled_appointment: finalDate,
    updated_at: new Date().toISOString(),
  }).eq('id', tokenData.damage_report_id)

  // Save to status history so portal shows confirmed date
  await adminClient.from('damage_report_status_history').insert({
    damage_report_id: tokenData.damage_report_id,
    old_status: currentDR?.status ?? null,
    new_status: 'termin_vereinbart',
    note: isRescheduled
      ? `Werkstatt schlägt neuen Termin vor: ${finalDateLabel}`
      : `Termin bestätigt: ${finalDateLabel}`,
    changed_by: null,
  })

  // Get HV admin emails
  const { data: hvProfiles } = await adminClient
    .from('profiles')
    .select('id')
    .eq('organization_id', tokenData.organization_id)
    .in('role', ['hv_admin', 'hv_mitarbeiter'])
    .eq('is_deleted', false)

  const hvIds = new Set((hvProfiles || []).map((p: any) => p.id))
  const hvEmails = (users || []).filter((u: any) => hvIds.has(u.id) && u.email).map((u: any) => u.email)

  // Get tenant email
  const tenantUser = users?.find((u: any) => u.id === report?.reporter_id)
  const { data: tenantProfile } = await adminClient.from('profiles').select('first_name, last_name').eq('id', report?.reporter_id).single()
  const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'

  // Send emails
  await sendTerminBestaetigung({
    hvEmails,
    tenantEmail: tenantUser?.email || null,
    tenantName,
    caseNumber: report?.case_number || '',
    caseTitle: report?.title || '',
    contractorCompany: contractor?.company || '',
    confirmedDate: finalDateLabel,
    isRescheduled,
    orgName: org?.name || 'Hausverwaltung',
  })

  return NextResponse.json({ success: true, isRescheduled, confirmedDate: finalDateLabel })
}
