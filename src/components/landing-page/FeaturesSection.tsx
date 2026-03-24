'use client'

import { Reveal } from './Reveal'

const steps = [
  {
    num: '01',
    icon: '📸',
    title: 'Mieter meldet — digital, ohne Anruf',
    text: 'Foto machen, Schaden kurz beschreiben, absenden. Kein Telefonat, kein WhatsApp, keine Warteschleife. Die Meldung ist vollständig strukturiert und landet sofort im System — inklusive Foto, Wohnung und Zeitstempel.',
    side: 'left' as const,
  },
  {
    num: '02',
    icon: '📋',
    title: 'Strukturierte Meldung — sofort übersichtlich',
    text: 'Kein E-Mail-Chaos, keine Zettelwirtschaft. Der Mitarbeiter sieht eine vollständige, kategorisierte Meldung auf einen Blick — priorisiert und bereit zur Bearbeitung. Ohne suchen, ohne Rückfragen.',
    side: 'right' as const,
  },
  {
    num: '03',
    icon: '🔍',
    title: 'Automatische Analyse — wer ist verantwortlich?',
    text: 'Das System analysiert: Mieter, Vermieter oder Versicherungsfall? Der passende Handwerker wird nach Gewerk vorgeschlagen, das Versicherungsblatt automatisch befüllt. Null manuelle Dokumentation — alles fertig vorbereitet.',
    side: 'left' as const,
  },
  {
    num: '04',
    icon: '👆',
    title: 'Ein Klick — der Rest läuft von selbst',
    text: 'Der Mitarbeiter prüft die fertige Analyse und entscheidet: Handwerker beauftragen? Klick. Versicherung einschalten? Klick. Das war\'s. Danach läuft alles automatisch weiter — keine weiteren Schritte nötig.',
    side: 'right' as const,
  },
  {
    num: '05',
    icon: '✅',
    title: 'Volle Transparenz — null Nachfragen',
    text: 'Jeder Fall hat einen klaren Status in Echtzeit. Mieter sehen ihren Fortschritt selbst. Handwerker wissen genau was zu tun ist. Kein Rückruf, keine Beschwerde — alles läuft, und alle wissen Bescheid.',
    side: 'left' as const,
  },
]

export default function FeaturesSection() {
  return (
    <section id="wie-es-funktioniert" className="bg-[#09090f] py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-20">
          <div className="lp-label mb-5 mx-auto w-fit">Der Ablauf</div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight">
            Von der Meldung bis zur Lösung —<br />
            <span className="lp-gold-text">vollautomatisch.</span>
          </h2>
          <p className="mt-5 text-[#7a7a90] text-lg max-w-xl mx-auto">
            Fünf Schritte. Einer davon ist Ihrer.
          </p>
        </Reveal>

        <div className="space-y-10">
          {steps.map((step, i) => (
            <Reveal key={step.num} direction={step.side} delay={i * 60}>
              <div className="lp-glass p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start group">
                <div className="shrink-0 flex flex-col items-center gap-2 md:w-20">
                  <span className="font-playfair text-5xl font-bold text-[#c9a44c]/20 group-hover:text-[#c9a44c]/40 transition-colors duration-500 leading-none">
                    {step.num}
                  </span>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-playfair text-xl md:text-2xl font-semibold text-white mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[#8a8a9a] leading-relaxed text-[0.95rem]">{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-16 text-center">
          <p className="text-[#5a5a70] text-sm tracking-wide">
            Das alles — für jede Schadensmeldung. Automatisch. Jeden Tag.
          </p>
          <div className="mt-4 lp-shimmer-line max-w-xs mx-auto" />
        </Reveal>
      </div>
    </section>
  )
}
