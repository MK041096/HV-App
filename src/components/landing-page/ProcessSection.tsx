const steps = [
  {
    num: '1',
    title: 'Mieter meldet den Schaden digital',
    text: 'Foto, Beschreibung, Ort, Dringlichkeit – alles in einem strukturierten Formular. Kein Telefonat, keine E-Mail.',
  },
  {
    num: '2',
    title: 'Das System verarbeitet die Meldung in Sekunden',
    text: 'Automatische Strukturierung der Falldaten. Ersteinschätzung, Schadenstyp und Handlungsoptionen werden sofort aufbereitet.',
  },
  {
    num: '3',
    title: 'Der HV-Mitarbeiter erhält eine vollständige Analyse',
    text: 'Schadensart, vorbereitete Einschätzung, Handwerkervorschlag und nächste mögliche Schritte – übersichtlich auf einen Blick.',
  },
  {
    num: '4',
    title: 'Freigabe mit einem Klick',
    text: 'Der Mitarbeiter prüft, entscheidet und gibt frei. Das System übernimmt den weiteren Ablauf – Beauftragung, Benachrichtigung, Dokumentation.',
  },
  {
    num: '5',
    title: 'Der Handwerker trifft beim Mieter ein',
    text: 'Koordiniert, informiert, mit allen nötigen Angaben ausgestattet. Der gesamte Fall ist lückenlos dokumentiert.',
  },
]

export default function ProcessSection() {
  return (
    <section id="ablauf" style={{ background: 'var(--bg-primary)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Der Ablauf</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 16px', fontWeight: 400 }}>
          Von der Meldung bis zur Werkstatt.<br />
          Ein durchgängiger Prozess.
        </h2>

        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 64px' }}>
          Was früher über mehrere Kanäle koordiniert werden musste,
          läuft bei [SOFTWARE] strukturiert durch einen einzigen Kanal.
        </p>

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {/* Verbindungslinie */}
          <div style={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 1, background: 'var(--border)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', gap: 28, paddingBottom: i < steps.length - 1 ? 40 : 0 }}>
                {/* Kreis */}
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.num}</span>
                </div>

                {/* Text */}
                <div style={{ paddingTop: 8 }}>
                  <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 8px' }}>{s.title}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
