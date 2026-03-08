# PROJ-12: KI-Mietvertragsanalyse (Claude API)

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-11 (Dokumentenablage) — Mietverträge müssen hochgeladen sein
- Requires: PROJ-6 (Case-Management HV) — Analyse wird im Kontext eines Falls ausgeführt

## Beschreibung
Die KI (Claude API) analysiert den Mietvertrag der betroffenen Wohneinheit und beantwortet automatisch: "Ist dieser Schaden laut Mietvertrag Mieter- oder Vermieter-Sache?" und "Welche Klauseln sind relevant?" — Ein Feature das bei professionellen HVs mit 200-1500 Einheiten täglich gebraucht wird und bisher manuelle Rechtsrecherche erfordert.

## User Stories
- Als HV-Mitarbeiter möchte ich mit einem Klick wissen ob ein gemeldeter Schaden laut Mietvertrag vom Mieter oder von der HV zu beheben ist, damit ich keine Zeit mit Vertragssuche verschwende.
- Als HV-Mitarbeiter möchte ich die relevanten Vertragsklauseln als Zitat sehen, damit ich die KI-Antwort selbst nachvollziehen und prüfen kann.
- Als HV-Mitarbeiter möchte ich die KI-Analyse als Notiz im Fall speichern, damit Kollegen die Einschätzung auch sehen.
- Als HV-Mitarbeiter möchte ich eine klare Einschätzung: "Mieter-Sache / Vermieter-Sache / Unklar", keine langen Texte.
- Als Plattformbetreiber möchte ich, dass die KI immer darauf hinweist, dass ihre Einschätzung keine Rechtsberatung ist.

## Acceptance Criteria
- [ ] "KI-Analyse starten" Button im Fall (nur wenn Mietvertrag für die Einheit hinterlegt ist)
- [ ] Analyse-Ergebnis: Einschätzung (Mieter-Sache / Vermieter-Sache / Unklar), relevante Klauseln als Zitate, Begründung (max. 200 Wörter)
- [ ] Pflicht-Disclaimer: "Diese Analyse ist keine Rechtsberatung. Bei Unklarheiten konsultieren Sie einen Rechtsanwalt."
- [ ] Analyse-Ergebnis kann als interne Notiz im Fall gespeichert werden
- [ ] Analyse-Verlauf: mehrere Analysen pro Fall möglich (z.B. nach Vertragsänderung)
- [ ] Wenn kein Mietvertrag hinterlegt: klare Meldung "Bitte zuerst Mietvertrag hochladen"
- [ ] Analyse-Dauer: Anzeige eines Ladeindikators (KI kann 5-15 Sekunden brauchen)
- [ ] Kosten-Transparenz: KI-Analyse verbraucht API-Credits (intern geloggt, nicht für MVP dem User angezeigt)

## Edge Cases
- Was passiert wenn der Mietvertrag nicht maschinenlesbar ist (gescanntes Bild-PDF)? → Fehlermeldung: "Dokument nicht lesbar — bitte als Text-PDF hochladen"
- Was passiert wenn der Mietvertrag sehr lang ist (> 100 Seiten)? → Relevante Abschnitte werden extrahiert (Semantic Search oder Chunking)
- Was passiert wenn die Claude API nicht erreichbar ist? → Fehlermeldung mit Retry-Option
- Was passiert wenn die KI "Unklar" antwortet? → Empfehlung: Rechtsanwalt kontaktieren (Link zu Disclaimer)
- Was passiert bei einem Vertrag auf Englisch oder einer anderen Sprache? → MVP: nur deutsche Verträge. Hinweis bei anderssprachigen Verträgen

## Technical Requirements
- Claude API: `claude-sonnet-4-6` (Kosten-Leistungs-Optimum für Dokumentenanalyse)
- PDF-Text-Extraktion: serverseitig vor API-Call (pdf-parse oder ähnlich)
- Kontext-Window: relevante Vertragsabschnitte via Keyword-Extraktion vorab filtern
- API-Key: nur serverseitig, nie im Frontend (Next.js API Route)
- Rate Limiting: max. 10 KI-Analysen pro Organisation pro Stunde
- Analyse-Log: Tabelle mit: case_id, organization_id, model_used, input_tokens, output_tokens, created_at (für Kostenkontrolle)

## DSGVO-Relevanz
- Mietvertrag enthält personenbezogene Daten → KI-Verarbeitung = Auftragsverarbeitung
- Anthropic (Claude API) als Sub-Auftragsverarbeiter: EU-Datenschutzbestimmungen prüfen
- Mietvertragsdaten NICHT für Anthropic-Training verwenden: API-Parameter `disable_training: true` setzen
- Hinweis in AVV: Anthropic als Unterauftragnehmer aufführen
- Daten werden nicht permanent bei Anthropic gespeichert (nur für Request-Verarbeitung)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
