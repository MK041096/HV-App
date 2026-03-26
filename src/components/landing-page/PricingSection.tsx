'use client'

import { useState } from 'react'
import OnboardingModal from './OnboardingModal'

export default function PricingSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <section id="preise" style={{ background: 'var(--bg-card)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Preise</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 16px', fontWeight: 400 }}>
          Transparent. Ohne Überraschungen.
        </h2>

        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 64px' }}>
          Das Nutzungsmodell wird individuell auf Ihre Hausverwaltung abgestimmt.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800, margin: '0 auto' }} className="pricing-grid">

          {/* April-Aktion */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent)', borderRadius: 10, padding: '40px 36px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Badge */}
            <div style={{ position: 'absolute', top: -13, left: 32, background: 'var(--accent)', borderRadius: 4, padding: '4px 12px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Nur 3 Plätze</span>
            </div>

            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', margin: '0 0 20px' }}>April-Aktion</p>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through', display: 'block', marginBottom: 4 }}>699 €</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 44, color: 'var(--text-primary)', lineHeight: 1 }}>349 €</span>
                <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'var(--accent-light)' }}>einmalig</span>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginTop: 8 }}>Einmaliges Onboarding</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[
                'Vollständiges Onboarding inklusive',
                'Alle Funktionen freigeschaltet',
                'Persönliche Einführung Ihres Teams',
                'Monatliches Abo individuell je Einheit abgestimmt',
                'Kein langfristiger Vertrag',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.55, color: 'var(--text-primary)' }}>{item}</span>
                </li>
              ))}
            </ul>

            <button onClick={() => setShowModal(true)} className="sw-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 500, gap: 8 }}>
              Anfragen
            </button>
          </div>

          {/* Standard */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 20px' }}>Standard</p>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 44, color: 'var(--text-primary)', lineHeight: 1 }}>699 €</span>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginTop: 8 }}>Einmaliges Onboarding</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[
                'Vollständiges Onboarding',
                'Alle Funktionen freigeschaltet',
                'Persönliche Einführung Ihres Teams',
                'Nutzungsmodell individuell abgestimmt',
                'Support & Weiterentwicklung inklusive',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{item}</span>
                </li>
              ))}
            </ul>

            <button onClick={() => setShowModal(true)} className="sw-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>
              Anfragen
            </button>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 640px) { .pricing-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </section>
  )
}
