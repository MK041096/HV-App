'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  File,
} from 'lucide-react'

const DOC_TYPE_LABELS: Record<string, string> = {
  mietvertrag: 'Mietvertrag',
  hausordnung: 'Hausordnung',
  versicherung: 'Versicherung',
  rechnung: 'Rechnung',
  sonstiges: 'Sonstiges',
}

const DOC_TYPE_COLORS: Record<string, string> = {
  mietvertrag: 'bg-blue-100 text-blue-800',
  hausordnung: 'bg-yellow-100 text-yellow-800',
  versicherung: 'bg-green-100 text-green-800',
  rechnung: 'bg-orange-100 text-orange-800',
  sonstiges: 'bg-gray-100 text-gray-700',
}

interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  document_type: string
  created_at: string
  unit: { id: string; name: string } | null
  uploader: { first_name: string | null; last_name: string | null } | null
}

interface Unit {
  id: string
  name: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DokumentePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterUnit, setFilterUnit] = useState<string>('all')

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('mietvertrag')
  const [docUnit, setDocUnit] = useState('none')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const unitFromUrl = searchParams.get('unit_id')
    if (unitFromUrl) setFilterUnit(unitFromUrl)
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    if (!profile) return

    const [docsRes, unitsRes] = await Promise.all([
      fetch('/api/documents'),
      supabase.from('units').select('id, name').eq('organization_id', profile.organization_id).eq('is_deleted', false).order('name'),
    ])

    const docsData = await docsRes.json()
    setDocuments(docsData.data || [])
    setUnits(unitsRes.data || [])
    setLoading(false)
  }

  async function loadDocuments() {
    const url = filterUnit && filterUnit !== 'all' ? `/api/documents?unit_id=${filterUnit}` : '/api/documents'
    const res = await fetch(url)
    const data = await res.json()
    setDocuments(data.data || [])
  }

  useEffect(() => {
    if (!loading) loadDocuments()
  }, [filterUnit])

  async function handleUpload() {
    if (!selectedFile || !docName.trim()) return
    setUploading(true)
    try {
      // 1. Upload file
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

      // 2. Save metadata
      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName.trim(),
          file_path: uploadData.file_path,
          file_size: uploadData.file_size,
          mime_type: uploadData.mime_type,
          document_type: docType,
          unit_id: docUnit !== 'none' ? docUnit : null,
        }),
      })
      if (!metaRes.ok) { alert('Fehler beim Speichern'); return }

      // Reset form
      setSelectedFile(null)
      setDocName('')
      setDocType('mietvertrag')
      setDocUnit('none')
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadDocuments()
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(doc: Document) {
    const res = await fetch(`/api/documents/${doc.id}`)
    const data = await res.json()
    if (data.url) {
      window.open(data.url, '_blank')
    } else {
      alert('Download-Link konnte nicht erstellt werden')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Dokument wirklich löschen?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dokumente</h1>
          <p className="text-muted-foreground text-sm mt-1">Mietverträge, Hausordnungen und weitere Dokumente</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Dokument hochladen
        </Button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Neues Dokument
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dokumentenname *</Label>
                <Input
                  placeholder="z.B. Mietvertrag Mustermann"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dokumententyp</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Einheit (optional)</Label>
                <Select value={docUnit} onValueChange={setDocUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Einheit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Allgemein (keine Einheit)</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Datei * (PDF, JPG, PNG — max. 20 MB)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const f = e.target.files?.[0] || null
                    setSelectedFile(f)
                    if (f && !docName) setDocName(f.name.replace(/\.[^.]+$/, ''))
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !docName.trim()}>
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Filtern nach Einheit:</Label>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Dokumente</SelectItem>
            {units.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Noch keine Dokumente</p>
            <p className="text-sm text-muted-foreground mt-1">Laden Sie Mietverträge und andere Dokumente hoch</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <Card key={doc.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="flex items-center justify-between py-4 px-6">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DOC_TYPE_COLORS[doc.document_type] || DOC_TYPE_COLORS.sonstiges}`}>
                        {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </span>
                      {doc.unit && (
                        <span className="text-xs text-muted-foreground">{doc.unit.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString('de-AT')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
