import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const MAX_SIZE = 20 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// POST /api/admin/organizations/[id]/upload-document
// Platform admin uploads a document on behalf of an organization
// Body: multipart/form-data with fields: file, name, document_type, liegenschaft (optional)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'platform_admin') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

    const { data: org } = await adminSupabase.from('organizations').select('id, name').eq('id', orgId).single()
    if (!org) return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docName = formData.get('name') as string | null
    const docType = (formData.get('document_type') as string | null) || 'sonstiges'
    const liegenschaft = (formData.get('liegenschaft') as string | null) || null

    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 20 MB)' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Nur PDF, JPG und PNG erlaubt' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'pdf'
    const filePath = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await adminSupabase.storage
      .from('documents')
      .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: doc, error: dbError } = await adminSupabase.from('documents').insert({
      organization_id: orgId,
      uploaded_by: user.id,
      name: docName || file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      document_type: docType,
      liegenschaft: liegenschaft || null,
      unit_id: null,
    }).select('id, name, document_type, created_at').single()

    if (dbError) throw dbError

    await adminSupabase.from('audit_logs').insert({
      user_id: user.id, organization_id: orgId, action: 'admin_document_uploaded', entity_type: 'document', entity_id: doc.id,
      details: { file_name: file.name, document_type: docType, performed_by: 'platform_admin' },
    })

    return NextResponse.json({ data: doc })
  } catch (err) {
    console.error('Admin upload-document error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
