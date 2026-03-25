'use client'

const problems = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Per Telefon',
    text: 'Keine strukturierte Erfassung, kein einheitliches Format.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Per E-Mail',
    text: 'Informationen kommen fragmentiert und unvollständig an.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Per WhatsApp',
    text: 'Keine Dokumentation, keine Nachverfolgbarkeit.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="1 4 1 10 7 10" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Fehlende Angaben',
    text: 'Rückfragen kosten Zeit – auf beiden Seiten.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Unklare Zuständigkeiten',
    text: 'Wer beauftragt wen? Wer informiert den Mieter?',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="15" x2="15" y2="15" strokeLinecap="round"/><line x1="9" y1="18" x2="12" y2="18" strokeLinecap="round"/><line x1="9" y1="12" x2="9.01" y2="12" strokeLinecap="round"/></svg>,
    title: 'Manuelle Dokumentation',
    text: 'Versicherungsunterlagen werden mühsam zusammengesucht.',
  },
]

export default function ProblemSection() {
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Label */}
        <p className="sw-label" style={{ marginBottom: 20 }}>Das Problem</p>

        {/* H2 */}
        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 64px', fontWeight: 400, maxWidth: 560 }}>
          Wie Schadensmeldungen heute<br />in Hausverwaltungen ankommen.
        </h2>

        {/* 3×2 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="problem-grid">
          {problems.map((p) => (
            <div key={p.title} className="sw-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ color: 'var(--text-muted)' }}>{p.icon}</div>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 6px' }}>{p.title}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Abschlusstext */}
        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 560, margin: '56px auto 0' }}>
          Das Ergebnis: unvollständige Informationen, unklare Zuständigkeiten
          und ein Prozess, der mehr Zeit kostet als er sollte.
        </p>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .problem-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .problem-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
