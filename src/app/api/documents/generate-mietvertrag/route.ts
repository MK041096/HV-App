import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit')

// POST /api/documents/generate-mietvertrag
// Body: { unit_id: string, save_to_storage?: boolean }
// Returns: PDF als Download ODER speichert in Supabase und gibt { document_id } zurück
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: hvProfile } = await supabase
      .from('profiles')
      .select('organization_id, role, first_name, last_name')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!hvProfile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(hvProfile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { unit_id, save_to_storage } = await request.json()
    if (!unit_id) return NextResponse.json({ error: 'unit_id fehlt' }, { status: 400 })

    // Einheit laden
    const { data: unit } = await supabase
      .from('units')
      .select('id, name, address')
      .eq('id', unit_id)
      .eq('organization_id', hvProfile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!unit) return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 })

    // Organisation laden
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', hvProfile.organization_id)
      .single()

    // Mieter laden (falls vorhanden)
    const { data: mieterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('unit_id', unit_id)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .maybeSingle()

    // Ausstehenden Aktivierungscode prüfen (noch nicht registrierter Mieter)
    let mieterName = mieterProfile
      ? `${mieterProfile.first_name || ''} ${mieterProfile.last_name || ''}`.trim()
      : null

    if (!mieterName) {
      const { data: code } = await supabase
        .from('activation_codes')
        .select('invited_first_name, invited_last_name')
        .eq('unit_id', unit_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (code) {
        mieterName = `${code.invited_first_name || ''} ${code.invited_last_name || ''}`.trim() || null
      }
    }

    const vermieterName = org?.name || 'Hausverwaltung'
    const today = new Date()
    const dateStr = today.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const beginn = dateStr
    const vertragsDatum = dateStr

    // Adresse und Top-Nummer parsen
    // Einheit: "Mariahilfer Straße 88 Top 1", Adresse: "Mariahilfer Straße 88, 1060 Wien"
    const unitNameClean = unit.name || ''
    const topMatch = unitNameClean.match(/Top\s*(\d+)/i)
    const topNr = topMatch ? topMatch[1] : ''
    const adresszeile = unit.address || ''

    // Vollständige Adresse des Mietgegenstands
    const mietgegenstandAdresse = topNr
      ? `${adresszeile}, Top ${topNr}`
      : adresszeile

    // ── PDF generieren ──
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 70, right: 70 },
        info: {
          Title: `Mietvertrag – ${unit.name}`,
          Author: vermieterName,
          Subject: 'Mietvertrag nach MRG (österreichisches Mietrechtsgesetz)',
        },
      })

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', resolve)
      doc.on('error', reject)

      const PAGE_W = doc.page.width - 140 // Textbreite (Seitenbreite minus Margins)
      const COL_LEFT = 70

      // Hilfsfunktionen
      function heading1(text: string) {
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a').text(text, COL_LEFT, undefined, { width: PAGE_W })
        doc.moveDown(0.5)
      }
      function heading2(text: string) {
        doc.moveDown(0.8)
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text(text, COL_LEFT, undefined, { width: PAGE_W })
        doc.moveDown(0.3)
      }
      function body(text: string) {
        doc.fontSize(10).font('Helvetica').fillColor('#333333').text(text, COL_LEFT, undefined, { width: PAGE_W, align: 'justify' })
        doc.moveDown(0.5)
      }
      function twoCol(label: string, value: string) {
        const y = doc.y
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555').text(label, COL_LEFT, y, { width: 150, continued: false })
        doc.fontSize(10).font('Helvetica').fillColor('#333333').text(value, COL_LEFT + 160, y, { width: PAGE_W - 160 })
        doc.moveDown(0.4)
      }
      function line() {
        doc.moveDown(0.3)
        doc.moveTo(COL_LEFT, doc.y).lineTo(COL_LEFT + PAGE_W, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke()
        doc.moveDown(0.5)
      }

      // ── DECKBLATT ──
      doc.moveDown(3)
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a1a')
        .text('MIETVERTRAG', COL_LEFT, undefined, { width: PAGE_W, align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(12).font('Helvetica').fillColor('#666666')
        .text('gemäß österreichischem Mietrechtsgesetz (MRG)', COL_LEFT, undefined, { width: PAGE_W, align: 'center' })
      doc.moveDown(2)
      line()
      doc.moveDown(1)
      twoCol('Mietobjekt:', mietgegenstandAdresse)
      twoCol('Mieter:', mieterName || '___________________________')
      twoCol('Vermieter:', vermieterName)
      twoCol('Vertragsdatum:', vertragsDatum)
      twoCol('Mietbeginn:', beginn)
      line()

      // ── SEITE 1: VERTRAGSPARTEIEN ──
      doc.addPage()

      heading1('§ 1  Vertragsparteien')

      heading2('1.1  Vermieter')
      body(`${vermieterName}, vertreten durch die Hausverwaltung SMARTCARL, Wildgansgasse 8/2, 7400 Oberwart, Österreich (im Folgenden „Vermieter" genannt).`)

      heading2('1.2  Mieter')
      body(`${mieterName || '___________________________'} (im Folgenden „Mieter" genannt).`)

      heading1('§ 2  Mietgegenstand')
      body(`Der Vermieter vermietet dem Mieter die Wohnung im Objekt ${mietgegenstandAdresse}${topNr ? ` (Top ${topNr})` : ''}.`)
      body('Das Mietobjekt befindet sich in folgendem Gebäude:')
      twoCol('Liegenschaft:', adresszeile)
      twoCol('Wohneinheit:', unit.name)
      twoCol('Top-Nummer:', topNr ? `Top ${topNr}` : '—')
      body('Das Mietobjekt dient ausschließlich zu Wohnzwecken. Eine gewerbliche Nutzung oder Untervermietung bedarf der ausdrücklichen schriftlichen Zustimmung des Vermieters.')

      heading2('2.1  Beschreibung des Mietobjekts')
      body('Das Mietobjekt besteht aus Wohn- und Schlafräumen, Küche, Bad, WC sowie gegebenenfalls Abstellraum und Balkonflächen. Der genaue Zustand des Mietobjekts wird im beiderseitig unterfertigten Übergabeprotokoll (Anlage 1) festgehalten.')

      heading2('2.2  Mitgemietete Flächen')
      body('Zum Mietgegenstand gehören alle in der Wohnung befindlichen Einrichtungsgegenstände und Anlagen gemäß Übergabeprotokoll. Die Nutzung der allgemeinen Teile des Hauses (Stiegenhaus, Waschküche, Kellerabteile) erfolgt nach Maßgabe der Hausordnung.')

      // ── SEITE 2: MIETDAUER & MIETZINS ──
      doc.addPage()

      heading1('§ 3  Mietdauer und Beginn des Mietverhältnisses')
      body(`Das Mietverhältnis beginnt am ${beginn} und wird auf unbestimmte Zeit abgeschlossen. Beide Vertragsparteien können das Mietverhältnis unter Einhaltung der gesetzlichen Kündigungsfristen gemäß MRG kündigen.`)
      body('Eine Befristung des Mietverhältnisses ist nur unter den Voraussetzungen des § 29 MRG zulässig. Bei einem befristeten Mietvertrag besteht das gesetzliche Eintrittsrecht sowie das Recht auf Verlängerung gemäß MRG.')

      heading1('§ 4  Hauptmietzins und Wertsicherung')

      heading2('4.1  Hauptmietzins')
      body('Der monatliche Hauptmietzins wird zwischen den Vertragsparteien gemäß den Bestimmungen des § 16 MRG vereinbart und im Übergabeprotokoll oder einer gesonderten Mietzinsvereinbarung schriftlich festgehalten.')
      body('Der Hauptmietzins ist monatlich im Voraus, spätestens bis zum 5. eines jeden Monats auf das vom Vermieter bekannt gegebene Konto zu überweisen.')

      heading2('4.2  Wertsicherung')
      body('Der vereinbarte Hauptmietzins ist wertgesichert und verändert sich entsprechend der Entwicklung des Verbraucherpreisindex (VPI) 2020 oder des an seine Stelle tretenden Index, herausgegeben von der Statistik Austria. Basis für die Wertsicherung ist der für den Monat des Vertragsabschlusses verlautbarte Indexwert.')
      body('Indexveränderungen werden mit dem nächsten Zinstermin wirksam. Veränderungen unter 5 % werden auf den nächsten Verrechnungszeitraum vorgetragen.')

      heading1('§ 5  Betriebskosten und öffentliche Abgaben')
      body('Neben dem Hauptmietzins trägt der Mieter anteilig die Betriebskosten gemäß § 21 MRG. Diese umfassen insbesondere:')
      body('• Wassergebühren und Kanalgebühren\n• Kosten der Rauchfangkehrung\n• Kosten der Hausbetreuung und Reinigung\n• Kosten der Beleuchtung der allgemeinen Teile\n• Verwaltungshonorar gemäß § 22 MRG\n• Öffentliche Abgaben (Grundsteuer anteilig)\n• Kosten einer Haushaltsversicherung (wenn vorhanden)')
      body('Die Betriebskosten werden jährlich abgerechnet. Der Mieter leistet monatliche Akontozahlungen. Eine Jahresabrechnung gemäß § 21 Abs. 3 MRG wird dem Mieter jährlich zur Verfügung gestellt.')

      // ── SEITE 3: KAUTION & PFLICHTEN ──
      doc.addPage()

      heading1('§ 6  Kaution und Sicherheitsleistung')
      body('Der Mieter leistet zu Beginn des Mietverhältnisses eine Kaution in Höhe von drei Bruttomonatsmieten (Hauptmietzins inkl. Betriebskosten und USt) als Sicherheitsleistung für alle Ansprüche des Vermieters aus diesem Mietvertrag.')
      body('Die Kaution ist auf einem gesonderten Konto zinsbringend anzulegen. Nach Beendigung des Mietverhältnisses und Übergabe des Mietobjekts in ordnungsgemäßem Zustand wird die Kaution innerhalb von einem Monat zurückerstattet, abzüglich allfälliger berechtigter Forderungen des Vermieters.')

      heading1('§ 7  Instandhaltungs- und Reparaturpflichten')

      heading2('7.1  Pflichten des Vermieters (§ 3 MRG)')
      body('Der Vermieter ist verpflichtet, das Mietobjekt in einem zum ortsüblichen Gebrauch tauglichen Zustand zu erhalten. Dazu gehören insbesondere:')
      body('• Erhaltung der allgemeinen Teile des Hauses\n• Behebung ernster Schäden des Hauses (§ 3 Abs. 2 Z 2 MRG)\n• Instandhaltung der Heizungsanlage, der Aufzugsanlage und sonstiger Gemeinschaftsanlagen\n• Behebung von Schäden, die die Bewohnbarkeit der Wohnung beeinträchtigen')

      heading2('7.2  Pflichten des Mieters (§ 8 MRG)')
      body('Der Mieter ist verpflichtet, auf eigene Kosten zu erhalten und zu reparieren:')
      body('• Kleinreparaturen und Wartung von Einrichtungsgegenständen\n• Aufrechterhaltung der Betriebsbereitschaft von mitvermieteten Einrichtungen\n• Schäden, die er oder seine Mitbewohner schuldhaft verursacht haben')
      body('Schäden am Mietobjekt sind dem Vermieter unverzüglich zu melden. Der Mieter ist verpflichtet, dem Vermieter oder von ihm beauftragten Personen nach vorheriger Ankündigung Zutritt zum Mietobjekt zu gewähren.')

      heading1('§ 8  Veränderungen am Mietobjekt')
      body('Bauliche Veränderungen am Mietobjekt, insbesondere Umbaumaßnahmen, die Installation von Einrichtungen oder sonstige Eingriffe in die Substanz des Mietobjekts, bedürfen der vorherigen schriftlichen Zustimmung des Vermieters.')
      body('Bei Beendigung des Mietverhältnisses hat der Mieter das Mietobjekt in dem Zustand zu übergeben, wie er es übernommen hat, normale Abnutzung ausgenommen. Nicht genehmigte Veränderungen sind auf Verlangen des Vermieters zu beseitigen.')

      // ── SEITE 4: WEITERE BESTIMMUNGEN ──
      doc.addPage()

      heading1('§ 9  Weitergabe und Untervermietung')
      body('Eine gänzliche Weitergabe des Mietrechts sowie die Untervermietung bedürfen der vorherigen schriftlichen Zustimmung des Vermieters. Ein gesetzliches Weitergaberecht besteht ausschließlich unter den Voraussetzungen des § 12 MRG (nahe Angehörige, die mit dem Mieter bereits im gemeinsamen Haushalt leben).')

      heading1('§ 10  Hausordnung')
      body('Der Mieter verpflichtet sich, die geltende Hausordnung sowie alle zukünftigen Änderungen und Ergänzungen einzuhalten. Die Hausordnung ist Bestandteil dieses Mietvertrags. Insbesondere ist auf Ruhezeiten zu achten (22:00 bis 06:00 Uhr sowie ganztägig sonn- und feiertags).')
      body('Der Betrieb von Haustieren ist nur mit ausdrücklicher Zustimmung des Vermieters gestattet.')

      heading1('§ 11  Kündigung (§ 30 MRG)')
      body('Der Mieter kann das Mietverhältnis unter Einhaltung einer Kündigungsfrist von einem Monat zum Monatsende kündigen. Die Kündigung hat schriftlich zu erfolgen.')
      body('Der Vermieter kann das Mietverhältnis nur aus den in § 30 MRG taxativ aufgezählten Gründen kündigen (z.B. Nichtzahlung des Mietzinses, erheblich nachteiliger Gebrauch des Mietobjekts, Untervermietung ohne Genehmigung).')
      body('Die Aufhebungsklage (§ 33 MRG) bei erheblichem Rückstand des Mietzinses ist zulässig.')

      heading1('§ 12  Versicherung')
      body('Der Vermieter unterhält eine angemessene Gebäudeversicherung für das Mietobjekt. Der Mieter wird ausdrücklich darauf hingewiesen, dass diese Versicherung seinen Hausrat und seine persönlichen Gegenstände nicht umfasst. Der Mieter wird empfohlen, eine eigene Haushaltsversicherung abzuschließen.')

      // ── SEITE 5: SCHLUSSBESTIMMUNGEN & UNTERSCHRIFTEN ──
      doc.addPage()

      heading1('§ 13  Datenschutz (DSGVO)')
      body('Die im Rahmen dieses Mietvertrags erhobenen personenbezogenen Daten (Name, Adresse, Kontaktdaten) werden ausschließlich zur Verwaltung des Mietverhältnisses verarbeitet. Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie den einschlägigen österreichischen datenschutzrechtlichen Bestimmungen (DSG).')
      body('Die Daten werden nicht an Dritte weitergegeben, ausgenommen behördliche Stellen bei gesetzlicher Verpflichtung. Der Mieter hat das Recht auf Auskunft, Berichtigung und Löschung seiner Daten gemäß DSGVO.')

      heading1('§ 14  Schlussbestimmungen')
      body('Dieser Mietvertrag unterliegt österreichischem Recht, insbesondere den Bestimmungen des Allgemeinen Bürgerlichen Gesetzbuchs (ABGB) und des Mietrechtsgesetzes (MRG) in ihrer jeweils geltenden Fassung.')
      body('Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform. Mündliche Nebenabreden wurden nicht getroffen.')
      body('Sollten einzelne Bestimmungen dieses Vertrags unwirksam oder undurchführbar sein, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht.')
      body('Gerichtsstand für allfällige Streitigkeiten aus diesem Mietvertrag ist, soweit gesetzlich zulässig, das örtlich zuständige Gericht am Ort der Liegenschaft.')

      heading1('§ 15  Anlagen')
      body('Folgende Anlagen sind Bestandteil dieses Mietvertrags:\n• Anlage 1: Übergabeprotokoll (wird bei Übergabe ausgefertigt)\n• Anlage 2: Hausordnung\n• Anlage 3: Mietzinsvereinbarung')

      // Unterschriften
      doc.moveDown(2)
      line()
      doc.moveDown(1)
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a')
        .text('Vertragsunterfertigung', COL_LEFT, undefined, { width: PAGE_W, align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica').fillColor('#555555')
        .text(`Ort und Datum: ___________________________     Wien, ${vertragsDatum}`, COL_LEFT, undefined, { width: PAGE_W })
      doc.moveDown(2.5)

      const sigY = doc.y
      // Vermieter links
      doc.moveTo(COL_LEFT, sigY).lineTo(COL_LEFT + 180, sigY).strokeColor('#333333').lineWidth(0.8).stroke()
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
        .text(`${vermieterName}\n(Vermieter)`, COL_LEFT, sigY + 4, { width: 180 })

      // Mieter rechts
      const rightCol = COL_LEFT + PAGE_W - 180
      doc.moveTo(rightCol, sigY).lineTo(rightCol + 180, sigY).strokeColor('#333333').lineWidth(0.8).stroke()
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
        .text(`${mieterName || '___________________________'}\n(Mieter)`, rightCol, sigY + 4, { width: 180 })

      // Footer auf allen Seiten
      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i)
        doc.fontSize(8).font('Helvetica').fillColor('#999999')
          .text(
            `Mietvertrag – ${unit.name} – ${mietgegenstandAdresse} | Seite ${i + 1} von ${range.count} | Erstellt: ${vertragsDatum}`,
            COL_LEFT, doc.page.height - 45,
            { width: PAGE_W, align: 'center' }
          )
      }

      doc.end()
    })

    const pdfBuffer = Buffer.concat(chunks)

    // Optional: In Supabase Storage speichern
    if (save_to_storage) {
      const fileName = `mietvertrag-${unit.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
      const filePath = `${hvProfile.organization_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

      if (uploadError) throw uploadError

      const { data: doc } = await supabase
        .from('documents')
        .insert({
          organization_id: hvProfile.organization_id,
          name: `Mietvertrag – ${unit.name}`,
          file_path: filePath,
          file_size: pdfBuffer.length,
          mime_type: 'application/pdf',
          document_type: 'mietvertrag',
          unit_id: unit_id,
        })
        .select('id')
        .single()

      return NextResponse.json({ success: true, document_id: doc?.id, file_path: filePath })
    }

    // Download zurückgeben
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Mietvertrag-${unit.name.replace(/\s+/g, '-')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('Mietvertrag-Generator Fehler:', err)
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 })
  }
}
