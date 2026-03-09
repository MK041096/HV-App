import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Datenschutzerklärung – SchadensMelder",
  robots: { index: false },
}

export default function DatenschutzPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Datenschutzerklärung</h1>
      <p className="text-sm text-gray-500 mb-8">Stand: März 2026</p>

      {/* 1. Verantwortlicher */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher (Art. 13 Abs. 1 lit. a DSGVO)</h2>
        <p>
          Mathias Kracher<br />
          Wildgansgasse 8/2<br />
          7400 Oberwart, Österreich<br />
          Telefon: +43 664 46 82 910<br />
          E-Mail:{" "}
          <a href="mailto:Kracherdigital@gmail.com" className="text-primary hover:underline">
            Kracherdigital@gmail.com
          </a>
        </p>
      </section>

      {/* 2. Erhobene Daten & Zwecke */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Verarbeitete Daten, Zwecke und Rechtsgrundlagen (Art. 13 Abs. 1 lit. c–e DSGVO)</h2>

        <h3 className="font-semibold mt-4 mb-1">a) Registrierung und Nutzerkonto</h3>
        <p>
          Bei der Registrierung erheben wir Name, E-Mail-Adresse und Rolle (Hausverwalter oder Mieter).
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
        </p>

        <h3 className="font-semibold mt-4 mb-1">b) Schadensmeldungen</h3>
        <p>
          Mieter können Schäden melden. Dabei werden Beschreibung, Fotos und Standortangaben
          (Wohneinheit) gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung im Rahmen des Mietverhältnisses).
        </p>

        <h3 className="font-semibold mt-4 mb-1">c) Kommunikation</h3>
        <p>
          Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Kontaktdaten zur
          Bearbeitung Ihrer Anfrage. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an der Beantwortung von Anfragen).
        </p>

        <h3 className="font-semibold mt-4 mb-1">d) Server-Logs</h3>
        <p>
          Bei jedem Zugriff auf unsere Website werden technische Daten (IP-Adresse, Browser,
          Uhrzeit) in Server-Logs gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an IT-Sicherheit). Speicherdauer: 30 Tage.
        </p>
      </section>

      {/* 3. Cookies */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Cookies</h2>
        <p>
          Die Website verwendet ausschließlich technisch notwendige Session-Cookies zur
          Authentifizierung (Supabase Auth). Diese Cookies sind für den Betrieb der Plattform
          erforderlich und werden ohne Einwilligung gesetzt (Art. 6 Abs. 1 lit. b DSGVO).
          Tracking- oder Analyse-Cookies werden derzeit nicht eingesetzt.
        </p>
      </section>

      {/* 4. Empfänger / Auftragsverarbeiter */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Empfänger und Auftragsverarbeiter (Art. 13 Abs. 1 lit. e DSGVO)</h2>
        <p className="mb-2">
          Wir setzen folgende Dienstleister als Auftragsverarbeiter ein (Art. 28 DSGVO).
          Mit allen wurde ein Auftragsverarbeitungsvertrag (AVV) abgeschlossen:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Supabase Inc.</strong> (Datenbank, Authentifizierung, Dateispeicher) –
            Serverstandort: EU (Frankfurt). DPA:{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              supabase.com/privacy
            </a>
          </li>
          <li>
            <strong>Vercel Inc.</strong> (Hosting, Webanwendung) –
            Serverstandort: EU. DPA:{" "}
            <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              vercel.com/legal/dpa
            </a>
          </li>
        </ul>
        <p className="mt-2">
          Eine Weitergabe an sonstige Dritte erfolgt nicht, es sei denn, dies ist zur
          Vertragserfüllung oder aufgrund gesetzlicher Verpflichtungen erforderlich.
        </p>
      </section>

      {/* 5. Speicherdauer */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Speicherdauer (Art. 13 Abs. 2 lit. a DSGVO)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nutzerkontodaten: für die Dauer der Nutzung + 3 Jahre nach Beendigung</li>
          <li>Schadensmeldungen: 7 Jahre (§ 132 BAO – steuerliche Aufbewahrungspflicht)</li>
          <li>Fotos zu Schadensmeldungen: 7 Jahre (gemeinsam mit Schadensmeldung)</li>
          <li>Server-Logs: 30 Tage</li>
          <li>Gelöschte Accounts: 30 Tage Soft-Delete, danach unwiderrufliche Löschung</li>
        </ul>
      </section>

      {/* 6. Betroffenenrechte */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Ihre Rechte (Art. 15–22 DSGVO)</h2>
        <p className="mb-2">Sie haben gegenüber uns folgende Rechte:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Auskunft</strong> (Art. 15 DSGVO): Welche Daten wir über Sie speichern</li>
          <li><strong>Berichtigung</strong> (Art. 16 DSGVO): Korrektur unrichtiger Daten</li>
          <li><strong>Löschung</strong> (Art. 17 DSGVO): Löschung Ihrer Daten unter bestimmten Voraussetzungen</li>
          <li><strong>Einschränkung</strong> (Art. 18 DSGVO): Einschränkung der Verarbeitung</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Export Ihrer Daten in maschinenlesbarem Format</li>
          <li><strong>Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen Verarbeitungen auf Basis berechtigter Interessen</li>
        </ul>
        <p className="mt-3">
          Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
          <a href="mailto:Kracherdigital@gmail.com" className="text-primary hover:underline">
            Kracherdigital@gmail.com
          </a>.
          Wir antworten innerhalb von 30 Tagen (Art. 12 Abs. 3 DSGVO).
        </p>
      </section>

      {/* 7. Beschwerderecht */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Beschwerderecht bei der Datenschutzbehörde (Art. 13 Abs. 2 lit. d DSGVO)</h2>
        <p>
          Sie haben das Recht, Beschwerde bei der zuständigen Aufsichtsbehörde einzureichen:
        </p>
        <p className="mt-2">
          <strong>Datenschutzbehörde (DSB)</strong><br />
          Barichgasse 40–42, 1030 Wien<br />
          Telefon: +43 1 52 152-0<br />
          Web:{" "}
          <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            www.dsb.gv.at
          </a>
        </p>
      </section>

      {/* 8. Datensicherheit */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Datensicherheit (Art. 32 DSGVO)</h2>
        <p>
          Alle Datenübertragungen erfolgen verschlüsselt via HTTPS/TLS. Daten werden
          verschlüsselt gespeichert (AES-256). Der Zugriff auf personenbezogene Daten ist
          durch Authentifizierung und rollenbasierte Berechtigungen (Row Level Security)
          geschützt. Fotos werden in privaten Speicherbereichen abgelegt und sind nicht
          öffentlich zugänglich.
        </p>
      </section>

      {/* 9. Änderungen */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich rechtliche
          Anforderungen oder unsere Dienste ändern. Die aktuelle Version ist stets auf dieser
          Seite einsehbar. Bei wesentlichen Änderungen informieren wir registrierte Nutzer
          per E-Mail.
        </p>
      </section>
    </main>
  )
}
