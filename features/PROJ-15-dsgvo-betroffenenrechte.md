# PROJ-15: DSGVO-Betroffenenrechte (Datenexport & Löschung)

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-3 (Mieter-Registrierung) — Mieter-Accounts müssen existieren
- Requires: PROJ-2 (HV-Authentifizierung)

## Beschreibung
Technische Umsetzung der DSGVO-Pflichtrechte für Mieter: Recht auf Auskunft (eigene Daten exportieren), Recht auf Löschung (Account löschen) und Recht auf Berichtigung (Daten korrigieren). Diese Features sind gesetzlich verpflichtend (Art. 15–17 DSGVO) und müssen vor dem Go-Live mit echten Kundendaten funktionieren.

## User Stories
- Als Mieter möchte ich alle meine gespeicherten Daten als Download erhalten (Auskunftsrecht), damit ich weiß was die Plattform über mich weiß.
- Als Mieter möchte ich meinen Account und alle meine Daten löschen lassen können (Recht auf Vergessenwerden).
- Als Mieter möchte ich meine Profildaten (Name, E-Mail, Telefon) selbst berichtigen können.
- Als HV-Mitarbeiter möchte ich Löschanfragen von Mietern im Portal sehen und bestätigen können (da HV Verantwortlicher ist).
- Als Plattformbetreiber möchte ich, dass alle Löschanfragen dokumentiert werden, damit ich bei einer DSB-Prüfung Compliance nachweisen kann.

## Acceptance Criteria
- [ ] Mieter-Einstellungsseite mit: Daten exportieren / Account löschen / Profil bearbeiten
- [ ] Datenexport: JSON-Datei mit allen Mieter-Daten (Profil, Schadensmeldungen, Kommentare) — Download per Klick
- [ ] Datenexport-Generierung: max. 60 Sekunden, dann Download-Link per E-Mail
- [ ] Account-Löschung: 30-Tage-Soft-Delete (Mieter kann sich nicht einloggen, Daten noch vorhanden), danach automatischer Hard-Delete
- [ ] Löschantrag wird HV-Admin angezeigt (zur Kenntnis, keine Genehmigung nötig)
- [ ] Löschantrag-Log: Datum, Mieter-ID (anonymisiert), Status (ausstehend/vollzogen)
- [ ] Sofortige Löschung wenn keine Aufbewahrungspflichten greifen (keine Schadensmeldungen)
- [ ] Wenn Aufbewahrungspflichten greifen (7 Jahre): Personaldaten anonymisiert, Fall-Daten bleiben
- [ ] Profilbearbeitung: Name, Telefon änderbar; E-Mail-Änderung via Supabase Auth (mit Bestätigungs-E-Mail)

## Edge Cases
- Was passiert wenn der Mieter einen laufenden Fall hat und seinen Account löschen möchte? → Hinweis: "Du hast noch offene Fälle. Diese werden nach der Löschung auf anonyme Daten reduziert."
- Was passiert wenn der Datenexport sehr groß ist? → Asynchron generieren, Download-Link per E-Mail, Link 24h gültig
- Was passiert wenn ein Mieter mehrfach Löschanträge stellt? → Nur ein aktiver Antrag pro Mieter, Duplikate ignoriert
- Was passiert wenn die 30-Tage-Frist verpasst wird (technischer Fehler)? → Cron-Job prüft täglich ausstehende Löschanträge

## Technical Requirements
- Datenexport: serverseitiger Job, JSON-Format, ZIP-Archiv
- Lösch-Cron: täglich prüfen ob 30-Tage-Frist abgelaufen (Supabase Edge Functions oder n8n)
- Anonymisierung statt Löschung bei Aufbewahrungspflicht: Name/E-Mail durch `[gelöscht]` ersetzen
- Lösch-Log-Tabelle: id, user_id_hash, request_date, completion_date, status, reason
- DSGVO-konforme Dokumentation: alle Löschanträge 3 Jahre in Log aufbewahren (Compliance-Nachweis)

## DSGVO-Relevanz
- Direkte Umsetzung von Art. 15 (Auskunft), Art. 16 (Berichtigung), Art. 17 (Löschung) DSGVO
- Frist: 1 Monat Antwortzeit (Art. 12 Abs. 3 DSGVO)
- Nachweispflicht: Lösch-Log für DSB-Prüfungen (§ 55 DSG)
- Zuständige Aufsichtsbehörde AT: Datenschutzbehörde, dsb.gv.at

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
