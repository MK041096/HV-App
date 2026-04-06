import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import crypto from 'crypto'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendTenantInviteEmail } from '@/lib/email'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const COL_UNIT = ['einheit', 'wohnung', 'wohneinheit', 'unit', 'name', 'bezeichnung', 'objekt', 'apartment', 'wohnungsnummer', 'einheitsnummer', 'top', 'top-nr', 'top nr', 'nr', 'nummer']
const COL_ADDRESS = ['adresse', 'address', 'strasse', 'straße', 'anschrift', 'wohnadresse', 'objektadresse']
const COL_FLOOR = ['stockwerk', 'etage', 'floor', 'geschoss', 'stiege', 'ebene', 'stock']
const COL_EMAIL = ['email', 'e-mail', 'mail', 'mieter email', 'mieter e-mail', 'emailadresse']
const COL_FIRST_NAME = ['vorname', 'first name', 'firstname', 'mieter vorname', 'vname']
const COL_LAST_NAME = ['nachname', 'last name', 'lastname', 'familienname', 'mieter nachname', 'zuname']
const COL_FULL_NAME = ['mieter', 'tenant', 'bewohner', 'mieter name', 'vollständiger name', 'full name', 'mietername']

function normalize(s: string): string { return s.toLowerCase().trim() }
function findCol(headers: string[], aliases: string[]): number {
  const exact = headers.findIndex((h) => aliases.includes(normalize(h)))
  if (exact !== -1) return exact
  return headers.findIndex((h) => { const n = normalize(h); return aliases.some((a) => n.includes(a)) })
}

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length]
  return code
}

interface ImportRow {
  rowIndex: number
  unitName: string
  address: string | null
  floor: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
}

// POST /api/admin/organizations/[id]/import-units
// Platform admin imports units on behalf of an organization (support use case)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orgId } = await params

    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    // Verify platform_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'platform_admin') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

    // Verify org exists
    const { data: org } = await adminSupabase.from('organizations').select('id, name').eq('id', orgId).single()
    if (!org) return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })

    // Parse file
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 5 MB)' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json({ error: 'Ungültiges Format. Nur .xlsx, .xls und .csv erlaubt.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return NextResponse.json({ error: 'Leere Datei' }, { status: 400 })

    const sheet = workbook.Sheets[sheetName]
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][]
    if (rows.length < 2) return NextResponse.json({ error: 'Keine Daten gefunden (Kopfzeile + mind. 1 Zeile benötigt)' }, { status: 400 })

    const headers = (rows[0] || []).map(String)
    const colUnit      = findCol(headers, COL_UNIT)
    const colAddress   = findCol(headers, COL_ADDRESS)
    const colFloor     = findCol(headers, COL_FLOOR)
    const colEmail     = findCol(headers, COL_EMAIL)
    const colFirstName = findCol(headers, COL_FIRST_NAME)
    const colLastName  = findCol(headers, COL_LAST_NAME)
    const colFullName  = findCol(headers, COL_FULL_NAME)

    if (colUnit === -1) {
      return NextResponse.json({ error: `Einheiten-Spalte nicht erkannt. Gefundene Spalten: ${headers.join(', ')}` }, { status: 400 })
    }

    const importRows: ImportRow[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || []
      const unitName = row[colUnit]?.toString().trim()
      if (!unitName) continue

      let firstName: string | null = colFirstName >= 0 ? row[colFirstName]?.toString().trim() || null : null
      let lastName: string | null = colLastName >= 0 ? row[colLastName]?.toString().trim() || null : null
      if (!firstName && !lastName && colFullName >= 0) {
        const fullName = row[colFullName]?.toString().trim() || null
        if (fullName) {
          const parts = fullName.split(' ')
          firstName = parts[0]
          lastName = parts.length >= 2 ? parts.slice(1).join(' ') : null
        }
      }

      importRows.push({
        rowIndex: i + 1,
        unitName,
        address: colAddress >= 0 ? row[colAddress]?.toString().trim() || null : null,
        floor: colFloor >= 0 ? row[colFloor]?.toString().trim() || null : null,
        email: colEmail >= 0 ? row[colEmail]?.toString().trim().toLowerCase() || null : null,
        firstName,
        lastName,
      })
    }

    if (importRows.length === 0) return NextResponse.json({ error: 'Keine gültigen Zeilen gefunden' }, { status: 400 })
    if (importRows.length > 1000) return NextResponse.json({ error: 'Maximal 1000 Einheiten pro Import' }, { status: 400 })

    // Get existing unit names
    const { data: existingUnits } = await adminSupabase.from('units').select('name').eq('organization_id', orgId).eq('is_deleted', false).limit(2000)
    const existingNames = new Set((existingUnits || []).map((u) => u.name.toLowerCase().trim()))

    const result = { units_created: 0, units_skipped: 0, codes_generated: 0, emails_sent: 0, errors: [] as { row: number; message: string }[] }
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    const expiresAtStr = expiresAt.toISOString()

    function isValidEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }

    for (const row of importRows) {
      if (existingNames.has(row.unitName.toLowerCase())) { result.units_skipped++; continue }

      const { data: newUnit, error: unitError } = await adminSupabase.from('units')
        .insert({ organization_id: orgId, name: row.unitName, address: row.address, floor: row.floor, is_deleted: false })
        .select('id, name').single()

      if (unitError || !newUnit) {
        result.errors.push({ row: row.rowIndex, message: `"${row.unitName}": ${unitError?.message || 'Fehler'}` })
        continue
      }

      result.units_created++
      existingNames.add(row.unitName.toLowerCase())

      // Activation code
      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateActivationCode()
        const { data: existing } = await adminSupabase.from('activation_codes').select('id').eq('code', candidate).limit(1)
        if (!existing || existing.length === 0) { code = candidate; break }
      }

      if (!code) { result.errors.push({ row: row.rowIndex, message: `Code für "${row.unitName}" nicht generiert` }); continue }

      const { error: codeError } = await adminSupabase.from('activation_codes').insert({
        organization_id: orgId, unit_id: newUnit.id, code, status: 'pending',
        expires_at: expiresAtStr, created_by: user.id,
        invited_email: row.email || null, invited_first_name: row.firstName || null, invited_last_name: row.lastName || null,
      })

      if (codeError) { result.errors.push({ row: row.rowIndex, message: `Code für "${row.unitName}" nicht gespeichert` }); continue }
      result.codes_generated++

      if (row.email) {
        if (!isValidEmail(row.email)) { result.errors.push({ row: row.rowIndex, message: `Ungültige E-Mail: ${row.email}` }); continue }
        const tenantName = row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.firstName || row.lastName || null
        try {
          await sendTenantInviteEmail({ to: row.email, tenantName, activationCode: code, expiresAt: expiresAtStr, orgName: org.name, unitName: newUnit.name })
          result.emails_sent++
        } catch {
          result.errors.push({ row: row.rowIndex, message: `E-Mail an ${row.email} fehlgeschlagen` })
        }
      }
    }

    // Audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id, organization_id: orgId, action: 'admin_units_imported', entity_type: 'unit', entity_id: orgId,
      details: { file_name: file.name, rows_total: importRows.length, ...result, errors: result.errors.length, performed_by: 'platform_admin' },
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('Admin import-units error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
