'use client'

import { Reveal } from './Reveal'

const features = [
  {
    tag: 'SCHADEN MELDEN',
    title: 'Accurate, Grounded\nReporting Across Your Portfolio',
    titleDE: 'Vollständig dokumentiert\nim ersten Schritt.',
    body: 'Der Mieter öffnet die App, macht ein Foto, beschreibt den Schaden kurz und vermerkt einen Wunschtermin. In unter 3 Minuten — ohne Anruf, ohne E-Mail, ohne Warteschleife. Die Meldung landet strukturiert und vollständig im System.',
    image: '/feature-1.jpg',
    items: ['Schadenmeldeblatt', 'Foto-Upload', 'Wunschtermin', 'Sofort im System'],
    imageLeft: false,
  },
  {
    tag: 'ANALYSE & BESTÄTIGUNG',
    titleDE: 'Ein Klick.\nDer Rest läuft von selbst.',
    body: 'Das System analysiert automatisch: Wer haftet? Welcher Handwerker passt? Das Versicherungsblatt wird vorausgefüllt. Der HV-Mitarbeiter sieht die fertige Analyse auf einen Blick und bestätigt — oder lehnt ab — mit einem einzigen Klick.',
    image: '/feature-2.jpg',
    items: ['Automatische Analyse', 'Handwerker-Vorschlag', '1-Klick Bestätigung', 'Versicherungsblatt fertig'],
    imageLeft: true,
  },
  {
    tag: 'VOLLSTÄNDIG AUTOMATISIERT',
    titleDE: 'Schaden behoben.\nAlles dokumentiert.',
    body: 'Nach Abschluss wird das Versicherungsformular automatisch archiviert. Mieter, HV-Mitarbeiter und Handwerker — alle wissen jederzeit Bescheid. Keine Nachfragen, kein Suchen in E-Mails, keine manuelle Ablage.',
    image: '/feature-3.jpg',
    items: ['Status in Echtzeit', 'Auto-Archivierung', 'Versicherungsformular', 'Alle informiert'],
    imageLeft: false,
  },
]

export default function FeaturesSection() {
  return (
    <section className="bg-[#080604]" id="wie-es-funktioniert">
      {features.map((f, i) => (
        <div
          key={f.tag}
          className={`max-w-7xl mx-auto px-6 lg:px-12 py-20 flex flex-col ${
            f.imageLeft ? 'lg:flex-row-reverse' : 'lg:flex-row'
          } gap-12 lg:gap-20 items-center`}
        >
          {/* Image in dark card frame — like Rogo */}
          <Reveal
            direction={f.imageLeft ? 'right' : 'left'}
            className="w-full lg:w-[52%] flex-shrink-0"
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: '#0e0b08',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
                padding: '12px',
              }}
            >
              {/* Top bar like Rogo's browser chrome */}
              <div className="flex items-center gap-1.5 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>

              <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <img
                  src={f.image}
                  alt={f.titleDE}
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.85) saturate(0.9)' }}
                />
                {/* Dark overlay on image */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(135deg, rgba(8,6,4,0.35) 0%, rgba(8,6,4,0.1) 100%)'
                }} />

                {/* Tag overlay bottom-left */}
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded text-[10px] font-bold tracking-[0.18em] text-white/60 border border-white/10 bg-black/40 backdrop-blur-sm">
                    {f.tag}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Text */}
          <Reveal
            direction={f.imageLeft ? 'left' : 'right'}
            className="flex-1 min-w-0"
          >
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#b85c0a] mb-5 uppercase">
              {f.tag}
            </p>

            <h2 className="font-playfair text-3xl md:text-4xl lg:text-[2.4rem] font-bold text-white leading-[1.12] mb-6">
              {f.titleDE.split('\n').map((line, idx) => (
                <span key={idx} className="block">{line}</span>
              ))}
            </h2>

            <p className="text-[#8a8070] leading-relaxed text-base mb-8">
              {f.body}
            </p>

            {/* Feature bullets */}
            <div className="space-y-3">
              {f.items.map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#b85c0a' }} />
                  <span className="text-sm text-[#a09080]">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      ))}
    </section>
  )
}
