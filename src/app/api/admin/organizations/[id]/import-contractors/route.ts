import { deriveSpecialties } from '@/lib/contractors'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendWerkstattWillkommensmail } from '@/lib/email'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const COL_COMPANY     = ['firmenname', 'firma', 'unternehmen', 'company', 'betrieb', 'name']
const COL_PHONE       = ['telefon', 'tel', 'phone', 'mobil', 'handy', 'telefonnummer']
const COL_EMAIL       = ['email', 'e-mail', 'mail', 'emailadresse']
const COL_TAETIGKEIT  = ['tätigkeit', 'taetigkeit', 'leistung', 'fachgebiet', 'gewerk', 'spezialisierung']
const COL_BESCHREIBUNG = ['beschreibung', 'notiz', 'notes', 'anmerkung', 'kommentar', 'info']

function normalize(s: string): string { return s.toLowerCase().trim() }
function findCol(headers: string[], aliases: string[]): number {
  const exact = headers.findIndex(h => aliases.includes(normalize(h)))
  if (exact !== -1) return exact
  return headers.findIndex(h => { const n = normalize(h); return aliases.some(a => n.includes(a) || a.includes(n)) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'platform_admin') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

    const { data: org } = await adminSupabase.from('organizations').select('id, name, phone').eq('id', orgId).single()
    if (!org) return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 5 MB)' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json({ error: 'Nur .xlsx, .xls und .csv erlaubt' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return NextResponse.json({ error: 'Leere Datei' }, { status: 400 })

    const rows: string[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false }) as string[][]
    if (rows.length < 2) return NextResponse.json({ error: 'Keine Daten gefunden' }, { status: 400 })

    const headers = (rows[0] || []).map(String)
    const colCompany      = findCol(headers, COL_COMPANY)
    const colPhone        = findCol(headers, COL_PHONE)
    const colEmail        = findCol(headers, COL_EMAIL)
    const colTaetigkeit   = findCol(headers, COL_TAETIGKEIT)
    const colBeschreibung = findCol(headers, COL_BESCHREIBUNG)

    if (colCompany === -1) {
      return NextResponse.json({ error: `Firmenname-Spalte nicht gefunden. Spalten: ${headers.join(', ')}` }, { status: 400 })
    }

    const { data: existing } = await adminSupabase.from('contractors').select('name, phone').eq('organization_id', orgId).eq('is_active', true).limit(2000)
    const existingKeys = new Set((existing || []).map(c => `${c.name?.toLowerCase()}|${c.phone?.toLowerCase() || ''}`))

    const result = { contractors_created: 0, contractors_skipped: 0, errors: [] as { row: number; message: string }[] }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || []
      const company = row[colCompany]?.toString().trim()
      if (!company) continue

      const phone       = colPhone        >= 0 ? row[colPhone]?.toString().trim()              || null : null
      const email       = colEmail        >= 0 ? row[colEmail]?.toString().trim().toLowerCase() || null : null
      const taetigkeit  = colTaetigkeit   >= 0 ? row[colTaetigkeit]?.toString().trim()         || null : null
      const beschreibung = colBeschreibung >= 0 ? row[colBeschreibung]?.toString().trim()       || null : null

      if (!phone) { result.errors.push({ row: i + 1, message: `"${company}": Telefonnummer fehlt` }); continue }
      if (!email) { result.errors.push({ row: i + 1, message: `"${company}": E-Mail fehlt` }); continue }
      if (!taetigkeit) { result.errors.push({ row: i + 1, message: `"${company}": Tätigkeit fehlt` }); continue }

      const key = `${company.toLowerCase()}|${phone.toLowerCase()}`
      if (existingKeys.has(key)) { result.contractors_skipped++; continue }

      const notes = beschreibung ? `${taetigkeit}\n${beschreibung}` : taetigkeit
      const { error: insertErr } = await adminSupabase.from('contractors').insert({
        organization_id: orgId, name: company, company, phone, email, specialties: deriveSpecialties(notes), notes, is_active: true,
      })

      if (insertErr) { result.errors.push({ row: i + 1, message: `"${company}": ${insertErr.message}` }); continue }
      result.contractors_created++
      existingKeys.add(key)

      sendWerkstattWillkommensmail({ to: email, contractorName: company, orgName: org.name, orgPhone: org.phone || undefined }).catch(() => {})
    }

    await adminSupabase.from('audit_logs').insert({
      user_id: user.id, organization_id: orgId, action: 'admin_contractors_imported', entity_type: 'contractor', entity_id: orgId,
      details: { file_name: file.name, ...result, errors: result.errors.length, performed_by: 'platform_admin' },
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('Admin import-contractors error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
