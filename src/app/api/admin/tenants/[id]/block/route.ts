import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { z } from 'zod'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const blockSchema = z.object({
  action: z.enum(['block_1day', 'block_1week', 'unblock']),
})

// POST /api/admin/tenants/[id]/block
// Platform-Admin kann jeden Mieter sperren/entsperren (ohne Org-Zugehörigkeit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminClient()
    const { id: tenantId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    if (!UUID_REGEX.test(tenantId)) {
      return NextResponse.json({ error: 'Ungültige Mieter-ID' }, { status: 400 })
    }

    // Nur platform_admin darf diesen Endpunkt nutzen
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!adminProfile || adminProfile.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = blockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }

    const { action } = parsed.data

    // Mieter laden (ohne Org-Filter — Admin sieht alle)
    const { data: tenant } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, organization_id, role')
      .eq('id', tenantId)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
    }

    let blockedUntil: string | null = null
    let auditAction = ''
    let message = ''

    if (action === 'block_1day') {
      const until = new Date()
      until.setDate(until.getDate() + 1)
      blockedUntil = until.toISOString()
      auditAction = 'tenant_blocked_by_admin'
      message = `Mieter ${[tenant.first_name, tenant.last_name].filter(Boolean).join(' ')} wurde für 1 Tag gesperrt.`
    } else if (action === 'block_1week') {
      const until = new Date()
      until.setDate(until.getDate() + 7)
      blockedUntil = until.toISOString()
      auditAction = 'tenant_blocked_by_admin'
      message = `Mieter ${[tenant.first_name, tenant.last_name].filter(Boolean).join(' ')} wurde für 1 Woche gesperrt.`
    } else {
      auditAction = 'tenant_unblocked_by_admin'
      message = `Sperre für Mieter ${[tenant.first_name, tenant.last_name].filter(Boolean).join(' ')} wurde aufgehoben.`
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ blocked_until: blockedUntil })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error blocking tenant:', updateError)
      return NextResponse.json({ error: 'Fehler beim Sperren des Mieters' }, { status: 500 })
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      organization_id: tenant.organization_id,
      action: auditAction,
      entity_type: 'profile',
      entity_id: tenantId,
      details: {
        tenant_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' '),
        action,
        blocked_until: blockedUntil,
        performed_by: 'platform_admin',
      },
    })

    return NextResponse.json({ message, blocked_until: blockedUntil })
  } catch (err) {
    console.error('Admin block error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
