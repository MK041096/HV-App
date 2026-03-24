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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Download,
  Trash2,
  Plus,
  File,
  Building2,
  Home,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Check,
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



interface EinheitDoc {
  id: string
  name: string
  created_at: string
}

interface Einheit {
  id: string
  name: string
  address: string
  docs: EinheitDoc[]
}
interface BulkItem {
  file: File
  status: 'pending' | 'uploading' | 'analysing' | 'done' | 'error' | 'not_found'
  liegenschaft: string | null
  overrideLiegenschaft: string | null
  suggestedName: string | null
  overrideName: string | null
  file_path?: string
  file_size?: number
  mime_type?: string
  errorMsg?: string
}

// Searchable combobox for Liegenschaft selection in bulk table rows
function LgCombobox({
  value,
  onChange,
  liegenschaften,
}: {
  value: string | null
  onChange: (val: string | null) => void
  liegenschaften: Liegenschaft[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-8 w-full justify-between text-sm font-normal px-2"
        >
          <span className="truncate">{value ?? <span className="text-muted-foreground">Nicht erkannt — zuordnen</span>}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Liegenschaft suchen…" />
          <CommandList>
            <CommandEmpty>Keine Liegenschaft gefunden.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => { onChange(null); setOpen(false) }}>
                <Check className={`mr-2 h-4 w-4 ${!value ? 'opacity-100' : 'opacity-0'}`} />
                — Keine Zuordnung —
              </CommandItem>
              {liegenschaften.map(lg => (
                <CommandItem
                  key={lg.address}
                  value={lg.address}
                  onSelect={() => { onChange(lg.address); setOpen(false) }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === lg.address ? 'opacity-100' : 'opacity-0'}`} />
                  {lg.address}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function VersicherungenPage() {
  const [liegenschaften, setLiegenschaften] = useState<Liegenschaft[]>([])
  const [einheiten, setEinheiten] = useState<Einheit[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [selectedLiegenschaft, setSelectedLiegenschaft] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Bulk upload state
  const [showBulk, setShowBulk] = useState(false)
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkShowOnlyProblems, setBulkShowOnlyProblems] = useState(false)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState<string>('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Einheit tab state
  const [searchEinheit, setSearchEinheit] = useState<string>('')
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [unitUploadUnitId, setUnitUploadUnitId] = useState<string>('')
  const [unitUploadFile, setUnitUploadFile] = useState<File | null>(null)
  const [unitUploading, setUnitUploading] = useState(false)
  const unitFileRef = useRef<HTMLInputElement>(null)
  // Combobox open state
  const [einheitComboOpen, setEinheitComboOpen] = useState(false)
  const [lgComboOpen, setLgComboOpen] = useState(false)
  const [lgFormComboOpen, setLgFormComboOpen] = useState(false)

  function toggleCard(address: string) {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(address)) next.delete(address)
      else next.add(address)
      return next
    })
  }



  function toggleUnit(id: string) {
    setExpandedUnits(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [lgRes, einheitenRes] = await Promise.all([
        fetch('/api/hv/liegenschaften'),
        fetch('/api/hv/einheiten-versicherungen'),
      ])
      const lgData = await lgRes.json()
      const einheitenData = await einheitenRes.json()
      setLiegenschaften(lgData.liegenschaften || [])
      setEinheiten(einheitenData.einheiten || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

      // Auto-detect name from PDF
      let name = `Versicherungspolice ${new Date().toLocaleDateString('de-AT')}`
      try {
        const analyseRes = await fetch('/api/documents/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: uploadData.file_path }),
        })
        const analyseData = await analyseRes.json()
        if (analyseData.suggested_name) name = analyseData.suggested_name
      } catch { /* ignore, use fallback name */ }

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
      setSelectedLiegenschaft('')
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadData()
    } finally {
      setUploading(false)
    }
  }

  async function handleUnitUpload() {
    if (!unitUploadFile || !unitUploadUnitId) return
    setUnitUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', unitUploadFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

      let name = 'Versicherungspolice Einheit ' + new Date().toLocaleDateString('de-AT')
      try {
        const analyseRes = await fetch('/api/documents/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: uploadData.file_path }),
        })
        const analyseData = await analyseRes.json()
        if (analyseData.suggested_name) name = analyseData.suggested_name
      } catch { /* ignore */ }

      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          file_path: uploadData.file_path,
          file_size: uploadData.file_size,
          mime_type: uploadData.mime_type,
          document_type: 'versicherung',
          unit_id: unitUploadUnitId,
          liegenschaft: null,
        }),
      })
      if (!metaRes.ok) { alert('Fehler beim Speichern'); return }

      setUnitUploadFile(null)
      setUnitUploadUnitId('')
      setShowUnitForm(false)
      if (unitFileRef.current) unitFileRef.current.value = ''
      await loadData()
    } finally {
      setUnitUploading(false)
    }
  }

  async function handleDownload(docId: string) {
    const res = await fetch(`/api/documents/${docId}`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    else alert('Download-Link konnte nicht erstellt werden')
  }

  function confirmDelete(doc: LiegenschaftDoc | EinheitDoc) {
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

  // ── Bulk upload ────────────────────────────────────────────────────────────

  function handleBulkFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setBulkItems(files.map(f => ({
      file: f,
      status: 'pending',
      liegenschaft: null,
      overrideLiegenschaft: null,
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

      // 1. Upload file
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

      // 2. Analyse PDF text for Liegenschaft
      updated[i] = { ...updated[i], status: 'analysing', file_path: uploadData.file_path, file_size: uploadData.file_size, mime_type: uploadData.mime_type }
      setBulkItems([...updated])

      try {
        const analyseRes = await fetch('/api/documents/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: uploadData.file_path }),
        })
        const analyseData = await analyseRes.json()

        if (analyseData.liegenschaft) {
          updated[i] = { ...updated[i], status: 'done', liegenschaft: analyseData.liegenschaft, suggestedName: analyseData.suggested_name || null }
        } else {
          updated[i] = { ...updated[i], status: 'not_found', liegenschaft: null, suggestedName: analyseData.suggested_name || null }
        }
      } catch {
        updated[i] = { ...updated[i], status: 'not_found', liegenschaft: null, suggestedName: null }
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
        const lg = item.overrideLiegenschaft ?? item.liegenschaft
        const name = item.overrideName ?? item.suggestedName ?? item.file.name.replace(/\.pdf$/i, '')
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            file_path: item.file_path,
            file_size: item.file_size,
            mime_type: item.mime_type || 'application/pdf',
            document_type: 'versicherung',
            unit_id: null,
            liegenschaft: lg || null,
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

  const einheitenMitPolice = einheiten.filter(e => e.docs.length > 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            Versicherungspolicen
          </h1>

        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowBulk(!showBulk); setShowForm(false) }}>
            <Sparkles className="h-4 w-4 mr-2" /> Policen importieren
          </Button>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-800">
            Hinterlegen Sie für jede Liegenschaft die zugehörigen Versicherungspolicen. Das System übernimmt die Zuordnung automatisch. Einheitsspezifische Policen, wie etwa eine Maschinenversicherung für eingebaute Geräte, können ebenfalls hochgeladen und direkt der jeweiligen Einheit zugewiesen werden.
          </p>
        </CardContent>
      </Card>

      {/* ── Bulk Upload ─────────────────────────────────────────────────────── */}
      {showBulk && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Policen importieren
            </CardTitle>
            <CardDescription>
              Laden Sie mehrere Policen auf einmal hoch. Das System liest Versicherungsart, Versicherer und Liegenschaft direkt aus dem PDF-Text und ordnet sie richtig zu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulkItems.length === 0 ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleBulkFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => bulkInputRef.current?.click()}
                  >
                    PDF-Dateien hochladen
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Tipp: Halten Sie Strg (Windows) oder ⌘ (Mac) gedrückt um mehrere Dateien gleichzeitig auszuwählen.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nur PDF-Dateien werden unterstützt. Google Docs bitte zuerst als PDF exportieren (Datei → Herunterladen → PDF).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress bar while processing */}
                {bulkProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Analysiere Policen…</span>
                      <span className="font-medium">{bulkProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: bulkProgress + '%' }} /></div>
                  </div>
                )}

                {/* Filter toggle — only visible after analysis */}
                {bulkDone && (() => {
                  const problemCount = bulkItems.filter(i => i.status === 'not_found' || i.status === 'error').length
                  return problemCount > 0 ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBulkShowOnlyProblems(v => !v)}
                        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border transition-colors ${
                          bulkShowOnlyProblems
                            ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                            : 'border-muted-foreground/30 text-muted-foreground hover:border-orange-300 hover:text-orange-700'
                        }`}
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {bulkShowOnlyProblems ? 'Alle anzeigen' : `Nur nicht erkannte anzeigen (${problemCount})`}
                      </button>
                      {!bulkShowOnlyProblems && (
                        <span className="text-xs text-muted-foreground">
                          {bulkItems.filter(i => i.status === 'done').length} von {bulkItems.length} automatisch erkannt
                        </span>
                      )}
                    </div>
                  ) : null
                })()}

                {/* Results table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Dateiname</th>
                        <th className="text-left px-3 py-2 font-medium">Bezeichnung (automatisch)</th>
                        <th className="text-left px-3 py-2 font-medium">Liegenschaft</th>
                        <th className="text-left px-3 py-2 font-medium w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {bulkItems.filter(item =>
                        !bulkShowOnlyProblems || item.status === 'not_found' || item.status === 'error'
                      ).map((item) => {
                        const realIdx = bulkItems.indexOf(item)
                        return (
                        <tr key={realIdx} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium max-w-[160px] truncate text-xs text-muted-foreground" title={item.file.name}>
                            {item.file.name}
                          </td>
                          <td className="px-3 py-2">
                            {item.status === 'done' || item.status === 'not_found' ? (
                              <input
                                type="text"
                                className="w-full text-sm border rounded px-2 py-1 bg-background"
                                value={item.overrideName ?? item.suggestedName ?? ''}
                                placeholder="Bezeichnung eingeben…"
                                onChange={(e) => {
                                  const updated = [...bulkItems]
                                  updated[realIdx] = { ...updated[realIdx], overrideName: e.target.value }
                                  setBulkItems(updated)
                                }}
                              />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {item.status === 'done' || item.status === 'not_found' ? (
                              <LgCombobox
                                value={item.overrideLiegenschaft ?? item.liegenschaft}
                                onChange={(val) => {
                                  const updated = [...bulkItems]
                                  updated[realIdx] = { ...updated[realIdx], overrideLiegenschaft: val }
                                  setBulkItems(updated)
                                }}
                                liegenschaften={liegenschaften}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {item.status === 'pending' && (
                              <span className="text-muted-foreground text-xs">Wartend</span>
                            )}
                            {item.status === 'uploading' && (
                              <span className="flex items-center gap-1 text-blue-600 text-xs">
                                <Loader2 className="h-3 w-3 animate-spin" /> Upload…
                              </span>
                            )}
                            {item.status === 'analysing' && (
                              <span className="flex items-center gap-1 text-blue-600 text-xs">
                                <Loader2 className="h-3 w-3 animate-spin" /> Analyse…
                              </span>
                            )}
                            {item.status === 'done' && (
                              <span className="flex items-center gap-1 text-green-700 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Erkannt
                              </span>
                            )}
                            {item.status === 'not_found' && (
                              <span className="flex items-center gap-1 text-orange-600 text-xs">
                                <AlertCircle className="h-3 w-3" /> Nicht erkannt
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="flex items-center gap-1 text-red-600 text-xs" title={item.errorMsg}>
                                <XCircle className="h-3 w-3" /> Fehler
                              </span>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {!bulkDone && !bulkProcessing && (
                    <Button onClick={startBulkProcessing}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Automatisch zuordnen ({bulkItems.length} {bulkItems.length === 1 ? 'Police' : 'Policen'})
                    </Button>
                  )}
                  {bulkDone && (
                    <Button onClick={saveBulkResults} disabled={bulkSaving}>
                      {bulkSaving ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird gespeichert…</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Alle übernehmen &amp; speichern</>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetBulk} disabled={bulkProcessing || bulkSaving}>
                    Zurücksetzen
                  </Button>
                  <Button variant="ghost" onClick={() => setShowBulk(false)} disabled={bulkProcessing || bulkSaving}>
                    Abbrechen
                  </Button>
                </div>

                {bulkDone && (
                  <p className="text-xs text-muted-foreground">
                    Nicht erkannte Policen können Sie oben manuell einer Liegenschaft zuordnen, bevor Sie speichern.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Single Upload Form ───────────────────────────────────────────────── */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Police für Liegenschaft hochladen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Liegenschaft</label>
              <Popover open={lgFormComboOpen} onOpenChange={setLgFormComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={lgFormComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedLiegenschaft || <span className="text-muted-foreground">Liegenschaft auswählen…</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Liegenschaft suchen…" />
                    <CommandList>
                      <CommandEmpty>Keine Liegenschaft gefunden.</CommandEmpty>
                      <CommandGroup>
                        {liegenschaften.map(lg => (
                          <CommandItem
                            key={lg.address}
                            value={lg.address}
                            onSelect={() => { setSelectedLiegenschaft(lg.address); setLgFormComboOpen(false) }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${selectedLiegenschaft === lg.address ? 'opacity-100' : 'opacity-0'}`} />
                            {lg.address}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PDF-Datei</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  PDF-Datei auswählen
                </Button>
                {selectedFile && (
                  <span className="text-sm text-muted-foreground truncate">{selectedFile.name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedLiegenschaft}
              >
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setSelectedLiegenschaft(''); setSelectedFile(null) }}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Unit Upload Form ─────────────────────────────────────────────────── */}
      {showUnitForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Police für Einheit hochladen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Einheit</label>
              <Popover open={einheitComboOpen} onOpenChange={setEinheitComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={einheitComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {unitUploadUnitId
                      ? (() => { const e = einheiten.find(e => e.id === unitUploadUnitId); return e ? `${e.name} — ${e.address}` : 'Einheit auswählen…' })()
                      : <span className="text-muted-foreground">Einheit auswählen…</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Einheit suchen…" />
                    <CommandList>
                      <CommandEmpty>Keine Einheit gefunden.</CommandEmpty>
                      <CommandGroup>
                        {einheiten.map(e => (
                          <CommandItem
                            key={e.id}
                            value={`${e.name} ${e.address}`}
                            onSelect={() => { setUnitUploadUnitId(e.id); setEinheitComboOpen(false) }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${unitUploadUnitId === e.id ? 'opacity-100' : 'opacity-0'}`} />
                            <span className="font-medium">{e.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground truncate">{e.address}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PDF-Datei</label>
              <input
                ref={unitFileRef}
                type="file"
                accept=".pdf"
                onChange={e => setUnitUploadFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => unitFileRef.current?.click()}>
                  PDF-Datei auswählen
                </Button>
                {unitUploadFile && (
                  <span className="text-sm text-muted-foreground truncate">{unitUploadFile.name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUnitUpload}
                disabled={unitUploading || !unitUploadFile || !unitUploadUnitId}
              >
                {unitUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird hochgeladen…</> : 'Hochladen'}
              </Button>
              <Button variant="outline" onClick={() => { setShowUnitForm(false); setUnitUploadUnitId(''); setUnitUploadFile(null) }}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="liegenschaft">
        <TabsList>
          <TabsTrigger value="liegenschaft">
            <Building2 className="h-4 w-4 mr-2" />
            Nach Liegenschaft
          </TabsTrigger>
          <TabsTrigger value="einheit">
            <Home className="h-4 w-4 mr-2" />
            Nach Einheit
            {einheitenMitPolice.length > 0 && (
              <Badge className="ml-2 bg-green-100 text-green-800 border-0 text-xs">
                {einheitenMitPolice.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liegenschaft" className="space-y-4 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Liegenschaft suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
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
        <div className="space-y-3">
          {liegenschaften.filter(lg => lg.address.toLowerCase().includes(search.toLowerCase())).map(lg => {
            const isExpanded = expandedCards.has(lg.address)
            const isInsured = lg.docs.length > 0
            return (
              <Card key={lg.address} className={isInsured ? 'border-green-200' : 'border-orange-200'}>
                {/* Collapsed header — always visible, clickable */}
                <CardHeader
                  className="pb-3 cursor-pointer select-none"
                  onClick={() => toggleCard(lg.address)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-base truncate">{lg.address}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {isInsured ? (
                        <Badge className="bg-green-100 text-green-800 border-0">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Police vorhanden
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Keine Police
                        </Badge>
                      )}
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                  <CardDescription className="mt-1">
                    {lg.unitCount} {lg.unitCount === 1 ? 'Einheit' : 'Einheiten'} in dieser Liegenschaft
                    {isInsured && !isExpanded && (
                      <span className="ml-2 text-green-700">· {lg.docs.length} {lg.docs.length === 1 ? 'Police' : 'Policen'}</span>
                    )}
                  </CardDescription>
                </CardHeader>

                {/* Expanded content */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    {lg.docs.length === 0 ? (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground flex-1">
                          Noch keine Versicherungspolice für diese Liegenschaft hinterlegt
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLiegenschaft(lg.address)
                            setShowForm(true)
                            setShowBulk(false)
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
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLiegenschaft(lg.address)
                            setShowForm(true)
                            setShowBulk(false)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Weitere Police hinzufügen
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

        </TabsContent>

        <TabsContent value="einheit" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Einheit suchen…"
              value={searchEinheit}
              onChange={e => setSearchEinheit(e.target.value)}
              className="pl-9"
            />
          </div>

          {einheiten.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Home className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Keine Einheiten gefunden</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Legen Sie zuerst Einheiten an — sie erscheinen dann automatisch hier.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {einheiten
                .filter(e =>
                  e.name.toLowerCase().includes(searchEinheit.toLowerCase()) ||
                  (e.address || '').toLowerCase().includes(searchEinheit.toLowerCase())
                )
                .map(einheit => {
                  const isExpanded = expandedUnits.has(einheit.id)
                  const isInsured = einheit.docs.length > 0
                  return (
                    <Card key={einheit.id} className={isInsured ? 'border-green-200' : 'border-orange-200'}>
                      <CardHeader
                        className="pb-3 cursor-pointer select-none"
                        onClick={() => toggleUnit(einheit.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-semibold text-base truncate">{einheit.name}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            {isInsured ? (
                              <Badge className="bg-green-100 text-green-800 border-0">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Police vorhanden
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-300 text-orange-700">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Keine Police
                              </Badge>
                            )}
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            }
                          </div>
                        </div>
                        <CardDescription className="mt-1">
                          {einheit.address}
                          {isInsured && !isExpanded && (
                            <span className="ml-2 text-green-700">· {einheit.docs.length} {einheit.docs.length === 1 ? 'Police' : 'Policen'}</span>
                          )}
                        </CardDescription>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          {einheit.docs.length === 0 ? (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground flex-1">
                                Noch keine Versicherungspolice für diese Einheit hinterlegt
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setUnitUploadUnitId(einheit.id)
                                  setShowUnitForm(true)
                                  setShowForm(false)
                                  setShowBulk(false)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Police hinzufügen
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {einheit.docs.map(doc => (
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setUnitUploadUnitId(einheit.id)
                                  setShowUnitForm(true)
                                  setShowForm(false)
                                  setShowBulk(false)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Weitere Police hinzufügen
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
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Police löschen?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.name}</strong> wird unwiderruflich gelöscht. Das System
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
