'use client'

import { useState } from 'react'
import OnboardingModal from './OnboardingModal'

export default function FinalCTASection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <section id="kontakt" style={{ background: 'var(--bg-primary)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Jetzt starten</p>

        <h2 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 24px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Ihr nächster Schaden, der erste,<br />der sich von selbst erledigt.
        </h2>

        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 48px' }}>
          Sprechen Sie mit uns. In einem kurzen Gespräch zeigen wir Ihnen,
          wie SMARTCARL in Ihrer Hausverwaltung funktioniert, ohne Risiko, ohne Verpflichtung.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              height: 48, padding: '0 32px', background: '#C74229', color: '#fff', border: 'none', borderRadius: 4,
              fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D85640')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C74229')}
          >
            Anfragen
          </button>
          <a
            href="tel:+436644682910"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 48, padding: '0 32px', background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--border)', borderRadius: 4,
              fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 500,
              textDecoration: 'none', transition: 'border-color 0.2s'
            }}
          >
            +43 664 46 82 910
          </a>
        </div>

        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          DSGVO-konform · Hosting in der EU · Persönliche Einführung inklusive
        </p>

      </div>

      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </section>
  )
}
