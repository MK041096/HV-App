'use client'

import DokumenteTabsHeader from '@/components/dashboard/DokumenteTabsHeader'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

// ── Datentypen ────────────────────────────────────────────────────────────
interface PoliceDoc {
  id: string
  name: string
  scope: 'liegenschaft' | 'einheit'
  liegenschaft: string | null
  created_at: string
}

interface Einheit {
  id: string
  name: string
  address: string | null
  liegenschaft: string | null
  docs: PoliceDoc[]
  inheritedCount: number
  directCount: number
}

interface BulkItem {
  file: File
  status: 'pending' | 'uploading' | 'analysing' | 'done' | 'error' | 'not_found' | 'wrong_type'
  liegenschaft: string | null
  overrideLiegenschaft: string | null
  unit_id: string | null
  unitName: string | null
  suggestedName: string | null
  overrideName: string | null
  file_path?: string
  file_size?: number
  mime_type?: string
  errorMsg?: string
}

// Liste eindeutiger Liegenschaften aus den Einheiten (für manuelle Zuordnung)
function uniqueLiegenschaften(einheiten: Einheit[]): string[] {
  const set = new Set<string>()
  einheiten.forEach(e => { if (e.liegenschaft) set.add(e.liegenschaft) })
  return Array.from(set).sort()
}

// Searchable combobox for Liegenschaft selection in bulk table rows
function LgCombobox({
  value,
  onChange,
  options,
}: {
  value: string | null
  onChange: (val: string | null) => void
  options: string[]
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
              {options.map(addr => (
                <CommandItem
                  key={addr}
                  value={addr}
                  onSelect={() => { onChange(addr); setOpen(false) }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === addr ? 'opacity-100' : 'opacity-0'}`} />
                  {addr}
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
  const [einheiten, setEinheiten] = useState<Einheit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'protected' | 'unprotected'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Single-upload form state (für „Police hinzufügen" pro Einheit)
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [unitFormUnitId, setUnitFormUnitId] = useState('')
  const [unitFormFile, setUnitFormFile] = useState<File | null>(null)
  const [unitFormUploading, setUnitFormUploading] = useState(false)
  const [unitFormScope, setUnitFormScope] = useState<'auto' | 'liegenschaft' | 'einheit'>('auto')
  const unitFileRef = useRef<HTMLInputElement>(null)

  // Bulk upload state
  const [showBulk, setShowBulk] = useState(false)
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkShowOnlyProblems, setBulkShowOnlyProblems] = useState(false)
  const bulkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/hv/einheiten-versicherungen')
      const data = await res.json()
      setEinheiten(data.einheiten || [])
    } finally {
      setLoading(false)
    }
  }

  const liegenschaftenList = uniqueLiegenschaften(einheiten)

  // ── Single-Police-Upload (per Einheit) ─────────────────────────────────
  async function handleUnitFormUpload() {
    if (!unitFormFile || !unitFormUnitId) return
    setUnitFormUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', unitFormFile)
      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { alert(uploadData.error || 'Upload fehlgeschlagen'); return }

      // Auto-detect name + scope
      let name = 'Versicherungspolice ' + new Date().toLocaleDateString('de-AT')
      let detectedScope: 'liegenschaft' | 'einheit' = 'einheit' // default für unit-Form: Einheit
      let detectedLg: string | null = null

      try {
        const analyseRes = await fetch('/api/documents/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_path: uploadData.file_path }),
        })
        const a = await analyseRes.json()
        if (a.suggested_name) name = a.suggested_name
        if (a.unit_id) detectedScope = 'einheit'
        else if (a.liegenschaft) { detectedScope = 'liegenschaft'; detectedLg = a.liegenschaft }
      } catch { /* ignore */ }

      const targetUnit = einheiten.find(e => e.id === unitFormUnitId)
      const finalScope = unitFormScope === 'auto' ? detectedScope : unitFormScope
      const finalLg = finalScope === 'liegenschaft' ? (detectedLg || targetUnit?.liegenschaft || null) : null
      const finalUnitId = finalScope === 'einheit' ? unitFormUnitId : null

      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          file_path: uploadData.file_path,
          file_size: uploadData.file_size,
          mime_type: uploadData.mime_type,
          document_type: 'versicherung',
          unit_id: finalUnitId,
          liegenschaft: finalLg,
        }),
      })
      if (!metaRes.ok) { alert('Fehler beim Speichern'); return }

      setUnitFormFile(null)
      setUnitFormUnitId('')
      setShowUnitForm(false)
      setUnitFormScope('auto')
      if (unitFileRef.current) unitFileRef.current.value = ''
      await loadData()
    } finally {
      setUnitFormUploading(false)
    }
  }

  // ── Bulk-Upload ────────────────────────────────────────────────────────
  function handleBulkFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setBulkItems(files.map(f => ({
      file: f,
      status: 'pending',
      liegenschaft: null,
      overrideLiegenschaft: null,
      unit_id: null,
      unitName: null,
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
        const a = await analyseRes.json()

        if (a.is_insurance === false) {
          updated[i] = {
            ...updated[i], status: 'wrong_type', liegenschaft: null, unit_id: null, unitName: null, suggestedName: null,
            errorMsg: a.error_reason || 'Kein Versicherungsdokument erkannt.',
          }
        } else if (a.unit_id) {
          updated[i] = {
            ...updated[i], status: 'done',
            unit_id: a.unit_id, unitName: a.unit_name || null, liegenschaft: null,
            suggestedName: a.suggested_name || null, errorMsg: undefined,
          }
        } else if (a.liegenschaft) {
          updated[i] = {
            ...updated[i], status: 'done',
            liegenschaft: a.liegenschaft, unit_id: null, unitName: null,
            suggestedName: a.suggested_name || null, errorMsg: undefined,
          }
        } else {
          updated[i] = {
            ...updated[i], status: 'not_found', liegenschaft: null, unit_id: null, unitName: null,
            suggestedName: a.suggested_name || null,
            errorMsg: a.error_reason || 'Keine Liegenschaft im PDF erkannt.',
          }
        }
      } catch {
        updated[i] = { ...updated[i], status: 'not_found', liegenschaft: null, suggestedName: null, errorMsg: 'Netzwerkfehler bei der Analyse.' }
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
            unit_id: item.unit_id || null,
            liegenschaft: item.unit_id ? null : (lg || null),
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

  // ── Lösch-Dialog ───────────────────────────────────────────────────────
  function confirmDelete(doc: { id: string; name: string }) {
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

  async function handleDownload(docId: string) {
    const res = await fetch(`/api/documents/${docId}`)
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    else alert('Download-Link konnte nicht erstellt werden')
  }

  function toggleEinheit(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Statistiken über alle Einheiten
  const protectedCount = einheiten.filter(e => e.docs.length > 0).length
  const unprotectedCount = einheiten.length - protectedCount

  // Such- und Filter-Logik kombinieren
  const filteredEinheiten = einheiten.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.address || '').toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'protected') return e.docs.length > 0
    if (filter === 'unprotected') return e.docs.length === 0
    return true
  })

  const bulkProgress = bulkItems.length > 0
    ? Math.round((bulkItems.filter(i => ['done', 'error', 'not_found'].includes(i.status)).length / bulkItems.length) * 100)
    : 0

  return (
    <div>
      <DokumenteTabsHeader />
      <div className="max-w-4xl mx-auto space-y-6 p-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-green-600" />
              Versicherungspolicen
            </h1>
          </div>
          <Button
            onClick={() => { setShowBulk(!showBulk); setShowUnitForm(false) }}
            variant={showBulk ? 'outline' : 'default'}
            className={showBulk ? 'border-primary text-primary' : ''}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {showBulk ? 'Importieren schließen' : 'Policen importieren'}
          </Button>
        </div>

        {/* ── Info-Bar ───────────────────────────────────────────────── */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-800">
              Laden Sie alle Versicherungspolicen hoch — das System ordnet sie automatisch zu.
              Pro Einheit sehen Sie alle greifenden Policen: Liegenschafts-Policen (für das ganze Gebäude)
              und einheitsspezifische Policen (z. B. Maschinenversicherung) zusammen in einer Liste.
            </p>
          </CardContent>
        </Card>

        {/* ── Bulk Upload ────────────────────────────────────────────── */}
        {showBulk && (
          <Card className="border-2 border-primary bg-primary/5 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Policen importieren
              </CardTitle>
              <CardDescription>
                Laden Sie alle Policen auf einmal hoch — das System erkennt automatisch ob eine Police für eine Liegenschaft oder eine bestimmte Einheit gilt und ordnet sie entsprechend zu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bulkItems.length === 0 ? (
                <div className="space-y-3">
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleBulkFileSelect}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => bulkInputRef.current?.click()}>
                    PDF-Dateien hochladen
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Tipp: Halten Sie Strg (Windows) oder ⌘ (Mac) gedrückt um mehrere Dateien gleichzeitig auszuwählen.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bulkProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Analysiere Policen…</span>
                        <span className="font-medium">{bulkProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: bulkProgress + '%' }} /></div>
                    </div>
                  )}

                  {bulkDone && (() => {
                    const problemCount = bulkItems.filter(i => i.status === 'not_found' || i.status === 'error' || i.status === 'wrong_type').length
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

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Dateiname</th>
                          <th className="text-left px-3 py-2 font-medium">Bezeichnung (automatisch)</th>
                          <th className="text-left px-3 py-2 font-medium">Liegenschaft / Einheit</th>
                          <th className="text-left px-3 py-2 font-medium w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {bulkItems.filter(item =>
                          !bulkShowOnlyProblems || item.status === 'not_found' || item.status === 'error' || item.status === 'wrong_type'
                        ).map((item) => {
                          const realIdx = bulkItems.indexOf(item)
                          return (
                          <tr key={realIdx} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium max-w-[160px] truncate text-xs text-muted-foreground" title={item.file.name}>
                              {item.file.name}
                            </td>
                            <td className="px-3 py-2">
                              {(item.status === 'done' || item.status === 'not_found') ? (
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
                              {item.status === 'done' && item.unit_id ? (
                                <span className="text-xs text-blue-700 font-medium">
                                  Einheit: {item.unitName || item.unit_id}
                                </span>
                              ) : (item.status === 'done' || item.status === 'not_found') ? (
                                <LgCombobox
                                  value={item.overrideLiegenschaft ?? item.liegenschaft}
                                  onChange={(val) => {
                                    const updated = [...bulkItems]
                                    updated[realIdx] = { ...updated[realIdx], overrideLiegenschaft: val }
                                    setBulkItems(updated)
                                  }}
                                  options={liegenschaftenList}
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
                                <div className="space-y-1">
                                  <span className="flex items-center gap-1 text-orange-600 text-xs">
                                    <AlertCircle className="h-3 w-3" /> Nicht erkannt
                                  </span>
                                  {item.errorMsg && (
                                    <p className="text-[11px] text-orange-700 leading-tight">{item.errorMsg}</p>
                                  )}
                                </div>
                              )}
                              {item.status === 'error' && (
                                <div className="space-y-1">
                                  <span className="flex items-center gap-1 text-red-600 text-xs">
                                    <XCircle className="h-3 w-3" /> Fehler
                                  </span>
                                  {item.errorMsg && (
                                    <p className="text-[11px] text-red-700 leading-tight">{item.errorMsg}</p>
                                  )}
                                </div>
                              )}
                              {item.status === 'wrong_type' && (
                                <div className="space-y-1">
                                  <span className="flex items-center gap-1 text-red-700 text-xs">
                                    <XCircle className="h-3 w-3" /> Kein Versicherungsdokument
                                  </span>
                                  {item.errorMsg && (
                                    <p className="text-[11px] text-red-700 leading-tight">{item.errorMsg}</p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

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
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Single-Upload Form (per Einheit ausgelöst) ────────────── */}
        {showUnitForm && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Police hinzufügen
              </CardTitle>
              <CardDescription>
                {(() => {
                  const u = einheiten.find(e => e.id === unitFormUnitId)
                  return u ? <>Für <strong>{u.name}</strong></> : null
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Geltungsbereich</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'auto', label: 'Auto-Erkennen', desc: 'PDF analysiert' },
                    { v: 'liegenschaft', label: 'Liegenschaft', desc: 'für ganzes Haus' },
                    { v: 'einheit', label: 'Nur Einheit', desc: 'nur diese Wohnung' },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setUnitFormScope(opt.v)}
                      className={`text-left rounded-md border px-3 py-2 transition-colors ${
                        unitFormScope === opt.v
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PDF-Datei</label>
                <input
                  ref={unitFileRef}
                  type="file"
                  accept=".pdf"
                  onChange={e => setUnitFormFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => unitFileRef.current?.click()}>
                    PDF-Datei auswählen
                  </Button>
                  {unitFormFile && (
                    <span className="text-sm text-muted-foreground truncate">{unitFormFile.name}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUnitFormUpload} disabled={unitFormUploading || !unitFormFile || !unitFormUnitId}>
                  {unitFormUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird hochgeladen…</> : 'Hochladen'}
                </Button>
                <Button variant="outline" onClick={() => { setShowUnitForm(false); setUnitFormUnitId(''); setUnitFormFile(null); setUnitFormScope('auto') }}>Abbrechen</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Warnbanner: ungeschützte Einheiten ─────────────────────── */}
        {unprotectedCount > 0 && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-orange-800">
                  {unprotectedCount} von {einheiten.length} Einheiten ohne Versicherungspolice
                </span>
                <span className="text-orange-700 ml-2">
                  — im Schadensfall keine Deckung. Bitte Policen hochladen oder zuordnen.
                </span>
              </div>
              {filter !== 'unprotected' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter('unprotected')}
                  className="shrink-0 border-orange-400 text-orange-800 hover:bg-orange-100"
                >
                  Anzeigen
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Filter-Pills + Suchfeld ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-md border bg-muted/30 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm px-3 py-1.5 rounded transition-colors ${
                filter === 'all'
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Alle <span className="text-xs text-muted-foreground ml-1">({einheiten.length})</span>
            </button>
            <button
              onClick={() => setFilter('protected')}
              className={`text-sm px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                filter === 'protected'
                  ? 'bg-background shadow-sm font-medium text-green-700'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Geschützt <span className="text-xs text-muted-foreground ml-0.5">({protectedCount})</span>
            </button>
            <button
              onClick={() => setFilter('unprotected')}
              className={`text-sm px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                filter === 'unprotected'
                  ? 'bg-background shadow-sm font-medium text-orange-700'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Ohne Police <span className="text-xs text-muted-foreground ml-0.5">({unprotectedCount})</span>
            </button>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Einheit oder Adresse suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* ── Einheiten-Liste ────────────────────────────────────────── */}
        {einheiten.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Home className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Noch keine Einheiten angelegt</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Legen Sie zuerst Einheiten an — pro Einheit sehen Sie dann alle greifenden Policen.
              </p>
            </CardContent>
          </Card>
        ) : filteredEinheiten.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              {filter === 'unprotected' && unprotectedCount === 0 ? (
                <>
                  <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-green-700 font-medium">Alle Einheiten sind versichert!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keine ungeschützte Einheit gefunden.
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">Keine Einheit gefunden</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search ? `Suche „${search}" liefert keine Treffer im aktuellen Filter.` : 'Kein Eintrag im aktuellen Filter.'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(''); setFilter('all') }}>
                    Filter zurücksetzen
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEinheiten.map(einheit => {
              const isExpanded = expanded.has(einheit.id)
              const total = einheit.docs.length
              const isInsured = total > 0
              return (
                <Card key={einheit.id} className={isInsured ? 'border-green-200' : 'border-orange-200'}>
                  <CardHeader
                    className="pb-3 cursor-pointer select-none rounded-t-lg hover:bg-muted/50 transition-colors"
                    onClick={() => toggleEinheit(einheit.id)}
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
                            {total} {total === 1 ? 'Police' : 'Policen'}
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
                        <span className="ml-2 text-muted-foreground">
                          · {einheit.inheritedCount} geerbt · {einheit.directCount} spezifisch
                        </span>
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
                              setUnitFormUnitId(einheit.id)
                              setShowUnitForm(true)
                              setShowBulk(false)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            <Upload className="h-3 w-3 mr-1" /> Police hinzufügen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {einheit.docs.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="h-4 w-4 text-green-700 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                    {doc.scope === 'liegenschaft' ? (
                                      <Badge variant="outline" className="border-blue-300 text-blue-700 text-[10px] px-1.5 py-0 h-5">
                                        <Building2 className="h-2.5 w-2.5 mr-0.5" /> Liegenschaft
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-purple-300 text-purple-700 text-[10px] px-1.5 py-0 h-5">
                                        <Home className="h-2.5 w-2.5 mr-0.5" /> Spezifisch
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.scope === 'liegenschaft' && doc.liegenschaft
                                      ? `geerbt von ${doc.liegenschaft} · `
                                      : ''}
                                    {new Date(doc.created_at).toLocaleDateString('de-AT')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-3 shrink-0">
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
                              setUnitFormUnitId(einheit.id)
                              setShowUnitForm(true)
                              setShowBulk(false)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            <Upload className="h-3 w-3 mr-1" /> Weitere Police hinzufügen
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

        {/* ── Lösch-Dialog ───────────────────────────────────────────── */}
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
    </div>
  )
}
