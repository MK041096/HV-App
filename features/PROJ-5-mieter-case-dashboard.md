# PROJ-5: Schadensmeldungs-Dashboard Mieter (Status-Tracking)

## Status: In Progress
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-4 (Schadensmeldung erstellen) — braucht Schadensmeldungen zum Anzeigen

## Beschreibung
Das persönliche Dashboard des Mieters. Zeigt alle eigenen Schadensmeldungen mit aktuellem Status, Verlaufshistorie und Kommunikation. Der Mieter kann den Fortschritt seiner Fälle jederzeit nachverfolgen — ohne anrufen zu müssen.

## User Stories
- Als Mieter möchte ich alle meine Schadensmeldungen auf einen Blick sehen, damit ich weiß was noch offen ist.
- Als Mieter möchte ich den aktuellen Status jeder Meldung sehen (Offen, In Bearbeitung, Termin vereinbart, Erledigt), damit ich informiert bin.
- Als Mieter möchte ich die Details einer Meldung aufrufen (Fotos, Beschreibung, Kommentare der HV), damit ich den vollständigen Verlauf sehe.
- Als Mieter möchte ich eine Benachrichtigung erhalten wenn sich der Status meiner Meldung ändert, damit ich nicht ständig nachschauen muss.
- Als Mieter möchte ich eine abgeschlossene Meldung als "zufriedenstellend gelöst" oder "nicht zufriedenstellend" bewerten, damit die HV Feedback erhält.

## Acceptance Criteria
- [ ] Dashboard zeigt alle Schadensmeldungen des eingeloggten Mieters (nur seine eigenen — RLS)
- [ ] Statusanzeige pro Meldung: Eingegangen / In Bearbeitung / Termin vereinbart / Abgeschlossen
- [ ] Fallnummer, Erstelldatum, Kategorie, Titel sichtbar in der Übersicht
- [ ] Filtermöglichkeit: Alle / Offen / Abgeschlossen
- [ ] Detailansicht einer Meldung: alle Felder, hochgeladene Fotos, Statusverlauf mit Zeitstempeln
- [ ] HV-Kommentare/Updates in der Detailansicht sichtbar
- [ ] E-Mail-Benachrichtigung bei Statusänderung (via Supabase + n8n vorbereitet)
- [ ] Bewertungsmöglichkeit für abgeschlossene Fälle (Daumen hoch/runter)
- [ ] Leerer Zustand: Hinweis "Noch keine Schadensmeldungen — Jetzt melden" mit Link zum Formular
- [ ] Responsive: funktioniert auf Smartphone (375px) genauso wie Desktop

## Edge Cases
- Was passiert wenn der Mieter 50+ Meldungen hat? → Pagination (20 pro Seite) oder Infinite Scroll
- Was passiert wenn eine Meldung gelöscht wurde (Soft-Delete)? → Nicht mehr angezeigt, aber Daten bleiben in DB für Audit
- Was passiert bei sehr langen HV-Kommentaren? → Kürzen mit "Mehr anzeigen" Button
- Was passiert wenn Fotos nicht laden (Signed URL abgelaufen)? → Automatisches Refresh der URL, Fallback-Placeholder
- Was passiert wenn der Mieter seine Bewertung ändern möchte? → Bewertung kann einmal geändert werden innerhalb von 7 Tagen

## Technical Requirements
- Alle Queries mit `organization_id` Filter + RLS
- Fotos: Signed URLs mit 30-Minuten Ablaufzeit (neu generiert beim Seitenaufruf)
- Status-Enum: `eingegangen | in_bearbeitung | termin_vereinbart | abgeschlossen`
- Benachrichtigungs-E-Mails: Vorbereitung für PROJ-8 (n8n Webhooks)
- Performance: Dashboard-Laden < 2 Sekunden (Index auf `tenant_id` + `created_at`)

## DSGVO-Relevanz
- Mieter sieht ausschließlich eigene Daten (RLS auf user_id Ebene)
- Fotos nur via Signed URLs — nie öffentliche permanente Links
- Statusverlauf ist Teil der Verarbeitungsdokumentation (Art. 5 Abs. 2 DSGVO)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
