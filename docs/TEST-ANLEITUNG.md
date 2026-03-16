# Test-Anleitung: SchadensMelder — Komplette Prüfung vor dem ersten Kunden

> **Für wen:** Mathias Kracher (manueller Test im Browser)
> **Ziel:** Sicherstellen, dass alle Funktionen korrekt funktionieren
> **Umgebung:** https://zerodamage.de (Live-System)
> **Datum der Erstellung:** 2026-03-16

---

## So nutzt du diese Anleitung

- Gehe jeden Abschnitt der Reihe nach durch
- Hake ab (✅) wenn etwas funktioniert
- Schreibe hin (❌) wenn etwas nicht funktioniert und was du siehst
- Mach Screenshots bei Fehlern

---

## BLOCK A: Registrierung & Login (HV-Seite)

### A1 — Neue Hausverwaltung registrieren

**Wo:** https://zerodamage.de/hv-registrierung

1. Öffne die Seite im Browser
2. Prüfe: Siehst du das Formular mit allen Feldern?
   - Firmenname, Vorname, Nachname, E-Mail, Passwort
3. Scrolle nach unten — siehst du **zwei Checkboxen**?
   - ☐ Ich akzeptiere die **Datenschutzerklärung**
   - ☐ Ich akzeptiere den **Auftragsverarbeitungsvertrag (AVV)**
4. Klicke auf den AVV-Link → öffnet sich eine neue Seite mit dem AVV-Text?
5. Fülle das Formular aus:
   - Firmenname: `Test Hausverwaltung GmbH`
   - Vorname: `Max`
   - Nachname: `Muster`
   - E-Mail: *(deine Test-E-Mail)*
   - Passwort: `TestPass123!`
6. Hake beide Checkboxen an
7. Klicke "Kostenlos registrieren"
8. Prüfe: Erscheint eine Erfolgsmeldung "Fast geschafft!" mit Hinweis auf Bestätigungs-E-Mail?
9. Öffne deine E-Mail → siehst du eine Bestätigungs-E-Mail von SchadensMelder?
10. Klicke den Bestätigungslink in der E-Mail
11. Prüfe: Wirst du auf die Login-Seite weitergeleitet?

**Erwartetes Ergebnis:** Registrierung klappt, E-Mail kommt an, Bestätigung funktioniert.

---

### A2 — Login als HV-Admin

**Wo:** https://zerodamage.de/login

1. Gib die E-Mail und das Passwort aus A1 ein
2. Klicke "Anmelden"
3. Prüfe: Wirst du zum Dashboard weitergeleitet? (/dashboard)
4. Siehst du das Dashboard mit:
   - "Übersicht" als Seitentitel
   - Die linke Navigationsleiste mit: Übersicht, Fälle, Einheiten, Mieter, Aktivierungscodes, Dokumente
   - Ein **"Erste Schritte"** Onboarding-Widget (weil noch keine Fälle vorhanden)

**Erwartetes Ergebnis:** Login klappt, Dashboard lädt, Onboarding-Widget ist sichtbar.

---

### A3 — Logout

1. Klicke unten links in der Navigation auf "Abmelden"
2. Prüfe: Wirst du zur Login-Seite weitergeleitet?
3. Versuche direkt https://zerodamage.de/dashboard aufzurufen
4. Prüfe: Wirst du automatisch zum Login umgeleitet?

---

## BLOCK B: Einheiten anlegen (Wohnungen)

**Wo:** Im Dashboard → "Einheiten" in der Navigation

1. Klicke auf "Einheiten" in der Navigation
2. Klicke auf "Neue Einheit" oder ähnlichen Button
3. Fülle aus:
   - Name: `Wohnung Top 1`
   - Adresse: `Musterstraße 1, 1010 Wien`
   - Stockwerk: `EG`
4. Speichern
5. Prüfe: Erscheint die Einheit in der Liste?
6. Lege eine zweite Einheit an: `Wohnung Top 2`, gleiche Adresse, 1. OG

---

## BLOCK C: Aktivierungscode für Mieter erstellen

**Wo:** Im Dashboard → "Aktivierungscodes"

1. Klicke auf "Aktivierungscodes" in der Navigation
2. Erstelle einen neuen Code für `Wohnung Top 1`
3. Prüfe: Erscheint ein Code mit Link?
   - Beispiel: `https://zerodamage.de/register?code=XXXXX`
4. Kopiere den Link — du brauchst ihn für Block D

---

## BLOCK D: Mieter-Registrierung (aus Sicht des Mieters)

**Wichtig:** Dafür brauchst du eine zweite E-Mail-Adresse (z.B. eine andere deiner Adressen)

**Wo:** Aktivierungslink aus Block C aufrufen

1. Öffne den Aktivierungslink im Browser (oder einem anderen Browser/Inkognito-Fenster)
2. Prüfe: Siehst du das Registrierungsformular für Mieter?
3. Fülle aus:
   - Vorname: `Anna`
   - Nachname: `Mieter`
   - E-Mail: *(deine zweite Test-E-Mail)*
   - Passwort: `MieterPass123!`
4. Klicke "Registrieren"
5. Bestätige die E-Mail (Bestätigungs-E-Mail öffnen und klicken)
6. Melde dich als Mieter an: https://zerodamage.de/mein-bereich
7. Prüfe: Siehst du das Mieter-Dashboard?

---

## BLOCK E: Schadensmeldung einreichen (als Mieter)

**Wo:** Mieter-Dashboard → "Neue Meldung"

1. Klicke auf "Neue Meldung" oder ähnlich
2. Fülle aus:
   - Titel: `Wasserschaden Küche`
   - Kategorie: Wähle eine passende
   - Beschreibung: `Wasserrohr leckt unter der Spüle. Wasser auf dem Boden.`
   - Dringlichkeit: `Dringend`
3. Optional: Lade ein Foto hoch (ein beliebiges Bild von deinem Computer)
4. Klicke "Meldung einreichen"
5. Prüfe: Erscheint die Meldung in der Übersicht mit Status "Neu"?
6. Prüfe: Hat die HV-E-Mail (aus Block A) eine Benachrichtigungs-E-Mail erhalten?

---

## BLOCK F: Fall bearbeiten (als HV-Admin)

**Wo:** HV-Dashboard → "Fälle"

1. Melde dich als HV-Admin an (E-Mail aus Block A)
2. Gehe zu "Fälle" in der Navigation
3. Prüfe: Siehst du den Fall "Wasserschaden Küche"?
4. Klicke auf den Fall
5. Prüfe die Detailseite:
   - Fall-Nummer (z.B. #2026-001)
   - Titel, Beschreibung, Status
   - Mieter-Name sichtbar
   - Falls Foto hochgeladen: Foto sichtbar

### F1 — Status ändern

1. Ändere den Status auf "In Bearbeitung"
2. Gib einen Kommentar ein: `Schauen wir uns an`
3. Klicke "Status aktualisieren"
4. Prüfe: Hat der Mieter eine E-Mail erhalten mit dem neuen Status?

### F2 — Handwerker zuweisen

1. Trage in der Handwerker-Sektion aus:
   - Name: `Fritz Klempner`
   - Firma: `Klempner GmbH`
   - Telefon: `+43 123 456789`
   - E-Mail: *(beliebig)*
2. Klicke Speichern
3. Prüfe: Wird der Handwerker in der Detail-Ansicht angezeigt?

### F3 — Rechnung hochladen (NEUES FEATURE)

1. Wechsle zum Tab "Dokumente" in der Fall-Detailansicht
2. Klicke "Rechnung hochladen"
3. Wähle eine PDF-Datei von deinem Computer aus (oder ein JPG)
4. Prüfe: Erscheint die Rechnung mit Dateiname und Upload-Datum?
5. Klicke "Öffnen" → öffnet sich die Rechnung in einem neuen Tab?
6. Klicke auf den Papierkorb-Icon → wird die Rechnung gelöscht?

### F4 — Versicherungsschaden markieren (NEUES FEATURE)

1. Bleibe im Tab "Dokumente"
2. Aktiviere den Toggle "Als Versicherungsschaden markieren"
3. Gib eine Notiz ein: `Polizze 12345-A`
4. Klicke "Speichern"
5. Klicke "Versicherungsblatt öffnen"
6. Prüfe: Öffnet sich eine neue Seite mit dem Versicherungsschadenblatt?
7. Prüfe: Sind alle Daten korrekt ausgefüllt (Fall-Nr., Adresse, Beschreibung, Handwerker)?
8. Klicke "Drucken / PDF" → öffnet sich der Druckdialog?

---

## BLOCK G: Mieter-Statusverfolgung

**Wo:** https://zerodamage.de/mein-bereich (als Mieter angemeldet)

1. Melde dich als Mieter an (E-Mail aus Block D)
2. Gehe zu "Meine Meldungen"
3. Prüfe: Siehst du den Fall "Wasserschaden Küche"?
4. Prüfe: Stimmt der Status mit dem, was du in Block F gesetzt hast, überein?
5. Klicke auf den Fall
6. Prüfe: Siehst du die Kommentare/Statusmeldungen die die HV eingegeben hat?

---

## BLOCK H: AVV prüfen

**Wo:** https://zerodamage.de/avv

1. Öffne die Seite
2. Prüfe: Ist der vollständige AVV-Text mit den § 1–12 sichtbar?
3. Prüfe: Sind die richtigen Daten von Mathias Kracher eingetragen (Adresse Oberwart, UID)?
4. Prüfe: Funktioniert der "Zurück zur Registrierung" Button?

---

## BLOCK I: Rechtliche Seiten prüfen

### I1 — Impressum
**Wo:** https://zerodamage.de/impressum
- Name: Mathias Kracher
- Adresse: Wildgansgasse 8/2, 7400 Oberwart, Österreich
- UID: ATU81585679
- GISA-Zahl: 37695736

### I2 — Datenschutzerklärung
**Wo:** https://zerodamage.de/datenschutz
- Vollständige DSGVO-konforme Datenschutzerklärung vorhanden?
- Kontaktdaten des Verantwortlichen (Hausverwaltung) erklärt?

### I3 — Kontakt
**Wo:** https://zerodamage.de/kontakt
- Formular oder echte Kontaktdaten sichtbar?

---

## BLOCK J: E-Mail-Benachrichtigungen prüfen

Zusammenfassung aller E-Mails die ankommen sollten:

| Auslöser | Empfänger | Kommt an? |
|----------|-----------|-----------|
| HV-Registrierung | HV-E-Mail (Bestätigung) | ☐ |
| Mieter-Registrierung | Mieter-E-Mail (Bestätigung) | ☐ |
| Neue Schadensmeldung | HV-Admin | ☐ |
| Status → "In Bearbeitung" | Mieter | ☐ |
| Status → "Termin vereinbart" | Mieter | ☐ |
| Status → "Erledigt" | Mieter | ☐ |

---

## BLOCK K: Mobile Ansicht prüfen

1. Öffne https://zerodamage.de auf dem Smartphone
2. Prüfe die Landing Page: Sieht es gut aus?
3. Öffne https://zerodamage.de/login am Smartphone
4. Prüfe: Ist das Formular benutzbar?
5. Melde dich als HV-Admin an
6. Prüfe: Gibt es ein Hamburger-Menü (☰) oben links?
7. Tippe darauf: Öffnet sich die Navigation als Drawer?

---

## Zusammenfassung der Testergebnisse

| Block | Beschreibung | Status |
|-------|-------------|--------|
| A | Registrierung & Login | ☐ OK / ❌ Fehler: |
| B | Einheiten anlegen | ☐ OK / ❌ Fehler: |
| C | Aktivierungscode | ☐ OK / ❌ Fehler: |
| D | Mieter-Registrierung | ☐ OK / ❌ Fehler: |
| E | Schadensmeldung einreichen | ☐ OK / ❌ Fehler: |
| F | Fall bearbeiten (HV) | ☐ OK / ❌ Fehler: |
| G | Mieter-Statusverfolgung | ☐ OK / ❌ Fehler: |
| H | AVV-Seite | ☐ OK / ❌ Fehler: |
| I | Rechtliche Seiten | ☐ OK / ❌ Fehler: |
| J | E-Mail-Benachrichtigungen | ☐ OK / ❌ Fehler: |
| K | Mobile Ansicht | ☐ OK / ❌ Fehler: |

---

## Was als nächstes geplant ist

Nach dem Test und der Freigabe:

1. **Stripe einrichten** — Zahlungsabwicklung (Mathias macht das direkt in Stripe)
2. **PROJ-9: Werkstattkommunikation** — n8n (braucht eigenen Server)
3. **PROJ-15: DSGVO-Datenexport** — Mieter kann eigene Daten exportieren/löschen
4. **Erster Kunde testen** — Gründungspreise anbieten (349 € Einrichtung + 0,50 €/Einheit)

---

*Erstellt: 2026-03-16 · SchadensMelder by Mathias Kracher*
