'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldCheck,
  Upload,
  Download,
  Trash2,
  Plus,
  File,
  Info,
  Brain,
} from 'lucide-react'

interface VersicherungsDoc {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  document_type: string
  created_at: string
  unit: null
  uploader: { first_name: string | null; last_name: string | null } | null
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function VersicherungenPage() {
  const [docs, setDocs] = useState<VersicherungsDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadDocs() }, [])

  async function loadDocs() {
    setLoading(true)
    try {
      const res = await fetch('/api/documents?document_type=versicherung&no_unit=true')
      const data = await res.json()
      // Filter client-side: only docs without unit_id (org-level)
      const allRes = await fetch('/api/documents')
      const allData = await allRes.json()
      const versicherungDocs = (allData.data || []).filter(
        (d: VersicherungsDoc) => d.document_type === 'versicherung' && d.unit === null
      )
      setDocs(versicherungDocs)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const name = docName.trim() || `Versicherungspolice ${new Date().toLocaleDateString('de-AT')}`

      // 1. Upload file
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

      // 2. Save metadata (no unit_id = org-level document)
      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          file_path: uploadData.file_path,
          file_size: uploadData.file_size,
          mime_type: uploadData.mime_type,
          document_type: 'versicherung',
          unit_id: null,
        }),
      })
      if (!metaRes.ok) { alert('Fehler beim Speichern'); return }

      setSelectedFile(null)
      setDocName('')
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadDocs()
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(doc: VersicherungsDoc) {
    const res = await fetch(`/api/documents/${doc.id}`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    else alert('Download-Link konnte nicht erstellt werden')
  }

  async function handleDelete(id: string) {
    if (!confirm('Versicherungspolice wirklich löschen?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            Versicherungspolizen
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hinterlegte Polizen werden bei der KI-Analyse automatisch berücksichtigt
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Police hochladen
        </Button>
      </div>

      {/* KI-Hinweis */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <Brain className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">KI-Analyse liest Ihre Versicherungspolice automatisch</p>
            <p className="mt-1 text-blue-700">
              Sobald eine Police hinterlegt ist, analysiert die KI bei jeder Schadensmeldung ob und
              welche Versicherung zuständig ist — und zitiert direkt aus Ihrer Police.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Neue Versicherungspolice hochladen
            </CardTitle>
            <CardDescription>
              PDF der Gebäudeversicherung, Haftpflicht oder sonstigen Police hochladen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bezeichnung der Police</Label>
              <Input
                placeholder="z.B. Gebäudeversicherung Wiener Städtische 2025"
                value={docName}
                onChange={e => setDocName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Datei (PDF — max. 20 MB)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info: what to upload */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Welche Polizen sind sinnvoll?</p>
              <ul className="space-y-0.5 ml-2">
                <li>• <strong>Gebäudeversicherung</strong> — Schäden durch Sturm, Leitungswasser, Feuer, Hagel</li>
                <li>• <strong>Haftpflichtversicherung</strong> — Schäden der Hausverwaltung gegenüber Dritten</li>
                <li>• <strong>Rechtsschutzversicherung</strong> — bei Streitigkeiten mit Mietern</li>
                <li>• <strong>Elementarschadenversicherung</strong> — Überschwemmung, Erdrutsch</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Noch keine Versicherungspolice hinterlegt</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Laden Sie Ihre Gebäudeversicherung hoch — die KI-Analyse wird dann automatisch
              prüfen ob der jeweilige Schaden versichert ist.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Jetzt hochladen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <Card key={doc.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="flex items-center justify-between py-4 px-6">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100 shrink-0">
                    <File className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Versicherungspolice
                      </Badge>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
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
