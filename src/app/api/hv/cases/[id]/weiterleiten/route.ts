import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendWeiterleitungTenantEmail, sendContractorEmail } from '@/lib/email'

// Extrahiert CARL's WERKSTATT_AUFTRAG-Feld aus dem ki_analyse_result-Text
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
    const { contractor_id, manual_contractor, scheduled_appointment, save_to_list, personal_note } = body

    // Either contractor_id (from list) or manual_contractor (name + email + phone) must be provided
    if (!contractor_id && (!manual_contractor?.name || !manual_contractor?.email || !manual_contractor?.phone)) {
      return NextResponse.json({ error: 'Name, E-Mail und Telefon sind bei manueller Eingabe Pflichtfelder' }, { status: 400 })
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

    // Load case + (optionally) contractor from DB
    const reportPromise = adminClient.from('damage_reports')
      .select('id, case_number, title, description, category, urgency, reporter_id, unit_id, preferred_appointment, preferred_appointment_2, ki_analyse_result')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    const contractorPromise = contractor_id
      ? adminClient.from('contractors')
          .select('id, name, company, email, phone')
          .eq('id', contractor_id)
          .eq('organization_id', profile.organization_id)
          .single()
      : Promise.resolve({ data: null, error: null })

    const [{ data: report }, { data: contractorFromDb }] = await Promise.all([reportPromise, contractorPromise])

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })

    // Build contractor object: from DB or from manual input
    const contractor = contractor_id
      ? contractorFromDb
      : {
          id: null,
          name: manual_contractor.name,
          company: manual_contractor.name,
          email: manual_contractor.email,
          phone: manual_contractor.phone,
          taetigkeit: manual_contractor.taetigkeit || null,
          beschreibung: manual_contractor.beschreibung || null,
        }

    if (!contractor) return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    if (!contractor.email) {
      return NextResponse.json(
        { error: 'Diese Werkstatt hat keine E-Mail-Adresse hinterlegt.' },
        { status: 400 }
      )
    }

    const appointmentDate = scheduled_appointment || report.preferred_appointment || null

    // Load current status
    const { data: currentStatusData } = await supabase
      .from('damage_reports')
      .select('status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    // Update damage report
    await supabase.from('damage_reports').update({
      status: 'warte_auf_handwerker',
      assigned_to_name: contractor.name,
      assigned_to_company: contractor.company,
      assigned_to_email: contractor.email,
      assigned_to_phone: contractor.phone,
      scheduled_appointment: appointmentDate,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    // Save to status history so portal shows who was assigned
    await supabase.from('damage_report_status_history').insert({
      damage_report_id: id,
      old_status: currentStatusData?.status ?? null,
      new_status: 'warte_auf_handwerker',
      note: `Weitergeleitet an ${contractor.company} (${contractor.name})`,
      changed_by: user.id,
    })

    // Create appointment token (contractor_id may be null for manual contractors)
    const { data: tokenData } = await adminClient.from('appointment_tokens').insert({
      damage_report_id: id,
      organization_id: profile.organization_id,
      ...(contractor_id ? { contractor_id } : {}),
    }).select('token').single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
    const tokenUrl = `${appUrl}/termin/${tokenData?.token}`

    // Save manual contractor to partners list if requested
    if (!contractor_id && save_to_list && contractor) {
      await adminClient.from('contractors').insert({
        organization_id: profile.organization_id,
        name: contractor.name,
        company: contractor.name,
        email: contractor.email,
        phone: (contractor as any).phone,
        description: (contractor as any).taetigkeit || null,
        notes: (contractor as any).beschreibung || null,
        is_active: true,
      }).then(({ error: insErr }) => {
        if (insErr) console.error('Contractor save-to-list Fehler:', insErr)
      })
    }

    // Mail-Versand mit waitUntil — Vercel sorgt dafür, dass die Tasks nicht abgebrochen werden
    waitUntil((async () => {
      try {
        const [{ data: tenantProfile }, { data: unit }, { data: org }, { data: { users } }] = await Promise.all([
          adminClient.from('profiles').select('id, first_name, last_name, phone').eq('id', report.reporter_id).single(),
          adminClient.from('units').select('name, address').eq('id', report.unit_id).single(),
          adminClient.from('organizations').select('name, phone').eq('id', profile.organization_id).single(),
          adminClient.auth.admin.listUsers({ perPage: 1000 }),
        ])

        const tenantUser = users?.find((u: any) => u.id === report.reporter_id)
        const tenantEmail = tenantUser?.email
        const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'
        const orgName = org?.name || 'Hausverwaltung'

        const formatDate = (d: string | null) => d
          ? new Date(d).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : null

        const wunschterminLabel = formatDate(report.preferred_appointment)
        const wunschtermin2Label = formatDate(report.preferred_appointment_2)
        const appointmentForTenant = formatDate(appointmentDate)

        await Promise.all([
          tenantEmail ? sendWeiterleitungTenantEmail({
            to: tenantEmail,
            tenantName,
            caseNumber: report.case_number,
            caseTitle: report.title,
            contractorName: contractor.name,
            contractorCompany: contractor.company,
            wunschtermin: appointmentForTenant,
            orgName,
          }) : Promise.resolve(),
          sendContractorEmail({
            to: contractor.email,
            contractorName: contractor.name,
            caseNumber: report.case_number,
            caseTitle: report.title,
            category: report.category,
            description: report.description,
            unitAddress: unit?.address || '',
            unitName: unit?.name || '',
            wunschtermin: wunschterminLabel,
            wunschtermin2: wunschtermin2Label,
            tokenUrl,
            orgName,
            orgPhone: (org as any)?.phone,
            personalNote: personal_note || null,
            werkstattAuftrag: extractWerkstattAuftrag(report.ki_analyse_result),
          }),
        ])
      } catch (err) {
        console.error('Weiterleiten E-Mail Fehler:', err)
      }
    })())

    return NextResponse.json({ success: true, token_url: tokenUrl })
  } catch (err) {
    console.error('Weiterleiten Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
