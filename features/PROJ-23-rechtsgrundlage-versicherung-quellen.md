# PROJ-23: Klickbare Rechtsgrundlage + Versicherungspolice mit Highlight

> **Status:** Planned
> **Priorität:** P1 (steigert Vertrauen in CARL massiv — HV kann jede CARL-Aussage verifizieren)
> **Erstellt:** 2026-05-05

## Overview

Wenn CARL eine Rechtsgrundlage (z.B. „MRG § 3") oder eine greifende Versicherung nennt, soll die HV **mit einem Klick** den **Original-Quelltext** sehen können — entweder den Gesetzestext aus dem österreichischen RIS oder die hinterlegte Versicherungs-Police als PDF mit **markierter Klausel**.

**Zweck:** CARL gibt Antworten — aber die HV soll sie mit einem Klick verifizieren können. Das schafft Vertrauen, reduziert Fehler-Risiko und macht die Software auditierbar.

## User Stories

### Als HV-Sachbearbeiter
- möchte ich auf das Feld „Rechtsgrundlage" klicken und sofort den vollen Gesetzestext sehen
- möchte ich auf das Feld „Versicherung" klicken und die Police als PDF sehen — mit der für diesen Schaden relevanten Klausel **markiert**
- möchte ich keinen Browsertab wechseln müssen — alles in einem Side-Panel oder Dialog
- möchte ich einen Link zur Original-Quelle (RIS) sehen, falls ich offline-archivieren oder zitieren will

## Acceptance Criteria

### Rechtsgrundlage klickbar

- [ ] Tile „Rechtsgrundlage" in der CARL-Analyse ist klickbar (cursor: pointer, Hover-Effekt)
- [ ] Klick öffnet rechts ein Side-Panel (Sheet) mit:
  - Paragraf-Bezeichnung als Titel (z.B. „MRG § 3 — Erhaltungspflicht")
  - Voller Gesetzestext (1-2 Absätze, formatiert)
  - Quelle-Badge: „Republik Österreich · RIS · zuletzt aktualisiert YYYY-MM-DD"
  - Externer Link: „Auf ris.bka.gv.at öffnen"
- [ ] Funktioniert für **alle** in CARL hinterlegten Paragrafen:
  - Österreich: MRG § 3, § 8, ABGB § 1096, § 1111, § 1489
  - Deutschland: BGB § 535, § 536, § 280, § 823, § 538

### Versicherung klickbar (mit Highlight)

- [ ] Tile „Versicherung" ist klickbar wenn `carlData.versicherung` einen echten Police-Namen enthält (nicht „Keine" oder „Prüfen")
- [ ] Klick öffnet Side-Panel/Dialog mit PDF-Viewer (PDF.js)
- [ ] Die für diesen Schaden relevante **Textstelle** in der Police ist **gelb markiert**
  - CARL muss dafür ein neues Feld liefern: `VERSICHERUNG_KLAUSEL: [exaktes Zitat aus der Police, max. 2 Sätze, das die Deckung belegt]`
  - Frontend sucht das Zitat im PDF-Text und markiert es per PDF.js Annotation-Layer
- [ ] Falls Klausel nicht im PDF gefunden wird: Hinweis „Klausel-Markierung nicht möglich — bitte manuell prüfen"
- [ ] Buttons: „Police herunterladen", „In neuem Tab öffnen"

### Backend / Daten

- [ ] Neue Tabelle `legal_texts` (org-übergreifend, public read):
  - `paragraph` (z.B. "MRG § 3"), `country` ("AT"|"DE"), `title`, `text`, `source_url`, `last_verified_at`
  - Initial gefüllt mit den ~10 wichtigsten Paragrafen aus dem CARL-Prompt
- [ ] Endpunkt `GET /api/legal/[paragraph]` → liefert Gesetzestext (gecacht, public)
- [ ] Endpunkt `GET /api/hv/cases/[id]/insurance-clause` → liefert PDF-URL (signed) + zu markierende Klausel
- [ ] CARL-Prompt erweitern um Pflichtfeld `VERSICHERUNG_KLAUSEL` bei greifender Versicherung

### Sicherheit

- [ ] Versicherungs-PDFs nur über signed URLs (max. 5 Minuten gültig)
- [ ] Tenant-Isolation: HV X kann keine Police von HV Y abrufen
- [ ] `legal_texts` ist read-only für alle User (nur durch Migration befüllt)

## Edge Cases

- CARL nennt einen Paragraf den wir nicht hinterlegt haben → Side-Panel zeigt nur den Link zu RIS, ohne lokalen Volltext, mit Hinweis „Volltext folgt"
- Police-PDF hat OCR-Probleme (Text nicht extrahierbar) → Highlight nicht möglich, Hinweis anzeigen
- Mehrere Versicherungen treffen zu → CARL nennt aktuell nur eine, das bleibt vorerst so

## Tech-Notes

- **PDF-Viewer:** `react-pdf` (Wrapper um pdf.js) — bereits via `pdf-parse` im Projekt, aber separater Renderer nötig
- **Highlight:** Via TextLayer + Custom-Span-Replacement in pdf.js
- **Gesetzestexte:** Einmalig manuell aus RIS kopieren (nicht scrapen — RIS hat keine offizielle API für Volltexte). 10 Paragrafen × ~5 Min = 1h Arbeit
- **Cache:** `legal_texts` ist semi-statisch — `cache-control: public, max-age=86400`

## Out of Scope (explicit)

- Keine Diff-Anzeige bei Gesetzesänderungen
- Keine automatische Synchronisation mit RIS — manuelle Verifikation via `last_verified_at`
- Kein PDF-Editing (nur Anzeigen + Markieren)
- Kein Highlight in Mietverträgen (separates Feature, später)

## Build Order

1. `legal_texts` Migration + 10 Paragrafen befüllen + RLS
2. `/api/legal/[paragraph]` Endpunkt
3. UI: Rechtsgrundlage-Tile klickbar + Sheet/Dialog mit Volltext
4. CARL-Prompt um `VERSICHERUNG_KLAUSEL` erweitern
5. PDF-Viewer (`react-pdf`) installieren + integrieren
6. Highlight-Logik (Text-Suche im PDF + gelbe Markierung)
7. UI: Versicherung-Tile klickbar + PDF-Viewer-Dialog
8. QA-Pass: alle Paragrafen testen, alle 5 hinterlegten Policen testen

**Geschätzter Aufwand:** 2-3 Tage
