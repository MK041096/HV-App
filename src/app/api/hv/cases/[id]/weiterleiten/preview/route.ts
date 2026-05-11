import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { buildContractorEmail } from '@/lib/email'
import { extractLiegenschaftFromAddress } from '@/lib/liegenschaft'

function extractWerkstattAuftrag(analysisText: string | null | undefined): string | null {
  if (!analysisText) return null
  const m = analysisText.match(/^WERKSTATT_AUFTRAG:\s*([\s\S]+?)(?:\n[A-ZÜÄÖ_]{3,}:|$)/mi)
  if (!m) return null
  const v = m[1].trim()
  if (!v || v === 'NICHT_NOETIG' || v === 'NICHT_VERFUEGBAR') return null
  return v
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const body = await request.json()
    const { contractor_id, manual_contractor, personal_note } = body

    if (!contractor_id && (!manual_contractor?.name || !manual_contractor?.email)) {
      return NextResponse.json({ error: 'Werkstatt erforderlich' }, { status: 400 })
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

    const [{ data: report }, { data: contractorFromDb }, { data: org }] = await Promise.all([
      adminClient.from('damage_reports')
        .select('id, case_number, title, description, category, unit_id, preferred_appointment, preferred_appointment_2, ki_analyse_result')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single(),
      contractor_id
        ? adminClient.from('contractors')
            .select('id, name, company, email')
            .eq('id', contractor_id)
            .eq('organization_id', profile.organization_id)
            .single()
        : Promise.resolve({ data: null }),
      adminClient.from('organizations').select('name, phone').eq('id', profile.organization_id).single(),
    ])

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })

    const contractor = contractor_id
      ? contractorFromDb
      : { name: manual_contractor.name, company: manual_contractor.name, email: manual_contractor.email }

    if (!contractor) return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })

    const { data: unit } = await adminClient.from('units').select('name, address').eq('id', report.unit_id).single()

    // PROJ-24: Rechnungsadresse pro Liegenschaft laden
    let billingAddressForMail: {
      name: string; street: string; zip: string; city: string; country: string
      uid?: string | null; email?: string | null; reference?: string | null
    } | null = null
    if (unit?.address) {
      const liegenschaft = extractLiegenschaftFromAddress(unit.address)
      const { data: billing } = await adminClient
        .from('billing_addresses')
        .select('billing_name, billing_street, billing_zip, billing_city, billing_country, billing_uid, billing_email, billing_reference')
        .eq('organization_id', profile.organization_id)
        .eq('liegenschaft_address', liegenschaft)
        .eq('is_deleted', false)
        .maybeSingle()
      if (billing) {
        billingAddressForMail = {
          name: billing.billing_name,
          street: billing.billing_street,
          zip: billing.billing_zip,
          city: billing.billing_city,
          country: billing.billing_country,
          uid: billing.billing_uid,
          email: billing.billing_email,
          reference: billing.billing_reference,
        }
      }
    }

    const formatDate = (d: string | null) => d
      ? new Date(d).toLocaleString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vienna' })
      : null

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
    // Preview uses placeholder token — the real token is created at send time
    const tokenUrl = `${appUrl}/termin/PREVIEW`

    const { subject, html } = buildContractorEmail({
      to: contractor.email,
      contractorName: contractor.name,
      caseNumber: report.case_number,
      caseTitle: report.title,
      category: report.category,
      description: report.description,
      unitAddress: unit?.address || '',
      unitName: unit?.name || '',
      wunschtermin: formatDate(report.preferred_appointment),
      wunschtermin2: formatDate(report.preferred_appointment_2),
      tokenUrl,
      orgName: org?.name || 'Hausverwaltung',
      orgPhone: (org as any)?.phone,
      personalNote: personal_note || null,
      werkstattAuftrag: extractWerkstattAuftrag(report.ki_analyse_result),
      billingAddress: billingAddressForMail,
    })

    return NextResponse.json({
      to: contractor.email,
      subject,
      html,
    })
  } catch (err) {
    console.error('Preview Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
