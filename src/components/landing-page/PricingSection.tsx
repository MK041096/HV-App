'use client'

import { useState } from 'react'
import { Reveal } from './Reveal'

const features = [
  { icon: '📸', title: 'Digitale Schadensmeldung', text: 'Mieter melden per Foto & Text — strukturiert, sofort, ohne Anruf.' },
  { icon: '🔍', title: 'Automatische Analyse', text: 'Wer haftet? Mieter, Vermieter oder Versicherung? Das System entscheidet.' },
  { icon: '🔧', title: 'Handwerker-Management', text: 'Passenden Handwerker nach Gewerk vorschlagen & automatisch beauftragen.' },
  { icon: '📋', title: 'Versicherungsblatt', text: 'Automatisch befüllt. In Sekunden fertig. Kein Formular per Hand.' },
  { icon: '👥', title: 'Mieterverwaltung', text: 'Mieter, Einheiten, Dokumente — alles strukturiert an einem Ort.' },
  { icon: '📊', title: 'Vollständige Kontrolle', text: 'Jeder Fall, jeder Status, jede Entscheidung — transparent und nachverfolgbar.' },
]

const plans = [
  {
    name: 'Starter',
    price: '0,50 €',
    unit: '/ Einheit / Monat',
    note: 'Gründerpreis — Jahr 1',
    highlighted: false,
    features: [
      'Digitale Schadensmeldungen',
      'Automatische Analyse & Kategorisierung',
      'Handwerker-Vorschlag',
      'Mieterportal',
      'E-Mail-Benachrichtigungen',
      'DSGVO-konform (EU-Server)',
    ],
  },
  {
    name: 'Pro',
    price: '0,85 €',
    unit: '/ Einheit / Monat',
    note: 'Jahresabo — meistgewählt',
    highlighted: true,
    features: [
      'Alles aus Starter',
      'Versicherungsblatt automatisch befüllen',
      'Dokumentenablage (Mietverträge, Policen)',
      'Handwerker-Kommunikation automatisiert',
      'Prioritäts-Support',
      'Onboarding inklusive',
    ],
  },
]

export default function PricingSection() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="preise" className="bg-[#09090f] py-28 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Features grid */}
        <Reveal className="text-center mb-16">
          <div className="lp-label mb-5 mx-auto w-fit">Was drin steckt</div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight">
            Alles, was eine moderne<br />
            <span className="lp-gold-text">Hausverwaltung braucht.</span>
          </h2>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-28">
          {features.map((f, i) => (
            <Reveal key={f.title} direction="up" delay={i * 70}>
              <div className="lp-glass p-6 h-full">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-[#7a7a90] text-sm leading-relaxed">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Pricing */}
        <Reveal className="text-center mb-12">
          <div className="lp-label mb-5 mx-auto w-fit">Preise</div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Transparent. Fair. <span className="lp-gold-text">Ohne Überraschungen.</span>
          </h2>
          <p className="text-[#7a7a90] text-base mb-8 max-w-md mx-auto">
            Einmalige Einrichtungsgebühr + monatlich pro Einheit. Keine versteckten Kosten.
          </p>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-white/[0.05] border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!annual ? 'bg-[#c9a44c] text-[#09090f]' : 'text-[#a0a0b0] hover:text-white'}`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${annual ? 'bg-[#c9a44c] text-[#09090f]' : 'text-[#a0a0b0] hover:text-white'}`}
            >
              Jährlich
            </button>
          </div>
        </Reveal>

        {/* Onboarding fee */}
        <Reveal className="mb-6">
          <div className="border border-[#c9a44c]/20 bg-[#c9a44c]/[0.04] rounded-xl p-5 text-center">
            <span className="text-[#c9a44c] text-sm font-medium">Einmalige Einrichtungsgebühr:</span>
            <span className="text-white font-semibold ml-2">699 €</span>
            <span className="text-[#7a7a90] text-sm ml-2">— Gründerpreis: 349 € (nur noch wenige Plätze)</span>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} direction={i === 0 ? 'left' : 'right'} delay={i * 80}>
              <div className={`rounded-2xl p-8 h-full flex flex-col ${
                plan.highlighted
                  ? 'bg-[#c9a44c]/[0.06] border-2 border-[#c9a44c]/40'
                  : 'lp-glass'
              }`}>
                {plan.highlighted && (
                  <div className="lp-label mb-4 w-fit text-xs">Meistgewählt</div>
                )}
                <div className="mb-6">
                  <h3 className="font-playfair text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-[#c9a44c]' : 'text-white'}`}>
                      {annual ? plan.price : (plan.highlighted ? '1,00 €' : '0,65 €')}
                    </span>
                    <span className="text-[#7a7a90] text-sm">{plan.unit}</span>
                  </div>
                  <p className="text-[#7a7a90] text-xs mt-1">{plan.note}</p>
                </div>
                <ul className="space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#b0b0c0]">
                      <svg className="h-4 w-4 text-[#c9a44c] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#april-angebot"
                  className={`mt-8 block text-center py-3.5 px-6 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? 'lp-btn-gold'
                      : 'lp-btn-ghost'
                  }`}
                >
                  Jetzt anfragen
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mt-8 text-center text-[#5a5a70] text-sm">
          30 Tage Geld-zurück-Garantie · Keine Mindestlaufzeit · DSGVO-konform
        </Reveal>
      </div>
    </section>
  )
}
