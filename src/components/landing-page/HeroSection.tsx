'use client'

import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t) }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Frankfurt night cityscape */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Dark cinematic overlay — Capacity style */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(4,4,10,0.62) 0%, rgba(4,4,10,0.48) 50%, rgba(4,4,10,0.72) 100%)' }} />
      {/* Bottom fade to page background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(9,9,15,0.97) 95%, #09090f 100%)' }} />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-32 pb-28">

        {/* Badge */}
        <div className={`inline-flex items-center gap-2 mb-8 ${ready ? 'lp-anim-fade' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
          <span className="lp-label">
            Digitale Hausverwaltung &nbsp;·&nbsp; DACH
          </span>
        </div>

        {/* Headline — Capacity style: large serif, white */}
        <h1 className={`font-playfair font-bold text-white leading-[1.08] tracking-tight ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '200ms', textShadow: '0 2px 40px rgba(0,0,0,0.8)' }}>
          <span className="block text-5xl md:text-6xl lg:text-[4.75rem]">
            Schadensmeldungen,
          </span>
          <span className="block text-5xl md:text-6xl lg:text-[4.75rem] lp-gold-text mt-1">
            die sich selbst verwalten.
          </span>
        </h1>

        {/* Subtext */}
        <p className={`mt-7 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '380ms', textShadow: '0 1px 16px rgba(0,0,0,0.9)' }}>
          Ihr Team bekommt jeden Schaden sofort strukturiert — mit automatischer Analyse, Handwerkerzuweisung und Statusverfolgung. Kein E-Mail-Chaos mehr.
        </p>

        {/* CTAs */}
        <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '520ms' }}>
          <a href="#april-angebot" className="lp-btn-gold">April-Angebot sichern →</a>
          <a href="#wie-es-funktioniert" className="lp-btn-ghost">Wie es funktioniert</a>
        </div>

        {/* Trust stats — glass cards */}
        <div className={`mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto ${ready ? 'lp-anim-fade' : 'opacity-0'}`} style={{ animationDelay: '700ms' }}>
          {[
            { value: '3 min', label: 'pro Meldung' },
            { value: '100%', label: 'Nachverfolgung' },
            { value: '0 €', label: 'Rückbuchungsrisiko' },
          ].map(item => (
            <div key={item.label} className="lp-glass py-4 px-3 text-center">
              <div className="text-xl font-bold text-white font-playfair">{item.value}</div>
              <div className="text-xs text-white/50 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5 text-white/40 text-[10px] tracking-[0.2em] uppercase"
        style={{ transform: 'translateX(-50%)', animation: 'lp-scroll-bounce 2.2s ease-in-out infinite' }}
      >
        <span>Scroll</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
