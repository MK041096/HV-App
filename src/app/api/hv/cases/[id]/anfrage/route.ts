import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendAnfrageEmail } from '@/lib/email'

// POST /api/hv/cases/[id]/anfrage
// Sendet eine Anfrage-E-Mail an eine unbekannte Werkstatt (kein SMARTCARL-Branding)
// Body: { email: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const [{ data: report }, { data: org }] = await Promise.all([
      adminClient
        .from('damage_reports')
        .select(`
          id, case_number, title, description, category, urgency,
          preferred_appointment, preferred_appointment_2,
          unit:units(id, name, address)
        `)
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single(),
      adminClient
        .from('organizations')
        .select('name, phone, email')
        .eq('id', profile.organization_id)
        .single(),
    ])

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })

    const unit = report.unit as { id?: string; name?: string; address?: string } | null
    const unitAddress = unit?.address || 'Unbekannte Adresse'
    const unitName = unit?.name || 'Unbekannte Einheit'

    const CATEGORY_LABELS: Record<string, string> = {
      wasser: 'Wasserschaden', heizung: 'Heizung/Warmwasser', elektrik: 'Elektrik',
      fenster_tueren: 'Fenster/Türen', boeden: 'Böden', schimmel: 'Schimmel',
      sanitaer: 'Sanitär', sonstiges: 'Sonstiges',
    }

    const formatDate = (iso: string | null) => {
      if (!iso) return null
      return new Date(iso).toLocaleString('de-AT', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    }

    await sendAnfrageEmail({
      to: email.trim().toLowerCase(),
      caseNumber: report.case_number,
      caseTitle: report.title,
      category: CATEGORY_LABELS[report.category] || report.category,
      description: report.description || null,
      unitAddress,
      unitName,
      wunschtermin: formatDate(report.preferred_appointment),
      wunschtermin2: formatDate(report.preferred_appointment_2),
      orgName: org?.name || 'Hausverwaltung',
      orgPhone: org?.phone || undefined,
      orgEmail: org?.email || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Anfrage-E-Mail Fehler:', err)
    return NextResponse.json({ error: 'Fehler beim Senden der E-Mail' }, { status: 500 })
  }
}
