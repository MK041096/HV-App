# DSGVO & DSG Österreich — Pflichtregeln für alle Skills

> **Rechtsgrundlage:** EU-Datenschutz-Grundverordnung (DSGVO, VO (EU) 2016/679) i.V.m.
> Österreichisches Datenschutzgesetz (DSG, BGBl. I Nr. 165/1999 i.d.F. BGBl. I Nr. 24/2018)
> Quellen: [RIS - DSG](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=bundesnormen&Gesetzesnummer=10001597) | [DSGVO Art. 28](https://dsgvo-gesetz.de/art-28-dsgvo/) | [DSGVO Art. 32](https://dsgvo-gesetz.de/art-32-dsgvo/) | [DSGVO Art. 33](https://dsgvo-gesetz.de/art-33-dsgvo/)

> **ACHTUNG:** Diese Datei enthält technische Implementierungsregeln basierend auf geltendem Recht.
> Sie ersetzt KEINE Rechtsberatung. Vor dem Go-Live mit echten Kundendaten ist ein
> Datenschutzanwalt (AT) hinzuzuziehen.

---

## 1. Rollenklarheit — wer ist was?

Diese App ist ein **Auftragsverarbeiter** (Art. 28 DSGVO), NICHT der Verantwortliche.

| Rolle | Wer | Bedeutung |
|-------|-----|-----------|
| **Verantwortlicher** (Controller) | Die Hausverwaltung (Kunde) | Entscheidet über Zweck & Mittel der Verarbeitung |
| **Auftragsverarbeiter** (Processor) | Unsere SaaS-App | Verarbeitet Daten NUR im Auftrag der Hausverwaltung |
| **Betroffene** (Data Subject) | Mieter | Haben Rechte auf Auskunft, Löschung, Berichtigung |
| **Sub-Auftragsverarbeiter** | Supabase, Vercel | Müssen im AVV aufgeführt sein |

**Konsequenz für den Code:** Die App darf Daten NICHT für eigene Zwecke nutzen
(kein Tracking, kein Weiterverkauf, keine KI-Trainingsnutzung der Kundendaten).

---

## 2. Auftragsverarbeitungsvertrag (AVV) — Art. 28 DSGVO

**PFLICHT:** Jede Hausverwaltung, die die App nutzt, MUSS einen AVV unterzeichnen.
Ohne AVV ist die Nutzung rechtswidrig.

### Was der AVV regeln muss (Art. 28 Abs. 3 DSGVO):
- Gegenstand und Dauer der Verarbeitung
- Art und Zweck der Verarbeitung
- Art der personenbezogenen Daten (Mieterdaten, Schadensmeldungen, Fotos)
- Kategorien betroffener Personen (Mieter, ggf. Handwerker)
- Liste der Sub-Auftragsverarbeiter (Supabase EU, Vercel EU)
- Weisungsgebundenheit des Auftragsverarbeiters
- Pflicht zur Unterstützung bei Betroffenenrechten
- Löschung oder Rückgabe nach Vertragsende

### Technische Umsetzung im Code:
- Jeder Tenant (Hausverwaltung) erhält eine eigene `organization_id`
- ALLE Tabellen mit Mieterdaten MÜSSEN eine `organization_id`-Spalte haben
- RLS-Policies stellen sicher, dass KEIN Tenant fremde Daten sieht (Multi-Tenancy)

---

## 3. Rechtsgrundlage der Verarbeitung — Art. 6 DSGVO

Für Schadensmeldungen und Mieterverwaltung gilt primär:

| Verarbeitungszweck | Rechtsgrundlage |
|-------------------|-----------------|
| Schadensmeldung erfassen & bearbeiten | Art. 6 Abs. 1 lit. b (Vertragserfüllung Mietvertrag) |
| Kommunikation mit Mietern | Art. 6 Abs. 1 lit. b (Vertragserfüllung) |
| Handwerkereinsätze koordinieren | Art. 6 Abs. 1 lit. b (Vertragserfüllung) |
| Rechnungsstellung | Art. 6 Abs. 1 lit. c (rechtliche Verpflichtung, UGB/BAO) |
| Nutzungsanalyse der App (anonym) | Art. 6 Abs. 1 lit. f (berechtigtes Interesse) |

**Niemals:** Verarbeitung ohne Rechtsgrundlage. Keine Einwilligung erzwingen für Kern-Funktionen.

---

## 4. Datensparsamkeit — Art. 5 Abs. 1 lit. c DSGVO

**Regel:** Nur Daten erheben, die für den definierten Zweck NOTWENDIG sind.

### Im Code bedeutet das:
- Kein Pflichtfeld "Geburtsdatum" wenn nicht benötigt
- Keine Telefonnummer speichern wenn E-Mail ausreicht
- Fotos von Schadensmeldungen: KEIN Metadaten-EXIF-Stripping vergessen
  (Fotos können GPS-Koordinaten enthalten — diese beim Upload entfernen)
- Keine unnötigen Analytics-Daten über Mieter sammeln
- Formularfelder: nur was wirklich gebraucht wird

---

## 5. Datensicherheit — Art. 32 DSGVO & § 54 DSG

### Pflichtmaßnahmen (MUSS im Code umgesetzt sein):

**Verschlüsselung:**
- Alle Daten in Transit: HTTPS/TLS (Vercel + Supabase: automatisch)
- Daten at Rest: Supabase verschlüsselt standardmäßig (AES-256)
- Passwörter: NIEMALS im Klartext — Supabase Auth handled das

**Zugriffskontrolle:**
- Row Level Security (RLS) auf JEDER Tabelle mit personenbezogenen Daten
- Jeder API-Endpunkt prüft Authentication BEVOR Daten zurückgegeben werden
- Prinzip der minimalen Rechte: Mieter sieht nur eigene Meldungen, Verwalter nur eigenen Tenant
- Admin-Zugriff auf Produktions-DB nur über Supabase Dashboard mit MFA

**Audit-Logging:**
- Sensible Aktionen protokollieren: wer hat wann welche Mieterdaten abgerufen/geändert
- Löschvorgänge protokollieren (Wer hat gelöscht, wann, welcher Datensatz-Typ)

**Foto-Upload (Schadensmeldungen):**
- Supabase Storage Bucket: PRIVAT (nicht öffentlich zugänglich)
- Signed URLs mit Ablaufzeit für Foto-Anzeige (nicht permanente öffentliche Links)
- EXIF-Daten (GPS, Gerätedaten) beim Upload serverseitig entfernen

---

## 6. Datenspeicherort — EU-Pflicht

**REGEL:** Alle personenbezogenen Daten MÜSSEN in der EU gespeichert werden.

| Service | Region-Einstellung | Pflicht |
|---------|-------------------|---------|
| Supabase | **eu-central-1 (Frankfurt)** oder **eu-west-1** | MUSS bei Projekterstellung gesetzt werden |
| Vercel | Edge Functions: **nur EU-Regionen** wählen | MUSS in Vercel-Einstellungen konfiguriert werden |

**Warnung:** Supabase-Standardregion kann US-east sein — explizit EU wählen!

---

## 7. Speicherfristen & Löschung — Art. 5 Abs. 1 lit. e DSGVO

Daten dürfen nicht länger gespeichert werden als notwendig.

| Datenkategorie | Aufbewahrungsfrist | Rechtsgrundlage |
|---------------|-------------------|-----------------|
| Schadensmeldungen | 7 Jahre nach Abschluss | § 132 BAO (steuerliche Unterlagen) |
| Mieterdaten aktiver Mieter | Dauer des Mietverhältnisses + 3 Jahre | MRG / allg. Verjährung |
| Mieterdaten nach Mietende | 3 Jahre | Allg. zivilrechtliche Verjährung (§ 1489 ABGB) |
| Fotos von Schäden | Mit Schadensmeldung (7 Jahre) | § 132 BAO |
| Logs / Audit-Trail | 1 Jahr | Interne Sicherheitsanforderung |
| Gelöschte Accounts | 30 Tage Soft-Delete, dann Hard-Delete | DSGVO Art. 17 |

### Im Code:
- Soft-Delete statt Hard-Delete implementieren (is_deleted + deleted_at Felder)
- Nach Ablauf der Frist: automatisierter Hard-Delete-Job (Cron)
- Benutzer-Löschanfragen müssen innerhalb von 30 Tagen umgesetzt werden

---

## 8. Betroffenenrechte — Art. 15–22 DSGVO

Mieter haben folgende Rechte, die die Hausverwaltung (Verantwortlicher) erfüllen muss.
Die App MUSS diese technisch ermöglichen:

| Recht | Art. DSGVO | Technische Umsetzung |
|-------|------------|---------------------|
| **Auskunft** | Art. 15 | Export-Funktion: alle Daten eines Mieters als JSON/PDF |
| **Berichtigung** | Art. 16 | Mieter kann eigene Daten in der App bearbeiten |
| **Löschung** ("Recht auf Vergessenwerden") | Art. 17 | Account-Löschung löscht alle personenbezogenen Daten |
| **Einschränkung** | Art. 18 | Verarbeitungsstopp-Flag pro Datensatz möglich |
| **Datenübertragbarkeit** | Art. 20 | Datenexport in maschinenlesbarem Format (JSON/CSV) |
| **Widerspruch** | Art. 21 | Opt-out-Mechanismus für berechtigte Interessen |

### Fristen:
- Antwort auf Betroffenenanfragen: **innerhalb von 1 Monat** (Art. 12 Abs. 3 DSGVO)
- Verlängerung auf 3 Monate möglich, aber der Betroffene muss informiert werden

---

## 9. Datenpannenmeldung — Art. 33 DSGVO & § 55 DSG

Bei einem Datenleck (Breach):

1. **Auftragsverarbeiter (wir) → Verantwortlicher (Hausverwaltung):** UNVERZÜGLICH melden
2. **Verantwortlicher → Datenschutzbehörde:** binnen **72 Stunden**
   - Österreichische Datenschutzbehörde: [dsb.gv.at](https://www.dsb.gv.at)
   - Meldung über: https://www.dsb.gv.at/meldungen
3. **Bei hohem Risiko → Betroffene (Mieter):** unverzüglich informieren (Art. 34 DSGVO)

### Im Code vorbereiten:
- Logging-System das ungewöhnliche Zugriffsmuster erkennt
- Incident-Response-Prozess dokumentieren (in docs/)
- Kontaktdaten der DSB in Datenschutzerklärung verlinken

---

## 10. Informationspflichten — Art. 13 DSGVO

Beim Erheben von Mieterdaten MUSS informiert werden über:
- Identität und Kontaktdaten des Verantwortlichen (Hausverwaltung)
- Verarbeitungszwecke und Rechtsgrundlagen
- Speicherdauer
- Betroffenenrechte
- Beschwerderecht bei der DSB

**Im Code:** Datenschutzerklärung-Link im Footer und bei jeder Datenerhebung (Registrierung, Schadensmeldungs-Formular).

---

## 11. Multi-Tenancy — technische Datentrennung (DSGVO-Pflicht)

**Jede Hausverwaltung ist ein eigener Tenant mit vollständig isolierten Daten.**

### Pflicht-Schema für JEDE Tabelle mit personenbezogenen Daten:
```
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
```

### RLS-Policy Pflicht-Template (JEDE Tabelle):
```sql
-- Aktivieren
ALTER TABLE [tabelle] ENABLE ROW LEVEL SECURITY;

-- Nur eigene Tenant-Daten lesen
CREATE POLICY "tenant_isolation_select" ON [tabelle]
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

**Ohne RLS = Datenpanne = DSGVO-Verstoß = bis zu 20 Mio. € Strafe (Art. 83 Abs. 2 DSGVO)**

---

## 12. Sub-Auftragsverarbeiter — Art. 28 Abs. 2 DSGVO

Diese Dienste verarbeiten Kundendaten und MÜSSEN im AVV aufgeführt sein:

| Dienst | Zweck | DSGVO-Konformität | Vertrag |
|--------|-------|-------------------|---------|
| **Supabase** (EU) | Datenbank, Auth, Storage | EU-Hosting, DPA verfügbar | [Supabase DPA](https://supabase.com/privacy) |
| **Vercel** (EU) | Hosting, Edge Functions | EU-Hosting möglich, DPA verfügbar | [Vercel DPA](https://vercel.com/legal/dpa) |

**Vor Go-Live:** DPA mit Supabase und Vercel unterzeichnen (online verfügbar).

---

## 13. Was NICHT erlaubt ist (Verbotsliste)

- **NIEMALS** Mieterdaten in US-Cloud-Diensten ohne Standardvertragsklauseln speichern
- **NIEMALS** Fotos in einem öffentlichen Storage-Bucket ablegen
- **NIEMALS** Passwörter oder Tokens im Klartext in der DB speichern
- **NIEMALS** Logs mit personenbezogenen Daten (Name, E-Mail) an externe Dienste senden
- **NIEMALS** Mieterdaten für eigenes Marketing oder KI-Training nutzen
- **NIEMALS** EXIF-Daten aus Fotos unbereinigt speichern
- **NIEMALS** Datenbankzugriff ohne Authentication-Check

---

## 14. Checkliste vor jedem Feature-Go-Live

Jeder Skill (Frontend, Backend, QA) prüft vor Abschluss:

- [ ] Werden personenbezogene Daten erhoben? → Rechtsgrundlage dokumentiert?
- [ ] Hat jede neue Tabelle `organization_id` + RLS aktiviert?
- [ ] Werden Fotos hochgeladen? → EXIF-Stripping implementiert? Storage-Bucket privat?
- [ ] Gibt es einen neuen API-Endpunkt? → Authentication-Check vorhanden?
- [ ] Werden Daten gelöscht? → Audit-Log eintrag vorhanden?
- [ ] Neue personenbezogene Felder? → In Datenschutzerklärung ergänzt?
- [ ] Werden Daten an Dritte übermittelt? → Im AVV als Sub-Auftragsverarbeiter aufgeführt?

---

## 15. Zuständige Aufsichtsbehörde Österreich

**Datenschutzbehörde (DSB)**
Barichgasse 40-42, 1030 Wien
Tel: +43 1 52 152-0
Web: [dsb.gv.at](https://www.dsb.gv.at)
Meldungen: https://www.dsb.gv.at/meldungen

---

*Letzte Aktualisierung der Rechtsgrundlagen: DSG BGBl. I Nr. 24/2018 (Stand: Feb. 2024 laut RIS)*
*DSGVO: VO (EU) 2016/679 (in Kraft seit 25.05.2018)*
