// PROJ-29 Teil 1: Hard-Delete-Cron für DSGVO Art. 17 Lösch-Anträge.
// Läuft täglich. Verarbeitet alle deletion_requests, deren scheduled_deletion_at <= NOW.
// Strategie: Anonymisierung des profile + Hard-Delete von auth.users.
// damage_reports/documents.reporter_id ist ON DELETE SET NULL — Inhalte bleiben (BAO 7 Jahre)
// aber sind nicht mehr einem Mieter zuordenbar.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 300

const ANON_FIRST_NAME = 'Gelöscht'
const ANON_LAST_NAME = '(DSGVO Art. 17)'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: requests, error: fetchError } = await adminClient
    .from('deletion_requests')
    .select('id, user_id, organization_id')
    .eq('status', 'pending')
    .lte('scheduled_deletion_at', nowIso)
    .limit(50)

  if (fetchError) {
    console.error('[cron] process-deletion-requests fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json({ processed: 0, due: 0 })
  }

  let processed = 0
  const errors: { id: string; user_id: string; error: string }[] = []

  for (const req of requests) {
    try {
      await adminClient
        .from('deletion_requests')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', req.id)

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          first_name: ANON_FIRST_NAME,
          last_name: ANON_LAST_NAME,
          phone: null,
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', req.user_id)
      if (profileError) throw new Error(`profile anonymize: ${profileError.message}`)

      await adminClient
        .from('damage_report_comments')
        .update({
          content: '[Inhalt nach DSGVO-Löschung anonymisiert]',
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('author_id', req.user_id)
        .eq('is_deleted', false)

      const { error: authError } = await adminClient.auth.admin.deleteUser(req.user_id)
      if (authError && !/not.found|user.not.found/i.test(authError.message)) {
        throw new Error(`auth delete: ${authError.message}`)
      }

      await adminClient
        .from('deletion_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.id)

      await adminClient.from('audit_logs').insert({
        user_id: req.user_id,
        organization_id: req.organization_id,
        action: 'deletion_executed',
        entity_type: 'profile',
        entity_id: req.user_id,
        details: { request_id: req.id, executed_at: new Date().toISOString() },
      })

      processed++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[cron] deletion-request ${req.id} failed:`, errorMsg)
      errors.push({ id: req.id, user_id: req.user_id, error: errorMsg })

      await adminClient
        .from('deletion_requests')
        .update({
          status: 'error',
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.id)

      await adminClient.from('audit_logs').insert({
        user_id: req.user_id,
        organization_id: req.organization_id,
        action: 'deletion_failed',
        entity_type: 'profile',
        entity_id: req.user_id,
        details: { request_id: req.id, error: errorMsg },
      })
    }
  }

  return NextResponse.json({
    processed,
    due: requests.length,
    errors: errors.length,
    errorDetails: errors,
  })
}
