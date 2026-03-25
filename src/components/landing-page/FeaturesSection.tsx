'use client'

const features = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round"/></svg>,
    title: 'Digitale Schadensmeldung',
    text: 'Mieter melden Schäden strukturiert über ein einfaches Formular – mit Foto, Beschreibung und Ortsangabe.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round"/><line x1="9" y1="16" x2="13" y2="16" strokeLinecap="round"/></svg>,
    title: 'Vollständige Fallerfassung',
    text: 'Jede Meldung wird vollständig und einheitlich erfasst. Keine Information geht verloren.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    title: 'Vorbereitete Einschätzung',
    text: 'Das System bereitet eine strukturierte Ersteinschätzung vor – als Entscheidungsgrundlage, nicht als Entscheidung.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Handwerker-Vorschlag',
    text: 'Basierend auf Schadensart schlägt das System passende Handwerker vor. Die HV entscheidet, wen sie beauftragt.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Freigabe durch die Hausverwaltung',
    text: 'Nichts läuft ohne Ihre Bestätigung. Jeder Schritt erfordert eine bewusste Freigabe Ihres Teams.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round"/><polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Versicherungsblatt vorbereiten',
    text: 'Relevante Angaben werden automatisch zusammengeführt. Ihr Team prüft und versendet.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Status & Nachverfolgung',
    text: 'Alle Beteiligten sehen den aktuellen Stand eines Falls – ohne Rückfragen, ohne manuellen Statusabgleich.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="21 8 21 21 3 21 3 8" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12" strokeLinecap="round"/></svg>,
    title: 'Dokumentation & Archivierung',
    text: 'Jeder abgeschlossene Fall wird vollständig dokumentiert – revisionssicher, durchsuchbar, langfristig verfügbar.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="funktionen" style={{ background: 'var(--bg-card)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Funktionen</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 56px', fontWeight: 400 }}>
          Was das System für Sie leistet.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="sw-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ color: 'var(--accent-light)' }}>{f.icon}</div>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 8px' }}>{f.title}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) { .features-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 641px) and (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}
