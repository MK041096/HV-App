'use client'

const features = [
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round"/></svg>,
    title: 'Strukturierte Digitalmeldung',
    text: 'Mieter füllen ein geführtes Formular aus — Foto, Ort, Beschreibung, Dringlichkeit. Keine fehlenden Angaben mehr, keine Rückfragen, kein Telefonat.',
    tag: 'Vollständige Meldungen ab Tag 1',
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Analyse und 1-Klick-Freigabe',
    text: 'Das System bereitet Einschätzung, Schadenstyp und passenden Handwerkervorschlag automatisch vor. Ihr Mitarbeiter prüft auf einen Blick — und gibt mit einem Klick frei.',
    tag: '20 Minuten → unter 3 Minuten',
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Automatische Dokumentation',
    text: 'Statusverlauf, Kommunikationsprotokoll, Versicherungsblatt — alles entsteht automatisch aus dem laufenden Prozess. Kein manuelles Zusammensuchen am Ende.',
    tag: 'Revisionssicher und archiviert',
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Echtzeit-Status für alle Beteiligten',
    text: 'Mieter, Mitarbeiter und Handwerker sehen jederzeit den aktuellen Stand des Falls. Keine Rückfragen, kein manueller Statusabgleich, keine verlorenen Informationen.',
    tag: 'Transparenz ohne Mehraufwand',
  },
]

export default function FeaturesSection() {
  return (
    <section id="funktionen" style={{ background: 'var(--bg-card)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Was das System übernimmt</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: 0, fontWeight: 400 }}>
            Das System macht die Arbeit.<br />Ihr Team behält die Kontrolle.
          </h2>
          <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, maxWidth: 560 }}>
            Kein Automatismus ohne Freigabe — jede Entscheidung liegt bei Ihren Mitarbeitern.
            Das System erledigt alles davor.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }} className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="sw-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '32px 28px' }}>
              <div style={{ color: 'var(--accent-light)' }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 10px' }}>{f.title}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{f.text}</p>
              </div>
              <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(154,107,60,0.12)', border: '1px solid rgba(181,131,74,0.25)', borderRadius: 4, padding: '4px 10px' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 12, fontWeight: 500, color: 'var(--accent-light)', letterSpacing: '0.03em' }}>{f.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) { .features-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
