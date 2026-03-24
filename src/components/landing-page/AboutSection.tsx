'use client'

import { Reveal } from './Reveal'

const pains = [
  {
    icon: '📞',
    title: 'Anruf. E-Mail. WhatsApp. Nochmal Anruf.',
    text: 'Jeden Tag dieselben Kanäle, dieselbe manuelle Arbeit. Nichts ist strukturiert, nichts ist nachverfolgbar. Der Mitarbeiter kämpft gegen das Chaos statt Einheiten zu verwalten.',
  },
  {
    icon: '📄',
    title: 'Versicherungsformulare per Hand.',
    text: 'Jeder Versicherungsfall bedeutet: Suchen, Ausfüllen, Nachfragen. Stunden für etwas, das in Sekunden erledigt sein könnte.',
  },
  {
    icon: '🚧',
    title: 'Wachstum bedeutet mehr Personal.',
    text: 'Jede neue Einheit bedeutet mehr Arbeit. Irgendwann kommt der Punkt, wo man einstellen muss — obwohl die Kapazität eigentlich da wäre. Das System fehlt.',
  },
]

const capabilities = [
  'Schadensmeldungen digital empfangen — strukturiert, vollständig, sofort',
  'Automatische Analyse: Mieter, Vermieter oder Versicherungsfall?',
  'Handwerker automatisch vorschlagen & beauftragen',
  'Versicherungsblatt in Sekunden automatisch befüllen',
  'Mieterverwaltung, Dokumente und Kommunikation — alles an einem Ort',
  'Mit demselben Team massiv mehr Einheiten verwalten',
]

export default function AboutSection() {
  return (
    <section className="bg-[#0d0d16] py-28 px-6">
      <div className="max-w-6xl mx-auto">

        <Reveal className="text-center mb-16">
          <div className="lp-label mb-5 mx-auto w-fit">Die Realität</div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight">
            Hausverwaltungen, die nicht digitalisieren,<br />
            <span className="lp-gold-text">werden überholt.</span>
          </h2>
          <p className="mt-5 text-[#7a7a90] text-lg max-w-2xl mx-auto">
            Nicht morgen. Nicht irgendwann. Es passiert gerade — während Ihre Konkurrenz
            mit denselben Mitarbeitern doppelt so viele Einheiten verwaltet.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3 mb-24">
          {pains.map((p, i) => (
            <Reveal key={p.title} direction="up" delay={i * 100}>
              <div className="lp-glass p-7 h-full">
                <span className="text-3xl block mb-4">{p.icon}</span>
                <h3 className="font-semibold text-white text-base mb-2 leading-snug">{p.title}</h3>
                <p className="text-[#7a7a90] text-sm leading-relaxed">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal direction="left">
            <div className="lp-label mb-6 w-fit">Die Lösung</div>
            <h3 className="font-playfair text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
              Mit demselben Team.<br />
              <span className="lp-gold-text">Dreimal mehr Einheiten.</span>
            </h3>
            <p className="text-[#8a8a9a] leading-relaxed mb-8">
              Das ist kein Versprechen — das ist die logische Konsequenz davon, wenn manuelle Arbeit
              durch Automatisierung ersetzt wird. Keine Neueinstellungen. Kein Chaos.
              Nur ein System, das für Sie arbeitet.
            </p>
            <a href="#april-angebot" className="lp-btn-gold inline-flex">Jetzt starten →</a>
          </Reveal>

          <Reveal direction="right" delay={100}>
            <ul className="space-y-4">
              {capabilities.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-[#c9a44c]/15 border border-[#c9a44c]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#c9a44c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-[#c0c0d0] text-[0.9375rem] leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={100} className="mt-24 text-center">
          <div className="lp-shimmer-line max-w-sm mx-auto mb-8" />
          <p className="font-playfair text-xl md:text-2xl text-white/70 italic max-w-2xl mx-auto leading-relaxed">
            &ldquo;Wer es verpasst, mit der Digitalisierung mitzugehen,
            wird früher oder später von der Konkurrenz eingeholt.&rdquo;
          </p>
          <div className="lp-shimmer-line max-w-sm mx-auto mt-8" />
        </Reveal>

      </div>
    </section>
  )
}
