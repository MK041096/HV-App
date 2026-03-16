import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

async function getHvProfile(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .eq('is_deleted', false)
    .single()
  if (!profile) return null
  if (!['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) return null
  return profile
}

// POST /api/hv/cases/[id]/invoice — Upload contractor invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })

    const profile = await getHvProfile(supabase, user.id)
    if (!profile) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    // Verify case belongs to org
    const { data: report } = await supabase
      .from('damage_reports')
      .select('id, case_number, invoice_path')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ungültiger Dateityp. Erlaubt: PDF, JPG, PNG' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Datei zu groß (max. 10 MB)' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Delete old invoice if exists
    if (report.invoice_path) {
      await adminClient.storage.from('invoices').remove([report.invoice_path])
    }

    // Build storage path
    const ext = file.name.split('.').pop() || 'pdf'
    const storagePath = `${profile.organization_id}/${id}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await adminClient.storage
      .from('invoices')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Invoice upload error:', uploadError)
      return NextResponse.json({ error: 'Fehler beim Hochladen der Rechnung' }, { status: 500 })
    }

    // Save path to damage_report
    const { error: updateError } = await adminClient
      .from('damage_reports')
      .update({
        invoice_path: storagePath,
        invoice_filename: file.name,
        invoice_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error saving invoice path:', updateError)
      return NextResponse.json({ error: 'Fehler beim Speichern der Rechnung' }, { status: 500 })
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'invoice_uploaded',
      entity_type: 'damage_report',
      entity_id: id,
      details: { filename: file.name, size: file.size },
    })

    // Return signed URL for immediate display
    const { data: signedData } = await adminClient.storage
      .from('invoices')
      .createSignedUrl(storagePath, 1800)

    return NextResponse.json({
      data: {
        invoice_path: storagePath,
        invoice_filename: file.name,
        invoice_uploaded_at: new Date().toISOString(),
        signed_url: signedData?.signedUrl || null,
      },
      message: 'Rechnung erfolgreich hochgeladen',
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/hv/cases/[id]/invoice — Remove invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })

    const profile = await getHvProfile(supabase, user.id)
    if (!profile) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    const adminClient = createAdminClient()

    const { data: report } = await adminClient
      .from('damage_reports')
      .select('id, invoice_path, invoice_filename')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    if (!report.invoice_path) return NextResponse.json({ error: 'Keine Rechnung vorhanden' }, { status: 404 })

    // Delete from storage
    await adminClient.storage.from('invoices').remove([report.invoice_path])

    // Clear from DB
    await adminClient
      .from('damage_reports')
      .update({
        invoice_path: null,
        invoice_filename: null,
        invoice_uploaded_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Audit log
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'invoice_deleted',
      entity_type: 'damage_report',
      entity_id: id,
      details: { filename: report.invoice_filename },
    })

    return NextResponse.json({ message: 'Rechnung erfolgreich entfernt' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// GET /api/hv/cases/[id]/invoice — Get signed URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })

    const profile = await getHvProfile(supabase, user.id)
    if (!profile) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

    const adminClient = createAdminClient()

    const { data: report } = await adminClient
      .from('damage_reports')
      .select('invoice_path, invoice_filename, invoice_uploaded_at')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    if (!report.invoice_path) return NextResponse.json({ data: null })

    const { data: signedData } = await adminClient.storage
      .from('invoices')
      .createSignedUrl(report.invoice_path, 1800)

    return NextResponse.json({
      data: {
        invoice_path: report.invoice_path,
        invoice_filename: report.invoice_filename,
        invoice_uploaded_at: report.invoice_uploaded_at,
        signed_url: signedData?.signedUrl || null,
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
