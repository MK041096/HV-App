# PROJ-11: Dokumentenablage (Mietverträge, Rechnungen, Versicherungsblätter)

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-2 (HV-Authentifizierung)

## Beschreibung
Zentrale Dokumentenablage im HV-Portal. HV-Mitarbeiter können Dokumente pro Wohneinheit oder pro Fall hochladen und verwalten: Mietverträge (wichtig für KI-Analyse in PROJ-12), Rechnungen von Handwerkern, Versicherungspolizzen und generierte Dokumente. Alles an einem Ort, DSGVO-konform gespeichert.

## User Stories
- Als HV-Mitarbeiter möchte ich Mietverträge pro Wohneinheit hochladen, damit die KI-Analyse (PROJ-12) auf aktuelle Vertragsdaten zugreifen kann.
- Als HV-Mitarbeiter möchte ich Handwerker-Rechnungen einem Fall zuordnen, damit die Kostendokumentation vollständig ist.
- Als HV-Mitarbeiter möchte ich Versicherungspolizzen und -blätter pro Organisation ablegen, damit alle relevanten Dokumente griffbereit sind.
- Als HV-Mitarbeiter möchte ich Dokumente nach Typ filtern und suchen, damit ich schnell das richtige Dokument finde.
- Als HV-Mitarbeiter möchte ich automatisch generierte Dokumente (PROJ-10) in der Ablage sehen, ohne sie manuell hochladen zu müssen.

## Acceptance Criteria
- [ ] Dokumenten-Upload: PDF, DOCX, JPG, PNG; max. 50 MB pro Dokument
- [ ] Dokumententypen: Mietvertrag / Handwerker-Rechnung / Versicherungspolizze / Versicherungsdatenblatt / Sonstiges
- [ ] Zuordnung: pro Organisation (global) oder pro Wohneinheit oder pro Fall
- [ ] Dokumentenliste: Typ, Name, Größe, Upload-Datum, Uploader, Zuordnung
- [ ] Filter nach: Typ / Einheit / Fall / Zeitraum
- [ ] Suche nach Dateiname
- [ ] Vorschau für PDFs (direkt im Browser)
- [ ] Download-Button für alle Dokumente
- [ ] Löschen möglich (Soft-Delete, Dokument bleibt für Audit)
- [ ] Automatisch generierte Dokumente (PROJ-10) erscheinen hier ohne manuellen Upload

## Edge Cases
- Was passiert wenn jemand eine ausführbare Datei hochlädt (.exe, .js)? → Serverseitige Whitelist: nur PDF, DOCX, JPG, PNG erlaubt
- Was passiert wenn ein Mietvertrag aktualisiert wird (neuer Upload)? → Beide Versionen bleiben mit Versionsnummer, neueste Version ist "aktiv"
- Was passiert wenn Speicherlimit erreicht wird? → Warnung bei 80%, Sperrung bei 100% (Plan-abhängig)
- Was passiert bei einem sehr großen Dokument (> 50 MB)? → Fehlermeldung, max. 50 MB pro Datei
- Was passiert wenn ein Mieter seinen Mietvertrag einsehen möchte? → MVP: Nur HV kann Dokumente sehen. Mieter-Zugriff auf eigene Dokumente = P2

## Technical Requirements
- Supabase Storage Bucket: `documents/{organization_id}/{context}/{filename}`
- Bucket: PRIVAT — nur via Signed URLs zugänglich (1 Stunde Laufzeit)
- Virenscan bei Upload (falls Supabase das unterstützt, sonst serverseitige Typ-Validierung)
- Tabelle `documents`: id, organization_id, unit_id (nullable), case_id (nullable), document_type, file_name, file_path, file_size, uploaded_by, version, is_deleted
- Index auf: organization_id + document_type + case_id

## DSGVO-Relevanz
- Mietverträge sind hochsensible Dokumente mit personenbezogenen Daten
- Speicherfrist: 7 Jahre nach Vertragsende (§ 132 BAO)
- Nur berechtigte HV-Mitarbeiter dürfen auf Dokumente ihrer Organisation zugreifen
- Signed URLs: keine permanenten öffentlichen Links

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
