'use client'

const checkItems = [
  'Digitale Meldung mit Foto und Beschreibung',
  'Strukturierte, vollständige Fallerfassung',
  'Vorbereitete Ersteinschätzung durch das System',
  'Handwerker-Vorschlag nach Gewerk',
  'Freigabe durch die Hausverwaltung – kein Automatismus',
  'Versicherungsblatt wird vorbereitet',
  'Statusverfolgung für alle Beteiligten',
  'Lückenlose Dokumentation und Archivierung',
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SolutionSection() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '120px 24px' }}>
      {/* Hintergrundfoto mit Overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/foto_architektur.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,7,0.80)', zIndex: 1 }} />

      {/* Inhalt */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto' }}>

        {/* Label */}
        <p className="sw-label" style={{ marginBottom: 20 }}>Die Lösung</p>

        {/* H2 */}
        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 24px', fontWeight: 400, maxWidth: 560 }}>
          Ein strukturierter Prozess.<br />
          Von der Meldung bis zur Dokumentation.
        </h2>

        {/* Subline */}
        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 56px', maxWidth: 580 }}>
          [SOFTWARE] bringt Ordnung in den Schadensprozess.
          Das System verarbeitet jede Meldung in Sekunden, bereitet eine
          vollständige Analyse vor und legt sie dem zuständigen Mitarbeiter
          zur Entscheidung vor. Ein Klick – und der Fall geht weiter.
          Sie behalten die Freigabe und Kontrolle.
        </p>

        {/* 2-spaltige Check-Liste */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 48px' }} className="check-grid">
          {checkItems.map((item) => (
            <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <CheckIcon />
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, lineHeight: 1.55, color: 'var(--text-primary)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) {
          .check-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
