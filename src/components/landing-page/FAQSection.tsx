'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'Wie melden sich meine Mieter an?',
    a: 'Sie vergeben einen Aktivierungscode pro Mieter — einmal, fertig. Der Mieter registriert sich damit selbst. Kein App-Download, kein technisches Wissen nötig. Funktioniert auf jedem Smartphone und PC.',
  },
  {
    q: 'Wie lange dauert das Onboarding?',
    a: 'In der Regel einen halben Tag. Wir richten alles gemeinsam mit Ihnen ein, importieren Ihre Objekte und Einheiten, und führen Sie und Ihr Team persönlich durch das System.',
  },
  {
    q: 'Funktioniert das auch bei vielen Einheiten?',
    a: 'Ja. Das Abo wird individuell je Einheit kalkuliert — egal ob Sie 30 oder 1.000 Einheiten verwalten. Je größer Ihre Verwaltung, desto mehr Zeit sparen Sie.',
  },
  {
    q: 'Was passiert mit unseren Daten?',
    a: 'Alle Daten liegen ausschließlich auf Servern innerhalb der EU — vollständig DSGVO-konform. Ein Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO ist im Onboarding inklusive.',
  },
  {
    q: 'Müssen wir unsere bisherige Software ablösen?',
    a: 'Nein. Instaclaim ergänzt Ihre bestehende Verwaltung und übernimmt gezielt den Schadensprozess. Keine Umstellung, keine Datenmigration von bestehenden Systemen nötig.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" style={{ background: 'var(--bg-card)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Häufige Fragen</p>

        <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 56px', fontWeight: 400 }}>
          Fragen, die wir oft hören.
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2"
                  style={{ flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
                >
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
                </svg>
              </button>

              {open === i && (
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 22px', paddingRight: 32 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
