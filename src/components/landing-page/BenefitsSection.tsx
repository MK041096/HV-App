'use client'

const benefits = [
  {
    title: 'Weniger Rückfragen',
    text: 'Meldungen kommen strukturiert und vollständig an – ohne fehlende Angaben, ohne Nachfassen.',
  },
  {
    title: 'Klarere Zuständigkeiten',
    text: 'Jeder Fall hat einen definierten Status und einen verantwortlichen Ansprechpartner.',
  },
  {
    title: 'Schnellere Bearbeitung',
    text: 'Vom Eingang bis zur Beauftragung ohne Medienbrüche und manuelle Übertragungen.',
  },
  {
    title: 'Bessere Nachvollziehbarkeit',
    text: 'Jede Entscheidung, jeder Status, jede Kommunikation ist dokumentiert und rückverfolgbar.',
  },
  {
    title: 'Sauberere Dokumentation',
    text: 'Versicherungsunterlagen entstehen aus dem laufenden Prozess heraus – nicht am Ende durch Suchen.',
  },
  {
    title: 'Mehr Transparenz',
    text: 'Mieter, Handwerker und Hausverwaltung sehen denselben aktuellen Stand – ohne Rückfragen.',
  },
]

export default function BenefitsSection() {
  return (
    <section id="vorteile" style={{ background: 'var(--bg-card)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Ihre Vorteile</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 56px', fontWeight: 400 }}>
          Was sich für Ihre Verwaltung<br />konkret verändert.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="benefits-grid">
          {benefits.map((b) => (
            <div key={b.title} className="sw-card">
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 10px' }}>{b.title}</p>
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) { .benefits-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 641px) and (max-width: 1024px) { .benefits-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}
