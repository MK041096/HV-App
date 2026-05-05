import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

// Liefert: signed URL der Mietvertrag-PDF + CARL's Mietvertrag-Hinweis
// Tenant-isoliert: prüft Auth + organization_id + Role
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (!profile || !['hv_admin', 'hv_mitarbeiter'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Case + Unit_id + KI-Analyse-Text laden (für MIETVERTRAG_HINWEIS)
    const { data: report } = await adminClient
      .from('damage_reports')
      .select('id, unit_id, ki_analyse_result')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    if (!report.unit_id) {
      return NextResponse.json({ error: 'Keine Wohneinheit zugeordnet' }, { status: 404 })
    }

    // Mietvertrag der Unit finden
    const { data: docs } = await adminClient
      .from('documents')
      .select('id, name, file_path, mime_type')
      .eq('organization_id', profile.organization_id)
      .eq('unit_id', report.unit_id)
      .eq('document_type', 'mietvertrag')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!docs) {
      return NextResponse.json({ error: 'Kein Mietvertrag hinterlegt' }, { status: 404 })
    }

    if (docs.mime_type !== 'application/pdf') {
      return NextResponse.json({ error: 'Mietvertrag liegt nicht als PDF vor' }, { status: 400 })
    }

    // Signed URL erstellen (5 Min gültig)
    const { data: signed, error: signErr } = await adminClient.storage
      .from('documents')
      .createSignedUrl(docs.file_path, 300)

    if (signErr || !signed?.signedUrl) {
      console.error('Signed URL Fehler:', signErr)
      return NextResponse.json({ error: 'Fehler beim Laden des Mietvertrags' }, { status: 500 })
    }

    // CARL-Hinweis aus ki_analyse_result extrahieren (MIETVERTRAG_HINWEIS-Feld)
    let hint: string | null = null
    if (report.ki_analyse_result) {
      const match = report.ki_analyse_result.match(/^MIETVERTRAG_HINWEIS:\s*([\s\S]+?)(?:\n[A-ZÜÄÖ_]{3,}:|$)/mi)
      if (match) hint = match[1].trim()
    }

    return NextResponse.json({
      name: docs.name,
      pdfUrl: signed.signedUrl,
      hint,
    })
  } catch (err) {
    console.error('Mietvertrag-PDF Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
