'use client'
import { useState } from 'react'

const steps = [
  {
    id: 1,
    number: '01',
    title: 'Schaden melden',
    description: 'Schadenmeldeblatt ausfüllen, Schaden beschreiben, Foto hochladen, Wunschtermin vermerken — fertig. Der Mieter erledigt alles per Handy in unter 3 Minuten. Kein Anruf, keine E-Mail.',
    imageUrl: '/accordion-1.jpg',
  },
  {
    id: 2,
    number: '02',
    title: 'Automatische Analyse',
    description: 'SchadensMelder erkennt sofort Schadensart, Dringlichkeit und Zuständigkeit. Die Meldung landet strukturiert im HV-Dashboard — vollständig und sofort einsatzbereit.',
    imageUrl: '/accordion-2.jpg',
  },
  {
    id: 3,
    number: '03',
    title: 'HV prüft & entscheidet',
    description: 'Der HV-Mitarbeiter sieht alle Details auf einen Blick und bestätigt oder lehnt die Meldung mit einem einzigen Klick ab. Keine langen Telefonate, keine Rückfragen.',
    imageUrl: '/accordion-3.jpg',
  },
  {
    id: 4,
    number: '04',
    title: 'Werkstatt & Termin',
    description: 'Nach Bestätigung wird die zuständige Werkstatt automatisch benachrichtigt. Termin wird vereinbart, der Mieter erhält eine Statusmeldung — alles ohne manuelle Arbeit.',
    imageUrl: '/accordion-4.jpg',
  },
  {
    id: 5,
    number: '05',
    title: 'Erledigt & dokumentiert',
    description: 'Schaden behoben, alle happy. Das Versicherungsformular wird automatisch ausgefüllt und archiviert. Jahresabrechnung, Versicherung, Revisionen — alles auf Knopfdruck.',
    imageUrl: '/accordion-5.jpg',
  },
]

interface AccordionPanelProps {
  step: typeof steps[0]
  isActive: boolean
  onMouseEnter: () => void
  onClick: () => void
}

function AccordionPanel({ step, isActive, onMouseEnter, onClick }: AccordionPanelProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer flex-shrink-0"
      style={{
        height: '480px',
        width: isActive ? '420px' : '72px',
        transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: isActive ? '420px' : '72px',
      }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {/* Photo */}
      <img
        src={step.imageUrl}
        alt={step.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isActive
            ? 'linear-gradient(to top, rgba(6,4,1,0.92) 0%, rgba(6,4,1,0.45) 55%, rgba(6,4,1,0.2) 100%)'
            : 'rgba(6,4,1,0.6)',
          transition: 'background 400ms ease',
        }}
      />

      {/* Gold border on active */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: isActive ? '1px solid rgba(217,119,6,0.5)' : '1px solid rgba(255,255,255,0.08)',
          transition: 'border-color 400ms ease',
        }}
      />

      {/* Collapsed: vertical number + title */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-8"
        style={{
          opacity: isActive ? 0 : 1,
          transition: 'opacity 250ms ease',
          pointerEvents: isActive ? 'none' : 'auto',
        }}
      >
        <span
          className="font-playfair font-bold text-white whitespace-nowrap"
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {step.number} · {step.title}
        </span>
      </div>

      {/* Expanded: content */}
      <div
        className="absolute bottom-0 left-0 right-0 p-7"
        style={{
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 350ms ease 150ms, transform 350ms ease 150ms',
          pointerEvents: isActive ? 'auto' : 'none',
        }}
      >
        <div
          className="text-xs font-bold mb-2 font-playfair"
          style={{ color: '#f59e0b', letterSpacing: '0.18em' }}
        >
          SCHRITT {step.number}
        </div>
        <h3 className="font-playfair font-bold text-white text-2xl mb-3 leading-tight">
          {step.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,220,160,0.72)' }}>
          {step.description}
        </p>
      </div>
    </div>
  )
}

export default function FeaturesAccordion() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section
      id="wie-es-funktioniert"
      className="py-24 px-6 overflow-hidden"
      style={{ background: '#080604' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-4" style={{ color: '#b85c0a' }}>
            WIE ES FUNKTIONIERT
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mt-2 leading-tight">
            5 Schritte. Vollständig automatisiert.
          </h2>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'rgba(255,220,160,0.5)' }}>
            Von der ersten Meldung bis zur archivierten Dokumentation.
          </p>
        </div>

        {/* Horizontal Accordion */}
        <div
          className="flex gap-3 items-stretch justify-center"
          style={{ overflowX: 'auto', paddingBottom: '4px' }}
        >
          {steps.map((step, index) => (
            <AccordionPanel
              key={step.id}
              step={step}
              isActive={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        {/* Step dots navigation */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className="rounded-full transition-all duration-300"
              style={{
                width: activeIndex === index ? '28px' : '8px',
                height: '8px',
                background: activeIndex === index ? '#d97706' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
