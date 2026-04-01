'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#F5F5F5', borderTop: '1px solid #E0E0E0', padding: '64px 24px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* 3-Spalten */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 56 }} className="footer-grid">

          {/* Spalte 1: Wordmark + Beschreibung */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 18, fontWeight: 700, color: '#C74229', letterSpacing: '0.08em' }}>SMARTCARL</span>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: '#555', margin: '0 0 16px', maxWidth: 320 }}>
              Digitales Schadensmeldungs-Management für professionelle Hausverwaltungen.
              Strukturiert, nachvollziehbar, DSGVO-konform.
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: '#888', margin: 0 }}>
              Mathias Kracher · Wildgansgasse 8/2, 7400 Oberwart
            </p>
          </div>

          {/* Spalte 2: Produkt */}
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', margin: '0 0 20px' }}>Produkt</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Funktionen', href: '#funktionen' },
                { label: 'Ablauf', href: '#ablauf' },
                { label: 'Preise', href: '#preise' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: '#555', textDecoration: 'none' }}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Spalte 3: Rechtliches */}
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', margin: '0 0 20px' }}>Rechtliches</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Impressum', href: '/impressum' },
                { label: 'Datenschutz', href: '/datenschutz' },
                { label: 'AVV', href: '/avv' },
                { label: 'Kontakt', href: '/kontakt' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: '#555', textDecoration: 'none' }}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: '#888', margin: 0 }}>
            © {new Date().getFullYear()} Mathias Kracher. Alle Rechte vorbehalten.
          </p>
          <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: '#888', margin: 0 }}>
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
