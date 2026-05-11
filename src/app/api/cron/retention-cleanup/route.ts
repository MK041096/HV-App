// PROJ-29 Teil 2: Retention-Cleanup für DSGVO Art. 5 (Datensparsamkeit).
// Läuft monatlich. Entfernt Daten nach Ablauf der gesetzlichen Aufbewahrungsfristen:
// - Schadensmeldungen (status=erledigt/abgelehnt) älter als 7 Jahre (§ 132 BAO) → Hard-Delete
// - Audit-Logs älter als 1 Jahr
// - Login-Attempts / Rate-Limit-Attempts älter als 90 Tage
// - Abgeschlossene deletion_requests älter als 1 Jahr

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 300

const SEVEN_YEARS_MS = 7 * 365.25 * 24 * 60 * 60 * 1000
const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const now = Date.now()
  const cutoff7y = new Date(now - SEVEN_YEARS_MS).toISOString()
  const cutoff1y = new Date(now - ONE_YEAR_MS).toISOString()
  const cutoff90d = new Date(now - NINETY_DAYS_MS).toISOString()

  const result: Record<string, number | string> = {}
  const errors: { step: string; error: string }[] = []

  // 1. Alte abgeschlossene Schadensmeldungen identifizieren
  try {
    const { data: oldReports, error: queryErr } = await adminClient
      .from('damage_reports')
      .select('id')
      .in('status', ['erledigt', 'abgelehnt'])
      .lt('closed_at', cutoff7y)
      .limit(500)

    if (queryErr) throw queryErr
    const reportIds = (oldReports || []).map((r: { id: string }) => r.id)
    result.reports_due = reportIds.length

    if (reportIds.length > 0) {
      // Photos: Storage-Files vor DB-Delete entfernen
      const { data: photos } = await adminClient
        .from('damage_report_photos')
        .select('id, storage_path')
        .in('damage_report_id', reportIds)
      const photoPaths = (photos || [])
        .map((p: { storage_path: string | null }) => p.storage_path)
        .filter((p): p is string => !!p)
      if (photoPaths.length > 0) {
        const { error: storageErr } = await adminClient.storage
          .from('damage-photos')
          .remove(photoPaths)
        if (storageErr) console.warn('[retention] storage cleanup partial:', storageErr.message)
        result.storage_files_deleted = photoPaths.length
      }

      // Abhängige Tabellen löschen (FK-Reihenfolge)
      const deps = [
        'damage_report_photos',
        'damage_report_status_history',
        'damage_report_comments',
        'damage_report_ratings',
        'appointment_tokens',
      ]
      for (const tbl of deps) {
        const { error: depErr } = await adminClient
          .from(tbl)
          .delete()
          .in('damage_report_id', reportIds)
        if (depErr) console.warn(`[retention] ${tbl} cleanup:`, depErr.message)
      }

      const { error: rpErr } = await adminClient
        .from('damage_reports')
        .delete()
        .in('id', reportIds)
      if (rpErr) throw rpErr
      result.reports_deleted = reportIds.length
    } else {
      result.reports_deleted = 0
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push({ step: 'damage_reports', error: msg })
  }

  // 2. Audit-Logs > 1 Jahr
  try {
    const { count, error } = await adminClient
      .from('audit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff1y)
    if (error) throw error
    result.audit_logs_deleted = count ?? 0
  } catch (err) {
    errors.push({ step: 'audit_logs', error: err instanceof Error ? err.message : String(err) })
  }

  // 3. Login-Attempts > 90 Tage
  try {
    const { count, error } = await adminClient
      .from('login_attempts')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff90d)
    if (error) throw error
    result.login_attempts_deleted = count ?? 0
  } catch (err) {
    errors.push({ step: 'login_attempts', error: err instanceof Error ? err.message : String(err) })
  }

  // 4. Rate-Limit-Attempts > 90 Tage
  try {
    const { count, error } = await adminClient
      .from('rate_limit_attempts')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff90d)
    if (error) throw error
    result.rate_limit_attempts_deleted = count ?? 0
  } catch (err) {
    errors.push({ step: 'rate_limit_attempts', error: err instanceof Error ? err.message : String(err) })
  }

  // 5. Abgeschlossene deletion_requests > 1 Jahr
  try {
    const { count, error } = await adminClient
      .from('deletion_requests')
      .delete({ count: 'exact' })
      .eq('status', 'completed')
      .lt('completed_at', cutoff1y)
    if (error) throw error
    result.deletion_requests_archived = count ?? 0
  } catch (err) {
    errors.push({ step: 'deletion_requests', error: err instanceof Error ? err.message : String(err) })
  }

  // Audit-Log über diesen Cron-Lauf
  await adminClient.from('audit_logs').insert({
    user_id: null,
    organization_id: null,
    action: 'retention_cleanup_executed',
    entity_type: 'system',
    details: { ...result, errors: errors.length, errorDetails: errors },
  })

  return NextResponse.json({ ...result, errors: errors.length, errorDetails: errors })
}
