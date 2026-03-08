# PROJ-8: n8n Webhook-Integration & E-Mail-Benachrichtigungen

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-4 (Schadensmeldung erstellen) — Events kommen von neuen Meldungen
- Requires: PROJ-6 (Case-Management HV) — Events kommen von Status-Änderungen

## Beschreibung
Die App sendet bei definierten Ereignissen Webhooks an den selbst gehosteten n8n-Server. n8n verarbeitet diese und versendet automatisch E-Mail-Benachrichtigungen an Mieter und HV-Mitarbeiter. Das ist die Grundlage aller weiteren Automatisierungen (PROJ-9, PROJ-10).

## User Stories
- Als HV-Mitarbeiter möchte ich sofort per E-Mail benachrichtigt werden wenn ein neuer Schaden gemeldet wird (besonders Notfälle), damit ich schnell reagieren kann.
- Als Mieter möchte ich per E-Mail benachrichtigt werden wenn sich der Status meiner Meldung ändert, damit ich nicht ständig ins Portal schauen muss.
- Als Mieter möchte ich eine Bestätigungs-E-Mail nach dem Einreichen meiner Meldung erhalten.
- Als HV-Mitarbeiter möchte ich konfigurieren können welche Benachrichtigungen ich erhalte (z.B. nur Notfälle), damit ich nicht mit E-Mails überflutet werde.
- Als Plattformbetreiber möchte ich, dass Benachrichtigungen über n8n laufen (nicht direkt aus der App), damit Workflows ohne Code-Änderungen angepasst werden können.

## Acceptance Criteria
- [ ] App sendet Webhook bei: neue Schadensmeldung, Status-Änderung, neuer Kommentar, Termin eingetragen
- [ ] Webhook-Payload enthält: event_type, organization_id, case_id, fallnummer, dringlichkeit, mieter_email, hv_email, zeitstempel
- [ ] Webhook-Endpunkt in App: `/api/webhooks/n8n` (POST, signiert mit HMAC-Geheimnis)
- [ ] n8n verarbeitet Webhook und sendet E-Mail: Neue Meldung → HV-Mitarbeiter E-Mail
- [ ] n8n sendet E-Mail: Status-Änderung → Mieter E-Mail
- [ ] n8n sendet E-Mail: Termin vereinbart → Mieter E-Mail mit Datum/Uhrzeit
- [ ] Webhook-Delivery wird in DB geloggt (event_id, status: sent/failed, retry_count)
- [ ] Bei Webhook-Fehler: automatischer Retry (3x, exponentieller Backoff)
- [ ] E-Mail-Templates: professionelles Design, Fallnummer prominent, Link zum Portal

## Edge Cases
- Was passiert wenn n8n nicht erreichbar ist? → Webhook-Queue in DB, Retry bis zu 3x über 24h
- Was passiert bei doppeltem Webhook-Versand (Netzwerk-Retry)? → Idempotenz via event_id (n8n erkennt Duplikate)
- Was passiert wenn die Mieter-E-Mail-Adresse ungültig ist? → n8n-Fehler wird geloggt, HV wird informiert
- Was passiert bei massenhaften Status-Änderungen (Batch)? → Webhooks in Queue, max. 10/Sekunde
- Was passiert wenn n8n Server-Upgrade durchgeführt wird? → Webhooks werden gequeued, nach Restart verarbeitet

## Technical Requirements
- Webhook-Signierung: HMAC-SHA256 mit gemeinsamem Geheimnis (in .env.local)
- n8n selbst gehostet (Hetzner o.ä.), eigene Domain (z.B. n8n.deinedomain.at)
- Webhook-Log-Tabelle: event_id, event_type, payload, status, sent_at, retry_count
- E-Mail-Versand via n8n: SMTP (eigener Server oder SendGrid/Postmark)
- n8n-Workflows dokumentiert in `docs/n8n-workflows/`

## DSGVO-Relevanz
- Webhook-Payloads enthalten personenbezogene Daten → HTTPS-Übertragung Pflicht
- n8n-Server muss in der EU stehen (DSGVO-Pflicht)
- n8n als Sub-Auftragsverarbeiter im AVV aufführen
- E-Mail-Benachrichtigungen: Rechtsgrundlage Art. 6 Abs. 1 lit. b (Vertragserfüllung)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
