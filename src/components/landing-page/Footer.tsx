'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '64px 24px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* 3-Spalten */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 56 }} className="footer-grid">

          {/* Spalte 1: Wordmark + Beschreibung */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.6">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 18, color: 'var(--text-primary)', fontWeight: 400 }}>Anotherhenri</span>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 16px', maxWidth: 320 }}>
              Digitales Schadensmeldungs-Management für professionelle Hausverwaltungen.
              Strukturiert, nachvollziehbar, DSGVO-konform.
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Mathias Kracher · Wildgansgasse 8/2, 7400 Oberwart
            </p>
          </div>

          {/* Spalte 2: Produkt */}
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px' }}>Produkt</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Funktionen', href: '#funktionen' },
                { label: 'Ablauf', href: '#ablauf' },
                { label: 'Preise', href: '#preise' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Spalte 3: Rechtliches */}
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px' }}>Rechtliches</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Impressum', href: '/impressum' },
                { label: 'Datenschutz', href: '/datenschutz' },
                { label: 'AVV', href: '/avv' },
                { label: 'Kontakt', href: '/kontakt' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            © {new Date().getFullYear()} Mathias Kracher. Alle Rechte vorbehalten.
          </p>
          <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Hosting in der EU · DSGVO-konform
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }
        @media (min-width: 641px) and (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </footer>
  )
}
