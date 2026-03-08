# PROJ-4: Schadensmeldung erstellen (Mieter-Portal)

## Status: In Progress
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-3 (Mieter-Registrierung) — Mieter muss eingeloggt sein

## Beschreibung
Das Kernfeature der App. Ein eingeloggter Mieter kann über ein strukturiertes Formular eine Schadensmeldung einreichen. Die Meldung enthält Kategorie, Beschreibung, Fotos, Dringlichkeitsstufe und optionalen Wunschtermin. Nach dem Absenden erhält der Mieter eine Bestätigung und die HV wird benachrichtigt.

## User Stories
- Als Mieter möchte ich einen Schaden in meiner Wohnung schnell und einfach melden, damit die Hausverwaltung informiert wird ohne dass ich anrufen muss.
- Als Mieter möchte ich Fotos des Schadens hochladen, damit die HV den Schaden besser beurteilen kann.
- Als Mieter möchte ich eine Dringlichkeitsstufe angeben (z.B. Notfall: Wasserrohrbruch vs. Normal: Riss in Wand), damit schnell auf echte Notfälle reagiert wird.
- Als Mieter möchte ich einen Wunschtermin für den Handwerkerbesuch angeben, damit ich bei der Terminvereinbarung berücksichtigt werde.
- Als Mieter möchte ich nach dem Absenden eine Bestätigung mit einer Fallnummer erhalten, damit ich den Status verfolgen kann.

## Acceptance Criteria
- [ ] Formular-Felder: Kategorie (Pflicht), Unterkategorie, Titel (Pflicht, max. 100 Zeichen), Beschreibung (Pflicht, max. 1000 Zeichen), Dringlichkeit (Pflicht), Fotos (optional, max. 5), Wunschtermin (optional)
- [ ] Kategorien: Sanitär, Elektrik, Heizung, Fenster/Türen, Böden/Wände, Außenbereich, Sonstiges
- [ ] Dringlichkeitsstufen: Notfall (sofort), Dringend (innerhalb 48h), Normal (innerhalb 2 Wochen)
- [ ] Foto-Upload: max. 5 Fotos, max. 10 MB pro Foto, Formate: JPG, PNG, HEIC
- [ ] EXIF-Daten werden beim Upload serverseitig entfernt (DSGVO)
- [ ] Fotos werden in privatem Supabase Storage Bucket gespeichert (keine öffentlichen URLs)
- [ ] Nach Absenden: Bestätigungsseite mit generierter Fallnummer (Format: SCH-YYYY-XXXXX)
- [ ] Bestätigungs-E-Mail an Mieter mit Fallnummer und Zusammenfassung
- [ ] Schadensmeldung wird der richtigen Organisation und Wohneinheit zugeordnet (via eingeloggten Mieter)
- [ ] Formular validiert client- und serverseitig

## Edge Cases
- Was passiert bei schlechter Internetverbindung während des Uploads? → Upload-Fehler mit "Erneut versuchen"-Option, bereits hochgeladene Fotos bleiben
- Was passiert wenn der Mieter das Formular halb ausfüllt und Seite verlässt? → Kein Auto-Save im MVP, Mieter muss neu beginnen (Hinweis beim Verlassen)
- Was passiert wenn ein Foto zu groß ist (> 10 MB)? → Klare Fehlermeldung vor dem Upload, kein stiller Fehler
- Was passiert bei Notfall-Dringlichkeit? → Hervorgehobene Warnung + Hinweis auf Notfall-Telefonnummer der HV
- Was passiert wenn der Mieter in 1 Stunde 20 Meldungen einreicht? → Rate Limiting: max. 5 Meldungen / Stunde pro Mieter
- Was passiert bei verbotenen Dateitypen (PDF, exe)? → Serverseitige Validierung, Ablehnung mit Fehlermeldung

## Technical Requirements
- Foto-Upload: Supabase Storage, privater Bucket `damage-photos/{organization_id}/{case_id}/`
- EXIF-Stripping: serverseitig vor dem Speichern (sharp-Bibliothek oder ähnlich)
- Fallnummer: generiert beim Speichern, format `SCH-{YEAR}-{5-stellig-sequential}`
- Zod-Validierung auf Server-Seite für alle Formularfelder
- Maximale Formular-Antwortzeit: < 3 Sekunden
- Mobile-first Design (viele Mieter melden vom Smartphone)

## DSGVO-Relevanz
- Fotos: EXIF-Daten (GPS, Gerätedaten) MÜSSEN entfernt werden (Datensparsamkeit, Art. 5 DSGVO)
- Storage-Bucket: PRIVAT — Fotos nur via Signed URLs mit Ablaufzeit (30 min) abrufbar
- Schadensmeldung enthält personenbezogene Daten → `organization_id` + RLS Pflicht
- Rechtsgrundlage: Art. 6 Abs. 1 lit. b (Vertragserfüllung Mietvertrag)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
