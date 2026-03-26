'use client'

const problems = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Meldungen kommen fragmentiert an',
    text: 'Telefon, E-Mail, WhatsApp, Zettel — jede Meldung kommt auf einem anderen Weg. Nichts ist vollständig. Alles muss nachgefragt werden.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Jede Bearbeitung kostet 20 Minuten',
    text: 'Rückfragen, manuelles Einpflegen, Weiterleiten. Ein einziger Schadensfall bindet Ihren Mitarbeiter für eine halbe Stunde — jeden Tag, mehrfach.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="15" x2="15" y2="15" strokeLinecap="round"/><line x1="9" y1="18" x2="12" y2="18" strokeLinecap="round"/></svg>,
    title: 'Kein Überblick, keine Dokumentation',
    text: 'Wer hat was entschieden? Welcher Handwerker war zuständig? Was braucht die Versicherung? Das Wissen liegt in E-Mail-Verläufen und Köpfen.',
  },
]

export default function ProblemSection() {
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Das Problem</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 64px', fontWeight: 400, maxWidth: 600 }}>
          So läuft Schadensmeldung heute<br />in den meisten Hausverwaltungen.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="problem-grid">
          {problems.map((p) => (
            <div key={p.title} className="sw-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '28px 24px' }}>
              <div style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{p.icon}</div>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 8px' }}>{p.title}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{p.text}</p>
              </div>
            </div>
          ))}
        </div>

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
