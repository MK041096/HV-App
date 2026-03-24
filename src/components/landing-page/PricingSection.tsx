'use client'

import { Reveal } from './Reveal'

const features = [
  { icon: '📸', title: 'Digitale Schadensmeldung', text: 'Mieter melden per Foto & Text — strukturiert, sofort, ohne Anruf.' },
  { icon: '🔍', title: 'Automatische Analyse', text: 'Wer haftet? Mieter, Vermieter oder Versicherung? Das System entscheidet.' },
  { icon: '🔧', title: 'Handwerker-Management', text: 'Passenden Handwerker nach Gewerk vorschlagen & automatisch beauftragen.' },
  { icon: '📋', title: 'Versicherungsblatt', text: 'Automatisch befüllt. In Sekunden fertig. Kein Formular per Hand.' },
  { icon: '👥', title: 'Mieterverwaltung', text: 'Mieter, Einheiten, Dokumente — alles strukturiert an einem Ort.' },
  { icon: '📊', title: 'Vollständige Kontrolle', text: 'Jeder Fall, jeder Status, jede Entscheidung — transparent und nachverfolgbar.' },
]

export default function PricingSection() {
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-24">
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

        {/* Simple onboarding pricing */}
        <Reveal className="text-center mb-10">
          <div className="lp-label mb-5 mx-auto w-fit">Einstieg</div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Transparent. Fair. <span className="lp-gold-text">Ohne Überraschungen.</span>
          </h2>
          <p className="text-[#7a7a90] text-base max-w-md mx-auto">
            Einmalige Einrichtungsgebühr, danach monatlich pro Einheit. Keine versteckten Kosten.
          </p>
        </Reveal>

        <Reveal>
          <div className="lp-glass p-8 md:p-12 text-center max-w-lg mx-auto">
            <div className="lp-label mb-6 mx-auto w-fit">🔥 Gründerangebot — nur noch wenige Plätze</div>
            <div className="mb-2">
              <span className="font-playfair text-6xl font-bold text-[#c9a44c]">349 €</span>
            </div>
            <p className="text-[#7a7a90] text-sm mb-1">
              <span className="line-through text-[#5a5a70]">699 €</span>
              &nbsp;· einmalige Einrichtungsgebühr
            </p>
            <p className="text-[#8a8a9a] text-sm mt-4 mb-8">
              Danach ab <strong className="text-white">0,50 € / Einheit / Monat</strong> im Gründerpreis.
            </p>
            <a href="#april-angebot" className="lp-btn-gold inline-flex">
              Jetzt Platz sichern →
            </a>
            <p className="mt-6 text-[#5a5a70] text-xs">
              30 Tage Geld-zurück-Garantie · Keine Mindestlaufzeit · DSGVO-konform
            </p>
          </div>
        </Reveal>

      </div>
    </section>
  )
}
