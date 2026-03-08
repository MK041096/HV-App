# PROJ-10: Automatische Versicherungsdatenblatt-Befüllung

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-8 (n8n Webhook-Integration)
- Requires: PROJ-11 (Dokumentenablage) — Versicherungsdatenblatt-Template liegt dort

## Beschreibung
Wenn ein Fall abgeschlossen wird (oder manuell ausgelöst), generiert n8n automatisch ein befülltes Versicherungsdatenblatt (PDF oder strukturiertes Dokument) aus den Fall-Daten. Das erspart HV-Mitarbeitern das manuelle Ausfüllen von Formularen — einer der größten Zeitfresser im Schadensprozess.

## User Stories
- Als HV-Mitarbeiter möchte ich, dass das Versicherungsdatenblatt automatisch aus dem Fall befüllt wird wenn ich auf "Abgeschlossen" setze, damit ich das nicht mehr manuell ausfüllen muss.
- Als HV-Mitarbeiter möchte ich das generierte Dokument vor dem Versand prüfen und ggf. Felder manuell korrigieren.
- Als HV-Mitarbeiter möchte ich das Dokument direkt aus der App an die Versicherung weiterleiten (als E-Mail-Anhang).
- Als HV-Mitarbeiter möchte ich das Versicherungsdatenblatt als PDF in der Dokumentenablage des Falls speichern.

## Acceptance Criteria
- [ ] Beim Abschluss eines Falls (Status → Abgeschlossen): n8n Webhook `fall_abgeschlossen` ausgelöst
- [ ] n8n befüllt Versicherungsdatenblatt-Template mit: Fallnummer, Datum, Adresse, Schadenkategorie, Beschreibung, Schätzbetrag (falls hinterlegt), Handwerker-Name, Abschlussdatum
- [ ] Generiertes Dokument wird als PDF in Supabase Storage gespeichert
- [ ] Dokument erscheint automatisch in der Dokumentenablage des Falls (PROJ-11)
- [ ] HV-Mitarbeiter kann Felder im generierten Dokument nachbearbeiten (direktes Bearbeiten oder Felder im Fall korrigieren + neu generieren)
- [ ] "An Versicherung senden" Button: öffnet E-Mail-Client mit vorbefülltem Betreff + PDF als Anhang
- [ ] Manuelle Auslösung möglich: "Versicherungsdatenblatt generieren" Button im Fall

## Edge Cases
- Was passiert wenn Pflichtfelder für das Versicherungsdatenblatt fehlen (z.B. kein Schätzbetrag)? → Warnung mit Liste der fehlenden Felder, Generierung trotzdem möglich (leere Felder)
- Was passiert wenn das Template-Format sich ändert? → Template in Dokumentenablage hinterlegt, bei Änderung nur Template ersetzen
- Was passiert wenn PDF-Generierung fehlschlägt? → Fehlermeldung im Portal + Retry-Option
- Was passiert bei sehr langen Schadensbeschreibungen? → Text wird auf Versicherungsformular-Zeichenlimit gekürzt, Original bleibt im Fall erhalten
- Was passiert wenn verschiedene Versicherungen verschiedene Templates brauchen? → MVP: 1 Template pro Organisation konfigurierbar

## Technical Requirements
- PDF-Generierung: via n8n (HTML-zu-PDF Konvertierung oder Template-System)
- Template: DOCX oder HTML-Template in Supabase Storage
- Webhook-Event: `fall_abgeschlossen` mit vollständigem Fall-Payload
- PDF gespeichert in: `documents/{organization_id}/{case_id}/versicherung-{fallnummer}.pdf`
- Maximale Generierungszeit: < 30 Sekunden

## DSGVO-Relevanz
- Versicherungsdatenblatt enthält personenbezogene Mieterdaten → Übermittlung an Versicherung: Art. 6 Abs. 1 lit. c (rechtliche Verpflichtung) oder lit. f (berechtigtes Interesse)
- Dokument in privatem Storage Bucket — nie öffentlich
- Versicherungsunternehmen = eigener Verantwortlicher, kein AVV erforderlich (Art. 26 DSGVO)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
