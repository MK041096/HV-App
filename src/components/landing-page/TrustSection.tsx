'use client'

const items = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'DSGVO-konform',
    text: 'Alle Daten werden ausschließlich auf Servern innerhalb der EU verarbeitet und gespeichert.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Klare Rollen und Freigaben',
    text: 'Das System unterscheidet klar zwischen Mieter-, Mitarbeiter- und Verwaltungszugängen.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Nachvollziehbare Dokumentation',
    text: 'Jede Aktion ist protokolliert – für interne Prüfungen und rechtliche Anforderungen geeignet.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round"/></svg>,
    title: 'Pilotprojekt möglich',
    text: 'Einführung als 30-Tage-Pilot – ohne langfristige Bindung zu Beginn.',
  },
]

export default function TrustSection() {
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Vertrauen & Sicherheit</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 64px', fontWeight: 400 }}>
          Entwickelt für den professionellen Einsatz.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }} className="trust-grid">
          {items.map((item) => (
            <div key={item.title}>
              <div style={{ color: 'var(--accent-light)', marginBottom: 16 }}>{item.icon}</div>
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 10px' }}>{item.title}</p>
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) { .trust-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }
        @media (min-width: 641px) and (max-width: 1024px) { .trust-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}
