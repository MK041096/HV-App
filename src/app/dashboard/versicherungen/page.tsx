'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Download,
  Trash2,
  Plus,
  File,
  Info,
  Brain,
  Building2,
} from 'lucide-react'

interface LiegenschaftDoc {
  id: string
  name: string
  created_at: string
}

interface Liegenschaft {
  address: string
  unitCount: number
  docs: LiegenschaftDoc[]
}

export default function VersicherungenPage() {
  const [liegenschaften, setLiegenschaften] = useState<Liegenschaft[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [selectedLiegenschaft, setSelectedLiegenschaft] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/hv/liegenschaften')
      const data = await res.json()
      setLiegenschaften(data.liegenschaften || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const name = docName.trim() || `Versicherungspolice ${new Date().toLocaleDateString('de-AT')}`

      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

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
          liegenschaft: selectedLiegenschaft || null,
        }),
      })
      if (!metaRes.ok) { alert('Fehler beim Speichern'); return }

      setSelectedFile(null)
      setDocName('')
      setSelectedLiegenschaft('')
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadData()
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(docId: string) {
    const res = await fetch(`/api/documents/${docId}`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    else alert('Download-Link konnte nicht erstellt werden')
  }

  function confirmDelete(doc: LiegenschaftDoc) {
    setDeleteTarget({ id: doc.id, name: doc.name })
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/documents/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteOpen(false)
    setDeleteTarget(null)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const totalPolicies = liegenschaften.reduce((sum, lg) => sum + lg.docs.length, 0)

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
            Polizen werden pro Liegenschaft hinterlegt — die KI wählt automatisch die richtige
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
            <p className="font-medium">KI-Analyse wählt automatisch die richtige Police</p>
            <p className="mt-1 text-blue-700">
              Bei einer Schadensmeldung erkennt die KI anhand der Adresse welche Liegenschaft
              betroffen ist und liest die passende Police aus.
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
              Wählen Sie die Liegenschaft aus, für die diese Police gilt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Liegenschaft *</Label>
              <Select value={selectedLiegenschaft} onValueChange={setSelectedLiegenschaft}>
                <SelectTrigger>
                  <SelectValue placeholder="Liegenschaft auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {liegenschaften.map(lg => (
                    <SelectItem key={lg.address} value={lg.address}>
                      {lg.address} ({lg.unitCount} {lg.unitCount === 1 ? 'Einheit' : 'Einheiten'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedLiegenschaft}
              >
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info box */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Welche Polizen sind sinnvoll?</p>
              <ul className="space-y-0.5 ml-2">
                <li>• <strong>Gebäudeversicherung</strong> — Sturm, Leitungswasser, Feuer, Hagel</li>
                <li>• <strong>Haftpflichtversicherung</strong> — Schäden gegenüber Dritten</li>
                <li>• <strong>Rechtsschutzversicherung</strong> — bei Streitigkeiten mit Mietern</li>
                <li>• <strong>Elementarschadenversicherung</strong> — Überschwemmung, Erdrutsch</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liegenschaft cards */}
      {liegenschaften.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Keine Liegenschaften gefunden</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Legen Sie zuerst Einheiten an — die Liegenschaften werden dann automatisch erkannt.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {liegenschaften.length} {liegenschaften.length === 1 ? 'Liegenschaft' : 'Liegenschaften'} erkannt
            {totalPolicies > 0 && ` · ${totalPolicies} ${totalPolicies === 1 ? 'Police' : 'Polizen'} hinterlegt`}
          </p>
          {liegenschaften.map(lg => (
            <Card key={lg.address} className={lg.docs.length > 0 ? 'border-green-200' : 'border-orange-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {lg.address}
                  </CardTitle>
                  {lg.docs.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Versichert
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Keine Police
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {lg.unitCount} {lg.unitCount === 1 ? 'Einheit' : 'Einheiten'} in dieser Liegenschaft
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {lg.docs.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground flex-1">
                      Noch keine Versicherungspolice für diese Liegenschaft hinterlegt
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLiegenschaft(lg.address)
                        setShowForm(true)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Police hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lg.docs.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/40"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="h-4 w-4 text-green-700 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString('de-AT')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(doc)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => {
                        setSelectedLiegenschaft(lg.address)
                        setShowForm(true)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Weitere Police hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Police löschen?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.name}</strong> wird unwiderruflich gelöscht. Die KI-Analyse
              kann diese Police danach nicht mehr verwenden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
