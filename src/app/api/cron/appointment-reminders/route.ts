import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendWerkstattErinnerung } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Find all pending tokens older than 24h without reminder
  const { data: tokens, error } = await adminClient
    .from('appointment_tokens')
    .select('id, damage_report_id, organization_id, contractor_id')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .is('reminder_sent_at', null)
    .limit(50)

  if (error) {
    console.error('[cron] appointment-reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  let processed = 0

  for (const token of tokens) {
    try {
      const [{ data: report }, { data: contractor }, { data: org }] = await Promise.all([
        adminClient.from('damage_reports')
          .select('case_number, title, reporter_id')
          .eq('id', token.damage_report_id)
          .single(),
        adminClient.from('contractors')
          .select('name, company, phone')
          .eq('id', token.contractor_id)
          .single(),
        adminClient.from('organizations')
          .select('name')
          .eq('id', token.organization_id)
          .single(),
      ])

      if (!report || !contractor || !org) continue

      const { data: hvProfiles } = await adminClient
        .from('profiles')
        .select('id')
        .eq('organization_id', token.organization_id)
        .in('role', ['hv_admin', 'hv_mitarbeiter'])
        .eq('is_deleted', false)

      const hvIds = new Set((hvProfiles || []).map((p: any) => p.id))
      const hvEmails = (users || []).filter((u: any) => hvIds.has(u.id) && u.email).map((u: any) => u.email as string)

      const tenantUser = users?.find((u: any) => u.id === report.reporter_id)
      const { data: tenantProfile } = await adminClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', report.reporter_id)
        .single()
      const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'

      await sendWerkstattErinnerung({
        hvEmails,
        tenantEmail: tenantUser?.email || null,
        tenantName,
        caseNumber: report.case_number || '',
        caseTitle: report.title || '',
        contractorCompany: (contractor as any).company || '',
        contractorPhone: (contractor as any).phone || null,
        reportId: token.damage_report_id,
        orgName: org.name || 'Hausverwaltung',
      })

      await adminClient
        .from('appointment_tokens')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', token.id)

      processed++
    } catch (err) {
      console.error('[cron] error processing token', token.id, err)
    }
  }

  return NextResponse.json({ processed })
}
