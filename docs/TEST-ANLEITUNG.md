# Test-Anleitung: SchadensMelder
Umgebung: https://zerodamage.de | Erstellt: 2026-03-16

---

## Deine 3 Test-E-Mail-Adressen

| Rolle | E-Mail | Postfach |
|-------|--------|----------|
| HV-Admin + Platform-Admin | kracherdigital@gmail.com | Gmail |
| Mieter | kracherdigital@gmx.at | GMX |
| Werkstatt (kein Login, nur E-Mail) | mathiaskracher@gmx.at | GMX |

Wichtig: Du meldest im System NIEMANDEN automatisch an.
Alles wird manuell durchgespielt wie ein echter Nutzer es erlebt.

---

## Deine Excel-Testdateien

Oeffne diese Dateien BEVOR du anfaengst. Du tippst Daten manuell in die App ein.

| Datei | Pfad | Wofuer |
|-------|------|--------|
| testdaten-mieter.csv | HV-App/docs/testdaten-mieter.csv | Name + Einheit fuer Mieter-Test |
| testdaten-werkstaetten.csv | HV-App/docs/testdaten-werkstaetten.csv | Werkstatt-Kontaktdaten zum Abtippen |

---

## Portale

    kracherdigital@gmail.com -> zerodamage.de/admin        (Platform-Admin: Betreiber)
                             -> zerodamage.de/dashboard    (HV-Admin: Hausverwaltung)
    kracherdigital@gmx.at    -> zerodamage.de/mein-bereich (Mieter)
    mathiaskracher@gmx.at    -> kein Login, nur E-Mails    (Werkstatt)

---

## Reihenfolge beim Testen

    BLOCK 0   -> Registrierung + Admin-Freischaltung (einmalig, 1x)
    BLOCK 1.1 -> Einheiten anlegen (aus testdaten-mieter.csv)
    BLOCK 1.2 -> Aktivierungscode fuer Mieter erstellen + kopieren
    BLOCK 2.1 -> Mieter registrieren (Inkognito-Fenster!)
    BLOCK 2.2 -> Schadensmeldung einreichen
    BLOCK 1.3 -> Als HV den Fall bearbeiten
    BLOCK 2.3 -> Als Mieter Status pruefen
    BLOCK 4   -> Platform-Admin-Portal pruefen (/admin)
    BLOCK 5/6/7 -> Rechtliches + E-Mails + Mobile

---

## BLOCK 0: Einmalige Vorbereitung

### 0.1 Als HV registrieren

Wo: https://zerodamage.de/hv-registrierung

1. Formular:
   - Firmenname: Hausverwaltung Kracher
   - Vorname: Mathias | Nachname: Kracher
   - E-Mail: kracherdigital@gmail.com
   - Passwort: selbst waehlen und merken
2. Beide Checkboxen ankreuzen (Datenschutz + AVV)
3. "Kostenlos registrieren" klicken
4. Gmail oeffnen -> Bestaetigungslink klicken
5. Einloggen: https://zerodamage.de/login
6. Pruefe: HV-Dashboard mit Onboarding-Widget sichtbar?

### 0.2 Platform-Admin freischalten

Schreib mir: "ich bin registriert"
Dann fuehre ich den SQL-Befehl aus der /admin freischaltet.

---

## BLOCK 1: Als HV-Admin testen

Konto: kracherdigital@gmail.com | Portal: https://zerodamage.de/dashboard

### 1.1 Einheiten anlegen

JETZT OEFFNEN: testdaten-mieter.csv
Wo: Dashboard -> Einheiten

1. "Neue Einheit":
   Name: Wohnung Top 1 | Adresse: Musterstrasse 12, 1010 Wien | Stockwerk: EG
2. Speichern -> Einheit sichtbar?
3. Noch 2 anlegen:
   Wohnung Top 2 (1. OG) + Wohnung Top 3 (2. OG)
4. Pruefe: 3 Einheiten in der Liste?

### 1.2 Aktivierungscode erstellen

Wo: Dashboard -> Aktivierungscodes

1. Neuen Code fuer Wohnung Top 1 erstellen
2. Link erscheint: zerodamage.de/register?code=XXXXX
3. LINK KOPIEREN -> wird in Block 2.1 gebraucht!

### 1.3 Fall bearbeiten (ERST NACH BLOCK 2.2 DURCHFUEHREN!)

Wo: Dashboard -> Faelle

Pruefe zuerst:
   Fall-Nr., Titel "Wasserschaden Kueche", Status "Neu", Mieter-Name, Foto

--- Status aendern ---
1. Status -> "In Bearbeitung"
2. Kommentar: Wir schauen uns das an, melden uns bald.
3. Pruefe: Hat kracherdigital@gmx.at eine E-Mail erhalten?

--- Werkstatt zuweisen (JETZT OEFFNEN: testdaten-werkstaetten.csv) ---
Name: Thomas Huber
Firma: Huber Sanitaer und Heizung GmbH
Telefon: +43 664 111 2233
E-Mail: mathiaskracher@gmx.at
Speichern -> Werkstatt sichtbar?
HINWEIS: Automatische E-Mail an Werkstatt kommt erst mit PROJ-9 (noch nicht gebaut)

--- Rechnung hochladen ---
Tab "Dokumente" oeffnen
"Rechnung hochladen" -> beliebige PDF oder JPG auswaehlen
Dateiname + Datum sichtbar? | "Oeffnen" -> in neuem Tab? | Papierkorb -> geloescht?

--- Versicherungsschaden ---
Toggle "Als Versicherungsschaden markieren" aktivieren
Notiz: Polizze Nr. 12345-A | Speichern
"Versicherungsblatt oeffnen" -> alle Daten korrekt?
"Drucken / PDF" -> Druckdialog oeffnet sich?

--- Fall abschliessen ---
Status -> "Erledigt"
Kommentar: Reparatur abgeschlossen. Rechnung liegt bei.
Pruefe: Hat kracherdigital@gmx.at eine Abschluss-E-Mail?

### 1.4 Mieter-Uebersicht

Wo: Dashboard -> Mieter
Anna Berger in der Liste? | Einheit, Name, E-Mail korrekt?

---

## BLOCK 2: Als Mieter testen

Konto: kracherdigital@gmx.at | Portal: https://zerodamage.de/mein-bereich
!! INKOGNITO-FENSTER OEFFNEN damit du gleichzeitig als HV eingeloggt bleibst !!

### 2.1 Mieter-Registrierung

1. Aktivierungslink aus Block 1.2 im Inkognito-Fenster oeffnen
2. Formular ausfullen (aus testdaten-mieter.csv):
   Vorname: Anna | Nachname: Berger
   E-Mail: kracherdigital@gmx.at | Passwort: MieterTest123!
3. "Registrieren" klicken
4. GMX oeffnen (kracherdigital@gmx.at) -> Bestaetigungslink klicken
5. Einloggen: https://zerodamage.de/mein-bereich
6. Pruefe: Mieter-Dashboard sichtbar?

### 2.2 Schadensmeldung einreichen

Wo: Mieter-Dashboard -> "Neue Meldung"

Titel: Wasserschaden Kueche
Kategorie: Wasser
Beschreibung: Wasserrohr leckt unter der Spuele. Wasser auf dem Boden.
Dringlichkeit: Dringend
Foto hochladen: beliebiges Bild von deinem Computer

Pruefe nach dem Einreichen:
- Meldung mit Status "Neu" sichtbar?
- Hat kracherdigital@gmail.com (HV) eine Benachrichtigung erhalten?

### 2.3 Status-Verfolgung (ERST NACH BLOCK 1.3!)

- Status stimmt mit dem ueberein was die HV gesetzt hat?
- Kommentar der HV sichtbar?
- GMX: E-Mail-Benachrichtigungen fuer jeden Statuswechsel erhalten?

---

## BLOCK 3: Als Werkstatt

Kein Login. Werkstatt bekommt nur E-Mails.

Was heute testbar ist:
- Kontaktdaten korrekt in der Fall-Detailseite angezeigt?

Was noch NICHT fertig ist:
- Automatische E-Mail an mathiaskracher@gmx.at -> kommt mit PROJ-9

---

## BLOCK 4: Als Platform-Admin

Konto: kracherdigital@gmail.com | Portal: https://zerodamage.de/admin
NUR nach Block 0.2 (SQL-Freischaltung durch mich) verfuegbar!

1. https://zerodamage.de/admin oeffnen
2. Statistiken pruefen: Kunden, Nutzer, Faelle, Einheiten sichtbar?
3. "Kunden" in der Navigation klicken
4. "Hausverwaltung Kracher" in der Kundenliste?
5. AVV-Haekchen gruen?
6. "Details" klicken:
   - Einheiten: 3 sichtbar?
   - Mieter: 1 sichtbar?
   - Faelle: 1 sichtbar?
   - Benutzerliste mit Rollen?
   - Letzte Meldung in der Tabelle?

---

## BLOCK 5: Rechtliche Seiten

| Seite | URL |
|-------|-----|
| AVV | https://zerodamage.de/avv |
| Impressum | https://zerodamage.de/impressum |
| Datenschutz | https://zerodamage.de/datenschutz |
| Kontakt | https://zerodamage.de/kontakt |

AVV: Paragraphen 1-12, Name Mathias Kracher, Adresse Oberwart, UID ATU81585679
Impressum: Adresse Wildgansgasse 8/2 7400 Oberwart, UID ATU81585679, GISA 37695736

---

## BLOCK 6: E-Mail-Checkliste

| Was ausgeloest hat | Postfach zum Pruefen |
|-------------------|---------------------|
| HV-Registrierung (Bestaetigung) | kracherdigital@gmail.com (Gmail) |
| Mieter-Registrierung (Bestaetigung) | kracherdigital@gmx.at (GMX) |
| Neue Schadensmeldung (HV-Info) | kracherdigital@gmail.com (Gmail) |
| Status -> In Bearbeitung | kracherdigital@gmx.at (GMX) |
| Status -> Erledigt | kracherdigital@gmx.at (GMX) |

---

## BLOCK 7: Mobile Ansicht

1. https://zerodamage.de am Smartphone oeffnen
2. Landing Page: Sieht gut aus?
3. Login-Formular: Benutzbar?
4. Als HV einloggen: Hamburger-Menue sichtbar?
5. Menue antippen: Navigation als Schublade?

---

## Testergebnis-Tabelle

| Block | Rolle | Was | Ergebnis |
|-------|-------|-----|----------|
| 0 | Setup | Registrierung + Admin-Freischaltung | [ ] OK / Fehler: |
| 1.1 | HV-Admin | Einheiten anlegen | [ ] OK / Fehler: |
| 1.2 | HV-Admin | Aktivierungscode erstellen | [ ] OK / Fehler: |
| 1.3 | HV-Admin | Fall bearbeiten (alle Unterblocks) | [ ] OK / Fehler: |
| 1.4 | HV-Admin | Mieter-Uebersicht | [ ] OK / Fehler: |
| 2.1 | Mieter | Registrierung per Aktivierungslink | [ ] OK / Fehler: |
| 2.2 | Mieter | Schadensmeldung einreichen | [ ] OK / Fehler: |
| 2.3 | Mieter | Status-Verfolgung + E-Mails | [ ] OK / Fehler: |
| 3 | Werkstatt | E-Mail-Empfang | PROJ-9 noch nicht fertig |
| 4 | Platform-Admin | Admin-Portal /admin | [ ] OK / Fehler: |
| 5 | -- | Rechtliche Seiten | [ ] OK / Fehler: |
| 6 | -- | E-Mail-Benachrichtigungen | [ ] OK / Fehler: |
| 7 | -- | Mobile Ansicht | [ ] OK / Fehler: |

---

## Nach dem Test: Naechste Schritte

1. PROJ-9: Werkstatt-E-Mails (mathiaskracher@gmx.at bekommt auto. E-Mail bei Zuweisung)
2. PROJ-15: DSGVO-Datenexport fuer Mieter
3. PROJ-14: Stripe-Zahlungsabwicklung
4. Erster echter Kunde: 349 EUR Einrichtung + 0,50 EUR/Einheit/Monat

---

Erstellt: 2026-03-16 | SchadensMelder by Mathias Kracher
