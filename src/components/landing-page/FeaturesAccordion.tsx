'use client'
import React, { useState } from 'react'

const features = [
  {
    id: 1,
    title: 'Meldung in 3 Minuten',
    description: 'Mieter fotografieren den Schaden direkt am Handy — kein Anruf, kein E-Mail.',
    imageUrl: '/accordion-1.jpg',
  },
  {
    id: 2,
    title: 'Automatische Analyse',
    description: 'Schadensart, Dringlichkeit und Verantwortlichkeit werden sofort erkannt.',
    imageUrl: '/accordion-2.jpg',
  },
  {
    id: 3,
    title: 'Handwerker-Zuweisung',
    description: 'Der richtige Handwerker bekommt automatisch den Auftrag — per E-Mail.',
    imageUrl: '/accordion-3.jpg',
  },
  {
    id: 4,
    title: 'Status-Tracking',
    description: 'Mieter und HV sehen jederzeit den aktuellen Stand der Meldung.',
    imageUrl: '/accordion-4.jpg',
  },
  {
    id: 5,
    title: 'Versicherungsdokumentation',
    description: 'Alle Unterlagen werden automatisch befüllt und archiviert.',
    imageUrl: '/accordion-5.jpg',
  },
]

export default function FeaturesAccordion() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section className="py-24 px-6" style={{ background: '#0c0a08' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="lp-label mb-4 inline-flex">SO FUNKTIONIERT ES</span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mt-4 leading-tight">
            Von der Meldung zur<br />
            <span className="lp-gold-text">Lösung — automatisch.</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: feature list */}
          <div className="w-full lg:w-2/5 space-y-2">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                className="w-full text-left transition-all duration-300"
                onClick={() => setActiveIndex(index)}
              >
                <div
                  className="p-5 rounded-2xl border transition-all duration-300"
                  style={{
                    background: activeIndex === index
                      ? 'rgba(217, 119, 6, 0.12)'
                      : 'rgba(255,255,255,0.03)',
                    borderColor: activeIndex === index
                      ? 'rgba(217, 119, 6, 0.4)'
                      : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold font-playfair"
                      style={{ color: activeIndex === index ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}
                    >
                      0{index + 1}
                    </span>
                    <span
                      className="font-semibold text-base"
                      style={{ color: activeIndex === index ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
                    >
                      {feature.title}
                    </span>
                  </div>
                  {activeIndex === index && (
                    <p className="mt-2 text-sm leading-relaxed pl-8" style={{ color: 'rgba(255,220,160,0.65)' }}>
                      {feature.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right: photo */}
          <div className="w-full lg:w-3/5 sticky top-8">
            <div className="relative rounded-2xl overflow-hidden" style={{ height: '460px' }}>
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{ opacity: activeIndex === index ? 1 : 0 }}
                >
                  <img
                    src={feature.imageUrl}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(12,10,8,0.85) 0%, rgba(12,10,8,0.2) 60%, transparent 100%)' }}
                  />
                  {/* Caption */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="font-playfair text-2xl font-bold text-white">{feature.title}</p>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,220,160,0.7)' }}>{feature.description}</p>
                  </div>
                </div>
              ))}
              {/* Gold border */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ border: '1px solid rgba(217,119,6,0.25)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
