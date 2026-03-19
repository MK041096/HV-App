'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  File,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Home,
} from 'lucide-react'

interface EinheitDoc {
  id: string
  name: string
  created_at: string
}

interface Einheit {
  id: string
  name: string
  address: string | null
  docs: EinheitDoc[]
}

interface BulkItem {
  file: File
  status: 'pending' | 'uploading' | 'analysing' | 'done' | 'error' | 'not_found'
  suggestedUnitId: string | null
  overrideUnitId: string | null
  suggestedName: string | null
  overrideName: string | null
  file_path?: string
  file_size?: number
  mime_type?: string
  errorMsg?: string
}

export default function DokumentePage() {
  const [einheiten, setEinheiten] = useState<Einheit[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showBulk, setShowBulk] = useState(false)
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState<string>('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  function toggleCard(unitId: string) {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) next.delete(unitId)
      else next.add(unitId)
      return next
    })
  }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/hv/einheiten-mit-vertraegen')
      const data = await res.json()
      setEinheiten(data.einheiten || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile || !selectedUnitId) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

      const unit = einheiten.find(e => e.id === selectedUnitId)
      const name = `Mietvertrag – ${unit?.name || 'Einheit'}`

      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          file_path: uploadData.file_path,
          file_size: uploadData.file_size,
          mime_type: uploadData.mime_type,
          document_type: 'mietvertrag',
          unit_id: selectedUnitId,
          liegenschaft: null,
        }),
      })
      if (!metaRes.ok) { alert('Fehler beim Speichern'); return }

      setSelectedFile(null)
      setSelectedUnitId('')
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

  function confirmDelete(doc: EinheitDoc) {
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

  function handleBulkFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setBulkItems(files.map(f => ({
      file: f,
      status: 'pending',
      suggestedUnitId: null,
      overrideUnitId: null,
      suggestedName: null,
      overrideName: null,
    })))
    setBulkDone(false)
  }

  async function startBulkProcessing() {
    if (bulkItems.length === 0) return
    setBulkProcessing(true)
    setBulkDone(false)
    const updated = [...bulkItems]
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i]
      updated[i] = { ...item, status: 'uploading' }
      setBulkItems([...updated])
      const formData = new FormData()
      formData.append('file', item.file)
      let uploadData: { file_path?: string; file_size?: number; mime_type?: string; error?: string }
      try {
        const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
        uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          updated[i] = { ...updated[i], status: 'error', errorMsg: uploadData.error || 'Upload fehlgeschlagen' }
          setBulkItems([...updated])
          continue
        }
      } catch {
        updated[i] = { ...updated[i], status: 'error', errorMsg: 'Netzwerkfehler beim Upload' }
        setBulkItems([...updated])
        continue
      }
      updated[i] = { ...updated[i], status: 'analysing', file_path: uploadData.file_path, file_size: uploadData.file_size, mime_type: uploadData.mime_type }
      setBulkItems([...updated])
      try {
        const analyseRes = await fetch('/api/documents/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: uploadData.file_path }),
        })
        const analyseData = await analyseRes.json()
        let matchedUnitId: string | null = null
        if (analyseData.liegenschaft) {
          const lg = analyseData.liegenschaft.toLowerCase().trim()
          const match = einheiten.find(e =>
            e.address?.toLowerCase().startsWith(lg) ||
            e.address?.toLowerCase().includes(lg)
          )
          if (match) matchedUnitId = match.id
        }
        updated[i] = {
          ...updated[i],
          status: matchedUnitId ? 'done' : 'not_found',
          suggestedUnitId: matchedUnitId,
          suggestedName: analyseData.suggested_name || null,
        }
      } catch {
        updated[i] = { ...updated[i], status: 'not_found', suggestedUnitId: null, suggestedName: null }
      }
      setBulkItems([...updated])
    }
    setBulkProcessing(false)
    setBulkDone(true)
  }

  async function saveBulkResults() {
    setBulkSaving(true)
    try {
      const toSave = bulkItems.filter(item =>
        (item.status === 'done' || item.status === 'not_found') && item.file_path
      )
      for (const item of toSave) {
        const unitId = item.overrideUnitId ?? item.suggestedUnitId
        if (!unitId) continue
        const unit = einheiten.find(e => e.id === unitId)
        const name = item.overrideName ?? item.suggestedName ?? `Mietvertrag – ${unit?.name || item.file.name.replace(/\.pdf$/i, '')}`
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            file_path: item.file_path,
            file_size: item.file_size,
            mime_type: item.mime_type || 'application/pdf',
            document_type: 'mietvertrag',
            unit_id: unitId,
            liegenschaft: null,
          }),
        })
      }
      setBulkItems([])
      setBulkDone(false)
      setShowBulk(false)
      if (bulkInputRef.current) bulkInputRef.current.value = ''
      await loadData()
    } finally {
      setBulkSaving(false)
    }
  }

  function resetBulk() {
    setBulkItems([])
    setBulkDone(false)
    setBulkProcessing(false)
    if (bulkInputRef.current) bulkInputRef.current.value = ''
  }

  const bulkProgress = bulkItems.length > 0
    ? Math.round((bulkItems.filter(i => ['done', 'error', 'not_found'].includes(i.status)).length / bulkItems.length) * 100)
    : 0

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Mietverträge
          </h1>
        </div>
        <Button onClick={() => { setShowBulk(!showBulk); setShowForm(false) }}>
          <Sparkles className="h-4 w-4 mr-2" /> Mietverträge importieren
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-800">
            Hinterlegen Sie für jede Einheit den aktuellen Mietvertrag als PDF. So haben Sie alle Verträge jederzeit im Zugriff.
          </p>
        </CardContent>
      </Card>

      {showBulk && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Mietverträge importieren
            </CardTitle>
            <CardDescription>
              Laden Sie mehrere Mietverträge auf einmal hoch. Das System versucht automatisch zu erkennen, zu welcher Einheit der Vertrag gehört.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulkItems.length === 0 ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <input ref={bulkInputRef} type="file" accept=".pdf" multiple onChange={handleBulkFileSelect} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => bulkInputRef.current?.click()}>
                    PDF-Dateien auswählen
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tipp: Halten Sie Strg (Windows) oder ⌘ (Mac) gedrückt um mehrere Dateien gleichzeitig auszuwählen.</p>
                  <p className="text-xs text-muted-foreground">Nur PDF-Dateien werden unterstützt.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bulkProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Analysiere Mietverträge…</span>
                      <span className="font-medium">{bulkProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: bulkProgress + '%' }} />
                    </div>
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Dateiname</th>
                        <th className="text-left px-3 py-2 font-medium">Bezeichnung</th>
                        <th className="text-left px-3 py-2 font-medium">Einheit</th>
                        <th className="text-left px-3 py-2 font-medium w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bulkItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="px-3 py-2 max-w-[160px] truncate text-xs text-muted-foreground" title={item.file.name}>{item.file.name}</td>
                          <td className="px-3 py-2">
                            {item.status === 'done' || item.status === 'not_found' ? (
                              <input type="text" className="w-full text-sm border rounded px-2 py-1 bg-background"
                                value={item.overrideName ?? item.suggestedName ?? ''} placeholder="Bezeichnung eingeben…"
                                onChange={(e) => { const u = [...bulkItems]; u[idx] = { ...u[idx], overrideName: e.target.value }; setBulkItems(u) }} />
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            {item.status === 'done' || item.status === 'not_found' ? (
                              <Select value={item.overrideUnitId ?? item.suggestedUnitId ?? '__none__'}
                                onValueChange={(val) => { const u = [...bulkItems]; u[idx] = { ...u[idx], overrideUnitId: val === '__none__' ? null : val }; setBulkItems(u) }}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Einheit zuordnen…" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">— Keine Zuordnung —</SelectItem>
                                  {einheiten.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}{e.address ? ` · ${e.address}` : ''}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            {item.status === 'pending' && <span className="text-muted-foreground text-xs">Wartend</span>}
                            {item.status === 'uploading' && <span className="flex items-center gap-1 text-blue-600 text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Upload…</span>}
                            {item.status === 'analysing' && <span className="flex items-center gap-1 text-blue-600 text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Analyse…</span>}
                            {item.status === 'done' && <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle2 className="h-3 w-3" /> Erkannt</span>}
                            {item.status === 'not_found' && <span className="flex items-center gap-1 text-orange-600 text-xs"><AlertCircle className="h-3 w-3" /> Nicht erkannt</span>}
                            {item.status === 'error' && <span className="flex items-center gap-1 text-red-600 text-xs" title={item.errorMsg}><XCircle className="h-3 w-3" /> Fehler</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!bulkDone && !bulkProcessing && (
                    <Button onClick={startBulkProcessing}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Automatisch zuordnen ({bulkItems.length} {bulkItems.length === 1 ? 'Vertrag' : 'Verträge'})
                    </Button>
                  )}
                  {bulkDone && (
                    <Button onClick={saveBulkResults} disabled={bulkSaving}>
                      {bulkSaving
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird gespeichert…</>
                        : <><CheckCircle2 className="h-4 w-4 mr-2" /> Alle übernehmen &amp; speichern</>}
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetBulk} disabled={bulkProcessing || bulkSaving}>Zurücksetzen</Button>
                  <Button variant="ghost" onClick={() => setShowBulk(false)} disabled={bulkProcessing || bulkSaving}>Abbrechen</Button>
                </div>
                {bulkDone && (
                  <p className="text-xs text-muted-foreground">
                    Nicht erkannte Verträge können Sie oben manuell einer Einheit zuordnen. Einträge ohne Zuordnung werden übersprungen.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Mietvertrag hochladen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger><SelectValue placeholder="Einheit auswählen…" /></SelectTrigger>
              <SelectContent>
                {einheiten.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}{e.address ? ` · ${e.address}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>PDF-Datei auswählen</Button>
                {selectedFile && <span className="text-sm text-muted-foreground truncate">{selectedFile.name}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !selectedUnitId}>
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Einheit suchen…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {einheiten.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Home className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Keine Einheiten gefunden</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Legen Sie zuerst Einheiten in der Mieterverwaltung an.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {einheiten
            .filter(e =>
              e.name.toLowerCase().includes(search.toLowerCase()) ||
              (e.address || '').toLowerCase().includes(search.toLowerCase())
            )
            .map(einheit => {
              const isExpanded = expandedCards.has(einheit.id)
              const hasVertrag = einheit.docs.length > 0
              return (
                <Card key={einheit.id} className={hasVertrag ? 'border-green-200' : 'border-orange-200'}>
                  <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => toggleCard(einheit.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-base truncate">{einheit.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {hasVertrag ? (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mietvertrag vorhanden
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Kein Mietvertrag
                          </Badge>
                        )}
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {einheit.address && (
                      <CardDescription className="mt-1">
                        {einheit.address}
                        {hasVertrag && !isExpanded && (
                          <span className="ml-2 text-green-700">
                            · {einheit.docs.length} {einheit.docs.length === 1 ? 'Vertrag' : 'Verträge'}
                          </span>
                        )}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      {einheit.docs.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground flex-1">
                            Noch kein Mietvertrag für diese Einheit hinterlegt
                          </p>
                          <Button size="sm" variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUnitId(einheit.id)
                              setShowForm(true)
                              setShowBulk(false)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}>
                            <Plus className="h-3 w-3 mr-1" /> Mietvertrag hinzufügen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {einheit.docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/40">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="h-4 w-4 text-blue-700 shrink-0" />
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
                                <Button variant="ghost" size="sm" onClick={() => confirmDelete(doc)}
                                  className="text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button size="sm" variant="ghost" className="text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUnitId(einheit.id)
                              setShowForm(true)
                              setShowBulk(false)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}>
                            <Plus className="h-3 w-3 mr-1" /> Weiteren Vertrag hinzufügen
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mietvertrag löschen?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.name}</strong> wird unwiderruflich gelöscht.
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
