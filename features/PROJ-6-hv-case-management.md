# PROJ-6: Case-Management Dashboard HV (Übersicht & Bearbeitung)

## Status: In Progress
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-2 (HV-Authentifizierung)
- Requires: PROJ-4 (Schadensmeldung erstellen) — braucht Fälle zum Verwalten

## Beschreibung
Das Herzstück des HV-Portals. Alle eingehenden Schadensmeldungen aller Mieter der Organisation auf einen Blick. HV-Mitarbeiter können Fälle priorisieren, Status aktualisieren, Kommentare hinterlassen, Handwerker zuweisen und Termine festlegen. Ziel: 1 Bildschirm für den gesamten Fallüberblick.

## User Stories
- Als HV-Mitarbeiter möchte ich alle offenen Schadensmeldungen meiner Organisation auf einen Blick sehen (nach Dringlichkeit sortiert), damit ich sofort weiß was zuerst bearbeitet werden muss.
- Als HV-Mitarbeiter möchte ich den Status einer Meldung mit wenigen Klicks aktualisieren, damit der Mieter immer informiert ist.
- Als HV-Mitarbeiter möchte ich einem Fall einen Handwerker zuweisen (Name + Kontakt), damit klar ist wer für die Behebung zuständig ist.
- Als HV-Mitarbeiter möchte ich interne Notizen zu einem Fall hinzufügen (für Kollegen sichtbar, nicht für Mieter), damit wichtige Infos nicht verloren gehen.
- Als HV-Mitarbeiter möchte ich einen Termin für den Handwerkerbesuch im Fall eintragen, damit der Mieter benachrichtigt werden kann.

## Acceptance Criteria
- [ ] Übersichtstabelle aller Fälle: Fallnummer, Mieter, Einheit, Kategorie, Dringlichkeit, Status, Erstelldatum, Zugewiesen an
- [ ] Sortierung: Standard nach Dringlichkeit (Notfall zuerst), dann nach Erstelldatum
- [ ] Filter: nach Status / Dringlichkeit / Kategorie / Zugewiesen an / Zeitraum
- [ ] Suche: nach Fallnummer, Mietername, Wohneinheit
- [ ] Detailansicht eines Falls: alle Mieter-Felder + Fotos + interner Bereich für HV
- [ ] Status-Update in Detailansicht: Dropdown + Speichern-Button (mit Kommentar-Pflichtfeld)
- [ ] Kommentar an Mieter senden (öffentlich, wird im Mieter-Dashboard sichtbar)
- [ ] Interne Notiz hinzufügen (nur für HV-Mitarbeiter sichtbar)
- [ ] Handwerker zuweisen: Name + Telefon/E-Mail + Firma (Freitext, kein eigenes Handwerker-Modul im MVP)
- [ ] Termin eintragen: Datum + Uhrzeit (wird Mieter per E-Mail mitgeteilt)
- [ ] Alle Status-Änderungen werden mit Zeitstempel + Name des HV-Mitarbeiters protokolliert

## Edge Cases
- Was passiert wenn 2 HV-Mitarbeiter gleichzeitig denselben Fall bearbeiten? → Optimistic UI, letzter Speichern gewinnt, Konflikt-Warnung wenn möglich
- Was passiert bei 500+ offenen Fällen? → Pagination + Filterung als Pflicht, keine unlimitierten Queries
- Was passiert wenn ein Mitarbeiter einen Fall versehentlich als "Abgeschlossen" markiert? → Rückgängig-Option für 24h (Soft-Close: Status kann zurückgesetzt werden)
- Was passiert wenn ein Foto nicht geladen werden kann? → Placeholder + "Foto erneut laden" Button
- Was passiert wenn die HV den Handwerker-Namen ändert nach Benachrichtigung? → Änderung nur in DB, bereits gesendete E-Mails können nicht zurückgerufen werden (Hinweis anzeigen)

## Technical Requirements
- Alle Queries: `organization_id` Filter + RLS (HV-Mitarbeiter sieht NUR eigene Org)
- Pagination: 25 Fälle pro Seite
- Status-Änderungen: Transaktion (Status + Audit-Log gleichzeitig)
- Audit-Log-Eintrag bei jeder Status-Änderung: user_id, old_status, new_status, timestamp, kommentar
- Response-Time Übersichtsseite: < 2 Sekunden bei 500 Fällen
- Index: `organization_id` + `status` + `created_at` auf Schadensmeldungs-Tabelle

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
