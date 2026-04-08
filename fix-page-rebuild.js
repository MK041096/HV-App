const fs = require('fs')
const path = 'src/app/dashboard/cases/[id]/page.tsx'
let c = fs.readFileSync(path, 'utf8')

// Find where the return starts (after urgencyConfig/statusConfig)
// Handle both CRLF (Windows) and LF line endings
const returnIdx = c.search(/\r?\n  return \(\r?\n    <div className="p-4 sm:p-6 lg:p-8 space-y-6">/)

if (returnIdx === -1) { console.error('Could not find return start'); process.exit(1) }

// Keep everything before the return
const before = c.substring(0, returnIdx)

// ── parseCarlAnalysis helper (inserted just before return) ──
const parseHelper = `

  // ── Parse CARL structured output ──
  const parseCarlAnalysis = (text: string) => {
    const get = (key: string) => text.match(new RegExp('^' + key + ':\\\\s*(.+)', 'mi'))?.[1]?.trim() ?? null
    const zustaendigkeit = get('ZUSTäNDIGKEIT') || get('ZUSTÄNDIGKEIT') || get('ZUSTAENDIGKEIT')
    const erklaerungMatch = text.match(/^ERKLÄRUNG:\\s*([\\s\\S]+?)(?:\\n[A-ZÜÄÖ]{3,}:|$)/mi)
    return {
      zustaendigkeit,
      rechtsgrundlage: get('RECHTSGRUNDLAGE'),
      versicherung: get('VERSICHERUNG'),
      empfehlung: get('EMPFEHLUNG'),
      erklaerung: erklaerungMatch?.[1]?.trim() ?? null,
    }
  }
  const carlData = kiResult ? parseCarlAnalysis(kiResult) : null
  const carlZustaendigkeit = carlData?.zustaendigkeit?.toUpperCase() ?? ''
  const isMieterFall = carlZustaendigkeit.includes('MIETER') && !carlZustaendigkeit.includes('VERMIETER')
  const isUnklarFall = carlZustaendigkeit.includes('UNKLAR') || carlZustaendigkeit === ''

  // Verdict bar styling
  const verdictStyle = isMieterFall
    ? { bar: 'bg-red-50 border-red-200', pill: 'bg-red-100 text-red-800 border-red-200', icon: '⚠️', label: 'MIETER zuständig' }
    : isUnklarFall && carlData
    ? { bar: 'bg-amber-50 border-amber-200', pill: 'bg-amber-100 text-amber-800 border-amber-200', icon: '❓', label: 'UNKLAR — bitte prüfen' }
    : { bar: 'bg-green-50 border-green-200', pill: 'bg-green-100 text-green-800 border-green-200', icon: '✅', label: 'VERMIETER zahlt' }

`

// ── New JSX return ──
const newReturn = `
  return (
    <div className="min-h-screen bg-background">
      {/* ── Photo Lightbox ── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setSelectedPhoto(null)}>
            <X className="h-8 w-8" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[90vh]">
            {selectedPhoto.url ? (
              <img src={selectedPhoto.url} alt={selectedPhoto.file_name} className="max-h-[90vh] max-w-full object-contain rounded-lg" />
            ) : (
              <div className="bg-muted rounded-lg p-8 text-center"><ImageIcon className="h-16 w-16 text-muted-foreground mx-auto" /></div>
            )}
            <p className="text-white text-sm text-center mt-2 opacity-70">{selectedPhoto.file_name}</p>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Meldung löschen?</CardTitle><CardDescription>Diese Aktion kann nicht rückgängig gemacht werden.</CardDescription></CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Abbrechen</Button>
              <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Löschen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">

        {/* ── ① Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <button onClick={() => router.push('/dashboard/cases')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="h-4 w-4" /> Alle Fälle
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border \${urgencyConfig.className}\`}>{urgencyConfig.label}</span>
              <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border \${statusConfig.className}\`}>{statusConfig.label}</span>
              <span className="text-sm text-muted-foreground font-mono">{caseData.case_number}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground truncate">{caseData.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {caseData.unit && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{caseData.unit.name}{caseData.unit.address ? \` · \${caseData.unit.address}\` : ''}</span>}
              {caseData.reporter && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{caseData.reporter.first_name} {caseData.reporter.last_name}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDateTime(caseData.created_at)}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />Löschen
          </Button>
        </div>

        {/* ── ② CARL Verdict Bar ── */}
        {carlData && (
          <div className={\`rounded-xl border px-4 py-3 flex items-center gap-3 flex-wrap \${verdictStyle.bar}\`}>
            <span className="font-semibold text-sm flex items-center gap-1.5">
              {verdictStyle.icon} {verdictStyle.label}
            </span>
            <span className="text-muted-foreground text-sm hidden sm:block">|</span>
            {carlData.rechtsgrundlage && (
              <span className={\`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium \${verdictStyle.pill}\`}>
                ⚖️ {carlData.rechtsgrundlage}
              </span>
            )}
            {carlData.versicherung && (
              <span className={\`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium \${verdictStyle.pill}\`}>
                🛡️ {carlData.versicherung}
              </span>
            )}
            {carlData.empfehlung && (
              <span className={\`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium \${verdictStyle.pill}\`}>
                🔧 {carlData.empfehlung}
              </span>
            )}
          </div>
        )}

        {/* ── ③ Mietvertrag Warning ── */}
        {kiResult && !kiLeaseFound && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Kein Mietvertrag hinterlegt — CARL analysiert nur nach Gesetz</p>
              <p className="text-xs text-amber-700 mt-0.5">Bitte <Link href={\`/dashboard/tenants\`} className="underline font-medium">Mietvertrag hochladen</Link> für eine vertragsgenaue Analyse.</p>
            </div>
          </div>
        )}

        {/* ── ④ Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT (2/3): Was ist passiert? ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Photos — direkt sichtbar */}
            {caseData.photos.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Fotos ({caseData.photos.length})</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {caseData.photos.map((photo) => (
                      <button key={photo.id} onClick={() => setSelectedPhoto(photo)}
                        className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
                        {photo.url
                          ? <img src={photo.url} alt={photo.file_name} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meldungsdetails */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Schadensmeldung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs mb-0.5">Kategorie</p><p className="font-medium">{CATEGORY_LABELS[caseData.category as keyof typeof CATEGORY_LABELS] || caseData.category}</p></div>
                  {caseData.subcategory && <div><p className="text-muted-foreground text-xs mb-0.5">Unterkategorie</p><p className="font-medium">{caseData.subcategory}</p></div>}
                  {caseData.room && <div><p className="text-muted-foreground text-xs mb-0.5">Raum</p><p className="font-medium">{ROOM_LABELS[caseData.room as keyof typeof ROOM_LABELS] || caseData.room}</p></div>}
                  <div><p className="text-muted-foreground text-xs mb-0.5">Erstellt</p><p className="font-medium">{formatDateTime(caseData.created_at)}</p></div>
                </div>
                {caseData.description && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground text-xs mb-1">Beschreibung des Mieters</p>
                    <p className="text-sm whitespace-pre-wrap text-foreground">{caseData.description}</p>
                  </div>
                )}
                {caseData.access_notes && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Zugangshinweise</p>
                    <p className="text-sm">{caseData.access_notes}</p>
                  </div>
                )}
                {(caseData.preferred_appointment || caseData.preferred_appointment_2) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Wunschtermin{caseData.preferred_appointment_2 ? 'e' : ''} des Mieters</p>
                    {caseData.preferred_appointment && <p className="text-sm text-blue-900">1. {formatDateTime(caseData.preferred_appointment)}</p>}
                    {caseData.preferred_appointment_2 && <p className="text-sm text-blue-900 mt-0.5">2. {formatDateTime(caseData.preferred_appointment_2)}</p>}
                  </div>
                )}
                <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Gemeldet von</p><p className="text-sm font-medium">{caseData.reporter?.first_name} {caseData.reporter?.last_name}</p></div>
                  </div>
                  {caseData.unit && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div><p className="text-xs text-muted-foreground">Wohneinheit</p><p className="text-sm font-medium">{caseData.unit.name}</p>{caseData.unit.address && <p className="text-xs text-muted-foreground">{caseData.unit.address}</p>}{caseData.unit.floor && <p className="text-xs text-muted-foreground">Stockwerk: {caseData.unit.floor}</p>}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CARL Analyse — 4 Kacheln + Erklärungstext */}
            <Card className={kiResult ? 'border-purple-200' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  CARL-Analyse
                </CardTitle>
                {!kiResult && <p className="text-xs text-muted-foreground">Verantwortlichkeit · Mietrecht · Versicherung · Empfehlung</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                {isRunningKi && (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-sm text-muted-foreground">CARL analysiert Mietvertrag, Versicherungspolice und Fotos…</span>
                  </div>
                )}
                {kiError && <p className="text-sm text-destructive">{kiError}</p>}

                {carlData && !isRunningKi && (
                  <div className="space-y-4">
                    {/* 4 Tiles */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={\`rounded-xl border p-4 \${isMieterFall ? 'bg-red-50 border-red-200' : isUnklarFall ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}\`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">👤 Zuständigkeit</p>
                        <p className={\`font-bold text-base \${isMieterFall ? 'text-red-800' : isUnklarFall ? 'text-amber-800' : 'text-green-800'}\`}>{carlData.zustaendigkeit || '—'}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">⚖️ Rechtsgrundlage</p>
                        <p className="font-medium text-sm">{carlData.rechtsgrundlage || '—'}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">🛡️ Versicherung</p>
                        <p className="font-medium text-sm">{carlData.versicherung || '—'}</p>
                      </div>
                      <div className="rounded-xl border bg-purple-50 border-purple-200 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">🔧 Empfehlung</p>
                        <p className="font-medium text-sm text-purple-900">{carlData.empfehlung || '—'}</p>
                      </div>
                    </div>

                    {/* Erklärungstext — weiterleitbar */}
                    {carlData.erklaerung && (
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📄 Erklärung (weiterleitbar)</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(carlData.erklaerung || '')}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Kopieren
                          </button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{carlData.erklaerung}</p>
                        <div className="flex gap-2 flex-wrap pt-1">
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => { setCommentContent(carlData.erklaerung || ''); setIsInternalComment(false) }}>
                            <Send className="h-3 w-3 mr-1.5" />An Mieter senden
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => navigator.clipboard.writeText(\`Betreff: Schadensmeldung \${caseData.case_number}\\n\\n\${carlData.erklaerung || ''}\`)}>
                            An Versicherung (kopieren)
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7"
                            onClick={() => navigator.clipboard.writeText(\`Auftrag: \${caseData.title}\\nAdresse: \${caseData.unit?.address || ''}\\n\\n\${carlData.erklaerung || ''}\`)}>
                            An Werkstatt (kopieren)
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!kiResult && !isRunningKi && (
                  <div className="text-center space-y-3 py-4">
                    <Button onClick={runKiAnalysis} disabled={isRunningKi} className="bg-purple-700 hover:bg-purple-800 text-white">
                      <Sparkles className="mr-2 h-4 w-4" />CARL-Analyse starten
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Prüft Mietvertrag, Versicherung & Fotos
                      {!kiLeaseFound ? ' — Kein Mietvertrag hinterlegt' : ''}
                    </p>
                  </div>
                )}

                {kiResult && !isRunningKi && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={runKiAnalysis}>
                      <RefreshCw className="h-3 w-3 mr-1.5" />Neu analysieren
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs: Kommentare, Verlauf, Dokumente */}
            <Card>
              <Tabs defaultValue="comments">
                <CardHeader className="pb-0">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="dokumente"><Receipt className="h-3.5 w-3.5 mr-1.5" />Dokumente</TabsTrigger>
                    <TabsTrigger value="comments" className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Kommentare ({caseData.comments.length})</TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-1.5"><Clock className="h-4 w-4" />Verlauf ({caseData.status_history.length})</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* DOKUMENTE */}
                  <TabsContent value="dokumente" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Rechnung der Werkstatt</CardTitle><CardDescription>PDF oder Bild der Werkstatt-Rechnung hochladen</CardDescription></CardHeader>
                      <CardContent className="space-y-3">
                        {invoiceError && <Alert variant="destructive"><AlertDescription>{invoiceError}</AlertDescription></Alert>}
                        {invoiceSuccess && <Alert><AlertDescription className="text-green-700">{invoiceSuccess}</AlertDescription></Alert>}
                        {caseData?.invoice_filename ? (
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3"><Receipt className="h-5 w-5 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium">{caseData.invoice_filename}</p><p className="text-xs text-muted-foreground">{caseData.invoice_uploaded_at ? new Date(caseData.invoice_uploaded_at).toLocaleString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '–'}</p></div></div>
                            <div className="flex items-center gap-2">
                              {invoiceSignedUrl && <Button variant="outline" size="sm" onClick={() => window.open(invoiceSignedUrl,'_blank')}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Öffnen</Button>}
                              <Button variant="ghost" size="sm" disabled={isDeletingInvoice} onClick={async()=>{if(!confirm('Rechnung wirklich löschen?'))return;setIsDeletingInvoice(true);setInvoiceError(null);try{const res=await fetch(\`/api/hv/cases/\${caseData.id}/invoice\`,{method:'DELETE'});const json=await res.json();if(!res.ok){setInvoiceError(json.error||'Fehler')}else{setCaseData(p=>p?{...p,invoice_path:null,invoice_filename:null,invoice_uploaded_at:null}:p);setInvoiceSignedUrl(null);setInvoiceSuccess('Rechnung gelöscht');setTimeout(()=>setInvoiceSuccess(null),3000)}}catch{setInvoiceError('Verbindungsfehler')}finally{setIsDeletingInvoice(false)}}}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-3">PDF, JPG oder PNG — max. 10 MB</p>
                            <label className="cursor-pointer"><Button variant="outline" size="sm" disabled={isUploadingInvoice} asChild><span>{isUploadingInvoice?<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin"/>Wird hochgeladen...</>:<><Upload className="h-3.5 w-3.5 mr-1.5"/>Rechnung hochladen</>}</span></Button><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" disabled={isUploadingInvoice} onChange={async(e)=>{const file=e.target.files?.[0];if(!file||!caseData)return;setIsUploadingInvoice(true);setInvoiceError(null);try{const fd=new FormData();fd.append('file',file);const res=await fetch(\`/api/hv/cases/\${caseData.id}/invoice\`,{method:'POST',body:fd});const json=await res.json();if(!res.ok){setInvoiceError(json.error||'Fehler')}else{setCaseData(p=>p?{...p,invoice_path:json.data.invoice_path,invoice_filename:json.data.invoice_filename||file.name,invoice_uploaded_at:json.data.invoice_uploaded_at}:p);if(json.data.signed_url)setInvoiceSignedUrl(json.data.signed_url);setInvoiceSuccess('Rechnung hochgeladen');setTimeout(()=>setInvoiceSuccess(null),3000)}}catch{setInvoiceError('Verbindungsfehler')}finally{setIsUploadingInvoice(false);e.target.value=''}}} /></label>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Versicherungsschaden</CardTitle><CardDescription>Handelt es sich um einen versicherungsrelevanten Schaden?</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><div><Label className="text-sm font-medium">Als Versicherungsschaden markieren</Label><p className="text-xs text-muted-foreground mt-0.5">Ermöglicht das Erstellen eines Versicherungsschadenblatts</p></div><Switch checked={isInsuranceDamage} onCheckedChange={setIsInsuranceDamage} /></div>
                        {isInsuranceDamage && <div className="space-y-2"><Label className="text-sm">Notizen für Versicherung (optional)</Label><Textarea placeholder="z.B. Polizzennummer, Schadensnummer..." value={insuranceNotes} onChange={e=>setInsuranceNotes(e.target.value)} rows={3} className="resize-none text-sm" /></div>}
                        {insuranceSuccess && <p className="text-sm text-green-700">{insuranceSuccess}</p>}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" disabled={isSavingInsurance} onClick={async()=>{if(!caseData)return;setIsSavingInsurance(true);try{const res=await fetch(\`/api/hv/cases/\${caseData.id}\`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_insurance_damage:isInsuranceDamage,insurance_notes:insuranceNotes})});if(res.ok){setCaseData(p=>p?{...p,is_insurance_damage:isInsuranceDamage,insurance_notes:insuranceNotes}:p);setInsuranceSuccess('Gespeichert');setTimeout(()=>setInsuranceSuccess(null),3000)}}catch{}finally{setIsSavingInsurance(false)}}}>{isSavingInsurance?<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin"/>Speichert...</>:<><Save className="h-3.5 w-3.5 mr-1.5"/>Speichern</>}</Button>
                          {caseData?.is_insurance_damage && <Button size="sm" onClick={()=>window.open(\`/dashboard/cases/\${caseData.id}/versicherungsblatt\`,'_blank')}><FileSearch className="h-3.5 w-3.5 mr-1.5" />Versicherungsblatt</Button>}
                          {caseData?.is_insurance_damage && <Button size="sm" variant="outline" onClick={()=>window.open(\`/api/hv/cases/\${caseData.id}/versicherungsformular\`,'_blank')}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Schadensanzeige</Button>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* KOMMENTARE */}
                  <TabsContent value="comments" className="mt-0 space-y-4">
                    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                      <Textarea placeholder={isInternalComment?'Interne Notiz hinzufügen (nur für HV sichtbar)...':'Kommentar an Mieter senden...'} value={commentContent} onChange={e=>setCommentContent(e.target.value)} className="min-h-[80px] resize-none" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch id="is-internal" checked={isInternalComment} onCheckedChange={setIsInternalComment} />
                          <Label htmlFor="is-internal" className="text-sm cursor-pointer flex items-center gap-1">{isInternalComment?<><Lock className="h-3.5 w-3.5 text-orange-500"/><span className="text-orange-600">Interne Notiz</span></>:<><Send className="h-3.5 w-3.5 text-blue-500"/><span>An Mieter senden</span></>}</Label>
                        </div>
                        <Button size="sm" disabled={!commentContent.trim()||isAddingComment} onClick={handleAddComment}>{isAddingComment?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Senden</Button>
                      </div>
                    </div>
                    {caseData.comments.length===0?(
                      <div className="text-center py-6 text-muted-foreground"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50"/><p className="text-sm">Noch keine Kommentare</p></div>
                    ):(
                      <div className="space-y-3">{caseData.comments.map(comment=>(
                        <div key={comment.id} className={\`rounded-lg border p-3 \${comment.is_internal?'bg-orange-50 border-orange-200':'bg-background'}\`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">{comment.author?.first_name} {comment.author?.last_name}</span>{comment.is_internal&&<Badge variant="outline" className="text-[10px] bg-orange-100 text-orange-700 border-orange-200"><Lock className="h-2.5 w-2.5 mr-1"/>Intern</Badge>}</div>
                            <span className="text-[11px] text-muted-foreground">{formatDateTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}</div>
                    )}
                  </TabsContent>

                  {/* VERLAUF */}
                  <TabsContent value="timeline" className="mt-0">
                    {caseData.status_history.length===0?(
                      <div className="text-center py-6 text-muted-foreground"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50"/><p className="text-sm">Kein Statusverlauf vorhanden</p></div>
                    ):(
                      <div className="relative space-y-0">{caseData.status_history.map((entry,idx)=>(
                        <div key={entry.id} className="flex gap-3">
                          <div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-primary border-2 border-background ring-2 ring-muted shrink-0 mt-1"/>{idx<caseData.status_history.length-1&&<div className="w-0.5 flex-1 bg-muted"/>}</div>
                          <div className="pb-6 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.old_status_label&&<><Badge variant="outline" className={\`text-[10px] \${getStatusConfig(entry.old_status!).className}\`}>{entry.old_status_label}</Badge><span className="text-xs text-muted-foreground">→</span></>}
                              <Badge variant="outline" className={\`text-[10px] \${getStatusConfig(entry.new_status).className}\`}>{entry.new_status_label}</Badge>
                            </div>
                            {entry.note&&<p className="text-sm mt-1 text-muted-foreground">{entry.note}</p>}
                            <p className="text-[11px] text-muted-foreground mt-1">{entry.changed_by?\`\${entry.changed_by.first_name} \${entry.changed_by.last_name}\`:'System'} — {formatDateTime(entry.created_at)}</p>
                          </div>
                        </div>
                      ))}</div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

          </div>{/* end left column */}

          {/* ── RIGHT (1/3): Was ist zu tun? ── */}
          <div className="space-y-4">

            {/* Nächster Schritt — Smart Action Panel */}
            {!['abgelehnt','erledigt'].includes(caseData.status) && (
              <Card className="border-2 border-primary/40 bg-primary/5 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {caseData.status==='neu'&&<span>🔵</span>}
                    {['in_bearbeitung','warte_auf_handwerker'].includes(caseData.status)&&<span>🟡</span>}
                    {caseData.status==='termin_vereinbart'&&<span>🟢</span>}
                    Nächster Schritt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schnellSuccess&&<div className="rounded-lg bg-green-100 border border-green-300 px-3 py-2 text-sm text-green-800 font-medium">{schnellSuccess}</div>}
                  {schnellError&&<div className="rounded-lg bg-red-100 border border-red-300 px-3 py-2 text-sm text-red-800">{schnellError}</div>}

                  {/* NEU */}
                  {caseData.status==='neu'&&(()=>{
                    const recommended=contractors.find(ct=>ct.id===selectedContractorId)
                    return (
                      <div className="space-y-3">
                        {/* Werkstatt */}
                        {recommended&&!showContractorChange?(
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">CARL empfiehlt</p>
                            <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                              <p className="text-sm font-medium">{recommended.name}</p>
                              <button type="button" onClick={()=>setShowContractorChange(true)} className="text-xs text-primary underline ml-3 shrink-0">Ändern</button>
                            </div>
                          </div>
                        ):(
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Werkstatt wählen</p>
                            <Select value={selectedContractorId} onValueChange={v=>{setSelectedContractorId(v);setShowContractorChange(false)}}>
                              <SelectTrigger className="text-sm"><SelectValue placeholder="Werkstatt wählen..."/></SelectTrigger>
                              <SelectContent>{contractors.map(ct=><SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        )}
                        {caseData.preferred_appointment&&<p className="text-xs text-muted-foreground">Wunschtermin: <span className="font-medium text-foreground">{formatDateTime(caseData.preferred_appointment)}</span></p>}

                        {/* Annehmen */}
                        <Button className="w-full bg-green-700 hover:bg-green-800 text-white" disabled={isSendingSchnell||!selectedContractorId}
                          onClick={async()=>{setIsSendingSchnell(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(\`/api/hv/cases/\${id}/weiterleiten\`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractor_id:selectedContractorId,scheduled_appointment:caseData.preferred_appointment||null})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Werkstatt beauftragt — Mieter & Werkstatt informiert');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingSchnell(false)}}}>
                          {isSendingSchnell?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Annehmen & Werkstatt beauftragen
                        </Button>

                        {/* Ablehnen */}
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Mieter zuständig?</p>
                          <Textarea
                            className="text-sm min-h-[70px] resize-none"
                            placeholder="Begründung für den Mieter..."
                            value={ablehnungText}
                            onChange={e=>setAblehnungText(e.target.value)}
                          />
                          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5" disabled={isSendingAblehnung||!ablehnungText.trim()}
                            onClick={async()=>{setIsSendingAblehnung(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(\`/api/hv/cases/\${id}/ablehnen\`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({begruendung:ablehnungText})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Absage gesendet — Mieter per E-Mail informiert');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingAblehnung(false)}}}>
                            {isSendingAblehnung?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:null}Ablehnen & Mieter informieren
                          </Button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* IN_BEARBEITUNG / WARTE_AUF_HANDWERKER */}
                  {['in_bearbeitung','warte_auf_handwerker'].includes(caseData.status)&&(
                    <div className="space-y-3">
                      {caseData.assigned_to_company&&<p className="text-sm text-muted-foreground">Werkstatt: <span className="font-medium text-foreground">{caseData.assigned_to_company}</span></p>}
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wann kommt die Werkstatt?</p>
                        <Input type="datetime-local" value={naechsterSchrittDate} onChange={e=>setNaechsterSchrittDate(e.target.value)} className="text-sm"/>
                      </div>
                      <Button className="w-full" disabled={isSendingSchnell||!naechsterSchrittDate}
                        onClick={async()=>{setIsSendingSchnell(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(\`/api/hv/cases/\${id}\`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'termin_vereinbart',comment:\`Termin: \${new Date(naechsterSchrittDate).toLocaleString('de-AT')}\`,scheduled_appointment:new Date(naechsterSchrittDate).toISOString()})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Termin gespeichert — Mieter informiert');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingSchnell(false)}}}>
                        {isSendingSchnell?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Calendar className="mr-2 h-4 w-4"/>}Termin festlegen & Mieter informieren
                      </Button>
                    </div>
                  )}

                  {/* TERMIN_VEREINBART */}
                  {caseData.status==='termin_vereinbart'&&(
                    <div className="space-y-3">
                      {caseData.scheduled_appointment&&<p className="text-sm text-muted-foreground">Termin: <span className="font-medium text-foreground">{formatDateTime(caseData.scheduled_appointment)}</span></p>}
                      <Button className="w-full bg-green-700 hover:bg-green-800 text-white" disabled={isSendingSchnell}
                        onClick={async()=>{setIsSendingSchnell(true);setSchnellError(null);setSchnellSuccess(null);try{const res=await fetch(\`/api/hv/cases/\${id}\`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'erledigt',comment:'Schaden behoben — Fall abgeschlossen.'})});if(!res.ok)throw new Error((await res.json()).error);setSchnellSuccess('✓ Fall abgeschlossen');await fetchCase()}catch(err){setSchnellError(err instanceof Error?err.message:'Fehler')}finally{setIsSendingSchnell(false)}}}>
                        {isSendingSchnell?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<CheckCircle2 className="mr-2 h-4 w-4"/>}Schaden behoben — Fall abschließen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Abgeschlossen / Abgelehnt */}
            {['erledigt','abgelehnt'].includes(caseData.status)&&(
              <Card className="border-muted">
                <CardContent className="py-6 text-center space-y-2">
                  <p className="text-2xl">{caseData.status==='erledigt'?'✅':'❌'}</p>
                  <p className="font-semibold">{caseData.status==='erledigt'?'Fall abgeschlossen':'Meldung abgelehnt'}</p>
                  {caseData.closed_at&&<p className="text-xs text-muted-foreground">{formatDateTime(caseData.closed_at)}</p>}
                </CardContent>
              </Card>
            )}

            {/* Erweiterte Optionen */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-1 py-2 list-none select-none">
                <List className="h-4 w-4" />Erweiterte Optionen
                <span className="ml-auto text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="space-y-4 pt-2">

                {/* Status manuell */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Status manuell ändern</CardTitle><CardDescription className="text-xs">Aktuell: {caseData.status_label}</CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Status wählen..."/></SelectTrigger>
                      <SelectContent>{CASE_STATUSES.filter(s=>s!==caseData.status).map(s=><SelectItem key={s} value={s}>{CASE_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                    </Select>
                    <Textarea placeholder="Kommentar (Pflichtfeld)" value={statusComment} onChange={e=>setStatusComment(e.target.value)} className="resize-none min-h-[60px] text-sm"/>
                    <Button className="w-full" size="sm" disabled={!newStatus||!statusComment.trim()||isUpdatingStatus} onClick={handleStatusUpdate}>
                      {isUpdatingStatus?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Save className="mr-2 h-4 w-4"/>}Status speichern
                    </Button>
                  </CardContent>
                </Card>

                {/* Dringlichkeit */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5"/>Dringlichkeit</CardTitle><CardDescription className="text-xs">Aktuell: <span className={urgencyConfig.className.split(' ').filter((x: string)=>x.startsWith('text-')).join(' ')}>{urgencyConfig.label}</span></CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    <Select value={newUrgency} onValueChange={setNewUrgency}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Dringlichkeit..."/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notfall">🔴 Notfall</SelectItem>
                        <SelectItem value="dringend">🟡 Dringend</SelectItem>
                        <SelectItem value="normal">🟢 Normal</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="w-full" size="sm" disabled={!newUrgency||isUpdatingUrgency} onClick={handleUrgencyUpdate}>
                      {isUpdatingUrgency?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Save className="mr-2 h-4 w-4"/>}Speichern
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </details>

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>{/* end max-w container */}
    </div>
  )
}
`

// Assemble the new file
const newFile = before + parseHelper + newReturn

fs.writeFileSync(path, newFile)
console.log('Page rebuilt!')
console.log('- parseCarlAnalysis:', newFile.includes('parseCarlAnalysis') ? 'YES' : 'NO')
console.log('- CARL Verdict Bar:', newFile.includes('verdictStyle') ? 'YES' : 'NO')
console.log('- 4 Kacheln:', newFile.includes('Zuständigkeit') ? 'YES' : 'NO')
console.log('- Erklärungstext:', newFile.includes('weiterleitbar') ? 'YES' : 'NO')
console.log('- Ablehnen:', newFile.includes('Ablehnen & Mieter') ? 'YES' : 'NO')
