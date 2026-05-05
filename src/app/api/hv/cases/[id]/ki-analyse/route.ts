import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { runKiAnalyse } from '@/lib/ki-analyse'

// Maximale Funktionslaufzeit erhöhen — PDF-Parse + Claude können bis zu 60s brauchen
export const maxDuration = 120

// HV triggert manuell oder beim Öffnen einer Meldung ohne Analyse die CARL-Analyse.
// Diese Route nutzt seit PROJ-23 dieselbe runKiAnalyse-Library wie die Auto-Analyse
// nach Mieter-POST — damit identischer Output, identische Felder, identischer Prompt.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    // Case + Unit + Reporter laden — minimal, nur was runKiAnalyse braucht
    const { data: caseData, error: caseError } = await adminClient
      .from('damage_reports')
      .select(`
        id, title, description, category, subcategory, room, unit_id, reporter_id,
        unit:units(id, name, address),
        reporter:profiles!damage_reports_reporter_id_fkey(first_name, last_name, phone)
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    const unit = (Array.isArray(caseData.unit) ? caseData.unit[0] : caseData.unit) as { id: string; name: string; address: string | null } | null
    const reporter = (Array.isArray(caseData.reporter) ? caseData.reporter[0] : caseData.reporter) as { first_name: string | null; last_name: string | null; phone: string | null } | null

    const tenantName = [reporter?.first_name, reporter?.last_name].filter(Boolean).join(' ') || null

    const result = await runKiAnalyse({
      supabase: adminClient,
      organizationId: profile.organization_id,
      reportId: caseData.id,
      title: caseData.title,
      description: caseData.description,
      category: caseData.category,
      subcategory: caseData.subcategory,
      room: caseData.room,
      unitId: caseData.unit_id || unit?.id || null,
      unitName: unit?.name || null,
      unitAddress: unit?.address || null,
      tenantName,
      tenantPhone: reporter?.phone || null,
    })

    return NextResponse.json({
      result: result.analysisText,
      lease_found: result.leaseFound,
      insurance_found: result.insuranceFound,
      photo_count: result.photoCount,
      recommended_contractor_id: result.recommendedContractorId,
    })
  } catch (err) {
    console.error('KI-Analyse error:', err)
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen' }, { status: 500 })
  }
}
