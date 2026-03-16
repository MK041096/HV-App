import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Auftragsverarbeitungsvertrag (AVV) | SchadensMelder",
  description:
    "Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO zwischen SchadensMelder und Hausverwaltungen.",
}

export default function AvvPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SchadensMelder</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/hv-registrierung">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück zur Registrierung
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Auftragsverarbeitungsvertrag (AVV)</h1>
          <p className="text-muted-foreground">
            gemäß Art. 28 Abs. 3 DSGVO i.V.m. § 62 DSG (Österreich)
          </p>
          <p className="text-sm text-muted-foreground">Stand: März 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed">

          {/* Präambel */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Präambel</h2>
            <p>
              Dieser Auftragsverarbeitungsvertrag (nachfolgend „AVV") wird zwischen
              der Hausverwaltung, die sich bei SchadensMelder registriert
              (nachfolgend „Verantwortlicher"), und
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="font-medium">Mathias Kracher</p>
              <p>Wildgansgasse 8/2, 7400 Oberwart, Österreich</p>
              <p>E-Mail: Kracherdigital@gmail.com</p>
              <p>Tel.: +43 664 46 82 910</p>
              <p>UID: ATU81585679 | GISA-Zahl: 37695736</p>
              <p className="text-muted-foreground text-xs">
                Betreiber der Plattform SchadensMelder (nachfolgend „Auftragsverarbeiter")
              </p>
            </div>
            <p>geschlossen.</p>
            <p>
              Der Auftragsverarbeiter erbringt für den Verantwortlichen
              IT-Dienstleistungen in Form einer Software-as-a-Service-Plattform
              zur digitalen Abwicklung von Schadensmeldungen in der
              Hausverwaltung. Im Rahmen dieser Leistung verarbeitet der
              Auftragsverarbeiter personenbezogene Daten im Auftrag und nach
              Weisung des Verantwortlichen.
            </p>
          </section>

          {/* § 1 Gegenstand und Dauer */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 1 Gegenstand und Dauer der Verarbeitung</h2>
            <p>
              (1) Gegenstand der Auftragsverarbeitung ist die Bereitstellung und
              der Betrieb der Plattform SchadensMelder, insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Erfassung und Verwaltung von Schadensmeldungen</li>
              <li>Kommunikation zwischen Hausverwaltung und Mietern</li>
              <li>Koordination von Handwerkereinsätzen</li>
              <li>Dokumentenablage und Archivierung</li>
              <li>Benachrichtigungsdienste per E-Mail</li>
            </ul>
            <p>
              (2) Die Auftragsverarbeitung beginnt mit Abschluss dieses Vertrags
              und endet mit Kündigung des Nutzungsvertrags. Nach Vertragsende
              werden alle personenbezogenen Daten des Verantwortlichen gemäß § 8
              dieses Vertrags gelöscht oder zurückgegeben.
            </p>
          </section>

          {/* § 2 Art und Zweck */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 2 Art und Zweck der Verarbeitung</h2>
            <p>
              (1) Die Verarbeitung dient ausschließlich der Erbringung der
              vertraglich vereinbarten Leistungen. Eine Verarbeitung zu eigenen
              Zwecken des Auftragsverarbeiters ist untersagt.
            </p>
            <p>
              (2) Art der Verarbeitung: Erheben, Speichern, Organisieren,
              Ordnen, Anpassen, Abfragen, Verwenden, Übermitteln, Verbreiten,
              Löschen.
            </p>
          </section>

          {/* § 3 Kategorien der betroffenen Personen */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 3 Kategorien betroffener Personen und Datenkategorien</h2>
            <p>(1) Betroffene Personen:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mieter und Mieterinnen der verwalteten Liegenschaften</li>
              <li>Mitarbeiter der Hausverwaltung</li>
              <li>Handwerker und Dienstleister (soweit in der Plattform erfasst)</li>
            </ul>
            <p>(2) Verarbeitete Datenkategorien:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Stammdaten: Name, Adresse, E-Mail, Telefonnummer</li>
              <li>Zugangsdaten: E-Mail-Adresse, verschlüsseltes Passwort</li>
              <li>Schadensdaten: Beschreibung, Fotos, Standort (Wohneinheit)</li>
              <li>Kommunikationsdaten: E-Mail-Verkehr innerhalb der Plattform</li>
              <li>Protokolldaten: Zugriffszeiten, durchgeführte Aktionen (Audit-Log)</li>
            </ul>
          </section>

          {/* § 4 Weisungsgebundenheit */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 4 Weisungsgebundenheit</h2>
            <p>
              (1) Der Auftragsverarbeiter verarbeitet personenbezogene Daten
              ausschließlich auf dokumentierte Weisung des Verantwortlichen,
              es sei denn, er ist durch Unionsrecht oder nationales Recht, dem
              er unterliegt, zur Verarbeitung verpflichtet.
            </p>
            <p>
              (2) Weisungen erfolgen in der Regel durch die Nutzung der
              Plattformfunktionen. Weitergehende Weisungen können per E-Mail
              an Kracherdigital@gmail.com erteilt werden.
            </p>
          </section>

          {/* § 5 Technische und organisatorische Maßnahmen */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 5 Technische und organisatorische Maßnahmen (Art. 32 DSGVO)</h2>
            <p>
              Der Auftragsverarbeiter trifft folgende Maßnahmen zur Gewährleistung
              der Sicherheit der Verarbeitung:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Vertraulichkeit</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Verschlüsselte Datenspeicherung (AES-256 via Supabase)</li>
                  <li>Verschlüsselte Datenübertragung (TLS/HTTPS)</li>
                  <li>Row Level Security (RLS) — strikte Datentrennung zwischen Mandanten</li>
                  <li>Zugriffskontrolle mit rollenbasiertem Berechtigungssystem</li>
                  <li>Passwörter werden ausschließlich als bcrypt-Hash gespeichert</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-1">Integrität</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Audit-Logging aller sensiblen Aktionen</li>
                  <li>Eingabevalidierung mit serverseitiger Prüfung</li>
                  <li>Foreign-Key-Constraints und Datenbankintegrität</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-1">Verfügbarkeit</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Hosting auf Vercel (EU) und Supabase (eu-north-1, Stockholm)</li>
                  <li>Automatische Backups durch Supabase</li>
                  <li>Angestrebte Verfügbarkeit: 99,5 % (Best-Effort)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-1">Datensparsamkeit</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>EXIF-Daten werden aus hochgeladenen Fotos serverseitig entfernt</li>
                  <li>Fotos in privatem Storage (kein öffentlicher Zugriff)</li>
                  <li>Zugriffslinks für Fotos mit Ablaufzeit (Signed URLs)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* § 6 Unterauftragsverarbeiter */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 6 Sub-Auftragsverarbeiter (Art. 28 Abs. 2 DSGVO)</h2>
            <p>
              Der Verantwortliche erteilt hiermit eine allgemeine Genehmigung
              zur Einschaltung folgender Sub-Auftragsverarbeiter:
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Dienst</th>
                    <th className="text-left p-3 font-medium">Zweck</th>
                    <th className="text-left p-3 font-medium">Standort</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 font-medium">Supabase Inc.</td>
                    <td className="p-3 text-muted-foreground">Datenbank, Authentifizierung, Dateispeicherung</td>
                    <td className="p-3 text-muted-foreground">EU (Stockholm, eu-north-1)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Vercel Inc.</td>
                    <td className="p-3 text-muted-foreground">Anwendungs-Hosting, Edge Functions</td>
                    <td className="p-3 text-muted-foreground">EU (Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Resend Inc.</td>
                    <td className="p-3 text-muted-foreground">E-Mail-Versand (Benachrichtigungen)</td>
                    <td className="p-3 text-muted-foreground">USA (SCCs vorhanden)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Über die Einschaltung weiterer oder die Änderung bestehender
              Sub-Auftragsverarbeiter wird der Verantwortliche per E-Mail
              informiert. Dem Verantwortlichen steht ein Widerspruchsrecht zu.
            </p>
          </section>

          {/* § 7 Betroffenenrechte */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 7 Unterstützung bei Betroffenenrechten</h2>
            <p>
              Der Auftragsverarbeiter unterstützt den Verantwortlichen bei der
              Erfüllung von Anfragen betroffener Personen (Art. 15–22 DSGVO):
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Auskunft (Art. 15):</strong> Bereitstellung einer
                Export-Funktion für alle Daten eines Mieters
              </li>
              <li>
                <strong>Berichtigung (Art. 16):</strong> Bearbeitung von
                Mieterdaten durch die Hausverwaltung möglich
              </li>
              <li>
                <strong>Löschung (Art. 17):</strong> Account-Löschung auf
                Anfrage innerhalb von 30 Tagen
              </li>
              <li>
                <strong>Datenübertragbarkeit (Art. 20):</strong> Datenexport
                in maschinenlesbarem Format (JSON/CSV)
              </li>
            </ul>
            <p>
              Anfragen von Betroffenen sind an Kracherdigital@gmail.com zu
              richten oder direkt über die Plattform einzureichen.
            </p>
          </section>

          {/* § 8 Löschung und Rückgabe */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 8 Löschung und Rückgabe nach Vertragsende</h2>
            <p>
              Nach Beendigung des Nutzungsvertrags werden alle
              personenbezogenen Daten des Verantwortlichen innerhalb von
              30 Tagen unwiderruflich gelöscht, sofern keine gesetzliche
              Aufbewahrungspflicht entgegensteht (z.B. § 132 BAO: 7 Jahre für
              steuerrelevante Unterlagen). Auf Wunsch wird dem Verantwortlichen
              vorher ein Dateiexport zur Verfügung gestellt.
            </p>
          </section>

          {/* § 9 Datenpannen */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 9 Meldung von Datenpannen (Art. 33 DSGVO)</h2>
            <p>
              Der Auftragsverarbeiter informiert den Verantwortlichen
              unverzüglich, spätestens jedoch innerhalb von 24 Stunden, nachdem
              ihm eine Verletzung des Schutzes personenbezogener Daten bekannt
              geworden ist. Die Meldung erfolgt per E-Mail.
            </p>
            <p>
              Der Verantwortliche ist verpflichtet, die Datenschutzbehörde
              (DSB, Wien) innerhalb von 72 Stunden zu informieren, sofern die
              Verletzung voraussichtlich ein Risiko für natürliche Personen
              darstellt (Art. 33 DSGVO, § 55 DSG).
            </p>
          </section>

          {/* § 10 Geheimhaltung */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 10 Geheimhaltung und Vertraulichkeit</h2>
            <p>
              Der Auftragsverarbeiter verpflichtet alle mit der Verarbeitung
              befassten Personen zur Vertraulichkeit. Dieser Verpflichtung
              liegen dauerhafte Geheimhaltungsvereinbarungen zugrunde.
            </p>
          </section>

          {/* § 11 Audit */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 11 Kontrollrechte des Verantwortlichen</h2>
            <p>
              Der Verantwortliche ist berechtigt, die Einhaltung der
              Datenschutzvorschriften und der Vereinbarungen dieses Vertrags
              beim Auftragsverarbeiter durch Anfragen oder Audits zu
              überprüfen. Der Auftragsverarbeiter stellt alle erforderlichen
              Informationen zum Nachweis der Einhaltung zur Verfügung.
            </p>
          </section>

          {/* § 12 Anwendbares Recht */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">§ 12 Anwendbares Recht und Gerichtsstand</h2>
            <p>
              Es gilt österreichisches Recht. Gerichtsstand ist Oberwart,
              Österreich. Auf die DSGVO (VO (EU) 2016/679) und das
              österreichische DSG (BGBl. I Nr. 165/1999 i.d.F.
              BGBl. I Nr. 24/2018) wird ausdrücklich Bezug genommen.
            </p>
          </section>

          {/* Abschlusserklärung */}
          <section className="bg-muted/30 border rounded-lg p-6 space-y-3">
            <h2 className="text-lg font-semibold">Zustimmungserklärung</h2>
            <p>
              Mit der digitalen Akzeptanz bei der Registrierung bestätigt der
              Verantwortliche (die Hausverwaltung), diesen
              Auftragsverarbeitungsvertrag gelesen und verstanden zu haben und
              stimmt dessen Bedingungen zu. Zeitpunkt und IP-Adresse der
              Zustimmung werden protokolliert und als rechtsverbindlicher
              Nachweis gespeichert.
            </p>
            <p className="text-sm text-muted-foreground">
              Dieser AVV tritt mit dem Zeitpunkt der digitalen Zustimmung in
              Kraft und ersetzt alle vorherigen mündlichen oder schriftlichen
              Vereinbarungen zum selben Gegenstand.
            </p>
          </section>

        </div>

        {/* Back button */}
        <div className="pt-4 border-t">
          <Button variant="outline" asChild>
            <Link href="/hv-registrierung">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Registrierung
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
