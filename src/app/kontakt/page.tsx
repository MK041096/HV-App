export const metadata = {
  title: "Kontakt – SchadensMelder",
}

export default function KontaktPage() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Kontakt</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Mathias Kracher</h2>
        <p className="text-gray-700">
          Wildgansgasse 8/2<br />
          7400 Oberwart, Österreich
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Erreichbarkeit</h2>
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

      <p className="text-gray-600 text-sm">
        Wir bemühen uns, Ihre Anfragen innerhalb von 1–2 Werktagen zu beantworten.
      </p>
    </main>
  )
}
