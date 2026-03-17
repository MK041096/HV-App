'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Upload, CheckCircle2, XCircle, FileText, AlertTriangle, User, FileSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Unit {
  id: string
  name: string
  address: string | null
  tenant_name: string | null
}

interface FileMapping {
  file: File
  filename: string
  matchedUnit: Unit | null
  unitId: string | null
  matchMethod: 'pdf-content' | 'filename' | 'manual' | null
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/\.(pdf|jpg|jpeg|png)$/i, '')
    .replace(/[^a-z0-9äöüß]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

// Extract readable text from a PDF file (works for text-based PDFs)
async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const raw = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
  // Extract strings between ( and ) followed by Tj or TJ
  const matches = raw.match(/\(([^)]{1,200})\)\s*T[jJ]/g) || []
  return matches
    .map(m => m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, ''))
    .join(' ')
}

// Try to find a unit by searching for the tenant name inside PDF text
function findByTenantName(pdfText: string, units: Unit[]): Unit | null {
  const textNorm = pdfText.toLowerCase()
  for (const unit of units) {
    if (!unit.tenant_name) continue
    const nameParts = unit.tenant_name.toLowerCase().split(' ').filter(p => p.length > 2)
    if (nameParts.length === 0) continue
    // All name parts must appear in the PDF text
    const allFound = nameParts.every(part => textNorm.includes(part))
    if (allFound) return unit
  }
  return null
}

// Fallback: match by filename against unit name
function findByFilename(filename: string, units: Unit[]): Unit | null {
  const norm = normalize(filename)
  let bestUnit: Unit | null = null
  let bestScore = 0

  for (const unit of units) {
    const unitNorm = normalize(unit.name)
    if (unitNorm === norm) return unit
    if (norm.includes(unitNorm) || unitNorm.includes(norm)) {
      const score = Math.min(unitNorm.length, norm.length)
      if (score > bestScore) { bestScore = score; bestUnit = unit }
    }
    const normWords = new Set(norm.split(' '))
    const unitWords = unitNorm.split(' ')
    const overlap = unitWords.filter(w => normWords.has(w) && w.length > 1).length
    const score = overlap / Math.max(unitWords.length, 1)
    if (score > 0.5 && score > bestScore) { bestScore = score; bestUnit = unit }
  }
  return bestUnit
}

export default function BulkImportPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [mappings, setMappings] = useState<FileMapping[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => { loadUnits() }, [])

  async function loadUnits() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) return

    const { data: unitData } = await supabase
      .from('units')
      .select('id, name, address')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('name')

    if (!unitData) { setLoadingUnits(false); return }

    // Load tenant names for each unit
    const unitIds = unitData.map(u => u.id)
    const { data: tenants } = await supabase
      .from('profiles')
      .select('unit_id, first_name, last_name')
      .in('unit_id', unitIds)
      .eq('role', 'mieter')
      .eq('is_deleted', false)

    const tenantMap: Record<string, string> = {}
    for (const t of tenants || []) {
      if (t.unit_id) {
        tenantMap[t.unit_id] = [t.first_name, t.last_name].filter(Boolean).join(' ')
      }
    }

    // Also check activation_codes for pending (not yet registered) tenants
    const { data: codes } = await supabase
      .from('activation_codes')
      .select('unit_id, invited_first_name, invited_last_name')
      .in('unit_id', unitIds)
      .eq('status', 'pending')

    for (const c of codes || []) {
      if (c.unit_id && !tenantMap[c.unit_id]) {
        const name = [c.invited_first_name, c.invited_last_name].filter(Boolean).join(' ')
        if (name) tenantMap[c.unit_id] = name
      }
    }

    setUnits(unitData.map(u => ({ ...u, tenant_name: tenantMap[u.id] || null })))
    setLoadingUnits(false)
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setAnalyzing(true)
    setDone(false)
    setUploadProgress(0)

    const newMappings: FileMapping[] = await Promise.all(files.map(async file => {
      // 1. Try to extract tenant name from PDF content
      let matchedUnit: Unit | null = null
      let matchMethod: FileMapping['matchMethod'] = null

      try {
        const pdfText = await extractTextFromPdf(file)
        matchedUnit = findByTenantName(pdfText, units)
        if (matchedUnit) matchMethod = 'pdf-content'
      } catch {
        // PDF extraction failed, fall through to filename matching
      }

      // 2. Fallback: match by filename
      if (!matchedUnit) {
        matchedUnit = findByFilename(file.name, units)
        if (matchedUnit) matchMethod = 'filename'
      }

      return {
        file,
        filename: file.name,
        matchedUnit,
        unitId: matchedUnit?.id || null,
        matchMethod,
        status: 'pending' as const,
      }
    }))

    setMappings(newMappings)
    setAnalyzing(false)
  }

  function updateMapping(index: number, unitId: string) {
    setMappings(prev => prev.map((m, i) => {
      if (i !== index) return m
      const unit = unitId === 'none' ? null : (units.find(u => u.id === unitId) || null)
      return { ...m, unitId: unit?.id || null, matchedUnit: unit, matchMethod: 'manual' }
    }))
  }

  async function handleUploadAll() {
    const toUpload = mappings.filter(m => m.unitId)
    if (toUpload.length === 0) {
      alert('Bitte mindestens einer Datei eine Einheit zuweisen.')
      return
    }
    setUploading(true)
    let done = 0
    const updated = [...mappings]

    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i]
      if (!mapping.unitId) continue

      updated[i] = { ...updated[i], status: 'uploading' }
      setMappings([...updated])

      try {
        const formData = new FormData()
        formData.append('file', mapping.file)
        const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload fehlgeschlagen')

        const unit = units.find(u => u.id === mapping.unitId)
        const metaRes = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Mietvertrag – ${unit?.name || 'Unbekannt'}`,
            file_path: uploadData.file_path,
            file_size: uploadData.file_size,
            mime_type: uploadData.mime_type,
            document_type: 'mietvertrag',
            unit_id: mapping.unitId,
          }),
        })
        if (!metaRes.ok) throw new Error('Fehler beim Speichern')

        updated[i] = { ...updated[i], status: 'done' }
      } catch (err) {
        updated[i] = { ...updated[i], status: 'error', error: err instanceof Error ? err.message : 'Fehler' }
      }

      done++
      setUploadProgress(Math.round((done / toUpload.length) * 100))
      setMappings([...updated])
    }

    setUploading(false)
    setDone(true)
  }

  const matchedCount = mappings.filter(m => m.unitId).length
  const pdfMatchCount = mappings.filter(m => m.matchMethod === 'pdf-content').length
  const doneCount = mappings.filter(m => m.status === 'done').length
  const errorCount = mappings.filter(m => m.status === 'error').length

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" asChild>
          <Link href="/dashboard/dokumente">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück zu Dokumente
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Mietverträge Bulk-Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mehrere Mietverträge auf einmal hochladen — automatische Zuordnung per Mieternamens-Erkennung aus dem PDF
        </p>
      </div>

      {/* Step 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schritt 1: PDFs auswählen</CardTitle>
          <CardDescription>
            Das System liest den Mieternamen direkt aus dem PDF und ordnet es automatisch der richtigen Einheit zu.
            Der Dateiname spielt keine Rolle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".pdf"
            multiple
            disabled={loadingUnits || uploading || analyzing}
            onChange={handleFilesSelected}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
          />
          {loadingUnits && <p className="text-xs text-muted-foreground mt-2">Einheiten werden geladen...</p>}
          {analyzing && (
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">PDF-Inhalte werden analysiert...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 */}
      {mappings.length > 0 && !analyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schritt 2: Zuordnung prüfen</CardTitle>
            <CardDescription>
              {matchedCount} von {mappings.length} Dateien automatisch zugeordnet
              {pdfMatchCount > 0 && ` (${pdfMatchCount} per PDF-Inhalt erkannt)`}
              {' '}— bei Bedarf manuell anpassen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="shrink-0">
                  {mapping.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : mapping.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : mapping.status === 'uploading' ? (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mapping.filename}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {mapping.matchMethod === 'pdf-content' && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
                        <FileSearch className="h-3 w-3" /> aus PDF erkannt
                      </span>
                    )}
                    {mapping.matchMethod === 'filename' && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        per Dateiname
                      </span>
                    )}
                    {mapping.matchMethod === 'manual' && (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <User className="h-3 w-3" /> manuell
                      </span>
                    )}
                    {!mapping.unitId && (
                      <span className="text-xs text-red-500">nicht zugeordnet</span>
                    )}
                  </div>
                  {mapping.status === 'error' && (
                    <p className="text-xs text-red-600">{mapping.error}</p>
                  )}
                  {mapping.status === 'done' && (
                    <p className="text-xs text-green-600">Erfolgreich hochgeladen</p>
                  )}
                </div>
                <div className="shrink-0 w-56">
                  {mapping.status === 'pending' || mapping.status === 'error' ? (
                    <Select
                      value={mapping.unitId || 'none'}
                      onValueChange={v => updateMapping(index, v)}
                      disabled={uploading}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Einheit wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Nicht zuordnen —</SelectItem>
                        {units.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}{u.tenant_name ? ` (${u.tenant_name})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {mapping.matchedUnit?.name || '—'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-sm font-medium">Wird hochgeladen... {uploadProgress}%</p>
            <Progress value={uploadProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Done summary */}
      {done && (
        <Card className={errorCount > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            {errorCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            )}
            <div className="text-sm">
              <p className="font-medium">
                {doneCount} Mietvertrag{doneCount !== 1 ? 'e' : ''} erfolgreich hochgeladen
                {errorCount > 0 ? `, ${errorCount} fehlgeschlagen` : ''}
              </p>
              <p className="text-muted-foreground mt-0.5">
                Die Mietverträge sind jetzt den Einheiten zugeordnet und werden bei der KI-Analyse verwendet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action button */}
      {mappings.length > 0 && !done && !analyzing && (
        <div className="flex gap-3">
          <Button
            onClick={handleUploadAll}
            disabled={uploading || matchedCount === 0}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {matchedCount} Mietvertrag{matchedCount !== 1 ? 'e' : ''} hochladen
          </Button>
          <Button variant="outline" onClick={() => setMappings([])} disabled={uploading}>
            Zurücksetzen
          </Button>
        </div>
      )}

      {done && (
        <Button asChild>
          <Link href="/dashboard/dokumente">Zu Dokumente</Link>
        </Button>
      )}
    </div>
  )
}
