export default function FounderSection() {
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Der Gründer</p>

        <div style={{ display: 'flex', gap: 48, alignItems: 'center' }} className="founder-grid">

          {/* Foto */}
          <div style={{ flexShrink: 0 }}>
            <img
              src="/mathias.jpg"
              alt="Mathias Kracher, Gründer von Anotherhenri"
              style={{ width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Text */}
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Mathias Kracher, 29
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-light)', margin: '0 0 20px' }}>
              Gründer von Anotherhenri
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
              "Anotherhenri ist aus einer persönlichen Erfahrung entstanden. Als Mieter habe ich erlebt wie Schadensmeldungen untergegangen sind, Wochen vergingen ohne Rückmeldung und der Schaden einfach blieb. Nicht weil die Hausverwaltung es nicht wollte, sondern weil der Prozess es nicht zuließ. Genau das wollte ich ändern."
            </p>

            {/* Social Links */}
            <div style={{ display: 'flex', gap: 16 }}>
              <a
                href="https://www.linkedin.com/in/mathias-kracher-57a5353b6"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/m_kracher"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
                Instagram
              </a>
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) {
          .founder-grid { flex-direction: column !important; text-align: center; align-items: center !important; }
        }
      `}</style>
    </section>
  )
}
