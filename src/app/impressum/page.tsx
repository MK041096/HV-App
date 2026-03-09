import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impressum – SchadensMelder",
  robots: { index: false },
}

export default function ImpressumPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Impressum</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Angaben gemäß § 5 ECG</h2>
        <p>
          Mathias Kracher<br />
          Wildgansgasse 8/2<br />
          7400 Oberwart<br />
          Österreich
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
        <p>
          Telefon:{" "}
          <a href="tel:+436644682910" className="text-primary hover:underline">
            +43 664 46 82 910
          </a>
          <br />
          E-Mail:{" "}
          <a href="mailto:Kracherdigital@gmail.com" className="text-primary hover:underline">
            Kracherdigital@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Unternehmensangaben</h2>
        <p>
          Rechtsform: Einzelunternehmer<br />
          Unternehmensgegenstand: Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik<br />
          UID-Nummer: ATU81585679<br />
          GISA-Zahl: 37695736
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Aufsichtsbehörde</h2>
        <p>
          Bezirkshauptmannschaft Oberwart<br />
          Gewerbebehörde gemäß GewO 1994
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Anwendbare Rechtsvorschriften</h2>
        <p>
          Gewerbeordnung 1994 (GewO), abrufbar unter{" "}
          <a
            href="https://www.ris.bka.gv.at"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            www.ris.bka.gv.at
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Verantwortlich für den Inhalt</h2>
        <p>Mathias Kracher (Anschrift wie oben)</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Online-Streitbeilegung</h2>
        <p>
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          <br />
          Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </main>
  )
}
