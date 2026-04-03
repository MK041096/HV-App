'use client'

import { useState } from 'react'
import OnboardingModal from './OnboardingModal'

export default function PricingSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <section id="preise" style={{ background: 'var(--bg-card)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Preise</p>

        <h2 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 16px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Transparent. Ohne Überraschungen.
        </h2>

        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 64px' }}>
          Das Onboarding ist einmalig. Das Abo läuft monatlich oder jährlich —
          und wird individuell auf die Anzahl Ihrer Einheiten abgestimmt.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>

          {/* April-Aktion */}
          <div style={{ background: '#FFFFFF', border: '2px solid #C74229', borderRadius: 10, padding: '40px 36px', position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 420 }}>
            {/* Badge */}
            <div style={{ position: 'absolute', top: -13, left: 32, background: '#C74229', borderRadius: 4, padding: '4px 12px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>Nur noch 3 Plätze für April</span>
            </div>

            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C74229', margin: '0 0 20px' }}>Gründer-Angebot</p>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: '#888', textDecoration: 'line-through', display: 'block', marginBottom: 4 }}>699 € Onboarding</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 44, fontWeight: 700, color: '#000', lineHeight: 1 }}>349 €</span>
                <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: '#C74229' }}>einmalig</span>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: '#555', display: 'block', marginTop: 8 }}>
                danach <strong style={{ color: '#000' }}>0,50 € / Einheit / Monat</strong> im 1. Jahr
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[
                'Vollständiges Onboarding inklusive',
                'Alle Funktionen sofort freigeschaltet',
                'Persönliche Einführung für Ihr Team',
                'CARL-KI-Analyse, Werkstatt-Kommunikation, Mieter-Portal',
                'Abo jederzeit monatlich oder jährlich kündbar',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C74229" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.55, color: '#000' }}>{item}</span>
                </li>
              ))}
            </ul>

            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
              height: 48, background: '#C74229', color: '#fff', border: 'none', borderRadius: 4,
              fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#D85640')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C74229')}>
              Anfragen
            </button>
          </div>

        </div>

        {/* Abo-Erklärung */}
        <div style={{ maxWidth: 800, margin: '40px auto 0', background: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: 10, padding: '28px 32px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C74229" strokeWidth="1.6" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 600, color: '#000', margin: '0 0 6px' }}>
              Wie funktioniert das Abo?
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: '#555', margin: 0 }}>
              Nach dem Onboarding wird gemeinsam mit Ihnen ein Abo-Modell festgelegt,
              basierend auf der Anzahl Ihrer verwalteten Einheiten.
              Sie wählen zwischen <strong style={{ color: '#000' }}>monatlicher</strong> oder{' '}
              <strong style={{ color: '#000' }}>jährlicher Abrechnung</strong>.
              Kein Pauschalpreis, kein versteckter Fixbetrag, nur was zu Ihrer Verwaltung passt.
            </p>
          </div>
        </div>

      </div>


      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </section>
  )
}
